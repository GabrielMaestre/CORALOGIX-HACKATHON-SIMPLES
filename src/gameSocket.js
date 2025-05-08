const WebSocket = require('ws');
const { gameStartCounter, playerJoinCounter, bombPlacedCounter } = require('./otel/otel');
const logger = require('./otel/logger');

module.exports = function(server) {
  // --- WEBSOCKET SERVER PARA MULTIPLAYER BOMBERMAN ---
  const wss = new WebSocket.Server({ server });

  // Estado global do jogo
  let gameState = {
    started: false,
    players: {}, // { id: {id, email, x, y, alive, faceImage} }
    bombs: [], // {x, y, placedAt, ownerId}
    explosions: [], // {x, y, startedAt}
    blocks: [], // {x, y, indestrutivel}
    adminId: null,
  };

  const GRID_SIZE = 30;

  function initBlocks() {
    let blocks = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (x === 0 || y === 0 || x === GRID_SIZE-1 || y === GRID_SIZE-1 || (x%2===0 && y%2===0)) {
          blocks.push({x, y, indestrutivel: true});
        } else if (Math.random() < 0.25) {
          blocks.push({x, y, indestrutivel: false});
        }
      }
    }
    return blocks;
  }

  function isAreaFree(blocks, bombs, x, y) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 2; dy++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) return false;
        const block = blocks.find(b => b.x === nx && b.y === ny);
        if (block && !block.indestrutivel) return false;
        if (bombs.find(b => b.x === nx && b.y === ny)) return false;
      }
    }
    return true;
  }

  function getRandomSpawn(blocks, bombs) {
    for (let i = 0; i < 100; i++) {
      const x = Math.floor(Math.random() * (GRID_SIZE-4)) + 2;
      const y = Math.floor(Math.random() * (GRID_SIZE-4)) + 2;
      if (isAreaFree(blocks, bombs, x, y)) return {x, y};
    }
    return {x: 1, y: 1};
  }

  function broadcastGameState() {
    const state = {
      started: gameState.started,
      players: Object.values(gameState.players).map(p => ({id: p.id, email: p.email, x: p.x, y: p.y, alive: p.alive, faceImage: p.faceImage})),
      bombs: gameState.bombs,
      explosions: gameState.explosions,
      blocks: gameState.blocks,
      adminId: gameState.adminId,
    };
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({type: 'gameState', state}));
      }
    });
  }

  wss.on('connection', (ws, req) => {
    ws.on('message', (msg) => {
      let data;
      try { data = JSON.parse(msg); } catch { return; }
      if (data.type === 'join') {
        const id = Math.random().toString(36).substr(2, 9);
        ws.playerId = id;
        let isAdmin = false;
        if (!gameState.adminId) {
          gameState.adminId = id;
          isAdmin = true;
        }
        let spawn = {x: 1, y: 1};
        if (gameState.started && gameState.blocks.length > 0) {
          spawn = getRandomSpawn(gameState.blocks, gameState.bombs);
        }
        let faceImage = data.faceImage || (req.session && req.session.faceImage) || null;
        gameState.players[id] = {
          id,
          email: data.email,
          x: spawn.x,
          y: spawn.y,
          alive: true,
          faceImage,
          isAdmin,
          ip: req.socket?.remoteAddress || '',
        };
        playerJoinCounter.add(1, { email: data.email, ip: req.socket?.remoteAddress || '' });
        logger.info(`[METRIC] player_joins | email=${data.email} | ip=${req.socket?.remoteAddress || ''}`);
        ws.send(JSON.stringify({type: 'joined', id, isAdmin}));
        broadcastGameState();
      }
      if (data.type === 'start' && ws.playerId && gameState.players[ws.playerId]?.isAdmin) {
        gameState.started = true;
        gameState.blocks = initBlocks();
        gameState.bombs = [];
        gameState.explosions = [];
        const spawns = [];
        Object.values(gameState.players).forEach(p => {
          let spawn;
          let tries = 0;
          do {
            spawn = getRandomSpawn(gameState.blocks, gameState.bombs);
            tries++;
          } while (spawns.some(s => Math.abs(s.x - spawn.x) < 3 && Math.abs(s.y - spawn.y) < 3) && tries < 100);
          p.x = spawn.x;
          p.y = spawn.y;
          p.alive = true;
          spawns.push(spawn);
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 2; dy++) {
              const nx = spawn.x + dx;
              const ny = spawn.y + dy;
              gameState.blocks = gameState.blocks.filter(b => !(b.x === nx && b.y === ny && b.indestrutivel === false));
            }
          }
        });
        gameStartCounter.add(1, { admin: gameState.players[ws.playerId]?.email || '', ip: req.socket?.remoteAddress || '' });
        logger.info(`[METRIC] game_starts | admin=${gameState.players[ws.playerId]?.email || ''} | ip=${req.socket?.remoteAddress || ''}`);
        broadcastGameState();
      }
      if (data.type === 'move' && gameState.started && ws.playerId && gameState.players[ws.playerId]?.alive) {
        const {dx, dy} = data;
        const p = gameState.players[ws.playerId];
        const nx = p.x + dx;
        const ny = p.y + dy;
        if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) return;
        if (!gameState.blocks.find(b => b.x === nx && b.y === ny) && !gameState.bombs.some(b => b.x === nx && b.y === ny)) {
          p.x = nx;
          p.y = ny;
          broadcastGameState();
        }
      }
      if (data.type === 'bomb' && gameState.started && ws.playerId && gameState.players[ws.playerId]?.alive) {
        const p = gameState.players[ws.playerId];
        if (!gameState.bombs.some(b => b.x === p.x && b.y === p.y)) {
          gameState.bombs.push({x: p.x, y: p.y, placedAt: Date.now(), ownerId: ws.playerId});
          bombPlacedCounter.add(1, { email: p.email, ip: p.ip });
          logger.info(`[METRIC] bombs_placed | email=${p.email} | ip=${p.ip}`);
          broadcastGameState();
        }
      }
    });

    ws.on('close', () => {
      if (ws.playerId) {
        delete gameState.players[ws.playerId];
        if (gameState.adminId === ws.playerId) gameState.adminId = null;
        broadcastGameState();
      }
    });
  });

  setInterval(() => {
    if (!gameState.started) return;
    const now = Date.now();
    for (let i = gameState.bombs.length-1; i >= 0; i--) {
      const bomb = gameState.bombs[i];
      if (now - bomb.placedAt > 2000) {
        const dirs = [[0,0],[1,0],[-1,0],[0,1],[0,-1]];
        dirs.forEach(([dx,dy]) => {
          for (let j=0; j<2; j++) {
            const nx = bomb.x + dx*j;
            const ny = bomb.y + dy*j;
            if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) break;
            const block = gameState.blocks.find(b => b.x === nx && b.y === ny);
            if (block) {
              if (!block.indestrutivel) {
                gameState.blocks = gameState.blocks.filter(b => !(b.x === nx && b.y === ny));
              }
              break;
            }
            gameState.explosions.push({x: nx, y: ny, startedAt: now});
            Object.values(gameState.players).forEach(p => {
              if (p.x === nx && p.y === ny && p.alive) {
                p.alive = false;
              }
            });
          }
        });
        gameState.bombs.splice(i, 1);
      }
    }
    for (let i = gameState.explosions.length-1; i >= 0; i--) {
      if (now - gameState.explosions[i].startedAt > 500) {
        gameState.explosions.splice(i, 1);
      }
    }
    broadcastGameState();
  }, 100);
}; 