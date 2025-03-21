-- Add payout_frequency column to offers table
ALTER TABLE offers ADD COLUMN IF NOT EXISTS payout_frequency text;

-- Set default value for existing rows
UPDATE offers SET payout_frequency = 'Monthly' WHERE payout_frequency IS NULL; 