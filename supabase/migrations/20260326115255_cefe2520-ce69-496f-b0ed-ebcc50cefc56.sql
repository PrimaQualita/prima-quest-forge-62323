CREATE OR REPLACE FUNCTION public.record_gamification_score(
  p_game_id text,
  p_points integer,
  p_scored_at timestamp with time zone DEFAULT now()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to record score';
  END IF;

  IF p_points IS NULL OR p_points <= 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.gamification_score_history (user_id, game_id, points, scored_at)
  VALUES (v_user_id, p_game_id, p_points, COALESCE(p_scored_at, now()));
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_gamification_score(text, integer, timestamp with time zone) TO authenticated;