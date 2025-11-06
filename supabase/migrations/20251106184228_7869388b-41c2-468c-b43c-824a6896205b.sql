-- Corrigir mais casos de encoding
UPDATE public.employees
SET job_title = 'AGENTE COMUNITÁRIO DE SAÚDE'
WHERE job_title LIKE 'AGENTE COMUNIT%RIO DE SA%DE';

UPDATE public.employees
SET job_title = 'FONOAUDIÓLOGO'
WHERE job_title = 'FONOAUDIOLOGO' OR job_title LIKE 'FONOAUDI%LOGO';

UPDATE public.employees
SET job_title = 'FARMACÊUTICO'
WHERE job_title LIKE 'FARMAC%UTICO';

UPDATE public.employees
SET job_title = 'RECEPCIONISTA'
WHERE job_title LIKE 'RECEPCION%';

UPDATE public.employees
SET job_title = 'AUXILIAR DE FARMÁCIA'
WHERE job_title LIKE 'AUXILIAR DE FARM%CIA';

-- Corrigir possíveis problemas com nomes também
UPDATE public.employees
SET name = REPLACE(REPLACE(REPLACE(name, '�', 'Ã'), '�', 'Ç'), '�', 'Á')
WHERE name LIKE '%�%';