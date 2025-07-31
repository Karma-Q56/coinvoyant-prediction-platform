ALTER TABLE predictions 
ADD COLUMN image_url TEXT,
ADD COLUMN prediction_type VARCHAR(20) NOT NULL DEFAULT 'long_term'; -- 'daily' or 'long_term'

-- Remove the required_pt constraint since users can now bet any amount
ALTER TABLE predictions 
ALTER COLUMN required_pt SET DEFAULT 1;

-- Update the votes table to allow any PT amount (remove the constraint if it exists)
-- The minimum will be enforced in the application logic
