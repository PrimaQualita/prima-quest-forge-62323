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
    const BATCH_SIZE = 20; // Process 20 employees at a time
    
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

        // Clean CPF (remove any formatting)
        const cpf = employee.cpf.replace(/\D/g, '');
        
        // Format birth date to use as password (only numbers: DDMMYYYY)
        const birthDate = new Date(employee.birth_date);
        const day = String(birthDate.getDate()).padStart(2, '0');
        const month = String(birthDate.getMonth() + 1).padStart(2, '0');
        const year = birthDate.getFullYear();
        const password = `${day}${month}${year}`;

        // Create a unique email using CPF (for auth system requirements)
        const authEmail = `${cpf}@primaqualita.local`;

        let userId: string;

        // Check if user exists in our cached map
        if (existingUsersMap.has(authEmail)) {
          userId = existingUsersMap.get(authEmail)!;
        } else {
          // Try to create user in auth with CPF-based email
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

          // If user already exists, get their ID
          if (userError && userError.message.includes('already registered')) {
            // User exists, fetch from the map we loaded at start
            const existingUser = existingUsersMap.get(authEmail);
            if (existingUser) {
              userId = existingUser;
            } else {
              // Fallback: fetch user by email
              const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
              const foundUser = users?.find(u => u.email === authEmail);
              if (foundUser) {
                userId = foundUser.id;
                existingUsersMap.set(authEmail, userId);
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
            userId = userData.user.id;
            existingUsersMap.set(authEmail, userId); // Cache the new user
          }
        }

        // Create profile, update employee, and add role in parallel
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
          user_id: userId,
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

    // Process in parallel batches
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
