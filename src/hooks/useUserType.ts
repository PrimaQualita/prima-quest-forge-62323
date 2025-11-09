import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para determinar o tipo de usuário
 * Retorna se o usuário é fornecedor ou colaborador/gestor
 */
export const useUserType = () => {
  const [isSupplier, setIsSupplier] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserType = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Verifica se é fornecedor
        const { data: supplierData } = await supabase
          .from('supplier_due_diligence')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        setIsSupplier(!!supplierData);
      } catch (error) {
        console.error('Erro ao verificar tipo de usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserType();
  }, []);

  return { isSupplier, loading };
};
