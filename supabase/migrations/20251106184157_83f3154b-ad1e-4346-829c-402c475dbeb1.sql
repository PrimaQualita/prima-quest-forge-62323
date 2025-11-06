-- Corrigir encoding dos cargos com acentuação
UPDATE public.employees
SET job_title = 'PSICÓLOGO'
WHERE job_title = 'PSIC�LOGO' OR job_title LIKE 'PSIC_LOGO';

UPDATE public.employees
SET job_title = 'TÉCNICO DE ENFERMAGEM'
WHERE job_title = 'T�CNICO DE ENFERMAGEM' OR job_title LIKE 'T_CNICO DE ENFERMAGEM';

UPDATE public.employees
SET job_title = 'TÉCNICO EM RADIOLOGIA'
WHERE job_title = 'T�CNICO EM RADIOLOGIA' OR job_title LIKE 'T_CNICO EM RADIOLOGIA';

UPDATE public.employees
SET job_title = 'AUXILIAR DE SERVIÇOS GERAIS'
WHERE job_title LIKE 'AUXILIAR DE SERVI%OS GERAIS';

UPDATE public.employees
SET job_title = 'COORDENADOR DE ENFERMAGEM'
WHERE job_title LIKE 'COORDENADOR%DE ENFERMAGEM';

UPDATE public.employees
SET job_title = 'FISIOTERAPEUTA'
WHERE job_title LIKE 'FISIOTER%';

UPDATE public.employees
SET job_title = 'NUTRICIONISTA'
WHERE job_title LIKE 'NUTRI%';

UPDATE public.employees
SET job_title = 'ASSISTENTE ADMINISTRATIVO'
WHERE job_title LIKE 'ASSISTENTE%ADMINISTRATIVO';

UPDATE public.employees
SET job_title = 'MÉDICO'
WHERE job_title = 'M�DICO' OR job_title LIKE 'M_DICO';