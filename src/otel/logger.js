const { loggerProvider } = require('./otel-logs');

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;

const timezone = () => {
    return new Date().toLocaleString('en-US', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
}
  
const textFormat = printf(({ level, message, timestamp }) => {
return `${timestamp} @ ${Math.floor(Date.now() / 1000)} | (${level.toUpperCase()}): ${message}`;
});

const logger = createLogger({
    level: 'debug',
    format: combine(
      format.combine(format.timestamp({ format: timezone }),format.prettyPrint()),
      format.json()
    ),
    transports: [
      new transports.Console({
        format: combine(
          timestamp(),
          textFormat
        ),
      }),
    ],
});

const otelLogger = loggerProvider.getLogger('ageri.equipe3.nodejsmain');

function logToOtel(level, message) {
  otelLogger.emit({
    severityText: level.toUpperCase(),
    body: message,
    attributes: {
      customAttribute: 'none'
    }
  });
}

const levels = ['error', 'warn', 'info', 'debug'];

levels.forEach((level) => {
  const original = logger[level].bind(logger);
  logger[level] = (...args) => {
    original(...args);
    logToOtel(level, args.join(' '));
  };
});

module.exports = logger;
