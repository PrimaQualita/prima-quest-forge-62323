-- Adicionar coluna para armazenar o conteúdo do documento usado para gerar questões
ALTER TABLE public.trainings 
ADD COLUMN document_content text;