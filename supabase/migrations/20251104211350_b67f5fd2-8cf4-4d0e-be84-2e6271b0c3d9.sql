-- Criar bucket para vídeos de treinamento
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'training-videos',
  'training-videos',
  true,
  524288000, -- 500MB limit
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo']
);

-- Policies para o bucket de vídeos
CREATE POLICY "Admins podem fazer upload de vídeos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'training-videos' AND
  (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ))
);

CREATE POLICY "Vídeos são publicamente acessíveis"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'training-videos');

CREATE POLICY "Admins podem deletar vídeos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'training-videos' AND
  (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ))
);

CREATE POLICY "Admins podem atualizar vídeos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'training-videos' AND
  (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ))
);