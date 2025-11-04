-- Add passing score to trainings table
ALTER TABLE trainings 
ADD COLUMN passing_score integer NOT NULL DEFAULT 6;