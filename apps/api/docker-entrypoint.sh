#!/bin/sh
set -e

echo "[KLIPYT] Aguardando PostgreSQL em ${DB_HOST:-postgres_db}:${DB_PORT:-5432}..."
until node -e "
const net = require('net');
const s = net.createConnection({
  host: process.env.DB_HOST || 'postgres_db',
  port: Number(process.env.DB_PORT || 5432),
});
s.on('connect', () => { s.end(); process.exit(0); });
s.on('error', () => process.exit(1));
"; do
  sleep 2
done

echo "[KLIPYT] Executando migrations..."
node -r reflect-metadata ./node_modules/typeorm/cli.js migration:run \
  -d ./dist/infrastructure/database/data-source.js

echo "[KLIPYT] Iniciando API na porta ${API_PORT:-3000}..."
exec node dist/main.js
