-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create repositories table
CREATE TABLE public.repositories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own repositories"
ON public.repositories FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own repositories"
ON public.repositories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own repositories"
ON public.repositories FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own repositories"
ON public.repositories FOR DELETE
USING (auth.uid() = user_id);

-- Create genome_modules table
CREATE TABLE public.genome_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  genome_id UUID,
  name TEXT NOT NULL,
  path TEXT,
  type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.genome_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view genome modules"
ON public.genome_modules FOR SELECT
USING (true);

-- Create genome_functions table
CREATE TABLE public.genome_functions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  genome_id UUID,
  name TEXT NOT NULL,
  signature TEXT,
  complexity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.genome_functions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view genome functions"
ON public.genome_functions FOR SELECT
USING (true);

-- Create genome_dependencies table
CREATE TABLE public.genome_dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  genome_id UUID,
  name TEXT NOT NULL,
  version TEXT,
  type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.genome_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view genome dependencies"
ON public.genome_dependencies FOR SELECT
USING (true);

-- Create genome_packages table
CREATE TABLE public.genome_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  genome_id UUID,
  name TEXT NOT NULL,
  version TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.genome_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view genome packages"
ON public.genome_packages FOR SELECT
USING (true);

-- Create genome_health table
CREATE TABLE public.genome_health (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  genome_id UUID,
  score INTEGER,
  metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.genome_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view genome health"
ON public.genome_health FOR SELECT
USING (true);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  difficulty TEXT DEFAULT 'beginner',
  xp_points INTEGER DEFAULT 0,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lessons"
ON public.lessons FOR SELECT
USING (true);

-- Create lesson_comments table
CREATE TABLE public.lesson_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lesson comments"
ON public.lesson_comments FOR SELECT
USING (true);

CREATE POLICY "Users can create lesson comments"
ON public.lesson_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.lesson_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.lesson_comments FOR DELETE
USING (auth.uid() = user_id);

-- Create user_progress table
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID,
  completed BOOLEAN DEFAULT false,
  quiz_score INTEGER,
  xp_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
ON public.user_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress"
ON public.user_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.user_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_repositories_updated_at
BEFORE UPDATE ON public.repositories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
BEFORE UPDATE ON public.user_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();