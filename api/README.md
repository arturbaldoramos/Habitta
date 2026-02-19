# Habitta API

Backend em Go para a plataforma SaaS de gestão condominial Habitta.

## 📋 Visão Geral

API REST multi-tenant construída com Clean Architecture para gestão completa de condomínios residenciais e comerciais.

### Stack Tecnológica

- **Go 1.25**
- **Gin** - Framework web
- **GORM** - ORM com PostgreSQL
- **Viper** - Gerenciamento de configurações
- **JWT** - Autenticação stateless
- **Bcrypt** - Hash de senhas

### Arquitetura

- **Clean Architecture / Hexagonal**
- **Multi-Tenancy** com isolamento por `tenant_id`
- **Camadas:** handlers → services → repositories → models

## 🚀 Quick Start

### Pré-requisitos

- Go 1.25 ou superior
- PostgreSQL 16+
- Make (opcional)

### Instalação

```bash
# Clone o repositório (se ainda não fez)
cd api

# Instalar dependências
go mod download

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais do PostgreSQL

# Rodar a aplicação
go run cmd/server/main.go
```

A API estará disponível em `http://localhost:8080`

### Build para Produção

```bash
# Build otimizado
go build -o bin/server cmd/server/main.go

# Executar
./bin/server
```

## ⚙️ Configuração

### Variáveis de Ambiente (.env)

```env
# Server
PORT=8080
ENV=development

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=habitta
DATABASE_PASSWORD=habitta123
DATABASE_NAME=habitta_db
DATABASE_SSL_MODE=disable

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION_HOURS=24

# CORS
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000
```

### Database Setup

```bash
# Opção 1: PostgreSQL via Docker
docker run -d \
  --name habitta-postgres \
  -e POSTGRES_USER=habitta \
  -e POSTGRES_PASSWORD=habitta123 \
  -e POSTGRES_DB=habitta_db \
  -p 5432:5432 \
  postgres:16-alpine

# Opção 2: PostgreSQL local
# Instale o PostgreSQL e crie o database manualmente
createdb habitta_db
```

As migrations são executadas automaticamente ao iniciar a aplicação.

## 📁 Estrutura do Projeto

```
api/
├── cmd/
│   └── server/
│       └── main.go              # Entry point
├── internal/
│   ├── config/                  # Viper configuration
│   ├── database/                # DB connection e migrations
│   ├── handlers/                # HTTP handlers (Gin)
│   ├── middleware/              # JWT, Tenant, CORS, Logger
│   ├── models/                  # GORM models
│   ├── repositories/            # Data access layer
│   └── services/                # Business logic
├── pkg/
│   └── utils/                   # Helpers (JWT, bcrypt)
├── .env                         # Environment variables
├── .env.example                 # Template de variáveis
├── go.mod                       # Dependencies
└── README.md                    # Este arquivo
```

## 🌐 API Endpoints

### Base URL

```
http://localhost:8080
```

### Health Check

```bash
GET /health
```

Resposta:
```json
{
  "status": "healthy",
  "time": "2024-02-07T01:00:00Z"
}
```

---

### Autenticação

#### Registrar Usuário

```bash
POST /api/auth/register
Content-Type: application/json

{
  "tenant_id": 1,
  "email": "user@example.com",
  "password": "senha123",
  "name": "João Silva",
  "role": "morador",
  "phone": "(11) 99999-9999",
  "cpf": "123.456.789-00"
}
```

Resposta (201 Created):
```json
{
  "data": {
    "id": 1,
    "tenant_id": 1,
    "email": "user@example.com",
    "name": "João Silva",
    "role": "morador",
    "active": true,
    "created_at": "2024-02-07T01:00:00Z"
  }
}
```

#### Login

```bash
POST /api/auth/login?tenant_id=1
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "senha123"
}
```

Resposta (200 OK):
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "tenant_id": 1,
      "email": "user@example.com",
      "name": "João Silva",
      "role": "morador"
    }
  }
}
```

**Nota:** Para MVP, `tenant_id` é passado via query param ou header `X-Tenant-ID`. Em produção, usar subdomain.

---

### Tenants (Admin Only)

**Requer:** Token JWT com `role: admin`

#### Criar Condomínio

```bash
POST /api/tenants
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Condomínio Residencial Exemplo",
  "cnpj": "12.345.678/0001-90",
  "email": "contato@exemplo.com",
  "phone": "(11) 3333-4444"
}
```

#### Listar Condomínios

```bash
GET /api/tenants
Authorization: Bearer <token>
```

#### Buscar Condomínio por ID

```bash
GET /api/tenants/:id
Authorization: Bearer <token>
```

#### Atualizar Condomínio

```bash
PUT /api/tenants/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Novo Nome",
  "cnpj": "12.345.678/0001-90",
  "active": true
}
```

#### Deletar Condomínio

```bash
DELETE /api/tenants/:id
Authorization: Bearer <token>
```

---

### Users (Tenant Isolated)

**Requer:** Token JWT válido

#### Criar Usuário

```bash
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "morador@example.com",
  "password": "senha123",
  "name": "Maria Santos",
  "role": "morador",
  "phone": "(11) 98888-7777"
}
```

**Nota:** `tenant_id` é extraído automaticamente do token JWT.

#### Listar Usuários

```bash
# Todos os usuários do tenant
GET /api/users
Authorization: Bearer <token>

