# Database Migration System Implementation

## Summary

The project now has a proper database migration system that handles schema evolution over time.

## What Was Implemented

### 1. Migration Directory Structure
```
apps/server/src/database/
├── migrations/
│   ├── 001_add_transfer_support.sql
│   ├── 002_add_products_normalized_name.sql
│   ├── 003_update_store_items.sql
│   ├── 004_add_price_validations.sql
│   ├── 005_update_ocr_metadata.sql
│   ├── 006_add_timestamp_triggers.sql
│   └── README.md
├── migrations.js (updated)
├── migrations-cli.js (new)
└── schema.sql (simplified)
```

### 2. Migration System Features
- **Tracking table**: `schema_migrations` tracks applied migrations
- **Sequential execution**: Migrations run in numbered order
- **Idempotent**: Each migration uses `IF NOT EXISTS` checks
- **Safe rollback**: Migrations wrap changes in transactions
- **Status CLI**: View which migrations have been applied

### 3. How It Works

**Fresh Database:**
1. Creates `schema_migrations` table
2. Runs `schema.sql` for base tables
3. Applies all migrations in order

**Existing Database:**
1. Creates `schema_migrations` table (if missing)
2. Checks which migrations are already applied
3. Only runs pending migrations

### 4. Migration Files

| File | Purpose |
|------|---------|
| `001_add_transfer_support.sql` | Adds transaction_type, transfer fields |
| `002_add_products_normalized_name.sql` | Enables fuzzy product matching |
| `003_update_store_items.sql` | Adds tracking fields |
| `004_add_price_validations.sql` | Validates JSONB price structure |
| `005_update_ocr_metadata.sql` | Updates OCR metadata for ML |
| `006_add_timestamp_triggers.sql` | Auto-update triggers |

## Usage

### Running Migrations
Migrations run automatically on server start. You can also run manually:

```bash
cd apps/server
pnpm migrate          # Run pending migrations
pnpm migrate:status   # Check migration status
pnpm migrate:reset    # Reset migration tracking (careful!)
```

### Creating New Migrations

1. Create a new numbered SQL file in `migrations/` directory
2. Use safe `DO $$ ... END $$;` blocks with `IF NOT EXISTS` checks
3. Test locally before deploying

Example migration:
```sql
-- 007_add_new_column.sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'your_table' AND column_name = 'new_column'
    ) THEN
        ALTER TABLE your_table ADD COLUMN new_column VARCHAR(255);
    END IF;
END $$;
```

## Fixing the Original Error

The original error was:
```
error: column "transaction_type" does not exist
```

This happened because:
1. Database had an old `transactions` table (without `transaction_type`)
2. `CREATE TABLE IF NOT EXISTS` skipped creating the table
3. Index creation failed because the column didn't exist

With the new migration system:
- `001_add_transfer_support.sql` uses `ALTER TABLE` to add missing columns
- Existing databases get updated safely
- No data loss occurs

## Testing

To test the migration system:

```bash
# 1. Check current status
pnpm migrate:status

# 2. Run migrations
pnpm migrate

# 3. Verify server starts
pnpm dev
```

## Important Notes

- **Always test migrations locally** before deploying
- **Never modify existing migration files** - create new ones
- **Migrations run in transactions** - they either fully succeed or rollback
- **The `schema.sql` file is now simplified** - only contains base structure
- **All migrations are idempotent** - can be run multiple times safely
