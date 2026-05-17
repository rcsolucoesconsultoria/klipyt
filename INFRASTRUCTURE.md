# 🐳 Engenharia de Infraestrutura Local — KLIPYT (Docker Compose)

**Domínio:** https://klipyt.com  
**PostgreSQL host:** `localhost:5433` (mapeamento para 5432 no container)  

---

## docker-compose.yml

```yaml
version: '3.8'

services:
  postgres_db:
    image: postgis/postgis:15-3.3-alpine
    container_name: klipyt_db
    restart: always
    ports:
      - "5433:5432"
    environment:
      POSTGRES_USER: klipyt_admin
      POSTGRES_PASSWORD: klipyt_strong_password
      POSTGRES_DB: klipyt_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U klipyt_admin -d klipyt_prod"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis_cache:
    image: redis:7-alpine
    container_name: klipyt_redis
    restart: always
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```

---

## Variáveis de conexão recomendadas (.env)

| Variável | Valor local |
|----------|-------------|
| `DATABASE_URL` | `postgresql://klipyt_admin:klipyt_strong_password@localhost:5433/klipyt_prod` |
| `REDIS_URL` | `redis://localhost:6379` |
| `APP_DOMAIN` | `https://klipyt.com` |

---

## Comandos úteis

```bash
docker compose up -d
docker compose ps
docker exec -it klipyt_db psql -U klipyt_admin -d klipyt_prod -c "SELECT PostGIS_Version();"
docker exec -it klipyt_redis redis-cli PING
```