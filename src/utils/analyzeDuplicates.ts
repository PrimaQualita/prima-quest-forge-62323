// Script to analyze duplicate CPFs in the CSV file

export const analyzeCsvDuplicates = (csvText: string) => {
  const rows = csvText.split('\n').slice(1); // Skip header
  const cpfMap = new Map<string, { count: number; names: string[]; lines: number[] }>();
  
  rows.forEach((row, index) => {
    if (!row.trim()) return;
    
    const columns = row.split(';');
    const name = columns[0]?.trim();
    const cpf = columns[1]?.trim().replace(/\D/g, ''); // Clean CPF
    
    if (!cpf || !name) return;
    
    if (cpfMap.has(cpf)) {
      const existing = cpfMap.get(cpf)!;
      existing.count++;
      existing.names.push(name);
      existing.lines.push(index + 2); // +2 because we skip header and arrays are 0-indexed
    } else {
      cpfMap.set(cpf, { count: 1, names: [name], lines: [index + 2] });
    }
  });
  
  // Find duplicates
  const duplicates: Array<{
    cpf: string;
    count: number;
    names: string[];
    lines: number[];
  }> = [];
  
  cpfMap.forEach((value, cpf) => {
    if (value.count > 1) {
      duplicates.push({ cpf, ...value });
    }
  });
  
  return {
    totalRows: rows.filter(r => r.trim()).length,
    uniqueCpfs: cpfMap.size,
    duplicates,
    duplicateCount: duplicates.reduce((sum, d) => sum + d.count, 0)
  };
};
