-- BrandHelix Initial Schema Migration
-- All tables with RLS policies

-- ============================================
-- 1. Users (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
  api_usage_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (id = auth.uid());

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. Projects
-- ============================================
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  industry TEXT,
  website_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'dna_collecting', 'dna_complete', 'generating', 'active', 'paused')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own projects"
  ON public.projects FOR ALL
  USING (user_id = auth.uid());

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 3. Brand DNA (8-Layer JSONB)
-- ============================================
CREATE TABLE public.brand_dna (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects ON DELETE CASCADE UNIQUE NOT NULL,
  layers JSONB NOT NULL DEFAULT '{}',
  completeness_score INTEGER DEFAULT 0 CHECK (completeness_score >= 0 AND completeness_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.brand_dna ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own brand DNA"
  ON public.brand_dna FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE TRIGGER brand_dna_updated_at
  BEFORE UPDATE ON public.brand_dna
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 4. Crawl Results
-- ============================================
CREATE TABLE public.crawl_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('website', 'sns', 'blog', 'news', 'competitor')),
  raw_data JSONB,
  analysis JSONB,
  crawled_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.crawl_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own crawl results"
  ON public.crawl_results FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 5. Generated Contents
-- ============================================
CREATE TABLE public.generated_contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects ON DELETE CASCADE NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('site', 'blog', 'instagram', 'shortform')),
  content_type TEXT NOT NULL,
  title TEXT,
  body JSONB NOT NULL,
  images TEXT[],
  copy_style TEXT,
  design_tone TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'scheduled', 'published')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  tokens_used INTEGER DEFAULT 0,
  generation_cost NUMERIC(10, 4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.generated_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own generated contents"
  ON public.generated_contents FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 6. Generated Sites
-- ============================================
CREATE TABLE public.generated_sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects ON DELETE CASCADE UNIQUE NOT NULL,
  pages JSONB NOT NULL,
  design_tokens JSONB,
  template TEXT,
  deploy_url TEXT,
  custom_domain TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.generated_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own generated sites"
  ON public.generated_sites FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE TRIGGER generated_sites_updated_at
  BEFORE UPDATE ON public.generated_sites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 7. API Usage Logs
-- ============================================
CREATE TABLE public.api_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects ON DELETE SET NULL,
  model TEXT NOT NULL,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  cost NUMERIC(10, 6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API usage"
  ON public.api_usage_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own API usage"
  ON public.api_usage_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 8. Prompt Cache
-- ============================================
CREATE TABLE public.prompt_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL,
  prompt_hash TEXT NOT NULL,
  response JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt cache is accessed server-side only (admin client)
-- No RLS needed, but enable it with a deny-all policy for safety
ALTER TABLE public.prompt_cache ENABLE ROW LEVEL SECURITY;

-- Only accessible via service role key (admin client)
-- No user-facing policy needed

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_brand_dna_project_id ON public.brand_dna(project_id);
CREATE INDEX idx_crawl_results_project_id ON public.crawl_results(project_id);
CREATE INDEX idx_generated_contents_project_id ON public.generated_contents(project_id);
CREATE INDEX idx_generated_contents_channel ON public.generated_contents(channel);
CREATE INDEX idx_generated_contents_status ON public.generated_contents(status);
CREATE INDEX idx_generated_sites_project_id ON public.generated_sites(project_id);
CREATE INDEX idx_api_usage_logs_user_id ON public.api_usage_logs(user_id);
CREATE INDEX idx_api_usage_logs_created_at ON public.api_usage_logs(created_at);
CREATE INDEX idx_prompt_cache_key ON public.prompt_cache(cache_key);
CREATE INDEX idx_prompt_cache_expires ON public.prompt_cache(expires_at);
