-- Recriar a função com search_path definido para corrigir o aviso de segurança
DROP FUNCTION IF EXISTS fix_encoding(TEXT);

CREATE OR REPLACE FUNCTION fix_encoding(text_value TEXT)
RETURNS TEXT 
LANGUAGE plpgsql 
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    text_value,
    '�', 'Á'), '�', 'Â'), '�', 'Ã'), '�', 'À'), '�', 'É'), '�', 'Ê'), '�', 'Í'), '�', 'Ó'), '�', 'Ô'), '�', 'Õ'), 
    '�', 'Ú'), '�', 'Ü'), '�', 'Ç'), '�', 'Ñ');
END;
$$;