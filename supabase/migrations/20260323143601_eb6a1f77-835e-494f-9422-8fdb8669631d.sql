
-- Table to track individual score events for monthly/annual rankings
CREATE TABLE public.gamification_score_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game_id text NOT NULL,
  points integer NOT NULL,
  scored_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for efficient monthly/annual queries
CREATE INDEX idx_score_history_user_date ON public.gamification_score_history(user_id, scored_at);
CREATE INDEX idx_score_history_date ON public.gamification_score_history(scored_at);

-- Enable RLS
ALTER TABLE public.gamification_score_history ENABLE ROW LEVEL SECURITY;

-- Users can insert their own scores
CREATE POLICY "Users can insert their own scores"
ON public.gamification_score_history
FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);

-- Users can view their own scores
CREATE POLICY "Users can view their own scores"
ON public.gamification_score_history
FOR SELECT
TO public
USING (auth.uid() = user_id);

-- Admins can view all scores (needed for ranking)
CREATE POLICY "Admins can view all scores"
ON public.gamification_score_history
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- All authenticated users can read scores for ranking purposes
CREATE POLICY "Authenticated users can read scores for ranking"
ON public.gamification_score_history
FOR SELECT
TO authenticated
USING (true);
