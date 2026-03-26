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
  users_with_real_scores AS (
    SELECT DISTINCT user_id
    FROM public.gamification_score_history
    WHERE game_id <> 'backfill_legacy'
  ),
  filtered_history AS (
    SELECT gsh.*
    FROM public.gamification_score_history gsh
    LEFT JOIN users_with_real_scores uwrs ON uwrs.user_id = gsh.user_id
    WHERE gsh.game_id <> 'backfill_legacy'
       OR uwrs.user_id IS NULL
  ),
  aggregated_scores AS (
    SELECT
      fh.user_id,
      SUM(fh.points)::bigint AS total_score
    FROM filtered_history fh
    CROSS JOIN period_bounds pb
    WHERE pb.start_at IS NULL
       OR (fh.scored_at >= pb.start_at AND fh.scored_at < pb.end_at)
    GROUP BY fh.user_id
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