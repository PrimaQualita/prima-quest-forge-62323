-- Função para corrigir encoding de todos os caracteres especiais
CREATE OR REPLACE FUNCTION fix_encoding(text_value TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    text_value,
    '�', 'Á'), '�', 'Â'), '�', 'Ã'), '�', 'À'), '�', 'É'), '�', 'Ê'), '�', 'Í'), '�', 'Ó'), '�', 'Ô'), '�', 'Õ'), 
    '�', 'Ú'), '�', 'Ü'), '�', 'Ç'), '�', 'Ñ');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Aplicar correção a todos os job_titles
UPDATE public.employees
SET job_title = fix_encoding(job_title)
WHERE job_title LIKE '%�%';

-- Aplicar correção a todos os nomes se necessário
UPDATE public.employees
SET name = fix_encoding(name)
WHERE name LIKE '%�%';