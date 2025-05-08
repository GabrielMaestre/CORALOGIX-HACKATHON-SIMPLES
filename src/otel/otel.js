const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { OTLPTraceExporter, OTLPMetricExporter } = require('@opentelemetry/exporter-otlp-http');
const { MeterProvider } = require('@opentelemetry/sdk-metrics');
const { metrics } = require('@opentelemetry/api');

const traceExporter = new OTLPTraceExporter({
  url: 'http://host.docker.internal:4318/v1/traces',
});

const metricExporter = new OTLPMetricExporter({
  url: 'http://host.docker.internal:4318/v1/metrics',
});

const sdk = new NodeSDK({
  traceExporter: traceExporter,
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

try {
  sdk.start();
} catch (error) {
  console.error(error);
}

// MÉTRICAS CUSTOMIZADAS
const meter = metrics.getMeter('ageri.equipe3.nodejs');

// Contadores customizados
const userSessionCounter = meter.createCounter('user_sessions', {
  description: 'Contagem de sessões de usuário (login, registro, etc)'
});
const gameStartCounter = meter.createCounter('game_starts', {
  description: 'Partidas iniciadas'
});
const bombPlacedCounter = meter.createCounter('bombs_placed', {
  description: 'Bombas colocadas no jogo'
});
const playerJoinCounter = meter.createCounter('player_joins', {
  description: 'Jogadores que entraram na partida'
});

// Exportar para uso em outros arquivos
module.exports = {
  userSessionCounter,
  gameStartCounter,
  bombPlacedCounter,
  playerJoinCounter,
  meter,
};