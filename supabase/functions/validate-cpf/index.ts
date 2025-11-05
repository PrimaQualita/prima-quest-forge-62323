import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  cpf: string;
  birthDate: string;
  name?: string;
}

interface ValidationResult {
  cpf: string;
  isValid: boolean;
  cpfFormatValid: boolean;
  cpfExists: boolean;
  birthDateMatches: boolean | null;
  nameMatches: boolean | null;
  error?: string;
  details?: any;
}

// Validar formato e dígitos verificadores do CPF
function validateCPFFormat(cpf: string): boolean {
  // Remove non-numeric characters
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  
  // Validate check digits
  let sum = 0;
  let remainder;
  
  // First check digit
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
  
  // Second check digit
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
  
  return true;
}

// Consultar CPF na API da Receita Federal (usando Brasil API como fallback)
async function consultCPF(cpf: string): Promise<any> {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  try {
    // Tentar Brasil API primeiro
    console.log(`Consultando CPF ${cleanCPF} na Brasil API...`);
    const response = await fetch(`https://brasilapi.com.br/api/cpf/v1/${cleanCPF}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Resposta da Brasil API:', data);
      return { success: true, data, source: 'brasilapi' };
    }
    
    console.log('Brasil API falhou:', response.status);
  } catch (error) {
    console.error('Erro ao consultar Brasil API:', error);
  }
  
  // Fallback para ReceitaWS
  try {
    console.log(`Tentando ReceitaWS para CPF ${cleanCPF}...`);
    const response = await fetch(`https://www.receitaws.com.br/v1/cpf/${cleanCPF}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Resposta da ReceitaWS:', data);
      return { success: true, data, source: 'receitaws' };
    }
    
    console.log('ReceitaWS falhou:', response.status);
  } catch (error) {
    console.error('Erro ao consultar ReceitaWS:', error);
  }
  
  return { success: false, error: 'APIs indisponíveis no momento' };
}

// Comparar data de nascimento
function compareBirthDate(apiDate: string | undefined, providedDate: string): boolean | null {
  if (!apiDate) return null;
  
  // Normalizar datas para formato YYYY-MM-DD
  const normalizeDate = (date: string): string => {
    // Se for DD/MM/YYYY
    if (date.includes('/')) {
      const [day, month, year] = date.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // Se for YYYY-MM-DD
    return date;
  };
  
  const normalized1 = normalizeDate(apiDate);
  const normalized2 = normalizeDate(providedDate);
  
  return normalized1 === normalized2;
}

// Comparar nome (similaridade básica)
function compareName(apiName: string | undefined, providedName: string | undefined): boolean | null {
  if (!apiName || !providedName) return null;
  
  const normalize = (name: string) => 
    name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z\s]/g, '')
      .trim();
  
  const name1 = normalize(apiName);
  const name2 = normalize(providedName);
  
  // Verificar se um nome contém o outro (para casos de nome completo vs nome parcial)
  return name1.includes(name2) || name2.includes(name1);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { cpfs } = await req.json() as { cpfs: ValidationRequest[] };

    if (!cpfs || !Array.isArray(cpfs)) {
      return new Response(
        JSON.stringify({ error: 'Array de CPFs é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Validando ${cpfs.length} CPF(s)...`);

    const results: ValidationResult[] = [];

    for (const { cpf, birthDate, name } of cpfs) {
      const cleanCPF = cpf.replace(/\D/g, '');
      console.log(`\nValidando CPF: ${cleanCPF}`);

      const result: ValidationResult = {
        cpf: cleanCPF,
        isValid: false,
        cpfFormatValid: false,
        cpfExists: false,
        birthDateMatches: null,
        nameMatches: null,
      };

      // 1. Validar formato do CPF
      result.cpfFormatValid = validateCPFFormat(cleanCPF);
      console.log(`Formato válido: ${result.cpfFormatValid}`);

      if (!result.cpfFormatValid) {
        result.error = 'CPF com formato inválido ou dígitos verificadores incorretos';
        results.push(result);
        continue;
      }

      // 2. Consultar CPF na Receita Federal
      const apiResult = await consultCPF(cleanCPF);
      
      if (apiResult.success) {
        result.cpfExists = true;
        result.details = apiResult.data;

        // 3. Verificar data de nascimento
        const apiBirthDate = apiResult.data.data_nascimento || apiResult.data.nascimento;
        if (apiBirthDate) {
          result.birthDateMatches = compareBirthDate(apiBirthDate, birthDate);
          console.log(`Data de nascimento confere: ${result.birthDateMatches}`);
        }

        // 4. Verificar nome (se disponível)
        const apiName = apiResult.data.nome || apiResult.data.name;
        if (apiName && name) {
          result.nameMatches = compareName(apiName, name);
          console.log(`Nome confere: ${result.nameMatches}`);
        }

        // CPF é válido se existe E a data de nascimento confere
        // Se a API retornou data mas não confere, bloquear
        if (result.birthDateMatches === false) {
          result.isValid = false;
          result.error = 'Data de nascimento não confere com o CPF na Receita Federal';
        } else {
          result.isValid = result.cpfExists && result.birthDateMatches === true;
          if (result.birthDateMatches === null) {
            result.error = 'CPF encontrado mas data de nascimento não disponível na API';
            result.isValid = false; // Bloquear se não conseguiu verificar a data
          }
        }
      } else {
        // APIs públicas não têm 100% dos CPFs - permitir cadastro com formato válido
        // mas avisar que não foi possível validar a data de nascimento
        console.log(`CPF ${cleanCPF} não encontrado nas APIs públicas - permitindo por formato válido`);
        result.error = 'Atenção: CPF não encontrado nas bases públicas. Validação apenas de formato.';
        result.isValid = result.cpfFormatValid;
        result.cpfExists = false;
      }

      console.log(`Resultado final - CPF ${cleanCPF} válido: ${result.isValid}`);
      results.push(result);

      // Rate limiting: esperar um pouco entre requisições
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const validCount = results.filter(r => r.isValid).length;
    const invalidCount = results.length - validCount;

    console.log(`\nResumo: ${validCount} válidos, ${invalidCount} inválidos de ${results.length} total`);

    return new Response(
      JSON.stringify({ 
        results,
        summary: {
          total: results.length,
          valid: validCount,
          invalid: invalidCount,
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro na validação:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
