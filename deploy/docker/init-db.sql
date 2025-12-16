-- Initialize PostgreSQL database for Smart Pocket
-- This runs automatically when the postgres container starts (if database is empty)

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- The actual schema will be loaded by the migration runner
-- This file just ensures extensions are available

SELECT 'Smart Pocket database initialized' AS status;
