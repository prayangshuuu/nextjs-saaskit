# Next.js SaaS Kit

A production-ready, **100% free and open-source** SaaS starter kit built with Next.js. Features authentication, billing, multi-tenancy, and everything you need to launch your SaaS product.

**License**: MIT License - Free to use for any purpose, including commercial use.

## 🧠 LLM Project Context (Read This First)

**nextjs-saaskit** is a production-ready, 100% free and open-source SaaS starter kit built with Next.js 16, TypeScript, Prisma, and PostgreSQL. It provides a complete foundation for building multi-tenant SaaS applications with authentication, billing, role-based access control, email services, and admin dashboards. The project is designed to be immediately usable while remaining fully customizable, with no vendor lock-in, no telemetry, and no monetization features.

**Core Goals:**
- Provide a complete, production-ready SaaS foundation that developers can deploy immediately
- Maintain 100% open-source status with MIT licensing (no paywalls, no restrictions)
- Ensure security-first design with proper authentication, authorization, and data isolation
- Support multi-tenancy with organization-based tenant isolation
- Enable rapid development through comprehensive admin tooling and developer experience features

**Tech Stack Overview:**
- **Frontend**: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui components
- **Backend**: Next.js API Routes (REST API v1), JWT authentication, Prisma ORM
- **Database**: PostgreSQL with Prisma migrations
- **Key Libraries**: bcryptjs (password hashing), jsonwebtoken (auth), nodemailer (email), speakeasy (2FA), qrcode (2FA QR codes)

**High-Level Architecture:**
- **Frontend**: App Router with route groups for auth and dashboard, server and client components, theme support
- **Backend**: RESTful API under `/api/v1` with versioning, middleware-based route protection, centralized error handling
- **Database**: PostgreSQL with Prisma ORM, multi-tenant data isolation via middleware, comprehensive audit logging
- **Email**: Provider-agnostic email service with SMTP configuration, template system, org-level overrides
- **Billing**: Stripe integration with webhooks, subscription management, invoice generation, multiple payment provider support

**Key Design Constraints:**
- **Open Source First**: No monetization logic, no telemetry, no license enforcement in code
- **Security First**: JWT with refresh tokens, HTTP-only cookies, CSRF protection, rate limiting, tenant isolation
- **Multi-Tenancy**: Organization-based isolation with Prisma middleware enforcing data boundaries
- **RBAC**: Role-based access control with granular permissions, API and UI guards
- **Maintainer-Led**: Project direction guided by maintainer with community input

