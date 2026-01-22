# Database Migrations

This directory contains SQL migration files for updating the database schema.

## How It Works

The migration system tracks which migrations have been applied to your database:

1. **Fresh install**: Runs `schema.sql` to create base tables, then applies all migrations
2. **Existing database**: Skips schema setup and only applies pending migrations
3. **Migration tracking**: Stored in `schema_migrations` table

## Migration Files

Migrations are numbered SQL files that add new columns, constraints, or indexes to existing tables:

- `001_add_transfer_support.sql` - Adds transaction types (expense/income/transfer)
- `002_add_products_normalized_name.sql` - Enables fuzzy product name matching
- `003_update_store_items.sql` - Adds tracking fields for store items
- `004_add_price_validations.sql` - Validates JSONB price object structure
- `005_update_ocr_metadata.sql` - Updates OCR metadata for ML training
- `006_add_timestamp_triggers.sql` - Adds auto-update triggers for timestamps

## Running Migrations

Migrations run automatically when the server starts via `runMigrations()` in `migrations.js`.

## CLI Commands

```bash
# Check migration status
node apps/server/src/database/migrations-cli.js list

# Reset migration tracking (careful!)
node apps/server/src/database/migrations-cli.js reset
```

## Creating New Migrations

1. Create a new numbered `.sql` file in this directory
2. Use `DO $$ ... END $$;` blocks with `IF NOT EXISTS` checks for safety
3. Test locally before deploying

Example:
```sql
-- Add new column safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'your_table' AND column_name = 'your_column'
    ) THEN
        ALTER TABLE your_table ADD COLUMN your_column VARCHAR(255);
    END IF;
END $$;
```
