-- Create pesapal_transactions table
CREATE TABLE IF NOT EXISTS public.pesapal_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  merchant_reference VARCHAR NOT NULL UNIQUE,
  order_tracking_id VARCHAR,
  amount NUMERIC NOT NULL,
  currency VARCHAR DEFAULT 'KES',
  phone_number VARCHAR,
  email VARCHAR,
  status VARCHAR DEFAULT 'pending',
  transaction_type VARCHAR DEFAULT 'payment',
  payment_method VARCHAR,
  confirmation_code VARCHAR,
  payment_account VARCHAR,
  payment_status_description TEXT,
  callback_data JSONB,
  transaction_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pesapal_merchant_reference ON public.pesapal_transactions(merchant_reference);
CREATE INDEX IF NOT EXISTS idx_pesapal_order_tracking ON public.pesapal_transactions(order_tracking_id);
CREATE INDEX IF NOT EXISTS idx_pesapal_user_id ON public.pesapal_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pesapal_status ON public.pesapal_transactions(status);

-- Enable Row Level Security
ALTER TABLE public.pesapal_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own transactions"
  ON public.pesapal_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.pesapal_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_pesapal_transactions_updated_at
  BEFORE UPDATE ON public.pesapal_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.pesapal_transactions IS 'Stores Pesapal payment transactions';