**Important Warning:**
If you do not have full repository context (e.g., you're reading only the README or a single file), do not propose large refactors or architectural changes. The codebase has specific patterns, middleware configurations, and design decisions that may not be apparent from limited context. Instead, ask questions or request clarification before suggesting significant modifications.

## 🤖 Coding Agent Instructions (Cursor / Copilot / AI Agents)

**You have full repository context.** These instructions govern your behavior when making changes to this codebase.

### Architecture Preservation Rules

- **DO NOT** modify the folder structure without explicit user request
- **DO NOT** change API versioning (`/api/v1`) or introduce breaking changes
- **DO NOT** refactor core authentication or authorization logic without approval
- **DO NOT** modify Prisma schema without understanding all dependent code
- **DO NOT** change multi-tenancy isolation patterns (Prisma middleware)
- **DO NOT** alter RBAC permission system structure

### Database & Prisma Rules

- **DO NOT** run `prisma db push --force-reset` or reset migrations
- **DO NOT** delete or rename existing Prisma models without checking all relations
- **DO NOT** modify tenant isolation middleware in `src/lib/prisma.ts`
- **DO** use `prisma db push` for development schema changes
- **DO** create proper migrations for production changes
- **DO** verify foreign key relationships before schema changes

### Authentication & Security Rules

- **DO NOT** modify JWT token generation or validation logic without security review
- **DO NOT** change password hashing algorithm (bcrypt) or salt rounds
- **DO NOT** remove or weaken security middleware or guards
- **DO NOT** expose sensitive data in API responses or logs
- **DO** maintain HTTP-only cookies for token storage
- **DO** preserve CSRF protection mechanisms
- **DO** maintain rate limiting on authentication endpoints

### API Versioning Rules

- **DO NOT** modify existing `/api/v1` endpoints in breaking ways
- **DO NOT** remove or rename API routes without deprecation notice
- **DO** add new endpoints following existing patterns
- **DO** maintain consistent error response formats
- **DO** use `apiHandler` wrapper for all API routes
- **DO** include proper authentication/authorization checks

### Multi-Tenancy Safety Rules

- **DO NOT** bypass tenant isolation middleware
- **DO NOT** query data without organization context where required
- **DO NOT** expose cross-tenant data in API responses
- **DO** use `getTenantFromRequest` for organization context
- **DO** verify tenant isolation in all data queries
- **DO** test multi-tenant scenarios when modifying data access

### RBAC Safety Rules

- **DO NOT** modify permission checking logic without understanding impact
- **DO NOT** grant admin access without proper checks
- **DO NOT** bypass `requireAdmin` or `requirePermission` guards
- **DO** verify permissions before allowing data access
- **DO** maintain consistency between API guards and UI guards

### Email & Billing Safety Rules

- **DO NOT** modify email sending logic without testing SMTP fallback
- **DO NOT** change billing calculation or subscription logic without verification
- **DO NOT** modify Stripe webhook handling without testing
- **DO** preserve org-level SMTP override functionality
- **DO** maintain email template variable interpolation
- **DO** verify payment provider configurations before changes

### Testing & Developer Experience Rules

- **DO NOT** remove or disable existing tests
- **DO NOT** modify CI/CD workflows without understanding impact
- **DO NOT** change Docker configuration without testing
- **DO** add tests for new features
- **DO** maintain test coverage for critical paths
- **DO** ensure tests pass before committing

### Commit Discipline Rules

- **DO** make one logical change per commit
- **DO** use conventional commit messages: `feat:`, `fix:`, `docs:`, `chore:`, `test:`
- **DO** update README.md when adding features or changing behavior
- **DO NOT** combine unrelated changes in a single commit
- **DO NOT** commit with generic messages like "update" or "fix"
- **DO NOT** skip commits or merge multiple tasks

### Explicitly Forbidden Actions

- **FORBIDDEN**: Running `prisma migrate reset` or destructive database operations
- **FORBIDDEN**: Changing API versioning from `/api/v1` without deprecation
- **FORBIDDEN**: Removing or weakening security features
- **FORBIDDEN**: Breaking multi-tenant data isolation
- **FORBIDDEN**: Silent refactoring of core systems without approval
- **FORBIDDEN**: Swapping major dependencies without user approval
- **FORBIDDEN**: Modifying authentication flow without security review
- **FORBIDDEN**: Removing audit logging or compliance features

### Error Handling Expectations

- **DO** use `apiHandler` wrapper for consistent error handling
- **DO** return appropriate HTTP status codes (400, 401, 403, 404, 500)
- **DO** log errors appropriately without exposing sensitive data
- **DO** provide clear error messages for validation failures
- **DO NOT** expose internal errors or stack traces in production responses

### README Update Rules

- **DO** update README.md when:
  - Adding new features or capabilities
  - Changing API endpoints or behavior
  - Modifying setup or deployment instructions
  - Adding new environment variables
  - Changing database schema significantly
- **DO NOT** update README.md for:
  - Internal code refactoring (unless behavior changes)
  - Bug fixes that don't change documented behavior
  - Test-only changes

### When in Doubt

- **ASK** before making architectural changes
- **VERIFY** impact on multi-tenancy and security
- **TEST** changes thoroughly before committing
- **PRESERVE** existing patterns and conventions
- **DOCUMENT** significant changes in README or code comments

## 🚀 Features

### Core Features
- ✅ **Next.js 16** with App Router and TypeScript
- ✅ **Prisma ORM** with PostgreSQL
- ✅ **JWT Authentication** with access and refresh tokens
- ✅ **Role-Based Access Control (RBAC)** with permissions
- ✅ **Email/Password Authentication**
- ✅ **Email Verification** flow
- ✅ **Password Reset** functionality
- ✅ **Dark/Light Mode** toggle
- ✅ **shadcn/ui** components with Tailwind CSS
- ✅ **REST API** versioned under `/api/v1`
- ✅ **Environment Validation** with Zod
- ✅ **Secure Middleware** for route protection

### Authentication & Security
- Secure password hashing with bcrypt
- HTTP-only cookies for token storage
- Session management
- Refresh token rotation
- Protected API routes
- Middleware-based route guards

### RBAC System
- **Roles**: ADMIN, USER (extensible)
- **Permissions**: Resource-based (USERS, SETTINGS, BILLING, CRUD) with actions (CREATE, READ, UPDATE, DELETE, MANAGE)
- **API Guards**: Permission-based API route protection
- **UI Guards**: Client and server-side component guards
- **Middleware**: Automatic route protection

## 📋 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Zod
- **Icons**: Lucide React

## 🏗️ System Architecture

### Frontend
- **App Router**: Next.js 16 App Router with route groups
- **Layouts**: Separate layouts for auth and dashboard
- **Components**: Reusable UI components with shadcn/ui
- **Theme**: Dark/light mode with system preference support

### Backend
- **API Routes**: RESTful API under `/api/v1`
- **Middleware**: Next.js middleware for route protection
- **Guards**: API and UI guards for authorization
- **Error Handling**: Centralized error handling with apiHandler
- **API Documentation**: Complete OpenAPI/Swagger documentation at `/api/docs/v1`

### Admin Dashboard
- **User Management**: Full CRUD operations for users with pagination and search
- **Role & Permission Management**: Create roles, assign permissions, manage user roles
- **Analytics & Reporting**: System metrics, user statistics, revenue tracking
- **SMTP Configuration**: Configure email sending with org-level overrides
- **Email Templates**: Manage and customize email templates
- **Settings Management**: System-wide configuration
- **Audit Logs**: Complete audit trail of all system actions
- **Module Management**: Enable/disable system features without redeployment

### Module-Based Architecture

**Philosophy**: Every feature, page, and system capability is controlled by a **module**. Admins can enable or disable modules from the Admin Dashboard, and changes apply instantly without code deployment.

**Module System**:
- **Database-Driven**: Module state is stored in the `system_modules` table
- **Centralized Control**: Single source of truth for feature availability
- **Multi-Level Enforcement**: Modules are checked at:
  - **Middleware Level**: Blocks API routes and pages before execution
  - **API Level**: Additional checks in route handlers
  - **UI Level**: Components conditionally render based on module state

**Default Modules**:
- `landing` - Landing page (PUBLIC scope)
- `pricing` - Pricing page and plans (PUBLIC scope)
- `billing` - Billing and subscriptions (AUTH scope)
- `auth` - Authentication system (PUBLIC scope)
- `rest_api` - REST API access (AUTH scope)
- `api_docs` - API documentation (PUBLIC scope)
- `dashboard` - User dashboard (AUTH scope)
- `admin` - Admin dashboard (ADMIN scope)
- `file_uploads` - File upload system (AUTH scope)
- `notifications` - Notification system (AUTH scope)

**Module Scopes**:
- **GLOBAL**: Available to everyone, no restrictions
- **PUBLIC**: Available to unauthenticated users
- **AUTH**: Requires authentication
- **ADMIN**: Requires admin role

**Dependency Rules**:
- Cannot disable `admin` module (critical system module)
- Cannot disable `auth` if `dashboard` is enabled
- Cannot disable `rest_api` if `api_docs` is enabled
- Cannot disable `dashboard` while users exist

**How Modules Affect System Behavior**:
- **Disabled API Routes**: Return 404 or 403 errors
- **Disabled Pages**: Redirect to appropriate fallback pages
- **Disabled UI Components**: Hidden or disabled
- **Changes Apply Instantly**: No code deployment required

**Admin Control**: 
- Access module management at `/dashboard/admin/modules` (admin only)
- Control landing page sections at `/dashboard/admin/landing` (admin only)
- Enable/disable coming soon mode via `coming_soon` module

**System-Wide Toggles**:
- **Coming Soon Mode**: When enabled, all public pages redirect to `/coming-soon` (admins can bypass)
- **REST API Toggle**: Disabling `rest_api` module blocks all `/api/v1` routes
- **Billing & Pricing**: Disabling `billing` or `pricing` modules hides those features from UI and blocks API access

### Database
- **Prisma**: Type-safe database client
- **Migrations**: Prisma migrations for schema management
- **Seeding**: Automated seed script for initial data

## 📊 Database Model

### Tables

#### `users`
- `id` (String, Primary Key)
- `email` (String, Unique)
- `password` (String, Hashed)
- `name` (String, Optional)
- `emailVerified` (Boolean)
- `emailVerifiedAt` (DateTime, Optional)
- `roleId` (String, Foreign Key → roles)
- `createdAt`, `updatedAt` (DateTime)

#### `roles`
- `id` (String, Primary Key)
- `name` (String, Unique) - e.g., "ADMIN", "USER"
- `description` (String, Optional)
- `createdAt`, `updatedAt` (DateTime)

#### `permissions`
- `id` (String, Primary Key)
- `name` (String, Unique) - e.g., "USERS_CREATE"
- `description` (String, Optional)
- `resource` (String) - e.g., "USERS", "SETTINGS", "BILLING", "CRUD"
- `action` (String) - e.g., "CREATE", "READ", "UPDATE", "DELETE", "MANAGE"
- `createdAt`, `updatedAt` (DateTime)

#### `role_permissions`
- `id` (String, Primary Key)
- `roleId` (String, Foreign Key → roles)
- `permissionId` (String, Foreign Key → permissions)
- `createdAt` (DateTime)
- Unique constraint on `[roleId, permissionId]`

#### `sessions`
- `id` (String, Primary Key)
- `userId` (String, Foreign Key → users)
- `token` (String, Unique)
- `expiresAt` (DateTime)
- `createdAt` (DateTime)

#### `refresh_tokens`
- `id` (String, Primary Key)
- `userId` (String, Foreign Key → users)
- `token` (String, Unique)
- `expiresAt` (DateTime)
- `createdAt` (DateTime)

#### `password_reset_tokens`
- `id` (String, Primary Key)
- `userId` (String, Foreign Key → users)
- `token` (String, Unique)
- `expiresAt` (DateTime)
- `used` (Boolean)
- `createdAt` (DateTime)

#### `email_verification_tokens`
- `id` (String, Primary Key)
- `userId` (String)
- `token` (String, Unique)
- `expiresAt` (DateTime)
- `used` (Boolean)
- `createdAt` (DateTime)

### Billing Tables

#### `plans`
- `id` (String, Primary Key)
- `name` (String)
- `description` (String, Optional)
- `price` (Decimal) - Price in specified currency
- `interval` (Enum: MONTHLY, YEARLY)
- `features` (JSON, Optional) - Array of feature strings
- `active` (Boolean) - Whether plan is available for subscription
- `createdAt`, `updatedAt` (DateTime)

#### `subscriptions`
- `id` (String, Primary Key)
- `userId` (String, Foreign Key → users)
- `planId` (String, Foreign Key → plans)
- `status` (Enum: PENDING, ACTIVE, CANCELED, EXPIRED, PAST_DUE)
- `currentPeriodStart` (DateTime, Optional)
- `currentPeriodEnd` (DateTime, Optional)
- `cancelAtPeriodEnd` (Boolean) - Cancel at end of billing period
- `canceledAt` (DateTime, Optional)
- `providerSubscriptionId` (String, Optional) - External provider subscription ID
- `providerType` (Enum: STRIPE, BKASH, SSLCOMMERZ, PIPRAPAY, Optional)
- `createdAt`, `updatedAt` (DateTime)

#### `invoices`
- `id` (String, Primary Key)
- `userId` (String, Foreign Key → users)
- `subscriptionId` (String, Foreign Key → subscriptions, Optional)
- `amount` (Decimal) - Invoice amount
- `currency` (String) - Currency code (default: USD)
- `status` (Enum: DRAFT, PENDING, PAID, FAILED, REFUNDED)
- `providerInvoiceId` (String, Optional) - External provider invoice ID
- `providerType` (Enum: STRIPE, BKASH, SSLCOMMERZ, PIPRAPAY, Optional)
- `paidAt` (DateTime, Optional)
- `dueDate` (DateTime, Optional)
- `createdAt`, `updatedAt` (DateTime)

#### `payment_providers`
- `id` (String, Primary Key)
- `type` (Enum: STRIPE, BKASH, SSLCOMMERZ, PIPRAPAY, Unique)
- `enabled` (Boolean) - Whether provider is enabled
- `testMode` (Boolean) - Test/live mode toggle
- `apiKey` (String, Optional) - Encrypted API key
- `apiSecret` (String, Optional) - Encrypted API secret
- `webhookSecret` (String, Optional) - Encrypted webhook secret
- `config` (JSON, Optional) - Provider-specific configuration
- `createdAt`, `updatedAt` (DateTime)

### Multi-Tenancy Tables

#### `organizations`
- `id` (String, Primary Key)
- `name` (String) - Organization name
- `slug` (String, Unique) - URL-friendly identifier
- `ownerId` (String, Foreign Key → users) - Organization owner
- `metadata` (JSON, Optional) - Additional organization data
- `createdAt`, `updatedAt` (DateTime)

#### `organization_members`
- `id` (String, Primary Key)
- `organizationId` (String, Foreign Key → organizations)
- `userId` (String, Foreign Key → users)
- `role` (Enum: OWNER, ADMIN, MEMBER) - Member role
- `invitedBy` (String, Optional) - User who invited this member
- `joinedAt` (DateTime) - When member joined
- `createdAt`, `updatedAt` (DateTime)
- Unique constraint on `[organizationId, userId]`

**Tenant Isolation:**
- `subscriptions.organizationId` - Links subscriptions to organizations
- `invoices.organizationId` - Links invoices to organizations
- `api_keys.organizationId` - Links API keys to organizations
- Prisma middleware automatically enforces tenant isolation for all queries

#### `smtp_configs`
- `id` (String, Primary Key)
- `organizationId` (String, Optional, Foreign Key → organizations) - null for global fallback
- `host` (String) - SMTP server hostname
- `port` (Int) - SMTP port (default: 587)
- `username` (String) - SMTP username
- `password` (String) - Encrypted SMTP password
- `fromName` (String) - Sender display name
- `fromEmail` (String) - Sender email address
- `secure` (Boolean) - Use TLS/SSL (default: false)
- `enabled` (Boolean) - Whether config is active
- `createdAt`, `updatedAt` (DateTime)
- Unique constraint on `organizationId` (one config per org)

**Email Architecture:**
- Global SMTP fallback (organizationId = null)
- Organization-level SMTP override support
- Automatic fallback: org config → global config
- Encrypted password storage (application layer)
- Provider-agnostic email service

## 🔌 API Structure

All API routes are versioned under `/api/v1`.

### Authentication Endpoints

#### `POST /api/v1/auth/register`
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe" // optional
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": false
  }
}
```

#### `POST /api/v1/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": true,
    "role": "USER"
  }
}
```

#### `POST /api/v1/auth/logout`
Logout and invalidate sessions.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

#### `GET /api/v1/auth/me`
Get current user information.

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": true,
    "role": {
      "id": "role_id",
      "name": "USER",
      "permissions": [...]
    }
  }
}
```

