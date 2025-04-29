const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { OTLPTraceExporter, OTLPMetricExporter } = require('@opentelemetry/exporter-otlp-http');

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