-- Tabela para armazenar o progresso de gamificação dos usuários
CREATE TABLE IF NOT EXISTS public.gamification_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL DEFAULT 0,
  integrity_level INTEGER NOT NULL DEFAULT 0,
  games_progress JSONB NOT NULL DEFAULT '{}',
  badges JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.gamification_progress ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: usuários podem ver e atualizar apenas seu próprio progresso
CREATE POLICY "Usuários podem ver seu próprio progresso"
  ON public.gamification_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seu próprio progresso"
  ON public.gamification_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio progresso"
  ON public.gamification_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins podem ver todos os progressos
CREATE POLICY "Admins podem ver todos os progressos"
  ON public.gamification_progress
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Índices para melhorar performance
CREATE INDEX idx_gamification_progress_user_id ON public.gamification_progress(user_id);
CREATE INDEX idx_gamification_progress_total_score ON public.gamification_progress(total_score DESC);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_gamification_progress_updated_at
  BEFORE UPDATE ON public.gamification_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();