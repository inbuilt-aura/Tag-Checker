-- Perplexity Promo Code Validator Database Setup
-- Run this in your Supabase SQL Editor

-- Create promo_batches table
CREATE TABLE IF NOT EXISTS promo_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID REFERENCES promo_batches(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  status TEXT CHECK (status IN ('valid', 'invalid', 'pending')) DEFAULT 'pending',
  message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE promo_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own batches" ON promo_batches;
DROP POLICY IF EXISTS "Users can insert their own batches" ON promo_batches;
DROP POLICY IF EXISTS "Users can update their own batches" ON promo_batches;
DROP POLICY IF EXISTS "Users can delete their own batches" ON promo_batches;

DROP POLICY IF EXISTS "Users can view codes from their batches" ON promo_codes;
DROP POLICY IF EXISTS "Users can insert codes to their batches" ON promo_codes;
DROP POLICY IF EXISTS "Users can update codes in their batches" ON promo_codes;
DROP POLICY IF EXISTS "Users can delete codes from their batches" ON promo_codes;

-- Create policies for promo_batches
CREATE POLICY "Users can view their own batches" ON promo_batches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own batches" ON promo_batches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own batches" ON promo_batches
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own batches" ON promo_batches
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for promo_codes
CREATE POLICY "Users can view codes from their batches" ON promo_codes
  FOR SELECT USING (
    batch_id IN (
      SELECT id FROM promo_batches WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert codes to their batches" ON promo_codes
  FOR INSERT WITH CHECK (
    batch_id IN (
      SELECT id FROM promo_batches WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update codes in their batches" ON promo_codes
  FOR UPDATE USING (
    batch_id IN (
      SELECT id FROM promo_batches WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete codes from their batches" ON promo_codes
  FOR DELETE USING (
    batch_id IN (
      SELECT id FROM promo_batches WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promo_batches_user_id ON promo_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_batches_created_at ON promo_batches(created_at);
CREATE INDEX IF NOT EXISTS idx_promo_codes_batch_id ON promo_codes(batch_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_status ON promo_codes(status);
CREATE INDEX IF NOT EXISTS idx_promo_codes_timestamp ON promo_codes(timestamp);