-- Force types regeneration by adding a helpful comment
COMMENT ON TABLE public.employees IS 'Tabela de colaboradores do sistema de compliance';
COMMENT ON TABLE public.compliance_documents IS 'Documentos e políticas de compliance';
COMMENT ON TABLE public.trainings IS 'Treinamentos de compliance disponíveis';
COMMENT ON TABLE public.document_acknowledgments IS 'Registro de aceites de documentos';
COMMENT ON TABLE public.training_participations IS 'Registro de participação em treinamentos';
COMMENT ON TABLE public.profiles IS 'Perfis dos usuários do sistema';
COMMENT ON TABLE public.user_roles IS 'Papéis e permissões dos usuários';