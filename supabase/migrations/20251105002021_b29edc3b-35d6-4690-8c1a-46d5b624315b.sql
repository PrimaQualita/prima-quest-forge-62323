-- Create video_progress table to track individual video watching progress
CREATE TABLE IF NOT EXISTS public.video_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  training_id UUID NOT NULL,
  video_id UUID NOT NULL,
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_video_progress_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_video_progress_training FOREIGN KEY (training_id) REFERENCES trainings(id) ON DELETE CASCADE,
  CONSTRAINT fk_video_progress_video FOREIGN KEY (video_id) REFERENCES training_videos(id) ON DELETE CASCADE,
  CONSTRAINT unique_video_progress UNIQUE (employee_id, video_id)
);

-- Enable RLS
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view their own video progress"
ON public.video_progress
FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

-- Users can insert their own progress
CREATE POLICY "Users can insert their own video progress"
ON public.video_progress
FOR INSERT
WITH CHECK (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

-- Users can update their own progress
CREATE POLICY "Users can update their own video progress"
ON public.video_progress
FOR UPDATE
USING (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

-- Admins can view all progress
CREATE POLICY "Admins can view all video progress"
ON public.video_progress
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_video_progress_employee_training ON public.video_progress(employee_id, training_id);
CREATE INDEX idx_video_progress_video ON public.video_progress(video_id);