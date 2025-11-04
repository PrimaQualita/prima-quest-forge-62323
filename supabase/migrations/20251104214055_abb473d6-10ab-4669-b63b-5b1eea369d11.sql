-- Add scoring fields to due_diligence_questions table
ALTER TABLE due_diligence_questions 
ADD COLUMN yes_points integer NOT NULL DEFAULT 0 CHECK (yes_points IN (0, 200)),
ADD COLUMN no_points integer NOT NULL DEFAULT 200 CHECK (no_points IN (0, 200));