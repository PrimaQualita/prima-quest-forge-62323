CREATE INDEX IF NOT EXISTS idx_gamification_score_history_scored_at_user_id
ON public.gamification_score_history (scored_at, user_id);

CREATE INDEX IF NOT EXISTS idx_gamification_score_history_user_id_game_id
ON public.gamification_score_history (user_id, game_id);

CREATE OR REPLACE FUNCTION public.get_gamification_ranking(
  p_year integer DEFAULT NULL,
  p_month integer DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  name text,
  total_score bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH period_bounds AS (
    SELECT
      CASE
        WHEN p_year IS NULL THEN NULL::timestamp with time zone
        WHEN p_month IS NULL THEN make_timestamptz(p_year, 1, 1, 0, 0, 0, 'UTC')
        ELSE make_timestamptz(p_year, p_month, 1, 0, 0, 0, 'UTC')
      END AS start_at,
      CASE
        WHEN p_year IS NULL THEN NULL::timestamp with time zone
        WHEN p_month IS NULL THEN make_timestamptz(p_year + 1, 1, 1, 0, 0, 0, 'UTC')
        WHEN p_month = 12 THEN make_timestamptz(p_year + 1, 1, 1, 0, 0, 0, 'UTC')
        ELSE make_timestamptz(p_year, p_month + 1, 1, 0, 0, 0, 'UTC')
      END AS end_at
  ),
  aggregated_scores AS (
    SELECT
      gsh.user_id,
      SUM(gsh.points)::bigint AS total_score
    FROM public.gamification_score_history gsh
    CROSS JOIN period_bounds pb
    WHERE pb.start_at IS NULL
       OR (gsh.scored_at >= pb.start_at AND gsh.scored_at < pb.end_at)
    GROUP BY gsh.user_id
  )
  SELECT
    e.user_id,
    e.name,
    COALESCE(aggregated_scores.total_score, 0)::bigint AS total_score
  FROM public.employees e
  LEFT JOIN aggregated_scores ON aggregated_scores.user_id = e.user_id
  WHERE e.user_id IS NOT NULL
  ORDER BY COALESCE(aggregated_scores.total_score, 0) DESC, e.name ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_gamification_ranking(integer, integer) TO authenticated;