-- Create github_config table to store repository configuration
CREATE TABLE public.github_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  owner TEXT NOT NULL,
  repo TEXT NOT NULL,
  base_branch TEXT DEFAULT 'main',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.github_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own GitHub configs"
ON public.github_config FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own GitHub configs"
ON public.github_config FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own GitHub configs"
ON public.github_config FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own GitHub configs"
ON public.github_config FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_github_config_updated_at
BEFORE UPDATE ON public.github_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();