/**
 * Copy Trading Social Features
 * 
 * Phase X.17 - Social Features
 * 
 * Adds ratings, reviews, and comments for copy trading strategies
 */

-- Strategy Ratings Table
CREATE TABLE IF NOT EXISTS public.copy_strategy_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES public.copy_strategies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE(strategy_id, user_id)
);

-- Strategy Comments Table
CREATE TABLE IF NOT EXISTS public.copy_strategy_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES public.copy_strategies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.copy_strategy_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Strategy Likes/Favorites Table
CREATE TABLE IF NOT EXISTS public.copy_strategy_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES public.copy_strategies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE(strategy_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS copy_strategy_ratings_strategy_id_idx 
  ON public.copy_strategy_ratings(strategy_id);

CREATE INDEX IF NOT EXISTS copy_strategy_ratings_user_id_idx 
  ON public.copy_strategy_ratings(user_id);

CREATE INDEX IF NOT EXISTS copy_strategy_comments_strategy_id_idx 
  ON public.copy_strategy_comments(strategy_id);

CREATE INDEX IF NOT EXISTS copy_strategy_comments_parent_id_idx 
  ON public.copy_strategy_comments(parent_comment_id) 
  WHERE parent_comment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS copy_strategy_favorites_strategy_id_idx 
  ON public.copy_strategy_favorites(strategy_id);

CREATE INDEX IF NOT EXISTS copy_strategy_favorites_user_id_idx 
  ON public.copy_strategy_favorites(user_id);

-- Enable RLS
ALTER TABLE public.copy_strategy_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copy_strategy_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copy_strategy_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Ratings
CREATE POLICY "Users can view all ratings"
  ON public.copy_strategy_ratings
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own ratings"
  ON public.copy_strategy_ratings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
  ON public.copy_strategy_ratings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
  ON public.copy_strategy_ratings
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for Comments
CREATE POLICY "Users can view all comments"
  ON public.copy_strategy_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own comments"
  ON public.copy_strategy_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.copy_strategy_comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.copy_strategy_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for Favorites
CREATE POLICY "Users can view all favorites"
  ON public.copy_strategy_favorites
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own favorites"
  ON public.copy_strategy_favorites
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update strategy average rating
CREATE OR REPLACE FUNCTION public.update_strategy_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.copy_strategies
  SET avg_rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM public.copy_strategy_ratings
    WHERE strategy_id = COALESCE(NEW.strategy_id, OLD.strategy_id)
  ),
  total_ratings = (
    SELECT COUNT(*)
    FROM public.copy_strategy_ratings
    WHERE strategy_id = COALESCE(NEW.strategy_id, OLD.strategy_id)
  )
  WHERE id = COALESCE(NEW.strategy_id, OLD.strategy_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update rating on insert/update/delete
CREATE TRIGGER update_strategy_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.copy_strategy_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_strategy_rating();

-- Add rating columns to copy_strategies if not exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'copy_strategies' AND column_name = 'avg_rating'
  ) THEN
    ALTER TABLE public.copy_strategies 
    ADD COLUMN avg_rating DECIMAL(3,2) DEFAULT 0,
    ADD COLUMN total_ratings INTEGER DEFAULT 0;
  END IF;
END $$;