#### `POST /api/v1/auth/verify-email`
Verify email with token.

**Request Body:**
```json
{
  "token": "verification_token"
}
```

#### `POST /api/v1/auth/forgot-password`
Request password reset.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

#### `POST /api/v1/auth/reset-password`
Reset password with token.

**Request Body:**
```json
{
  "token": "reset_token",
  "password": "new_password123"
}
```

### Admin Endpoints

#### `GET /api/v1/admin/plans`
Get all subscription plans (Admin only).

**Response:**
```json
{
  "plans": [
    {
      "id": "plan_id",
      "name": "Pro Plan",
      "description": "Professional features",
      "price": 29.99,
      "interval": "MONTHLY",
      "features": ["Feature 1", "Feature 2"],
      "active": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### `POST /api/v1/admin/plans`
Create a new subscription plan (Admin only).

**Request Body:**
```json
{
  "name": "Pro Plan",
  "description": "Professional features",
  "price": 29.99,
  "interval": "MONTHLY",
  "features": ["Feature 1", "Feature 2"],
  "active": true
}
```

#### `PUT /api/v1/admin/plans/:id`
Update a subscription plan (Admin only).

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Plan",
  "price": 39.99,
  "active": false
}
```

#### `DELETE /api/v1/admin/plans/:id`
Delete a subscription plan (Admin only). Cannot delete plans with active subscriptions.

