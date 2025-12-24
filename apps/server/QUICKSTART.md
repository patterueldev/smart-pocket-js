# Smart Pocket Server - Quick Start

This guide gets the Smart Pocket server running locally in under 5 minutes.

## Prerequisites

```bash
# Check Node.js version (20+ required)
node --version

# Check PostgreSQL (16+ required)
psql --version
```

## Step 1: Database Setup

Create PostgreSQL database:

```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE smart_pocket_dev;
CREATE USER smart_pocket WITH ENCRYPTED PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE smart_pocket_dev TO smart_pocket;
\q
```

## Step 2: Install Dependencies

```bash
cd apps/server
npm install
```

## Step 3: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` - **minimum required changes**:
```env
DATABASE_URL=postgres://smart_pocket:dev_password@localhost:5432/smart_pocket_dev
JWT_SECRET=your-random-secret-here
API_KEY=dev_api_key_change_me
OPENAI_API_KEY=sk-your-key-here
```

Generate secrets:
```bash
# JWT Secret (copy output to .env)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# API Key (copy output to .env)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Run Database Migrations

```bash
npm run migrate
```

Expected output:
```
Running database migrations...
Database migrations completed successfully
```

## Step 5: Start Server

```bash
npm run dev
```

Expected output:
```
Server started on port 3001
Database connection successful
```

## Step 6: Test API

```bash
# Health check
curl http://localhost:3001/health

# Connect (get bearer token)
curl -X POST http://localhost:3001/api/v1/connect \
  -H "X-API-Key: dev_api_key_change_me" \
  -H "Content-Type: application/json" \
  -d '{"deviceInfo":{"platform":"test","appVersion":"1.0.0","deviceId":"test"}}'
```

## Troubleshooting

### Database Connection Failed

```bash
# Test connection
npm run db:test

# If it fails, check:
psql $DATABASE_URL -c "SELECT 1"
```

### Port 3001 Already in Use

```bash
# Kill existing process
lsof -ti:3001 | xargs kill -9

# Or change PORT in .env
PORT=3002
```

### OpenAI API Key Invalid

Get a key from https://platform.openai.com/api-keys

## Next Steps

- Read full documentation: [README.md](README.md)
- Test with Postman: Import `docs/smart-pocket.postman_collection.json`
- Deploy with Docker: See `docs/DEVOPS.md`
- Connect mobile app: Use server URL `http://localhost:3001` and your API key

## Default Credentials

- API Key: `dev_api_key_change_me` (from `.env`)
- Database: `smart_pocket_dev`
- Database User: `smart_pocket`
- Port: `3001`

**Remember to change these in production!**
