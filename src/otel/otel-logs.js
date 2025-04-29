const { LoggerProvider, BatchLogRecordProcessor } = require('@opentelemetry/sdk-logs');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');

const loggerProvider = new LoggerProvider();
const logExporter = new OTLPLogExporter({
  url: 'http://host.docker.internal:4318/v1/logs',
});

loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));

module.exports = { loggerProvider };