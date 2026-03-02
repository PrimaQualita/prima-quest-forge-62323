

## Problema Identificado

O campo "Contrato de Gestão" não está sendo preenchido na importação CSV porque a busca pelo nome do contrato exige correspondência **exata**.

**Exemplo do problema:**
- No CSV: `PRIMA QUALITA - CG 033/2021 - SAQUAREMA HOSPITALAR` (maiúsculas, com prefixo)
- No banco: `CG 033/2021 - Saquarema Hospitalar` (sem prefixo, capitalização diferente)

Como os nomes não batem exatamente, o sistema não encontra o contrato e deixa o campo vazio.

## Solução

Implementar uma busca **flexível** (fuzzy match) do nome do contrato, com as seguintes estratégias em cascata:

1. **Normalização**: Comparar ambos os nomes em minúsculas e sem espaços extras
2. **Busca parcial**: Se não encontrar exato, verificar se o nome do CSV **contém** o nome do contrato do banco (ou vice-versa)
3. **Busca por código do contrato**: Extrair o padrão `CG XXX/YYYY` do texto e tentar casar por ele

### Alterações

**Arquivo: `src/pages/Employees.tsx`**

Na função `handleConfirmImport` (por volta da linha 641-683):

- Manter o `contractMap` original para match exato
- Criar um segundo mapa normalizado (lowercase/trimmed) para fallback
- Adicionar função auxiliar `findContractId(contractName)` que tenta:
  1. Match exato pelo nome
  2. Match normalizado (case-insensitive)
  3. Match parcial (se o nome do CSV contém o nome do contrato ou vice-versa)
  4. Match pelo código `CG XXX/YYYY`

### Detalhes Técnicos

```text
CSV Input: "PRIMA QUALITA - CG 033/2021 - SAQUAREMA HOSPITALAR"
                          |
    1. Exact match?  --> NO
    2. Lowercase match? --> NO  
    3. Partial match (contains "cg 033/2021 - saquarema hospitalar")? --> YES!
                          |
    Result: ff302d38-... (CG 033/2021 - Saquarema Hospitalar)
```

Também atualizarei o template CSV de exemplo para usar um nome de contrato mais realista no exemplo.
