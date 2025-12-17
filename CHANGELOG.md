# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-12-18

### Added
- **Google Sheets Sync Feature** (Prioritized Functionality)
  - Sync Actual Budget account balances to Google Sheets
  - Draft and approve workflow for balance changes
  - Cleared and uncleared balance tracking
  - Service account authentication
  - API endpoints: `/api/v1/google-sheets/sync/draft` and `/api/v1/google-sheets/sync/approve/:draftId`

- **QA Deployment Automation**
  - GitHub Actions workflow for automatic QA deployments on PR merge
  - Webhook-based deployment notifications via Cloudflare Tunnel
  - Docker Compose configuration for QA environment
  - Homeserver deployment support with pre-built registry images
  - GitHub Container Registry integration (ghcr.io)

- **Release Infrastructure**
  - Automated production release workflow on version tags
  - Semantic versioning support (0.x.x pre-MVP)
  - Multi-tag Docker images (`:latest`, `:prod`, `:v0.1.0`, etc.)
  - GitHub Releases automation

- **Database & Backend**
  - PostgreSQL database schema with JSONB price objects
  - Actual Budget integration layer
  - JWT-based authentication (two-stage: API key → bearer token)
  - RESTful API endpoints (transactions, payees, accounts, OCR parsing)
  - Database migrations system

- **Docker Infrastructure**
  - Multi-stage Dockerfile for optimized production builds
  - Docker Compose configurations for dev, QA, test, and production
  - Better-sqlite3 native bindings fix for linux/x64
  - Health checks and service dependencies
  - Environment-specific configurations

- **Documentation**
  - Comprehensive API documentation (API.md, api-spec.yaml)
  - OpenAPI 3.0 specification
  - Postman collection and environment
  - Database schema documentation
  - Mobile app screen specifications
  - DevOps and deployment guides
  - Release flow documentation
  - External API integration guides (Actual Budget, OpenAI, Google Sheets)

- **Developer Experience**
  - pnpm workspace monorepo structure
  - Jest test framework with coverage reporting
  - Conventional commits specification
  - GitHub Actions CI/CD workflows
  - Local development hot-reload
  - Automated test suites

### Fixed
- Better-sqlite3 native bindings not loading in Docker production images
- Google Sheets credentials EISDIR error when file mount missing
- GitHub Actions workflows referencing removed smoke-test.sh script

### Technical Details
- **Framework**: Node.js 20 with Express
- **Database**: PostgreSQL 16 with JSONB support
- **Package Manager**: pnpm with workspaces
- **Container Registry**: GitHub Container Registry (public)
- **Deployment**: Docker Compose on homeserver
- **CI/CD**: GitHub Actions (free for public repos)

### Known Limitations
- No mobile app yet (planned)
- OCR receipt scanning not implemented (backend ready)
- Transaction management UI pending (API complete)
- Single-user homeserver deployment model only

### What's Next (Roadmap to 1.0.0 MVP)
- React Native mobile app (iOS/Android/Web)
- OCR receipt scanning with AI parsing
- Transaction management UI
- Product price tracking and history
- Store-specific item code management
- Fuzzy matching for payees and products
- Manual transaction entry forms
- Mobile camera integration

---

## [Unreleased]

### Planned Features
- Mobile app development (React Native)
- OCR receipt processing (OpenAI integration)
- Transaction review and editing UI
- Item code auto-suggestions
- Price history tracking
- Multi-currency support enhancements
- Spending insights and analytics (optional)

---

## Version History

- **0.1.0** (2024-12-18) - Initial production-ready release
  - Google Sheets sync feature complete
  - QA/Production deployment automation
  - Database and API infrastructure
  - Docker production builds
  
- **1.0.0** (Target) - MVP Release
  - Mobile app with OCR scanning
  - Complete transaction management workflow
  - Item and price tracking features

---

## Notes

### Versioning Strategy
- **0.x.x**: Pre-MVP releases (current phase)
- **1.0.0**: Minimum Viable Product (MVP) target
- **x.x.x**: Post-MVP semantic versioning

### Release Process
See [RELEASE_FLOW.md](./RELEASE_FLOW.md) for detailed release procedures.

### Contributing
See [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines.