## 👥 Admin vs User Capabilities

### Admin Capabilities
- Full system access
- All permissions granted automatically
- Access to admin-only routes (`/api/v1/admin/*`)
- User management
- **Plans Management**: Create, update, delete subscription plans
  - Manage plan pricing, intervals (monthly/yearly)
  - Configure plan features
  - Toggle plan active/inactive status
- **Payment Provider Configuration**: Manage payment gateway settings
  - Enable/disable payment providers (Stripe, bKash, SSLCommerz, PipraPay)
  - Configure API keys and secrets securely
  - Toggle test/live mode
  - Manage provider-specific settings
- System configuration
- All CRUD operations

### User Capabilities
- Limited access based on assigned permissions
- Default permissions:
  - Read access to CRUD resources
  - Read access to Settings
- Can update own profile
- **Billing Features:**
  - View available subscription plans
  - Subscribe to plans
  - View own subscription history
- Cannot access admin routes

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nextjs_saaskit?schema=public"

# JWT Secrets (generate strong random strings, minimum 32 characters)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars-long"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars-long"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# App
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email (Optional - for production)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM=""
```

## 🚀 Setup & Deployment Guide

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nextjs-saaskit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and secrets
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Run migrations
   npm run db:migrate

   # Seed the database
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

### Production Deployment

#### Option 1: Docker (Recommended)

1. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Run migrations**
   ```bash
   docker-compose exec app npx prisma migrate deploy
   ```

3. **Seed database (optional)**
   ```bash
   docker-compose exec app npm run db:seed
   ```

#### Option 2: Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Run migrations in production**
   ```bash
   npx prisma migrate deploy
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

