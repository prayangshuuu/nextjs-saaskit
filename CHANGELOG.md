# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-XX

### Added

#### Core Features
- Next.js 16 with App Router and TypeScript
- Prisma ORM with PostgreSQL
- JWT Authentication with access and refresh tokens
- Role-Based Access Control (RBAC) with permissions
- Email/Password Authentication
- Email Verification flow
- Password Reset functionality
- Dark/Light Mode toggle
- shadcn/ui components with Tailwind CSS
- REST API versioned under `/api/v1`
- Environment Validation with Zod
- Secure Middleware for route protection

#### Authentication & Security
- Secure password hashing with bcrypt
- HTTP-only cookies for token storage
- Session management
- Refresh token rotation
- Protected API routes
- Middleware-based route guards

#### Billing & Payments
- Subscription plans management
- Stripe integration with webhooks
- Local payment providers (bKash, SSLCommerz, PipraPay)
- Invoice generation
- Payment provider configuration

#### Multi-Tenancy
- Organization management
- Organization member roles (OWNER, ADMIN, MEMBER)
- Tenant isolation via Prisma middleware
- Organization switching UI

#### Usage Metering
- Usage tracking engine
- Plan-based limits enforcement
- Usage analytics dashboard

#### Audit & Compliance
- Audit log system
- Admin audit log viewer
- Sensitive data masking

#### Email System
- SMTP configuration (global and org-level)
- Email template system
- Template rendering with variable interpolation
- Centralized email service

#### Notifications
- In-app notifications
- Email notifications
- Notification preferences
- Admin broadcast notifications

#### System Settings
- Runtime configuration engine
- Type-safe settings (string, number, boolean, json)
- Organization-level setting overrides
- Encrypted secret storage

#### Branding & White-Label
- Dynamic branding engine
- CSS variable customization
- White-label support
- Optional attribution

#### Feature Flags
- Feature flag system
- Organization-level flag overrides
- Cached flag resolution

#### Maintenance Mode
- Global maintenance toggle
- Custom maintenance message
- Admin bypass

#### Marketing & UX
- Public landing page
- Pricing page
- Conversion-focused CTAs
- SEO optimization (metadata, sitemap, robots.txt)
- Auth redirect logic
- Loading skeletons and empty states
- Accessibility improvements

#### Admin Dashboard
- Plans management UI
- Payment provider configuration UI
- SMTP settings UI
- Email template editor
- System settings UI
- System health diagnostics
- Telemetry controls (opt-in, disabled by default)
- Update notifications

#### Developer Experience
- API documentation (Swagger/OpenAPI)
- API keys with rate limiting
- Comprehensive README
- Seed scripts for initial data

### Security
- No telemetry by default
- No PII collection
- Encrypted sensitive data
- Tenant isolation
- Audit logging

### License
- MIT License
- 100% Free & Open Source
- No monetization or paywalls
- No license enforcement in code

[0.1.0]: https://github.com/prayangshuuu/nextjs-saaskit/releases/tag/v0.1.0

