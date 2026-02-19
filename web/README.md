# Habitta Frontend

Frontend da aplicação Habitta - Sistema de Gestão de Condomínios.

## 🛠️ Stack Tecnológico

- **Angular 21** - Framework principal
- **TypeScript** - Linguagem de programação
- **TailwindCSS** - Framework CSS utilitário
- **PrimeNG** - Biblioteca de componentes UI
- **RxJS** - Programação reativa
- **Angular Signals** - Gerenciamento de estado reativo

## 📁 Estrutura de Pastas

```
src/app/
├── core/                       # Módulo principal com serviços e modelos
│   ├── guards/                 # Guards de rota (auth, role)
│   ├── interceptors/           # HTTP interceptors (JWT)
│   ├── models/                 # Interfaces e tipos TypeScript
│   └── services/               # Serviços da aplicação
│
├── features/                   # Módulos de funcionalidades
│   ├── auth/                   # Autenticação (login, register)
│   ├── dashboard/              # Dashboard principal
│   ├── users/                  # CRUD de usuários
│   └── units/                  # CRUD de unidades
│
└── shared/                     # Componentes e recursos compartilhados
    ├── components/             # Componentes reutilizáveis
    └── layouts/                # Layouts da aplicação
```

## 🚀 Como Rodar

### Desenvolvimento

```bash
npm install
npm start
```

A aplicação estará disponível em `http://localhost:4200`

### Build de Produção

```bash
npm run build
```

Os arquivos de build estarão em `dist/`

### Docker

```bash
# Na raiz do projeto
docker-compose up web
```

## 🔐 Autenticação

O sistema utiliza JWT (JSON Web Tokens) para autenticação:

1. O usuário faz login através do endpoint `/api/auth/login`
2. O backend retorna um token JWT e os dados do usuário
3. O token é armazenado no `localStorage`
4. O `authInterceptor` adiciona automaticamente o token em todas as requisições
5. Em caso de erro 401, o usuário é deslogado automaticamente

### Guards de Rota

- **authGuard**: Protege rotas que requerem autenticação
- **guestGuard**: Redireciona usuários autenticados (ex: página de login)
- **roleGuard**: Protege rotas por perfil de usuário (admin, sindico, morador)

## 👥 Perfis de Usuário

- **Admin**: Acesso total ao sistema
- **Síndico**: Gerenciamento de usuários e unidades
- **Morador**: Acesso limitado às suas informações

## 📱 Componentes Principais

### AuthService
Gerencia autenticação, login, logout e estado do usuário usando Signals.

```typescript
readonly isAuthenticated = computed(() => !!this.token() && !!this.user());
readonly currentUser = this.userSignal.asReadonly();
```

### UserService
CRUD completo de usuários com paginação e busca.

### UnitService
CRUD completo de unidades com paginação e busca.

## 🎨 Estilização

### TailwindCSS
Utilitários CSS para estilização rápida:

```html
<div class="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  ...
</div>
```

### PrimeNG
Componentes prontos com tema Lara Light Blue:

- Tables (p-table)
- Forms (p-inputText, p-dropdown, p-password)
- Dialogs (p-confirmDialog, p-message)
- Buttons (p-button)
- Cards (p-card)
- E mais...

## 🛣️ Rotas

### Públicas
- `/login` - Página de login
- `/register` - Página de registro

### Privadas (requerem autenticação)
- `/dashboard` - Dashboard principal
- `/users` - Lista de usuários (admin/sindico)
- `/users/new` - Criar usuário (admin/sindico)
- `/users/edit/:id` - Editar usuário (admin/sindico)
- `/units` - Lista de unidades (admin/sindico)
- `/units/new` - Criar unidade (admin/sindico)
- `/units/edit/:id` - Editar unidade (admin/sindico)
- `/unauthorized` - Página de acesso negado

## 🔧 Configuração

### API Base URL

Por padrão, o frontend aponta para `http://localhost:8080/api`.

Para alterar, edite os serviços em `src/app/core/services/`:

```typescript
private readonly API_URL = 'http://localhost:8080/api';
```

### Temas PrimeNG

O tema atual é Lara Light Blue. Para trocar, edite `src/styles.css`:

```css
@import 'primeng/resources/themes/lara-light-blue/theme.css';
```

Temas disponíveis: https://primeng.org/theming

## 📦 Build e Deploy

### Variáveis de Ambiente

Crie um arquivo `environment.ts` para diferentes ambientes:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

### Docker

O Dockerfile utiliza multi-stage build:

1. **Builder**: Compila a aplicação Angular
2. **Runtime**: Serve os arquivos estáticos com Nginx

Configurações do Nginx:

- Gzip habilitado
- Cache para assets estáticos
- Proxy reverso para `/api/*` → backend
- Suporte para SPA routing

## 🐛 Debug

### Angular DevTools

Instale a extensão Angular DevTools no Chrome para debug de componentes, signals e performance.

### Logs

Para debug do AuthService e interceptors, verifique o console do navegador.

## 📝 Convenções de Código

- Componentes standalone (sem NgModules)
- Signals para estado reativo
- Computed para estado derivado
- Formulários reativos (ReactiveFormsModule)
- Lazy loading de rotas
- ChangeDetectionStrategy.OnPush
- Control flow nativo do Angular (@if, @for, @switch)

## 🔄 Próximos Passos

- [ ] Implementar testes unitários (Vitest)
- [ ] Implementar testes E2E
- [ ] Adicionar PWA support
- [ ] Implementar i18n (internacionalização)
- [ ] Adicionar tema dark mode
- [ ] Implementar notificações em tempo real (WebSockets)
- [ ] Adicionar upload de arquivos/imagens
- [ ] Implementar relatórios e gráficos

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
