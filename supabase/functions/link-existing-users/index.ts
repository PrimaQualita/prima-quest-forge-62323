import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { employees } = await req.json();
    
    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      throw new Error('Lista de funcionários inválida ou vazia');
    }

    console.log(`Iniciando vinculação de ${employees.length} funcionários`);

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    interface SuccessResult {
      employee_id: string;
      employee_name: string;
      user_id: string;
      cpf: string;
      action: 'linked' | 'created';
    }

    interface ErrorResult {
      employee_id?: string;
      employee_name?: string;
      error: string;
    }

    const results: {
      success: SuccessResult[];
      errors: ErrorResult[];
      total: number;
    } = {
      success: [],
      errors: [],
      total: employees.length
    };

    // Get all existing users once
    console.log('Buscando usuários existentes...');
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUsersMap = new Map(
      existingUsers?.users?.map(u => [u.email, u.id]) || []
    );
    console.log(`${existingUsersMap.size} usuários encontrados no auth`);

    // Process employees in parallel batches
    const BATCH_SIZE = 20;
    
    const processEmployee = async (employee: any): Promise<SuccessResult | ErrorResult> => {
      try {
        if (!employee || !employee.cpf || !employee.birth_date) {
          return {
            employee_id: employee?.id,
            employee_name: employee?.name,
            error: 'Dados incompletos (CPF ou data de nascimento ausente)'
          };
        }

        const cpf = employee.cpf.replace(/\D/g, '');
        const authEmail = `${cpf}@primaqualita.local`;
        
        let userId: string;
        let action: 'linked' | 'created' = 'linked';

        // Check if user already exists
        if (existingUsersMap.has(authEmail)) {
          userId = existingUsersMap.get(authEmail)!;
          console.log(`Usuário encontrado: ${employee.name} (${cpf})`);
        } else {
          // Create new user
          const birthDate = new Date(employee.birth_date);
          const day = String(birthDate.getDate()).padStart(2, '0');
          const month = String(birthDate.getMonth() + 1).padStart(2, '0');
          const year = birthDate.getFullYear();
          const password = `${day}${month}${year}`;

          const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email: authEmail,
            password: password,
            email_confirm: true,
            user_metadata: {
              employee_id: employee.id,
              cpf: cpf,
              actual_email: employee.email
            }
          });

          if (userError) {
            return {
              employee_id: employee.id,
              employee_name: employee.name,
              error: userError.message
            };
          }

          userId = userData.user.id;
          existingUsersMap.set(authEmail, userId);
          action = 'created';
          console.log(`Usuário criado: ${employee.name} (${cpf})`);
        }

        // Link user to employee and create profile
        const operations = [
          supabaseAdmin
            .from('profiles')
            .upsert({
              id: userId,
              cpf: cpf,
              birth_date: employee.birth_date,
              first_login: true
            }, { onConflict: 'id' }),
          supabaseAdmin
            .from('employees')
            .update({ user_id: userId })
            .eq('id', employee.id)
        ];

        if (employee.is_manager) {
          operations.push(
            supabaseAdmin
              .from('user_roles')
              .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' })
          );
        }

        const [profileResult, updateResult] = await Promise.all(operations);

        if (profileResult.error) {
          return {
            employee_id: employee.id,
            employee_name: employee.name,
            error: `Erro ao criar perfil: ${profileResult.error.message}`
          };
        }

        if (updateResult.error) {
          return {
            employee_id: employee.id,
            employee_name: employee.name,
            error: `Erro ao vincular colaborador: ${updateResult.error.message}`
          };
        }

        return {
          employee_id: employee.id,
          employee_name: employee.name,
          user_id: userId,
          cpf: cpf,
          action: action
        };

      } catch (employeeError) {
        return {
          employee_id: employee?.id,
          employee_name: employee?.name,
          error: employeeError instanceof Error ? employeeError.message : 'Erro desconhecido'
        };
      }
    };

    // Process in parallel batches
    for (let i = 0; i < employees.length; i += BATCH_SIZE) {
      const batch = employees.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(processEmployee));
      
      for (const result of batchResults) {
        if ('action' in result) {
          results.success.push(result);
        } else {
          results.errors.push(result);
          // Log primeiro erro de cada batch para diagnóstico
          if (results.errors.length === 1 || results.errors.length % 100 === 0) {
            console.error(`Erro exemplo #${results.errors.length}:`, result.error);
          }
        }
      }

      console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${results.success.length} sucessos, ${results.errors.length} erros`);
    }

    const linked = results.success.filter(r => r.action === 'linked').length;
    const created = results.success.filter(r => r.action === 'created').length;

    console.log(`Processamento concluído: ${linked} vinculados, ${created} criados, ${results.errors.length} erros`);

    return new Response(
      JSON.stringify({ 
        success: true,
        results: results,
        message: `${linked} usuário(s) vinculado(s), ${created} criado(s), ${results.errors.length} erro(s)`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in link-existing-users function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao processar usuários';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