# Filtrar por role
GET /api/users?role=sindico
Authorization: Bearer <token>
```

#### Buscar Usuário por ID

```bash
GET /api/users/:id
Authorization: Bearer <token>
```

#### Atualizar Usuário

```bash
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Maria Santos Silva",
  "email": "maria@example.com",
  "phone": "(11) 97777-6666"
}
```

**Nota:** Para alterar senha, use o endpoint específico abaixo.

#### Atualizar Senha

```bash
PATCH /api/users/:id/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "old_password": "senha123",
  "new_password": "novaSenha456"
}
```

#### Deletar Usuário

```bash
DELETE /api/users/:id
Authorization: Bearer <token>
```

---

### Units (Tenant Isolated)

**Requer:** Token JWT válido

#### Criar Unidade

```bash
POST /api/units
Authorization: Bearer <token>
Content-Type: application/json

{
  "number": "101",
  "block": "A",
  "floor": 1,
  "area": 85.5,
  "owner_name": "Carlos Oliveira",
  "owner_email": "carlos@example.com",
  "owner_phone": "(11) 96666-5555"
}
```

#### Listar Unidades

```bash
# Todas as unidades do tenant
GET /api/units
Authorization: Bearer <token>

# Filtrar por bloco
GET /api/units?block=A
Authorization: Bearer <token>
```

#### Buscar Unidade por ID

```bash
GET /api/units/:id
Authorization: Bearer <token>
```

#### Atualizar Unidade

```bash
PUT /api/units/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "number": "101",
  "block": "A",
  "occupied": true,
  "active": true
}
```

#### Deletar Unidade

```bash
DELETE /api/units/:id
Authorization: Bearer <token>
```

---

## 🔐 Autenticação e Autorização

### JWT Token

Todas as rotas protegidas requerem um token JWT válido no header:

```
Authorization: Bearer <token>
```

### Claims do JWT

```json
{
  "user_id": 1,
  "tenant_id": 1,
  "email": "user@example.com",
  "role": "morador",
  "exp": 1707264000,
  "iat": 1707177600
}
```

### Roles

- **`admin`** - Acesso total, incluindo gestão de tenants
- **`sindico`** - Gestão do condomínio (users, units)
- **`morador`** - Acesso básico

### Multi-Tenancy

Todas as operações de `users` e `units` são automaticamente isoladas por `tenant_id`:

- ✅ User do Tenant 1 **NÃO** pode acessar dados do Tenant 2
- ✅ `tenant_id` extraído do JWT (não pode ser falsificado)
- ✅ Filtros automáticos em todas as queries

## 🧪 Testando a API

### Exemplo Completo: Criar Tenant e Usuário

```bash
# 1. Criar um tenant (requer admin - para teste inicial, criar direto no DB)
# Inserir manualmente no PostgreSQL:
# INSERT INTO tenants (name, cnpj, active, created_at, updated_at)
# VALUES ('Condomínio Teste', '12.345.678/0001-90', true, NOW(), NOW());

# 2. Registrar primeiro usuário admin
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": 1,
    "email": "admin@habitta.com",
    "password": "admin123",
    "name": "Admin Teste",
    "role": "admin"
  }'

# 3. Fazer login
curl -X POST "http://localhost:8080/api/auth/login?tenant_id=1" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@habitta.com",
    "password": "admin123"
  }'

# Copiar o token retornado

# 4. Criar um morador
TOKEN="<token_do_passo_3>"
curl -X POST http://localhost:8080/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "morador@example.com",
    "password": "senha123",
    "name": "João Silva",
    "role": "morador"
  }'

# 5. Listar usuários
curl -X GET http://localhost:8080/api/users \
  -H "Authorization: Bearer $TOKEN"
```

## 📊 Migrations

As migrations são executadas automaticamente ao iniciar o servidor. Os seguintes models são criados:

- **tenants** - Condomínios
- **users** - Usuários (com tenant_id)
- **units** - Unidades (com tenant_id)

Para forçar recriação das tabelas (apenas desenvolvimento):

```sql
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
```

Depois reinicie a aplicação.

## 🛠️ Desenvolvimento

### Rodando em modo development

#### Opção 1: Com Hot Reload (Recomendado)

```bash
# 1. Instalar o Air (apenas uma vez)
go install github.com/air-verse/air@latest

# 2. Rodar o servidor com hot reload
cd api
air

# O servidor irá recarregar automaticamente ao detectar mudanças nos arquivos .go
```

#### Opção 2: Sem Hot Reload

```bash
# Rodar diretamente
cd api
go run cmd/server/main.go
```

#### Configuração do Air

O arquivo `.air.toml` já está configurado. Ele:
- Monitora todos os arquivos `.go`
- Exclui arquivos de teste (`*_test.go`)
- Compila para `tmp/main.exe`
- Reinicia automaticamente após mudanças

### Logs

Em modo `development`, todas as queries SQL são logadas:

```
[GET] /api/users HTTP/1.1 | Status: 200 | Latency: 15ms | IP: 127.0.0.1
```

Em `production`, apenas erros são logados.

## 🐛 Troubleshooting

### Erro: "Failed to connect to database"

- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no `.env`
- Teste a conexão: `psql -U habitta -d habitta_db`

### Erro: "tenant_id not found in context"

- Certifique-se de incluir o token JWT no header
- Verifique se o token não expirou (24h por padrão)

### Erro: "CNPJ already registered"

- Cada tenant deve ter um CNPJ único
- Use outro CNPJ ou delete o tenant existente

## 📝 Convenções de Código

### Go

- Package names: lowercase, singular
- Struct fields: PascalCase
- JSON tags: snake_case
- Sempre retornar erros, nunca panic

### Commits

```
feat(api): adicionar endpoint de relatórios
fix(auth): corrigir validação de JWT expirado
docs(readme): atualizar exemplos de uso
```

## 🔗 Links Úteis

- [Documentação do Gin](https://gin-gonic.com/docs/)
- [Documentação do GORM](https://gorm.io/docs/)
- [Go by Example](https://gobyexample.com/)

## 📄 Licença

Proprietary - Habitta © 2024
