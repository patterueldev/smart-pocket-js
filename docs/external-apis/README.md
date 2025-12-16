# External API Documentation

This directory contains API documentation for external services used by Smart Pocket JS. These docs serve as reference material for developers and AI assistants when implementing features.

## Purpose

- **Quick Reference**: Access API specs without leaving the codebase
- **Offline Development**: Work without constant internet lookups
- **Version Tracking**: Document specific API versions we're targeting
- **AI Context**: Provide AI assistants with accurate API details for code generation
- **Onboarding**: Help new developers understand external integrations

## Directory Structure

```
external-apis/
├── README.md                          # This file
├── actual-budget/                     # Actual Budget integration
│   ├── README.md                      # Overview and key concepts
│   ├── ql-api.md                      # Query Language API reference
│   ├── rest-api.md                    # REST API reference (if using)
│   └── examples/                      # Code examples
├── openai/                            # OpenAI API for OCR parsing
│   ├── README.md                      # Overview and usage
│   ├── chat-completions.md            # Chat completions API
│   ├── structured-outputs.md          # Structured output format
│   └── examples/                      # Prompt examples
├── google-sheets/                     # Google Sheets API (personal feature)
│   ├── README.md                      # Overview and setup
│   ├── sheets-api-v4.md               # Sheets API v4 reference
│   ├── authentication.md              # OAuth2 setup
│   └── examples/                      # Integration examples
└── postgresql/                        # PostgreSQL extensions & features
    ├── README.md                      # Overview
    ├── pg-trgm.md                     # Fuzzy text matching
    ├── jsonb.md                       # JSONB operations
    └── uuid-ossp.md                   # UUID generation
```

## APIs Documented

### Core Dependencies

#### 1. **Actual Budget**
- **Purpose**: Core budgeting backend, transaction storage
- **Integration Type**: Direct QL library or REST API
- **Status**: Required for core functionality
- **Location**: `./actual-budget/`

#### 2. **OpenAI API**
- **Purpose**: OCR text parsing, extract structured data from receipts
- **Integration Type**: REST API (Chat Completions)
- **Status**: Required for OCR feature
- **Location**: `./openai/`

#### 3. **PostgreSQL**
- **Purpose**: Relational database for complex data relationships
- **Integration Type**: Direct connection via pg library
- **Status**: Required core infrastructure
- **Location**: `./postgresql/`

### Optional/Personal Features

#### 4. **Google Sheets API**
- **Purpose**: Sync account balances to Google Sheets
- **Integration Type**: REST API with OAuth2
- **Status**: Personal feature (excluded from distributed builds)
- **Location**: `./google-sheets/`

## How to Use These Docs

### For Developers

1. **Read the service README** first to understand integration approach
2. **Reference the API docs** when implementing features
3. **Check examples/** for working code patterns
4. **Update docs** when you discover important details or changes

### For AI Assistants

When asked to implement features using these services:

1. **Read the relevant API documentation** in this directory
2. **Follow the patterns** shown in examples/
3. **Reference version information** to ensure compatibility
4. **Ask for clarification** if documentation is unclear or missing

### Adding New API Documentation

When integrating a new external service:

1. Create a new directory: `external-apis/service-name/`
2. Add a README.md with:
   - Service overview
   - Why we're using it
   - Authentication approach
   - Key concepts
   - Links to official docs
3. Add specific API endpoint documentation
4. Include code examples in `examples/`
5. Note the API version we're targeting

## Documentation Format

Each API directory should follow this structure:

### README.md Template
```markdown
# [Service Name]

## Overview
Brief description of the service and why we use it.

## Version
API version we're targeting (e.g., v1, v4, 2024-11-01)

## Authentication
How we authenticate with this service.

## Key Concepts
Important concepts developers need to understand.

## Integration Approach
How we integrate (library, REST, GraphQL, etc.)

## Environment Variables
Required configuration.

## Links
- Official Documentation
- API Reference
- SDK/Library Documentation
```

### API Reference Template
```markdown
# [Endpoint/Feature Name]

## Endpoint
`POST /v1/resource`

## Description
What this endpoint does.

## Request Format
Example request with all parameters.

## Response Format
Example response.

## Error Handling
Common errors and how to handle them.

## Rate Limits
Any rate limiting to be aware of.

## Examples
Code examples showing usage.
```

## Best Practices

### Documentation Maintenance

- **Update when APIs change**: Document breaking changes
- **Note deprecated features**: Mark what not to use
- **Include error examples**: Show common failure cases
- **Version everything**: Track which API version docs refer to
- **Link to official docs**: Don't duplicate everything, link for details

### Code Examples

- **Keep examples simple**: Focus on one concept
- **Make them runnable**: Include necessary context
- **Show error handling**: Don't just show happy path
- **Comment liberally**: Explain why, not just what
- **Use TypeScript**: Show types for better understanding

### AI-Friendly Documentation

For AI assistants to use these docs effectively:

- **Be explicit**: Don't assume prior knowledge
- **Use clear structure**: Consistent headers and sections
- **Include context**: Explain why decisions were made
- **Provide examples**: Show, don't just tell
- **Document constraints**: Rate limits, quotas, limitations

## Contributing

When updating these docs:

1. Keep them focused on what we actually use
2. Don't copy-paste entire official docs - link to them
3. Highlight gotchas and non-obvious behaviors
4. Include working code examples
5. Update the version information when API changes

## Related Documentation

- [API.md](../API.md) - Smart Pocket's own API
- [DATABASE.md](../DATABASE.md) - Database schema
- [DEVOPS.md](../DEVOPS.md) - Deployment and operations
- [.github/copilot-instructions.md](../../.github/copilot-instructions.md) - AI coding instructions

---

**Note**: These docs are internal reference material. For official API documentation, always refer to the service's official website.
