# Habitta - SaaS de Gestão Condominial

Plataforma completa para gestão de condomínios residenciais e comerciais.

## 🏗️ Arquitetura

- **Backend:** Go 1.25 + Gin + GORM + PostgreSQL
- **Frontend:** Angular 21 + TailwindCSS + PrimeNG
- **Database:** PostgreSQL 16
- **Storage:** Amazon S3 (MinIO para dev local)
- **Deploy:** Docker + Docker Compose

## 📁 Estrutura do Projeto

```
habitta/
├── api/              # Backend em Go
│   ├── cmd/          # Entry points
│   ├── internal/     # Código interno (handlers, services, repos, models)
│   ├── pkg/          # Código reutilizável (utils)
│   ├── Dockerfile    # Build de produção
│   └── README.md     # Documentação da API
│
├── web/              # Frontend em Angular
│   ├── src/          # Código-fonte Angular
│   ├── Dockerfile    # Build de produção
│   └── nginx.conf    # Configuração Nginx
│
├── docker-compose.yml  # Orquestração de containers
└── PROJECT.md         # Documentação técnica completa
```

## 🚀 Quick Start

### Opção 1: Docker Compose (Recomendado para Produção)

```bash
# Clonar o repositório
git clone <repo-url>
cd habitta

# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar todos os serviços
docker-compose down
```

**Acessar:**
- Frontend: http://localhost
- Backend API: http://localhost:8080
- Database: localhost:5432
- MinIO Console: http://localhost:9001 (minioadmin/minioadmin)

### Opção 2: Desenvolvimento Local (Com Hot Reload)

#### 1. Database (via Docker)

```bash
docker run -d \
  --name habitta-postgres \
  -e POSTGRES_USER=habitta \
  -e POSTGRES_PASSWORD=habitta123 \
  -e POSTGRES_DB=habitta_db \
  -p 5432:5432 \
  postgres:16-alpine
```

#### 2. Backend (com Air - Hot Reload)

```bash
# Instalar Air (apenas uma vez)
go install github.com/air-verse/air@latest

# Configurar ambiente
cd api
cp .env.example .env
# Editar .env com credenciais do PostgreSQL

# Baixar dependências
go mod download

# Iniciar com hot reload
air
```

**Backend disponível em:** http://localhost:8080

O servidor irá **recarregar automaticamente** ao detectar mudanças nos arquivos `.go`

#### 3. Frontend (com Hot Reload nativo do Angular)

```bash
cd web
npm install
npm start
```

**Frontend disponível em:** http://localhost:4200

O Angular já possui hot reload nativo - mudanças em arquivos `.ts`, `.html` ou `.css` recarregam automaticamente.

---

### Opção 3: Desenvolvimento Local (Sem Hot Reload)

#### Backend

```bash
cd api
cp .env.example .env
go mod download
go run cmd/server/main.go
```

Backend disponível em: http://localhost:8080

#### Frontend

```bash
cd web
npm install
npm start
```

Frontend disponível em: http://localhost:4200

## 🐳 Docker

### Serviços

O `docker-compose.yml` orquestra 4 serviços:

1. **habitta-db** - PostgreSQL 16
   - Porta: 5432
   - Volume persistente: `postgres_data`

2. **habitta-minio** - MinIO (S3-compatible storage)
   - Porta API: 9000
   - Porta Console: 9001
   - Volume persistente: `minio_data`
   - Credenciais: minioadmin/minioadmin

3. **habitta-api** - Backend Go
   - Porta: 8080
   - Health check: GET /health
   - Aguarda database estar pronto

4. **habitta-web** - Frontend Angular + Nginx
   - Porta: 80
   - Proxy reverso para API (/api → habitta-api:8080)
   - Health check: GET /health

### Comandos Úteis

```bash
# Iniciar (detached)
docker-compose up -d

# Rebuild após mudanças
docker-compose up -d --build

# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f habitta-api

# Parar serviços
docker-compose stop

# Parar e remover containers
docker-compose down

# Parar e remover containers + volumes
docker-compose down -v

# Ver status dos serviços
docker-compose ps

# Executar comando em container
docker-compose exec habitta-api sh
```

### Variáveis de Ambiente (Produção)

Para produção, defina a variável `JWT_SECRET` antes de iniciar:

```bash
export JWT_SECRET="your-secure-secret-key-here"
docker-compose up -d
```

Ou crie um arquivo `.env` na raiz:

```env
JWT_SECRET=your-secure-secret-key-here
```

## 📊 Multi-Tenancy

O sistema implementa **multi-tenancy com isolamento por tenant_id**:

- Cada condomínio é um **Tenant**
- Todas as requisições são isoladas por `tenant_id` (extraído do JWT)
- Queries automáticas filtram dados por tenant
- **Impossível** acessar dados de outro condomínio

## 🔐 Autenticação

### Fluxo Básico

1. **Criar Tenant** (admin)
   ```bash
   POST /api/tenants
   ```

2. **Registrar Usuário**
   ```bash
   POST /api/auth/register
   ```

3. **Login**
   ```bash
   POST /api/auth/login?tenant_id=1
   ```

4. **Usar Token JWT** em todas as requisições protegidas
   ```bash
   Authorization: Bearer <token>
   ```

### Roles

- **admin** - Acesso total (gestão de tenants)
- **sindico** - Gestão do condomínio
- **morador** - Acesso básico

## 📚 Documentação

- **[PROJECT.md](./PROJECT.md)** - Visão geral técnica, stack, convenções
- **[api/README.md](./api/README.md)** - Documentação completa da API com exemplos

## 🧪 Testando

### Health Checks

```bash
# API
curl http://localhost:8080/health

# Frontend (via Docker)
curl http://localhost/health
```

### Exemplo Completo

```bash
# 1. Criar tenant (inserir manualmente no DB por enquanto)
docker-compose exec habitta-db psql -U habitta -d habitta_db -c \
  "INSERT INTO tenants (name, cnpj, active, created_at, updated_at)
   VALUES ('Condomínio Teste', '12.345.678/0001-90', true, NOW(), NOW());"

# 2. Registrar usuário admin
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": 1,
    "email": "admin@habitta.com",
    "password": "admin123",
    "name": "Admin",
    "role": "admin"
  }'

# 3. Login
curl -X POST "http://localhost:8080/api/auth/login?tenant_id=1" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@habitta.com",
    "password": "admin123"
  }'

# 4. Usar token retornado
TOKEN="<seu-token-aqui>"
curl -X GET http://localhost:8080/api/users \
  -H "Authorization: Bearer $TOKEN"
```

## 🛠️ Tecnologias

### Backend
- Go 1.25
- Gin (web framework)
- GORM (ORM)
- PostgreSQL 16
- AWS SDK v2 (S3/MinIO storage)
- JWT (autenticação)
- Bcrypt (hash de senhas)
- Viper (config)

### Frontend
- Angular 21 (standalone components)
- TailwindCSS
- PrimeNG
- TypeScript
- RxJS

### DevOps
- Docker
- Docker Compose
- Nginx
- MinIO (S3 local para desenvolvimento)
- Multi-stage builds

## 📄 Licença

Proprietary - Habitta © 2024

## 👥 Time

- Baldo - Tech Lead / Full Stack Developer
