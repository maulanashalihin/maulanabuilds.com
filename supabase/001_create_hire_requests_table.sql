-- Hire Requests Table for maulanabuilds.com
-- Run this SQL in your Supabase SQL Editor to create the hire_requests table

-- Create the table
CREATE TABLE IF NOT EXISTS hire_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  project_description TEXT NOT NULL,
  requirements TEXT,
  amount INTEGER DEFAULT 100000,
  currency TEXT DEFAULT 'usd',
  payment_status TEXT DEFAULT 'pending',
  payment_intent_id TEXT,
  stripe_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_hire_requests_email ON hire_requests(email);
CREATE INDEX IF NOT EXISTS idx_hire_requests_payment_status ON hire_requests(payment_status);
CREATE INDEX IF NOT EXISTS idx_hire_requests_payment_intent_id ON hire_requests(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_hire_requests_created_at ON hire_requests(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE hire_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anyone to insert (you may want to add authentication later)
CREATE POLICY "Allow public insert" ON hire_requests
  FOR INSERT
  WITH CHECK (true);

-- Allow public to view only their own requests (if needed)
CREATE POLICY "Allow public select" ON hire_requests
  FOR SELECT
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hire_requests_updated_at
  BEFORE UPDATE ON hire_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment describing the table
COMMENT ON TABLE hire_requests IS 'Stores hire request submissions with Stripe payment information';
