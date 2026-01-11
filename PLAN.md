# Smart Pocket JS - Project Planning

## Document Overview

This document provides comprehensive planning for the Smart Pocket JS project, including development roadmap, technical architecture, resource allocation, and success metrics.

**Last Updated**: 2026-01-11  
**Status**: In Progress  
**Project Phase**: Phase 3 - Mobile App Development

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Vision](#project-vision)
3. [Development Phases](#development-phases)
4. [Current Status](#current-status)
5. [Feature Roadmap](#feature-roadmap)
6. [Technical Architecture Planning](#technical-architecture-planning)
7. [Deployment Strategy](#deployment-strategy)
8. [Testing & Quality Assurance](#testing--quality-assurance)
9. [Team Workflow](#team-workflow)
10. [Risk Assessment](#risk-assessment)
11. [Timeline & Milestones](#timeline--milestones)
12. [Success Metrics](#success-metrics)
13. [Resource Planning](#resource-planning)
14. [Open Questions](#open-questions)

---

## Executive Summary

Smart Pocket JS is a personal finance management application with OCR receipt scanning capabilities, designed for homeserver deployment. The project follows a phased development approach:

- **Phase 1 (✅ Complete)**: Core Backend - Express server, PostgreSQL database, API endpoints
- **Phase 2 (✅ Complete)**: Docker Deployment & CI/CD - Containerization, GitHub Actions, release pipeline
- **Phase 3 (🚧 In Progress)**: Mobile App Development - React Native app with feature-based architecture
- **Phase 4 (📋 Planned)**: Integration & Features - Actual Budget sync, advanced features
- **Phase 5 (📋 Planned)**: Testing & Quality - Comprehensive test coverage
- **Phase 6 (🔮 Future)**: Advanced Features - AI insights, price trends, recommendations

**Current Focus**: Building out mobile app screens and connecting to backend APIs.

---

## Project Vision

### Goal
Create a privacy-first, self-hosted personal finance tracking system that makes receipt scanning and spending analysis effortless.

### Core Principles
1. **Privacy First**: All data stays on user's infrastructure
2. **Homeserver Model**: One server instance = one user (no multi-tenancy)
3. **Modular Design**: Features can be enabled/disabled per deployment
4. **Developer Experience**: Clean architecture, comprehensive documentation
5. **Progressive Enhancement**: Start simple, add advanced features incrementally

### Key Differentiators
- Detailed item-level tracking (not just transaction totals)
- Store-specific product code mapping
- Price history and trend analysis
- OCR with AI-powered parsing
- Actual Budget integration for budgeting
- Self-hosted (no cloud dependencies except OpenAI API)

---

## Development Phases

### Phase 1: Core Backend ✅ COMPLETE

**Goal**: Build robust API server with authentication, database, and core endpoints.

**Completed Work**:
- [x] Express.js server setup with middleware
- [x] PostgreSQL database schema (12 tables)
- [x] Authentication system (API key → JWT bearer tokens)
- [x] 9 API endpoints (OCR, transactions, products, accounts, payees, Google Sheets)
- [x] OpenAI integration for OCR parsing
- [x] Price object utilities (JSONB standardization)
- [x] Database migrations
- [x] Logging and error handling
- [x] Environment configuration

**Documentation**:
- API.md - Complete API reference
- DATABASE.md - Schema documentation
- PRICE_OBJECT.md - Price standardization guide
- api-spec.yaml - OpenAPI 3.0 specification

### Phase 2: Docker Deployment & CI/CD ✅ COMPLETE

**Goal**: Containerize application and automate release pipeline.

**Completed Work**:
- [x] Docker Compose configurations (dev/prod/test/smoke)
- [x] GitHub Actions workflows (build, test, deploy)
- [x] Version management system (semantic versioning + build numbers)
- [x] Release pipeline with QA and production tracks
- [x] Mobile app build automation (EAS Build for iOS/Android)
- [x] Branch protection and PR validation
- [x] Automated issue/PR project linking

**Documentation**:
- DEVOPS.md - Deployment guide
- RELEASE_FLOW.md - Release process
- MOBILE_BUILD.md - Mobile build guide
- TASK_MANAGEMENT.md - Workflow documentation

### Phase 3: Mobile App Development 🚧 IN PROGRESS

**Goal**: Build React Native mobile app with core features.

**Completed Work**:
- [x] Mobile app scaffold (Expo 50, React Native 0.73)
- [x] Feature-based package architecture
- [x] InversifyJS dependency injection setup
- [x] Mock service layer for API-free development
- [x] Shared UI components (Button, TextInput, Card)
- [x] Navigation structure (React Navigation)
- [x] SetupScreen (server connection)
- [x] DashboardScreen (main hub)
- [x] Basic test infrastructure (Jest + React Native Testing Library)

**In Progress**:
- [ ] Connect mobile app to real backend APIs (Issue #42)
- [ ] Implement camera/OCR screens
- [ ] Build transaction form UI
- [ ] Add form validation
- [ ] Implement draft transaction persistence
- [ ] Add error handling and retry logic

**Pending**:
- [ ] QR code auto-fill for setup (Issue #40)
- [ ] Bonjour/mDNS server discovery (Issue #41)
- [ ] Camera permissions handling
- [ ] Navigation wiring to all screens
- [ ] Platform-specific optimizations
- [ ] Accessibility improvements
- [ ] Performance optimization
- [ ] Offline mode support

### Phase 4: Integration & Features 📋 PLANNED

**Goal**: Complete Actual Budget integration and add advanced features.

**Planned Work**:
- [ ] Actual Budget QL library integration
- [ ] Transaction sync to Actual Budget
- [ ] Account/payee sync from Actual Budget
- [ ] Receipt image storage (S3 or local filesystem)
- [ ] Price history visualization
- [ ] Product search improvements
- [ ] Barcode scanning support
- [ ] Multi-currency exchange rate tracking

### Phase 5: Testing & Quality 📋 PLANNED

**Goal**: Achieve comprehensive test coverage and quality standards.

**Planned Work**:
- [ ] Backend unit tests (Jest)
- [ ] Backend integration tests (Supertest)
- [ ] Mobile unit tests (expand current coverage)
- [ ] Mobile integration tests
- [ ] E2E tests (Detox or Maestro)
- [ ] API contract tests
- [ ] Performance testing
- [ ] Security testing
- [ ] Accessibility testing

### Phase 6: Advanced Features 🔮 FUTURE

**Goal**: Add AI-powered insights and advanced analytics.

**Planned Work**:
- [ ] AI spending insights
- [ ] Price trend analysis and alerts
- [ ] Smart shopping recommendations
- [ ] Duplicate receipt detection
- [ ] Category auto-tagging via ML
- [ ] Full-text search on items
- [ ] Custom ML model training
- [ ] Cross-store price comparison
- [ ] Seasonal product detection
- [ ] Export to CSV/Excel

---

## Current Status

### What's Working
- ✅ Backend API (all 9 endpoints functional)
- ✅ Database schema with migrations
- ✅ OCR parsing with OpenAI
- ✅ Docker deployment (dev/prod/test environments)
- ✅ CI/CD pipeline (GitHub Actions)
- ✅ Mobile app scaffold with mock services
- ✅ Release automation (version bumping, QA/prod builds)
- ✅ Google Sheets sync (personal feature)

### What's In Progress
- 🚧 Mobile app UI screens (camera, transaction form)
- 🚧 API integration (replacing mock services)
- 🚧 Navigation wiring
- 🚧 Form validation

### What's Blocked/Pending
- ⏸️ Actual Budget integration (waiting for mobile app completion)
- ⏸️ Receipt image storage (architecture decision needed)
- ⏸️ E2E testing (waiting for mobile app completion)
- ⏸️ Production deployment (waiting for manual testing)

---

## Feature Roadmap

### Priority 1: Core Features (MVP)
**Target**: Q1 2026

1. **Receipt Scanning** (Mobile)
   - Camera screen with receipt capture
   - OCR text extraction
   - AI-powered parsing with OpenAI
   - Item extraction and validation
   - Status: 🚧 In Progress

2. **Transaction Management** (Mobile + Backend)
   - Transaction form UI
   - CRUD operations
   - Draft transaction persistence
   - Validation and error handling
   - Status: 🚧 In Progress (Backend ✅, Mobile 🚧)

3. **Product Search** (Mobile + Backend)
   - Fuzzy search with 3-phase matching
   - Auto-suggest from existing products
   - Store-specific product codes
   - Status: ✅ Backend complete, 📋 Mobile pending

4. **Server Connection** (Mobile)
   - Setup screen with URL + API key
   - Session management
   - Connection validation
   - Status: ✅ Complete

### Priority 2: Integration Features
**Target**: Q2 2026

5. **Actual Budget Sync** (Backend + Mobile)
   - Account sync (pull from Actual Budget)
   - Transaction sync (push to Actual Budget)
   - Payee mapping
   - Conflict resolution
   - Status: 📋 Planned

6. **Receipt Image Storage** (Backend + Mobile)
   - Image upload endpoint
   - S3 or local filesystem storage
   - Image retrieval and display
   - Image compression
   - Status: 📋 Planned

7. **Price History** (Backend + Mobile)
   - Historical price tracking
   - Price trend visualization
   - Price change notifications
   - Status: 📋 Backend schema ready, implementation pending

### Priority 3: Enhanced UX
**Target**: Q3 2026

8. **QR Code Setup** (Mobile)
   - QR code generation on server
   - QR code scanning in mobile app
   - Auto-fill server URL + API key
   - Status: 📋 Planned (Issue #40)

9. **Server Discovery** (Mobile)
   - Bonjour/mDNS service discovery
   - Auto-detect servers on local network
   - Quick connection setup
   - Status: 📋 Planned (Issue #41)

10. **Offline Mode** (Mobile)
    - Local SQLite database
    - Background sync when online
    - Conflict resolution
    - Status: 🔮 Future

### Priority 4: Advanced Features
**Target**: Q4 2026

11. **AI Spending Insights** (Backend + Mobile)
    - Pattern detection
    - Category-based analysis
    - Budget-based recommendations
    - Status: 🔮 Future

12. **Price Trend Analysis** (Backend + Mobile)
    - Cross-store price comparison
    - Price change alerts
    - Best time to buy suggestions
    - Status: 🔮 Future

13. **Barcode Scanning** (Mobile)
    - UPC/EAN code scanning
    - Product lookup
    - Universal product matching
    - Status: 🔮 Future

### Personal Features (Build-Excluded)

14. **Google Sheets Sync** (Backend + Mobile)
    - Draft/approve workflow
    - Account balance sync
    - Manual sheet management
    - Status: ✅ Backend complete, 📋 Mobile UI pending

---

## Technical Architecture Planning

### Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native Mobile App                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Feature Packages (Service + UI)                       │ │
│  │  - Receipt Scan (Camera, OCR Preview)                  │ │
│  │  - Transaction (Form, List)                            │ │
│  │  - Google Sheets (Sync Screen) [Personal]             │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Shared Packages                                       │ │
│  │  - @smart-pocket/shared-types (TS interfaces)         │ │
│  │  - @smart-pocket/shared-ui (Button, Input, Card)      │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Core App (@smart-pocket/app)                         │ │
│  │  - Navigation (React Navigation)                       │ │
│  │  - DI Container (InversifyJS)                          │ │
│  │  - Setup & Dashboard screens                           │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS, Bearer Token Auth
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Node.js Express Server                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Routes (9 endpoints)                                  │ │
│  │  /connect, /disconnect, /ocr/parse, /transactions,    │ │
│  │  /payees, /accounts, /products, /google-sheets        │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Services                                              │ │
│  │  - OCR Service (OpenAI integration)                    │ │
│  │  - Transaction Service                                 │ │
│  │  - Product Service (fuzzy search)                      │ │
│  │  - Google Sheets Service [Personal]                    │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Database Layer                                        │ │
│  │  - Migrations (12 tables)                              │ │
│  │  - pg-promise for queries                              │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  - 12 tables (transactions, line_items, products, etc.)     │
│  - JSONB for price objects                                   │
│  - Full-text search indexes                                  │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Decisions

#### 1. Monorepo Structure
**Decision**: Use pnpm workspaces for monorepo management.  
**Rationale**:
- Single repository for all packages (server, mobile, shared)
- Easier dependency management
- Shared TypeScript types across packages
- Consistent tooling and scripts

**Trade-offs**:
- Larger repository size
- More complex build setup
- Requires pnpm (not npm)

#### 2. Feature-Based Packages
**Decision**: Split features into separate packages (service + UI).  
**Rationale**:
- Independent development and testing
- Reusable across multiple apps
- Clear separation of concerns
- Easy to exclude personal features from builds

**Trade-offs**:
- More packages to manage
- More complex navigation between code
- Requires discipline to maintain boundaries

#### 3. Mock Services Pattern
**Decision**: All services have mock implementations.  
**Rationale**:
- UI development without backend dependency
- Faster iteration during prototyping
- Easier testing with predictable data
- Realistic delays for UX testing

**Trade-offs**:
- Extra code to maintain
- Need to keep mocks in sync with real APIs
- Risk of mock behavior diverging from reality

#### 4. Dependency Injection (InversifyJS)
**Decision**: Use InversifyJS for DI instead of direct imports.  
**Rationale**:
- Easy to swap implementations (mock ↔ real)
- Better testability
- Familiar pattern for developers from other languages
- Supports decorators and interfaces

**Trade-offs**:
- More boilerplate (decorators, container setup)
- Learning curve for DI pattern
- Runtime overhead (minimal but non-zero)

#### 5. JSONB for Prices
**Decision**: Store prices as JSONB objects `{amount: string, currency: string}`.  
**Rationale**:
- Multi-currency support from day 1
- Exact precision (string-based amounts)
- Flexible schema (can add fields later)
- PostgreSQL has excellent JSONB support

**Trade-offs**:
- More complex queries (need to extract fields)
- Harder to validate at DB level
- Need utility functions for price operations

### Pending Architecture Decisions

#### 1. Receipt Image Storage
**Options**:
- **Local Filesystem**: Simple, no external dependency, backup required
- **S3/Object Storage**: Scalable, durable, costs money
- **PostgreSQL BYTEA**: Simple, transactional, large DB size

**Considerations**:
- User prefers self-hosted (likely local filesystem)
- Need backup strategy
- Storage growth over time
- Image access patterns (rare after initial scan?)

**Decision**: TBD - Need user input on preferences

#### 2. Offline Mode Strategy
**Options**:
- **No Offline Mode**: Simplest, requires internet
- **SQLite + Sync**: Full offline capability, complex sync logic
- **Queue + Retry**: Partial offline (can create, sync later), simpler

**Considerations**:
- Use case: scanning receipts on-the-go without WiFi
- Conflict resolution complexity
- Storage management on mobile
- User expectations

**Decision**: TBD - Start with online-only, evaluate need

#### 3. Actual Budget Integration Method
**Options**:
- **Actual Budget QL Library**: Official JS library, typed, maintained
- **Direct API**: More control, more work, fragile
- **Hybrid**: Use library where possible, direct API for gaps

**Considerations**:
- Actual Budget QL is TypeScript-friendly
- Need to handle authentication
- Sync direction (one-way or bidirectional?)
- Conflict resolution

**Decision**: TBD - Need to prototype with Actual Budget QL

#### 4. State Management (Mobile)
**Options**:
- **React Context + Hooks**: Built-in, simple, sufficient for now
- **Redux**: Powerful, boilerplate-heavy, overkill?
- **Zustand**: Lightweight, modern, good DX
- **MobX**: Reactive, less boilerplate, learning curve

**Considerations**:
- Current app uses React Context
- State complexity is low (mostly API data)
- InversifyJS already provides service management
- Avoid premature optimization

**Decision**: Stick with React Context for now, evaluate if complexity grows

---

## Deployment Strategy

### Deployment Models

#### 1. Homeserver Deployment (Primary)
**Target User**: Technical user with home server (Raspberry Pi, NAS, VPS)

**Setup**:
```bash
# Docker Compose (recommended)
git clone <repo>
cd smart-pocket-js
cp deploy/docker/.env.example deploy/docker/.env
# Edit .env with configuration
docker compose -f deploy/docker/docker-compose.prod.yml up -d
```

**Requirements**:
- Docker + Docker Compose
- PostgreSQL (via Docker)
- Domain name + HTTPS (via reverse proxy)
- OpenAI API key

**Advantages**:
- Full control over data
- No cloud costs (except OpenAI)
- Runs 24/7 on home network

**Challenges**:
- Requires technical knowledge
- Need to manage backups
- Firewall/port forwarding for remote access
- SSL certificate management

#### 2. VPS Deployment
**Target User**: User without home server, willing to rent VPS

**Setup**: Same as homeserver, deployed on Digital Ocean/Linode/Hetzner

**Requirements**:
- VPS with Docker (1GB RAM minimum)
- PostgreSQL
- Domain name
- SSL certificate (Let's Encrypt)

**Advantages**:
- Accessible from anywhere
- Managed infrastructure (VPS provider handles hardware)
- Predictable costs

**Challenges**:
- Monthly VPS cost ($5-10)
- Data not on personal infrastructure
- Need to manage server security

#### 3. Local Development
**Target User**: Developer working on Smart Pocket

**Setup**:
```bash
# Install dependencies
pnpm install

# Start server
cd apps/server
cp .env.example .env
pnpm run migrate
pnpm run dev

# Start mobile app
cd apps/mobile
pnpm run ios  # or android
```

**Requirements**:
- Node.js 20+
- pnpm 8+
- PostgreSQL 16+
- Xcode (iOS) or Android Studio (Android)

### Deployment Environments

#### Development Environment
**Purpose**: Local development and testing  
**Docker Compose**: `docker-compose.dev.yml`  
**Features**:
- Hot reload for code changes
- Source code mounted as volumes
- Debug logging enabled
- PostgreSQL with persistent volume
- Accessible on localhost:3001

#### Production Environment
**Purpose**: User's homeserver/VPS  
**Docker Compose**: `docker-compose.prod.yml`  
**Features**:
- Optimized builds (no dev dependencies)
- Health checks enabled
- Restart policies (unless-stopped)
- Log rotation
- PostgreSQL with backup volumes
- Behind reverse proxy (nginx)

#### Test Environment
**Purpose**: Automated testing in CI/CD  
**Docker Compose**: `docker-compose.test.yml`  
**Features**:
- Ephemeral containers
- Fixtures for test data
- Isolated network
- Fast startup
- No persistent volumes

#### Smoke Test Environment
**Purpose**: Quick validation after deployment  
**Docker Compose**: `docker-compose.smoke.yml`  
**Features**:
- Minimal setup
- Basic health checks
- Fast validation
- No database persistence

### Release Strategy

#### Version Numbering
**Format**: `MAJOR.MINOR.PATCH` (Semantic Versioning)  
**Build Number**: Continuous increment (iOS buildNumber, Android versionCode)

**Rules**:
- **MAJOR**: Breaking changes (API incompatibility)
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)
- **Build Number**: Increments on every QA build

**Example**:
- v0.1.0 (build 1) - Initial release
- v0.1.1 (build 2) - Bug fix
- v0.2.0 (build 3) - New feature
- v1.0.0 (build 4) - Public release

#### Release Tracks

**QA Track** (Pre-Production):
- Triggered by PR with `qa-mobile` or `qa-server` label
- Builds with EAS Build (internal distribution)
- Increments build number (+1)
- No version change required
- Deploys to TestFlight (iOS) / Internal Testing (Android)

**Production Track**:
- Triggered by PR with `prod-release` label
- Requires semantic version change + build number increment
- Builds with EAS Build (production)
- Deploys to App Store / Google Play
- Creates GitHub release with changelog

#### Release Workflow

1. **Feature Development**:
   - Develop on feature branch (`feat/#123-feature-name`)
   - Merge to main with `qa-mobile` or `qa-server` label
   - Auto-deploy to QA track

2. **QA Testing**:
   - Test on TestFlight/Internal Testing
   - Report bugs, create fix PRs
   - Repeat QA cycle until stable

3. **Production Release**:
   - Create release PR with `prod-release` label
   - Bump version in package.json and app.config.js
   - Merge to main
   - Auto-deploy to production track
   - Submit to App Store / Google Play for review

4. **Post-Release**:
   - Monitor crash reports
   - Address critical bugs with patch releases
   - Plan next minor/major release

### Backup Strategy

#### Database Backups
**Frequency**: Daily at 2 AM (user's timezone)  
**Retention**: 30 days (rolling)  
**Method**: `pg_dump` via cron job  
**Storage**: Local filesystem + optional cloud sync

**Backup Script** (TBD):
```bash
#!/bin/bash
# /data/backups/backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > /data/backups/smart_pocket_$DATE.sql
# Keep last 30 days
find /data/backups -name "smart_pocket_*.sql" -mtime +30 -delete
```

#### Receipt Image Backups
**Method**: Depends on storage decision (local filesystem or S3)  
**Frequency**: Real-time (images are write-once)  
**Retention**: Indefinite (user may want historical receipts)

#### Configuration Backups
**Files**: `.env`, `docker-compose.yml`, certificates  
**Method**: Manual backup before changes  
**Storage**: Version control (private repo) + encrypted cloud storage

### Monitoring & Observability

#### Logging
**Current**: Winston logger (JSON format)  
**Levels**: error, warn, info, debug  
**Storage**: Docker logs (rotated)

**Future**:
- [ ] Structured logging with correlation IDs
- [ ] Log aggregation (Loki or ELK stack)
- [ ] Log retention policies
- [ ] Log analysis and alerting

#### Metrics
**Current**: Basic health check endpoint (`/health`)

**Future**:
- [ ] Prometheus metrics
- [ ] Grafana dashboards
- [ ] Key metrics:
  - Request rate, latency, errors
  - Database connection pool
  - OCR parsing success rate
  - Transaction sync status

#### Alerting
**Current**: None

**Future**:
- [ ] Email/SMS alerts for critical errors
- [ ] Disk space warnings
- [ ] Database backup failures
- [ ] API rate limit warnings (OpenAI)

---

## Testing & Quality Assurance

### Testing Strategy

#### Test Pyramid

```
       ┌─────────────┐
       │   E2E (5%)  │  Full app flow, slow, expensive
       ├─────────────┤
       │Integration  │  API + DB, moderate speed
       │   (15%)     │
       ├─────────────┤
       │    Unit     │  Fast, cheap, majority of tests
       │   (80%)     │
       └─────────────┘
```

### Current Test Coverage

#### Backend (apps/server)
**Status**: ❌ No tests yet  
**Target**: 80% code coverage

**Planned Tests**:
- [ ] Unit tests for services (OCR, transaction, product, Google Sheets)
- [ ] Unit tests for utilities (price, logger, validation)
- [ ] Integration tests for API endpoints (Supertest)
- [ ] Database migration tests
- [ ] Authentication middleware tests

#### Mobile (apps/mobile)
**Status**: ✅ Basic tests (70% coverage)  
**Coverage**: 44 test cases across 11 test files

**Existing Tests**:
- ✅ Shared UI components (Button, TextInput, Card)
- ✅ Mock services (Receipt Scan, Transaction, Google Sheets)

**Planned Tests**:
- [ ] Screen component tests (Setup, Dashboard, Camera, Transaction)
- [ ] Navigation tests
- [ ] DI container tests
- [ ] Form validation tests
- [ ] Error handling tests
- [ ] Snapshot tests for UI components

#### Shared Packages
**Status**: ✅ Type definitions only (no logic to test)

### Testing Tools

#### Backend
- **Jest**: Test runner and assertion library
- **Supertest**: HTTP assertions for API testing
- **Nock**: HTTP mocking for external APIs
- **pg-mem**: In-memory PostgreSQL for DB tests

#### Mobile
- **Jest**: Test runner
- **React Native Testing Library**: Component testing
- **@testing-library/react-hooks**: Hook testing
- **jest-expo**: Expo-specific Jest config

#### E2E
- **Detox** (Option 1): Gray-box testing, React Native support
- **Maestro** (Option 2): Simple YAML-based tests, cross-platform
- **Decision**: TBD - Evaluate both options

### Quality Gates

#### Pre-Merge Requirements
- [ ] All tests passing (100%)
- [ ] Code coverage ≥ 70% (branches, functions, lines, statements)
- [ ] No linting errors (ESLint)
- [ ] No TypeScript errors
- [ ] No security vulnerabilities (CodeQL, npm audit)

#### PR Validation (GitHub Actions)
- [x] Branch naming validation (`<type>/#<issue>-<desc>`)
- [x] Version sync validation (package.json, app.config.js)
- [x] Build number validation (QA: +1, Prod: semantic version change)
- [x] Label validation (conflict detection)
- [ ] Test coverage reports
- [ ] Bundle size tracking

### Manual Testing

#### Test Checklists

**Backend API Testing** (Postman Collection):
- [ ] Authentication flow (connect, disconnect)
- [ ] OCR parsing (various receipt formats)
- [ ] Transaction CRUD (create, read, update, delete)
- [ ] Product search (fuzzy matching)
- [ ] Payee and account management
- [ ] Google Sheets sync (draft, approve)
- [ ] Error handling (400, 401, 404, 500)

**Mobile App Testing**:
- [ ] Setup screen (valid/invalid server URL)
- [ ] Dashboard navigation
- [ ] Camera screen (permissions, capture)
- [ ] OCR preview (text display, remarks)
- [ ] Transaction form (validation, submission)
- [ ] Product search (auto-suggest)
- [ ] Google Sheets sync (draft review, approve)
- [ ] Offline behavior
- [ ] App backgrounding/resuming
- [ ] Deep linking (if implemented)

**Platform-Specific Testing**:
- [ ] iOS: TestFlight builds, App Store validation
- [ ] Android: Internal testing, Play Store validation
- [ ] Web: Browser compatibility (Chrome, Safari, Firefox)

### Performance Testing

**Backend**:
- [ ] Load testing (Apache Bench or k6)
- [ ] Database query performance
- [ ] OCR parsing latency
- [ ] Concurrent request handling

**Mobile**:
- [ ] App startup time
- [ ] Screen transition animations
- [ ] List scrolling performance
- [ ] Memory usage
- [ ] Battery impact

### Security Testing

**Backend**:
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Input validation
- [ ] Secrets management (no secrets in logs)

**Mobile**:
- [ ] Secure storage (Keychain/Keystore for API key)
- [ ] HTTPS enforcement
- [ ] Certificate pinning (optional)
- [ ] Input sanitization
- [ ] Biometric authentication (future)

**Infrastructure**:
- [ ] Docker image scanning (Trivy)
- [ ] Dependency vulnerability scanning (npm audit, Dependabot)
- [ ] CodeQL analysis (GitHub Actions)

### Accessibility Testing

**Mobile**:
- [ ] Screen reader support (VoiceOver, TalkBack)
- [ ] Color contrast (WCAG AA)
- [ ] Touch target sizes (44x44pt minimum)
- [ ] Focus order
- [ ] Alternative text for images

**Future**:
- [ ] Automated accessibility tests (axe-core)
- [ ] Manual testing with assistive technologies

---

## Team Workflow

### Development Workflow

#### 1. Issue Creation
**Process**:
1. Use helper script or issue templates
2. Automatically adds to GitHub Project
3. Status set to "Todo"

**Issue Types**:
- User Story (high-level feature)
- Mobile Task
- Backend Task
- Fullstack Task
- Bug Report
- CI/CD Task
- Documentation Task
- Release Task

#### 2. Branch Creation
**Format**: `<type>/#<issue>-<short-desc>`

**Types**:
- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation
- `chore` - Maintenance
- `refactor` - Code refactoring
- `test` - Tests
- `ci` - CI/CD changes
- `release` - Version releases

**Examples**:
```bash
git checkout -b feat/#123-receipt-scanning
git checkout -b fix/#124-camera-permissions
git checkout -b docs/#125-api-documentation
```

#### 3. Development
**Guidelines**:
- Commit frequently with descriptive messages
- Run tests locally before pushing
- Keep changes focused (one issue per PR)
- No auto-commit (always show user changes first)

**Commit Format**:
```
<type>: <description> (#<issue>)

<optional body>
```

**Examples**:
```
feat: Add receipt scanning UI (#123)
fix: Handle camera permission denial (#124)
docs: Update API documentation (#125)
```

#### 4. Pull Request
**Process**:
1. Push branch to GitHub
2. Create PR with template
3. Add appropriate labels:
   - `qa-mobile` - QA build for mobile
   - `qa-server` - QA build for server
   - `prod-release` - Production release
   - `skip-build` - Skip CI builds (docs-only)
4. Auto-transitions to "In Progress" status
5. Wait for PR validation checks
6. Address review feedback
7. Merge when approved

**PR Title Format**:
```
<type>: #<issue> <Platform> - <description>
```

**Examples**:
```
feat: #123 Mobile - Add receipt scanning screen
fix: #124 iOS - Handle camera permission denial
docs: #125 - Update API documentation
```

**PR Description**:
- Link to issue (`Closes #123`)
- Summary of changes
- Testing notes
- Screenshots (for UI changes)
- Breaking changes (if any)
- Migration steps (if any)

#### 5. Code Review
**Review Checklist**:
- [ ] Code follows style guidelines
- [ ] Tests pass and coverage is adequate
- [ ] No security vulnerabilities
- [ ] Documentation updated
- [ ] Breaking changes documented
- [ ] Performance impact considered

**Review Timeline**:
- Simple PRs: Same day
- Complex PRs: 1-2 days
- Critical fixes: Immediate

#### 6. Merge & Deploy
**Process**:
1. Merge PR to main (squash or merge commit)
2. Auto-transitions to "In Review" → "QA/Testing"
3. If `qa-mobile` or `qa-server` label: Auto-deploy to QA track
4. If `prod-release` label: Auto-deploy to production track
5. Manual testing in QA environment
6. If issues found: Create bug fix PR
7. When stable: Transition to "Done"

### Release Workflow

#### QA Release (Pre-Production)
**Trigger**: PR merge with `qa-mobile` or `qa-server` label

**Process**:
1. Increment build number (+1)
2. Build with EAS Build (internal)
3. Deploy to TestFlight (iOS) / Internal Testing (Android)
4. Notify testers
5. Collect feedback
6. Fix bugs if needed
7. Repeat until stable

**Timeline**: 1-7 days per QA cycle

#### Production Release
**Trigger**: PR merge with `prod-release` label

**Process**:
1. Bump semantic version (MAJOR.MINOR.PATCH)
2. Increment build number
3. Update CHANGELOG.md
4. Build with EAS Build (production)
5. Deploy to App Store / Google Play
6. Submit for review
7. Monitor crash reports
8. Create GitHub release

**Timeline**:
- Build: ~30 minutes
- App Store review: 1-3 days
- Google Play review: Few hours to 1 day

### Communication

#### Channels
- **GitHub Issues**: Task tracking, feature requests, bug reports
- **Pull Requests**: Code review, implementation discussion
- **Discussions**: Questions, ideas, brainstorming
- **Commit Messages**: Implementation details
- **Documentation**: Architectural decisions, guides

#### Status Updates
- **Daily**: Commit messages show progress
- **Weekly**: Issue/PR updates with status changes
- **Monthly**: Release notes with completed features

---

## Risk Assessment

### Technical Risks

#### 1. OpenAI API Dependency
**Risk**: OCR parsing depends on external API (OpenAI)  
**Impact**: High - Core feature blocked if API unavailable  
**Probability**: Low - OpenAI is reliable, but rate limits exist  
**Mitigation**:
- Cache parsed results
- Implement retry logic with exponential backoff
- Consider fallback to simpler regex parsing
- Monitor API usage and costs
- Have backup API key ready

#### 2. Actual Budget Integration Complexity
**Risk**: Actual Budget API may change, breaking integration  
**Impact**: Medium - Optional feature, but key differentiator  
**Probability**: Medium - Actual Budget is open source, changes happen  
**Mitigation**:
- Use official Actual Budget QL library
- Monitor Actual Budget GitHub for breaking changes
- Version lock dependencies
- Have integration tests with fixtures
- Make sync optional (user can disable)

#### 3. Mobile App Store Rejections
**Risk**: App Store / Google Play may reject app during review  
**Impact**: High - Delays release, blocks users  
**Probability**: Medium - First-time submissions are risky  
**Mitigation**:
- Follow platform guidelines strictly
- Test on TestFlight / Internal Testing first
- Address common rejection reasons:
  - Privacy policy (required for App Store)
  - App icons and screenshots
  - Account creation flow explanation
  - Permissions justification (camera, storage)
- Have app review appeal process ready

#### 4. Docker Compatibility Issues
**Risk**: Docker may not work on all homeserver setups  
**Impact**: Medium - Users can't deploy easily  
**Probability**: Low - Docker is widely supported  
**Mitigation**:
- Test on multiple platforms (Raspberry Pi, NAS, VPS)
- Provide manual installation guide (non-Docker)
- Document common issues (ARM vs x86, memory limits)
- Have Dockerfile for multi-platform builds

#### 5. Database Migration Failures
**Risk**: Schema changes may break existing deployments  
**Impact**: High - Data corruption or loss  
**Probability**: Low - Migrations tested, but edge cases exist  
**Mitigation**:
- Test migrations on production-like data
- Backup database before migration
- Have rollback scripts ready
- Version migrations explicitly
- Log migration progress and errors

### Product Risks

#### 1. Complex UX for Receipt Scanning
**Risk**: Multi-step OCR flow may confuse users  
**Impact**: Medium - Poor UX reduces adoption  
**Probability**: Medium - Receipt scanning is inherently complex  
**Mitigation**:
- Simplify flow as much as possible
- Add onboarding tutorial
- Provide clear error messages
- User testing with non-technical users
- Consider "quick scan" mode (skip review)

#### 2. Price Precision Issues
**Risk**: Floating-point errors in price calculations  
**Impact**: High - Incorrect totals erode trust  
**Probability**: Low - Using string-based amounts (JSONB)  
**Mitigation**:
- Use Dinero.js for calculations (integer-based)
- Validate totals match receipt
- Display warnings if mismatches detected
- Add manual price adjustment
- Extensive testing with edge cases (rounding, currency conversion)

#### 3. Limited Target Audience
**Risk**: Homeserver model limits user base  
**Impact**: Medium - Fewer users, slower feedback loop  
**Probability**: High - Most users don't have homeservers  
**Mitigation**:
- Document VPS deployment clearly
- Provide Docker Compose files (one-click deploy)
- Consider managed hosting option (future)
- Focus on power users first
- Build community for support

#### 4. Receipt Format Variations
**Risk**: OCR parsing fails on non-standard receipts  
**Impact**: Medium - Frustrating UX, manual entry fallback  
**Probability**: High - Receipts vary widely by store  
**Mitigation**:
- Train on multiple receipt formats
- Allow manual correction
- Store OCR metadata for ML training
- Add store-specific parsing rules
- Crowdsource receipt samples

### Business Risks

#### 1. OpenAI API Costs
**Risk**: High usage leads to expensive API bills  
**Impact**: Medium - User has to pay, may abandon  
**Probability**: Medium - Depends on usage frequency  
**Mitigation**:
- Estimate costs upfront (e.g., $0.01-0.05 per receipt)
- Provide cost tracking in UI
- Allow disabling OCR (manual entry only)
- Cache parsed results aggressively
- Consider cheaper alternatives (Azure OCR, Tesseract)

#### 2. Project Abandonment
**Risk**: Developer loses interest, project stalls  
**Impact**: High - No updates, bugs unfixed  
**Probability**: Medium - Personal project, no funding  
**Mitigation**:
- Comprehensive documentation (others can fork)
- Modular architecture (easy to modify)
- MIT or open source license (encourages contributions)
- Focus on MVP first (working product ASAP)
- Build habit of regular contributions

#### 3. Competitor Launches Similar Product
**Risk**: Another app with better UX/features  
**Impact**: Low - Personal project, not commercial  
**Probability**: Medium - Receipt scanning is popular  
**Mitigation**:
- Focus on unique features (item-level tracking, price history)
- Self-hosted differentiator (privacy-first)
- Open source if appropriate (community contributions)
- Fast iteration (agile development)

### Mitigation Summary

**High Priority** (address immediately):
1. ✅ Database migration testing
2. ✅ OpenAI API error handling
3. 🚧 Price calculation validation
4. 📋 App Store submission guidelines research

**Medium Priority** (address before launch):
1. 📋 Actual Budget integration tests
2. 📋 Docker multi-platform testing
3. 📋 Receipt format variation testing
4. 📋 Cost estimation and tracking

**Low Priority** (monitor, address if needed):
1. Project abandonment (documentation first)
2. Competitor analysis (periodic check)
3. Limited audience (niche is okay)

---

## Timeline & Milestones

### Milestone 1: MVP Backend ✅ COMPLETE
**Target**: December 2025  
**Status**: Complete

- [x] Express server setup
- [x] PostgreSQL schema
- [x] Authentication system
- [x] API endpoints (9 total)
- [x] OCR integration
- [x] Docker deployment files
- [x] Documentation (API, Database, DevOps)

### Milestone 2: CI/CD & Release Pipeline ✅ COMPLETE
**Target**: January 2026  
**Status**: Complete

- [x] GitHub Actions workflows
- [x] Version management system
- [x] Mobile build automation (EAS Build)
- [x] QA and production release tracks
- [x] Branch protection
- [x] PR validation

### Milestone 3: Mobile App Foundation 🚧 IN PROGRESS
**Target**: January 2026 (Week 2)  
**Status**: 70% complete

- [x] Mobile app scaffold
- [x] Feature-based architecture
- [x] Mock services
- [x] Navigation setup
- [x] Setup screen
- [x] Dashboard screen
- [ ] API integration (replace mocks)
- [ ] Camera screen
- [ ] Transaction form
- [ ] Basic testing

**Remaining Work**:
- API integration: 5 days
- Camera/OCR screens: 3 days
- Transaction form: 4 days
- Testing: 2 days

**Total**: ~14 days (Target: January 20, 2026)

### Milestone 4: Mobile App Core Features
**Target**: February 2026  
**Status**: Not started

- [ ] Real API integration complete
- [ ] Receipt scanning flow working
- [ ] Transaction CRUD working
- [ ] Product search working
- [ ] Error handling robust
- [ ] Offline mode (basic)
- [ ] E2E tests

**Estimated Work**:
- API service implementation: 5 days
- Screen polish and validation: 5 days
- Error handling: 3 days
- Offline mode: 5 days
- E2E tests: 3 days

**Total**: ~21 days (Target: February 25, 2026)

### Milestone 5: Actual Budget Integration
**Target**: March 2026  
**Status**: Not started

- [ ] Actual Budget QL library integrated
- [ ] Account sync (pull from Actual Budget)
- [ ] Transaction sync (push to Actual Budget)
- [ ] Payee mapping
- [ ] Conflict resolution
- [ ] Integration tests

**Estimated Work**:
- Library integration: 3 days
- Account sync: 3 days
- Transaction sync: 5 days
- Payee mapping: 2 days
- Conflict resolution: 4 days
- Testing: 3 days

**Total**: ~20 days (Target: March 25, 2026)

### Milestone 6: Beta Release
**Target**: April 2026  
**Status**: Not started

- [ ] TestFlight / Internal Testing builds
- [ ] User acceptance testing
- [ ] Bug fixes from testing
- [ ] Performance optimization
- [ ] Documentation complete
- [ ] Privacy policy and terms

**Estimated Work**:
- Beta testing: 14 days
- Bug fixes: 7 days
- Optimization: 5 days
- Documentation: 3 days
- Legal: 2 days

**Total**: ~30 days (Target: April 30, 2026)

### Milestone 7: Public Release
**Target**: May 2026  
**Status**: Not started

- [ ] App Store submission
- [ ] Google Play submission
- [ ] Production deployment guide
- [ ] Marketing materials (if any)
- [ ] Launch announcement
- [ ] Post-launch monitoring

**Estimated Work**:
- App Store submission prep: 3 days
- Submission and review: 3-7 days
- Monitoring and hotfixes: Ongoing

**Total**: ~10 days + review time (Target: May 15, 2026)

### Milestone 8: Post-Launch Iteration
**Target**: June 2026 onwards  
**Status**: Not started

- [ ] User feedback collection
- [ ] Bug fixes (high priority)
- [ ] Performance improvements
- [ ] Feature requests prioritization
- [ ] Advanced features (AI insights, price trends)

**Ongoing**: Monthly releases with bug fixes and minor features

---

## Success Metrics

### MVP Success Criteria

#### Functional Requirements
- [x] Backend API responds to all 9 endpoints
- [x] Database stores transactions, items, and products
- [x] OCR parsing extracts items from receipts
- [ ] Mobile app connects to server
- [ ] Users can scan receipts end-to-end
- [ ] Transactions sync to Actual Budget

#### Quality Requirements
- [ ] Backend test coverage ≥ 70%
- [x] Mobile test coverage ≥ 70% (currently at 70%)
- [ ] No critical security vulnerabilities
- [ ] API response time < 1 second (95th percentile)
- [ ] App startup time < 3 seconds

#### User Experience Requirements
- [ ] Setup flow completes in < 2 minutes
- [ ] Receipt scan-to-save flow < 60 seconds
- [ ] Product search returns results instantly (< 100ms)
- [ ] App crashes < 0.1% of sessions

### Key Performance Indicators (KPIs)

#### Development Metrics
- **Velocity**: Issues closed per week (target: 3-5)
- **Lead Time**: Days from issue creation to deployment (target: < 7 days)
- **Code Coverage**: Percentage of code tested (target: ≥ 70%)
- **Bug Rate**: Bugs per release (target: < 5 critical bugs)

#### Product Metrics
- **OCR Accuracy**: Percentage of items correctly extracted (target: ≥ 80%)
- **Parse Success Rate**: Percentage of receipts successfully parsed (target: ≥ 90%)
- **Manual Corrections**: Percentage of transactions requiring manual edits (target: < 30%)
- **Sync Success Rate**: Percentage of successful Actual Budget syncs (target: ≥ 95%)

#### User Metrics (Post-Launch)
- **Active Installs**: Number of active users (target: 10 in first month)
- **Daily Active Users**: Users opening app per day (target: 50% of installs)
- **Receipts Scanned**: Number of receipts scanned per user per week (target: ≥ 2)
- **Retention Rate**: Percentage of users active after 30 days (target: ≥ 60%)

#### Technical Metrics
- **Uptime**: Server availability (target: ≥ 99.5%)
- **Response Time**: API latency p95 (target: < 1 second)
- **Error Rate**: Percentage of API requests failing (target: < 1%)
- **Build Time**: CI/CD pipeline duration (target: < 10 minutes)

### Success Dashboard (Future)

**Metrics to Track**:
1. Total receipts scanned
2. Total transactions created
3. Total items tracked
4. Unique products identified
5. Price changes detected
6. Actual Budget syncs performed
7. API requests per day
8. Average OCR confidence score

**Tools**:
- Grafana dashboard (server metrics)
- Firebase Analytics or PostHog (mobile metrics)
- GitHub Insights (development metrics)

---

## Resource Planning

### Team Structure

**Current**: Solo developer (patterueldev)

**Roles**:
- Backend Developer
- Mobile Developer (iOS/Android)
- DevOps Engineer
- Product Manager
- QA Tester
- Technical Writer

**All roles filled by**: patterueldev

### Time Allocation

**Weekly Availability**: Variable (personal project)

**Time Breakdown** (ideal week):
- Development: 15 hours (60%)
- Testing: 5 hours (20%)
- Documentation: 3 hours (12%)
- Planning: 2 hours (8%)

**Total**: ~25 hours per week

### Development Tools

**Required** (already installed):
- Node.js 20+
- pnpm 8+
- PostgreSQL 16+
- Docker + Docker Compose
- Xcode (iOS development)
- Android Studio (Android development)
- Visual Studio Code
- Git

**Optional** (productivity enhancers):
- Postman (API testing)
- TablePlus (PostgreSQL GUI)
- GitHub Copilot (code suggestions)
- Raycast (macOS launcher)

### External Services

**Required**:
1. **OpenAI API**
   - Purpose: OCR parsing
   - Cost: ~$0.01-0.05 per receipt
   - Monthly estimate: $5-10 (100-200 receipts)

2. **Expo Application Services (EAS)**
   - Purpose: Mobile app builds
   - Cost: Free tier (100 builds/month)
   - May need paid plan if exceeding limits

3. **GitHub**
   - Purpose: Code hosting, CI/CD, project management
   - Cost: Free (public repo) or $4/month (private repo)

**Optional**:
1. **VPS Hosting** (if not using homeserver)
   - Purpose: Server deployment
   - Cost: $5-10/month (Digital Ocean, Linode, Hetzner)

2. **Domain Name**
   - Purpose: Custom domain for server
   - Cost: $10-15/year

3. **SSL Certificate**
   - Purpose: HTTPS
   - Cost: Free (Let's Encrypt) or paid (Cloudflare, etc.)

**Total Monthly Cost**: $5-25 (depending on usage and hosting)

### Knowledge Requirements

**Required Skills**:
- TypeScript/JavaScript
- Node.js + Express
- PostgreSQL
- React Native + Expo
- Docker + Docker Compose
- Git + GitHub

**Learning Needs**:
- [ ] Actual Budget QL library (documentation study)
- [ ] E2E testing with Detox/Maestro (tutorial)
- [ ] App Store submission process (research)
- [ ] Google Play submission process (research)
- [ ] Advanced PostgreSQL optimization (course)

---

## Open Questions

### Product Questions

1. **Receipt Image Storage**:
   - Where should receipt images be stored? (Local filesystem vs S3 vs PostgreSQL BYTEA)
   - Should images be required, or optional?
   - What's the retention policy? (Keep forever vs auto-delete after X days)

2. **Offline Mode**:
   - Is offline mode a must-have for MVP, or can it be added later?
   - If offline: SQLite sync vs queue-based approach?
   - How to handle conflicts? (Last write wins vs manual resolution)

3. **Actual Budget Sync**:
   - Should sync be one-way (Smart Pocket → Actual Budget) or bidirectional?
   - How to handle conflicts? (Actual Budget is source of truth vs Smart Pocket)
   - Should payees and accounts be created automatically in Actual Budget?

4. **Price History Visualization**:
   - Line chart, bar chart, or table view?
   - Should it show price per store, or aggregated?
   - What time range? (Last 30 days, 90 days, all time)

### Technical Questions

1. **State Management**:
   - Is React Context sufficient, or should we add Zustand/Redux?
   - When does state complexity justify a library?

2. **Image Compression**:
   - Should receipt images be compressed before storage?
   - What format? (JPEG vs WebP vs PNG)
   - What quality level? (balance size vs readability)

3. **Barcode Integration**:
   - Which barcode library? (react-native-camera vs expo-barcode-scanner)
   - Should barcode data be stored separately from product codes?
   - How to link barcodes to products? (UPC API lookup?)

4. **Multi-Currency**:
   - How to handle currency conversion? (Manual entry vs API)
   - Should exchange rates be stored? (Historical tracking)
   - What base currency? (User preference vs server config)

### Process Questions

1. **Release Frequency**:
   - How often to release? (Weekly sprints vs monthly releases)
   - Should bug fixes be hotfixed immediately, or batched?

2. **Feature Prioritization**:
   - How to decide between user requests and planned features?
   - Should there be a public roadmap?

3. **Community Involvement**:
   - Should project be open sourced?
   - If open source: Accept contributions, or read-only?
   - Should there be a Discord/forum for discussions?

4. **Documentation**:
   - Is current documentation sufficient?
   - Should there be video tutorials?
   - Should there be a blog for development updates?

---

## Next Actions

### Immediate (This Week)
1. **Complete API Integration** (Issue #42)
   - Replace mock services with real API calls
   - Implement HTTP client with auth
   - Add error handling and retry logic
   - Test all endpoints

2. **Build Transaction Form UI**
   - Date picker
   - Payee/account selectors
   - Line items list
   - Validation logic

3. **Add Camera Screen**
   - Camera permissions
   - Receipt capture
   - Image preview
   - OCR processing

### Short Term (Next 2 Weeks)
1. **Polish Mobile UI**
   - Form validation
   - Error messages
   - Loading states
   - Empty states

2. **Add E2E Tests**
   - Setup screen flow
   - Receipt scan flow
   - Transaction creation flow

3. **Documentation Updates**
   - Update API.md with latest changes
   - Add mobile app user guide
   - Update deployment guide

### Medium Term (Next Month)
1. **Actual Budget Integration**
   - Integrate Actual Budget QL library
   - Implement account sync
   - Implement transaction sync
   - Add conflict resolution

2. **Beta Testing**
   - Deploy to TestFlight / Internal Testing
   - Recruit beta testers
   - Collect feedback
   - Fix critical bugs

3. **Performance Optimization**
   - Profile app performance
   - Optimize database queries
   - Reduce bundle size
   - Improve startup time

### Long Term (Next 3 Months)
1. **Public Release**
   - App Store submission
   - Google Play submission
   - Launch announcement
   - Post-launch monitoring

2. **Advanced Features**
   - Price history visualization
   - AI spending insights
   - Receipt image storage
   - Barcode scanning

3. **Community Building**
   - Open source decision
   - Documentation polish
   - Tutorial videos
   - User support channels

---

## Appendix

### Related Documents

- **[README.md](README.md)** - Project overview
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
- **[CHANGELOG.md](CHANGELOG.md)** - Version history
- **[docs/FEATURES.md](docs/FEATURES.md)** - Feature specifications
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Technical architecture
- **[docs/API.md](docs/API.md)** - API documentation
- **[docs/DATABASE.md](docs/DATABASE.md)** - Database schema
- **[docs/MOBILE_SCREENS.md](docs/MOBILE_SCREENS.md)** - Mobile UI specs
- **[docs/TASK_MANAGEMENT.md](docs/TASK_MANAGEMENT.md)** - Workflow guide
- **[docs/RELEASE_FLOW.md](docs/RELEASE_FLOW.md)** - Release process

### Glossary

- **EAS**: Expo Application Services (mobile build platform)
- **OCR**: Optical Character Recognition (text extraction from images)
- **DI**: Dependency Injection (design pattern)
- **PR**: Pull Request (code review workflow)
- **MVP**: Minimum Viable Product (core features only)
- **QA**: Quality Assurance (testing before production)
- **VPS**: Virtual Private Server (cloud hosting)
- **JSONB**: PostgreSQL JSON Binary (efficient JSON storage)
- **JWT**: JSON Web Token (authentication token format)
- **API**: Application Programming Interface (server endpoints)

### Revision History

| Date       | Version | Author        | Changes                          |
|------------|---------|---------------|----------------------------------|
| 2026-01-11 | 1.0     | patterueldev  | Initial comprehensive plan       |

---

**Document Status**: 🚧 In Progress - This plan will be updated as the project evolves.

**Feedback**: Open an issue or PR with suggestions to improve this plan.
