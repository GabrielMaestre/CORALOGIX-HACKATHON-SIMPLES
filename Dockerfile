FROM node:23-slim

WORKDIR /app

COPY ./package*.json ./

RUN npm install

COPY ./src .

ENV OTEL_SERVICE_NAME="ageri.equipe3.nodejs" \
    OTEL_TRACES_EXPORTER="otlp" \
    OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="http://otel-collector:4318/v1/traces" \
    NODE_OPTIONS="--require @opentelemetry/auto-instrumentations-node/register" \
    OTEL_NODE_ENABLED_INSTRUMENTATIONS="http,express,winston,mysql2"

EXPOSE 3000

# CMD ["node", "--require", "./otel/otel.js", "./index.js"]
CMD ["node", "index.js"]