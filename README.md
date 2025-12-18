# Next.js SaaS Kit

A production-ready SaaS starter kit built with Next.js, featuring authentication, role-based access control (RBAC), and a scalable architecture.

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
  - [ ] User management UI
  - [ ] Role and permission management UI
  - [ ] Analytics and reporting
- [ ] **Email Service**
  - SMTP integration
  - Email templates
  - Email verification emails
  - Password reset emails
- [ ] **Advanced Features**
  - Two-factor authentication (2FA)
  - Social login (OAuth)
  - [x] API rate limiting
  - File uploads
  - [x] Webhooks (Stripe)
- [x] **Developer Experience**
  - [x] API documentation (Swagger/OpenAPI)
  - Testing suite (Jest/Vitest)
  - CI/CD pipeline
  - Docker support

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Commercial Licensing

This software is open source and free to use for any purpose, including commercial use. We also offer commercial services including paid support, private builds, and hosted SaaS options. See [COMMERCIAL.md](COMMERCIAL.md) for details.

**Open Source Commitment:**
- The open-source version will always remain free
- No features are restricted in the OSS version
- Commercial services are optional and do not restrict usage

## 🤝 Contributing

We welcome contributions! This is an open-source project under the MIT License.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow the existing code style
- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass

### Open Source Philosophy

- **Free Forever**: The open-source version will always remain free
- **No Restrictions**: No features are restricted in the OSS version
- **Transparency**: All code is open and auditable
- **Community First**: Community contributions are welcome and valued

## 📧 Support

### Community Support

For issues, questions, and discussions:
- Open an issue in the repository
- Check existing issues and discussions
- Review the documentation

### Commercial Support

For priority support, custom development, or hosted solutions:
- See [COMMERCIAL.md](COMMERCIAL.md) for details
- Contact: [support@example.com]

---

**Built with ❤️ using Next.js**

**License**: MIT License - See [LICENSE](LICENSE) for details
