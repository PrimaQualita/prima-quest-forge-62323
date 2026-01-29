import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication and admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = user.id;

    // Create admin client for role check
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: 'Acesso negado. Apenas administradores podem criar usuários.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { employees } = await req.json();
    
    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      throw new Error('Lista de funcionários inválida ou vazia');
    }

    interface SuccessResult {
      employee_id: string;
      employee_name: string;
      user_id: string;
      cpf: string;
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

    // Get all existing users once (optimization)
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUsersMap = new Map(
      existingUsers?.users?.map(u => [u.email, u.id]) || []
    );

    // Process employees in parallel batches
    const BATCH_SIZE = 20;
    
    interface ProcessSuccess {
      type: 'success';
      employee_id: string;
      employee_name: string;
      user_id: string;
      cpf: string;
    }

    interface ProcessError {
      type: 'error';
      employee_id?: string;
      employee_name?: string;
      error: string;
    }

    type ProcessResult = ProcessSuccess | ProcessError;
    
    const processEmployee = async (employee: any): Promise<ProcessResult> => {
      try {
        if (!employee || !employee.cpf || !employee.birth_date) {
          return {
            type: 'error',
            employee_id: employee?.id,
            error: 'Dados incompletos (CPF ou data de nascimento ausente)'
          };
        }

        const cpf = employee.cpf.replace(/\D/g, '');
        const birthDate = new Date(employee.birth_date);
        const day = String(birthDate.getDate()).padStart(2, '0');
        const month = String(birthDate.getMonth() + 1).padStart(2, '0');
        const year = birthDate.getFullYear();
        const password = `${day}${month}${year}`;
        const authEmail = `${cpf}@primaqualita.local`;

        let createdUserId: string;

        if (existingUsersMap.has(authEmail)) {
          createdUserId = existingUsersMap.get(authEmail)!;
        } else {
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

          if (userError && userError.message.includes('already registered')) {
            const existingUser = existingUsersMap.get(authEmail);
            if (existingUser) {
              createdUserId = existingUser;
            } else {
              const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
              const foundUser = users?.find(u => u.email === authEmail);
              if (foundUser) {
                createdUserId = foundUser.id;
                existingUsersMap.set(authEmail, createdUserId);
              } else {
                return {
                  type: 'error',
                  employee_id: employee.id,
                  employee_name: employee.name,
                  error: 'Usuário já existe mas não foi encontrado'
                };
              }
            }
          } else if (userError) {
            return {
              type: 'error',
              employee_id: employee.id,
              employee_name: employee.name,
              error: userError.message
            };
          } else {
            createdUserId = userData.user.id;
            existingUsersMap.set(authEmail, createdUserId);
          }
        }

        const operations = [
          supabaseAdmin
            .from('profiles')
            .upsert({
              id: createdUserId,
              cpf: cpf,
              birth_date: employee.birth_date,
              full_name: employee.name,
              first_login: true
            }, { onConflict: 'id' }),
          supabaseAdmin
            .from('employees')
            .update({ user_id: createdUserId })
            .eq('id', employee.id)
        ];

        if (employee.is_manager) {
          operations.push(
            supabaseAdmin
              .from('user_roles')
              .upsert({ user_id: createdUserId, role: 'admin' }, { onConflict: 'user_id,role' })
          );
        }

        const [profileResult, updateResult] = await Promise.all(operations);

        if (profileResult.error) {
          return {
            type: 'error',
            employee_id: employee.id,
            employee_name: employee.name,
            error: `Erro ao criar perfil: ${profileResult.error.message}`
          };
        }

        if (updateResult.error) {
          return {
            type: 'error',
            employee_id: employee.id,
            employee_name: employee.name,
            error: `Erro ao atualizar colaborador: ${updateResult.error.message}`
          };
        }

        return {
          type: 'success',
          employee_id: employee.id,
          employee_name: employee.name,
          user_id: createdUserId,
          cpf: cpf
        };

      } catch (employeeError) {
        return {
          type: 'error',
          employee_id: employee?.id,
          employee_name: employee?.name,
          error: employeeError instanceof Error ? employeeError.message : 'Erro desconhecido'
        };
      }
    };

    for (let i = 0; i < employees.length; i += BATCH_SIZE) {
      const batch = employees.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(processEmployee));
      
      for (const result of batchResults) {
        if (result.type === 'success') {
          results.success.push({
            employee_id: result.employee_id,
            employee_name: result.employee_name,
            user_id: result.user_id,
            cpf: result.cpf
          });
        } else {
          results.errors.push({
            employee_id: result.employee_id,
            employee_name: result.employee_name,
            error: result.error
          });
        }
      }
    }

    console.log(`Processamento concluído: ${results.success.length} sucessos, ${results.errors.length} erros`);

    return new Response(
      JSON.stringify({ 
        success: true,
        results: results,
        message: `${results.success.length} usuário(s) criado(s), ${results.errors.length} erro(s)`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-employee-user function:', error);
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