### Docker Development

For local development with Docker:

```bash
# Start PostgreSQL only
docker-compose -f docker-compose.dev.yml up -d

# Run migrations
npm run db:migrate

# Start dev server
npm run dev
```

### Database Migrations

```bash
# Create a new migration
npm run db:migrate

# Apply migrations in production
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npm run db:studio
```

## 👤 Seed Users

After running `npm run db:seed`, the following users are created:

### Admin User
- **Email**: `admin@prayangshu.com`
- **Password**: `Kit321!SaaS`
- **Role**: ADMIN
- **Permissions**: All permissions

### Regular User
- **Email**: `user@prayangshu.com`
- **Password**: `Kit321!SaaS`
- **Role**: USER
- **Permissions**: Basic read permissions

## 🛡️ Security Features

- **Password Hashing**: bcrypt with salt rounds of 12
- **JWT Tokens**: Secure token generation and validation
- **HTTP-Only Cookies**: Prevents XSS attacks
- **CSRF Protection**: SameSite cookie attribute
- **Route Guards**: Middleware and API guards
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Prisma ORM parameterized queries

## 📁 Project Structure

```
nextjs-saaskit/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                 # Seed script
├── src/
│   ├── app/
│   │   ├── (auth)/            # Auth route group
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/       # Dashboard route group
│   │   │   └── dashboard/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       └── auth/     # Auth API routes
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── guards/           # Auth & admin guards
│   │   ├── ui/               # shadcn/ui components
│   │   ├── theme-provider.tsx
│   │   └── theme-toggle.tsx
│   ├── lib/
│   │   ├── auth.ts           # Auth utilities
│   │   ├── rbac.ts           # RBAC utilities
│   │   ├── api-guards.ts     # API guards
│   │   ├── server-guards.ts  # Server-side guards
│   │   ├── env.ts            # Environment validation
│   │   ├── prisma.ts         # Prisma client
│   │   └── utils.ts          # Utility functions
│   └── middleware.ts         # Next.js middleware
├── .env.example              # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## 🌐 Marketing & Landing Pages

### Landing Page (`/`)
- Hero section with value proposition
- Feature highlights grid
- How it works section
- Screenshots placeholders
- Testimonials section
- Trust badges
- Feature comparison
- Multiple CTAs (pricing, free trial)
- Dark/light mode support
- SEO-optimized structure

**Conversion Focus:**
- Clear value proposition
- Social proof (testimonials)
- Trust indicators
- Multiple conversion points
- Pricing anchor links

## 🔮 Upcoming Features Roadmap

- [x] **Payment Integration**
  - [x] Stripe integration
  - [x] bKash integration (structure ready)
  - [x] SSLCommerz integration (structure ready)
  - [x] PipraPay integration (structure ready)
- [x] **Admin Dashboard**
  - [x] Plans management UI
  - [x] Payment provider configuration UI
  - [x] User management UI
  - [x] Role and permission management UI
  - [x] Analytics and reporting
- [x] **Email Service**
  - [x] SMTP integration
  - [x] Email templates
  - [x] Email verification emails
  - [x] Password reset emails
- [x] **Advanced Features**
  - [x] Two-factor authentication (2FA)
  - [x] Social login (OAuth)
  - [x] API rate limiting
  - [x] File uploads
  - [x] Webhooks (Stripe)
- [x] **Developer Experience**
  - [x] API documentation (Swagger/OpenAPI)
  - [x] Testing suite (Vitest)
  - [x] CI/CD pipeline
  - [x] Docker support

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Copyright (c) 2025 Prayangshu Biswas**

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the conditions in the LICENSE file.

**Open Source Commitment:**
- 100% Free & Open Source
- No monetization or paywalls
- No telemetry or tracking
- No license enforcement in code
- Community-friendly and maintainer-led

## 🤝 Contributing

We welcome contributions! This is an open-source project under the MIT License.

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

### Quick Start

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow the existing code style
- Write clear commit messages (see CONTRIBUTING.md)
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass

### Open Source Philosophy

- **100% Free & Open Source**: No monetization, no paywalls, no restrictions
- **No Tracking**: No telemetry or tracking by default
- **Transparency**: All code is open and auditable
- **Community First**: Community contributions are welcome and valued
- **Maintainer-Led**: Project direction guided by maintainer with community input

## 🎯 Project Vision

nextjs-saaskit aims to be the go-to open-source SaaS starter kit for developers who want to:

- **Launch Faster**: Skip the repetitive setup work and focus on your unique value
- **Build Confidently**: Use production-ready, battle-tested patterns and practices
- **Scale Easily**: Built with scalability and multi-tenancy in mind from day one
- **Stay Free**: No vendor lock-in, no hidden costs, no restrictions

We believe that great tools should be accessible to everyone, and that's why this project is 100% free and open source.

## 🔒 Security

### Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- HTTP-only cookies
- CSRF protection
- SQL injection prevention (Prisma ORM)
- XSS protection
- Rate limiting on API routes
- Tenant isolation for multi-tenant data
- Encrypted sensitive data storage
- Audit logs for compliance

### Security Policy

We take security seriously. If you discover a security vulnerability:

1. **Do not** open a public issue
2. Email security concerns to: [security@example.com]
3. Provide detailed information about the vulnerability
4. Allow time for the issue to be addressed before disclosure

### Responsible Disclosure

We encourage responsible disclosure of security vulnerabilities:
- Report privately first
- Give maintainers time to fix the issue
- Work together on a coordinated disclosure
- We appreciate your help in keeping the project secure

### Dependency Security

- All dependencies are open-source and regularly updated
- Dependencies are reviewed for security vulnerabilities
- Use `npm audit` to check for known vulnerabilities
- Keep dependencies up to date

## 📧 Support

### Community Support

For issues, questions, and discussions:
- Open an issue in the repository
- Check existing issues and discussions
- Review the documentation

---

**Built with ❤️ using Next.js**

**License**: MIT License - See [LICENSE](LICENSE) for details

**Copyright (c) 2025 Prayangshu Biswas**
