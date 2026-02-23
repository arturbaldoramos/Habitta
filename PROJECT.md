# Habitta - SaaS de Gestão Condominial

## 📋 Visão Geral

Habitta é uma plataforma SaaS multi-tenant para gestão completa de condomínios residenciais e comerciais. O sistema permite que síndicos criem e gerenciem seus condomínios de forma autônoma, com gestão financeira, comunicação interna, reservas de áreas comuns, controle de ocorrências e muito mais.

## 🏗️ Arquitetura

### Multi-Tenancy
- **Modelo:** Database-per-tenant com schema isolation no PostgreSQL
- **Identificação:** Cada requisição carrega o `tenant_id` via JWT ou subdomain
- **Isolamento:** Queries automáticas com filtro de tenant via GORM scopes

### Estrutura de Repositórios
```
habitta/
├── api/          # Backend em Go
├── web/          # Frontend em Angular 21
└── PROJECT.md    # Este arquivo
```

## 🔧 Stack Tecnológica

### Backend (api/)
- **Linguagem:** Go 1.25
- **Framework Web:** Gin (roteamento e middleware)
- **ORM:** GORM (com PostgreSQL driver)
- **Database:** PostgreSQL 16+
- **Config:** Viper (gerenciamento de configurações/env)
- **Migrations:** golang-migrate ou GORM AutoMigrate
- **Validação:** go-playground/validator
- **AWS SDK:** aws-sdk-go-v2 (S3/MinIO storage)
- **JWT:** golang-jwt/jwt

**Arquitetura:**
- Clean Architecture / Hexagonal
- Camadas: handlers → services → repositories → models
- Separação por domínios: auth, condos, users, billing, etc.

### Frontend (web/)
- **Framework:** Angular 21 (standalone components)
- **Styling:** TailwindCSS
- **Componentes:** PrimeNG (componentes + theming)
- **State Management:** Signals (Angular 19+) ou NgRx se necessário
- **HTTP Client:** Angular HttpClient
- **Forms:** Reactive Forms

## 🐳 Infraestrutura e Deploy

### Docker
- **Docker Compose:** Orquestração de containers para desenvolvimento e produção
- **Containers:**
  - `habitta-api` - Backend Go
  - `habitta-web` - Frontend Angular (Nginx)
  - `habitta-db` - PostgreSQL 16
  - `habitta-minio` - MinIO (S3-compatible storage para dev local)

### Ambientes

**Desenvolvimento Local:**
- Backend: `go run cmd/server/main.go` (porta 8080)
- Frontend: `npm start` (porta 4200)
- Database: PostgreSQL via Docker ou local
- Storage: MinIO via Docker (porta 9000 API, 9001 console)

**Produção (Docker):**
- Backend: Multi-stage build com imagem Alpine
- Frontend: Build otimizado servido via Nginx
- Database: PostgreSQL em container dedicado
- Network: Rede interna Docker com bridge

### Estrutura de Deploy
```
habitta/
├── docker-compose.yml          # Orquestração de containers
├── api/
│   ├── Dockerfile             # Multi-stage build Go
│   └── .dockerignore
└── web/
    ├── Dockerfile             # Build Angular + Nginx
    └── .dockerignore
```

## 🗄️ Modelo de Dados (Simplificado)

### Entidades Principais

**Platform Level (sem tenant):**
- `platforms` - Configurações globais
- `subscriptions` - Assinaturas dos condomínios (planos)
- `payments` - Pagamentos das assinaturas

**Tenant Level (com tenant_id):**
- `tenants` - Condomínios (clientes)
- `users` - Usuários do sistema (síndicos, moradores, etc.)
- `units` - Unidades (apartamentos/casas)
- `folders` - Pastas de documentos
- `documents` - Documentos do condomínio (metadados; arquivos no S3)
- `bills` - Boletos para moradores
- `expenses` - Despesas do condomínio
- `maintenance_requests` - Chamados de manutenção
- `reservations` - Reservas de áreas comuns
- `communications` - Avisos e comunicados
- `documents` - Documentos do condomínio

