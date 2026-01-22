-- Migration 006: Add timestamp triggers
-- Ensure all relevant tables have updated_at auto-update triggers

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to payees if not exists
CREATE OR REPLACE TRIGGER trg_payees_updated_at
    BEFORE UPDATE ON payees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add triggers to accounts if not exists
CREATE OR REPLACE TRIGGER trg_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add triggers to transactions if not exists
CREATE OR REPLACE TRIGGER trg_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add triggers to products if not exists
CREATE OR REPLACE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to store_items if not exists
CREATE OR REPLACE TRIGGER trg_store_items_updated_at
    BEFORE UPDATE ON store_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