### Relacionamentos Críticos
- `tenant` 1:N `users`
- `tenant` 1:N `units`
- `tenant` 1:N `folders`
- `tenant` 1:N `documents`
- `folder` 1:N `documents`
- `user` 1:N `documents` (uploaded_by)
- `unit` 1:N `users` (morador, proprietário, inquilino)
- `user` 1:N `maintenance_requests`
- `unit` 1:N `bills`

## 🎯 Funcionalidades MVP (Fase 1)

### Backend
- [x] Autenticação JWT multi-tenant
- [x] CRUD de condomínios (tenants)
- [x] CRUD de usuários (com roles: admin, sindico, morador)
- [x] CRUD de unidades
- [x] Sistema de convites por email
- [x] Gestão de documentos (upload/download via S3, pastas)
- [x] Minha Conta (perfil e senha)
- [ ] Geração de boletos (integração futura)
- [ ] Gestão financeira básica
- [ ] Chamados de manutenção
- [ ] Comunicados

### Frontend
- [x] Tela de login
- [x] Tela de registro
- [x] Dashboard do síndico
- [x] Cadastro de condomínio (onboarding)
- [x] Gestão de moradores
- [x] Gestão de unidades
- [x] Sistema de convites
- [x] Gestão de documentos (upload, pastas, download)
- [x] Minha Conta (perfil e senha)
- [ ] Lista de boletos
- [ ] Abertura de chamados

## 🔐 Segurança

- JWT com refresh tokens
- Passwords com bcrypt
- Rate limiting
- CORS configurado
- Validação de inputs
- SQL injection protection (via GORM)
- HTTPS obrigatório em produção

## 🚀 Como Rodar

### Desenvolvimento Local (Recomendado)

**Backend:**
```bash
cd api
go mod download
cp .env.example .env
# Configure as variáveis no .env
go run cmd/server/main.go
```

**Frontend:**
```bash
cd web
npm install
npm start
```

**Database:**
```bash
# Opção 1: PostgreSQL via Docker
docker run -d \
  --name habitta-postgres \
  -e POSTGRES_USER=habitta \
  -e POSTGRES_PASSWORD=habitta123 \
  -e POSTGRES_DB=habitta_db \
  -p 5432:5432 \
  postgres:16-alpine

# Opção 2: PostgreSQL local (instalar manualmente)
```

### Produção com Docker

**Iniciar todos os serviços:**
```bash
docker-compose up -d
```

**Parar todos os serviços:**
```bash
docker-compose down
```

**Ver logs:**
```bash
docker-compose logs -f
```

**Rebuild após mudanças:**
```bash
docker-compose up -d --build
```

**Acessar:**
- Frontend: http://localhost
- Backend API: http://localhost:8080
- Database: localhost:5432

## 📚 Convenções

### Código Go
- Package names: lowercase, singular
- Struct fields: PascalCase
- JSON tags: snake_case
- Errors: retornar sempre, usar `errors.New()` ou custom errors
- Context: sempre passar como primeiro parâmetro

### Código Angular
- Components: kebab-case (ex: `user-list.component.ts`)
- Services: PascalCase (ex: `UserService`)
- Interfaces: PascalCase com prefixo I (ex: `IUser`)
- Variáveis: camelCase

### Commits
- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Escopo: `feat(api):`, `fix(web):`

## 🔗 Links Úteis

- [Documentação do Gin](https://gin-gonic.com/docs/)
- [Documentação do GORM](https://gorm.io/docs/)
- [Angular Docs](https://angular.dev/)
- [PrimeNG Components](https://primeng.org/)
- [TailwindCSS](https://tailwindcss.com/docs)

## 👥 Time

- Baldo - Tech Lead / Full Stack Developer

## 📄 Licença

Proprietary - Habitta © 2024
