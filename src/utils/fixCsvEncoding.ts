/**
 * Fix common encoding issues from CSV files saved with Windows-1252/Latin-1 encoding
 * but read as UTF-8. This handles Portuguese accented characters.
 */
export const fixCsvEncoding = (text: string): string => {
  // Common replacements for Windows-1252/Latin-1 characters misread as UTF-8
  // Using hex codes to avoid syntax issues
  const replacements: Array<[RegExp, string]> = [
    // á, é, í, ó, ú lowercase
    [/Ã¡/g, 'á'],
    [/Ã©/g, 'é'],
    [/Ã­/g, 'í'],
    [/Ã³/g, 'ó'],
    [/Ãº/g, 'ú'],
    // ã, õ, â, ê, ô lowercase
    [/Ã£/g, 'ã'],
    [/Ãµ/g, 'õ'],
    [/Ã¢/g, 'â'],
    [/Ãª/g, 'ê'],
    [/Ã´/g, 'ô'],
    // ç
    [/Ã§/g, 'ç'],
    // à
    [/Ã\u00A0/g, 'à'],
    // ü
    [/Ã¼/g, 'ü'],
    // Á, É, Í, Ó, Ú uppercase
    [/Ã\u0081/g, 'Á'],
    [/Ã‰/g, 'É'],
    [/Ã\u008D/g, 'Í'],
    [/Ã"/g, 'Ó'],
    [/Ãš/g, 'Ú'],
    // Ã, Õ, Â, Ê, Ô uppercase
    [/Ãƒ/g, 'Ã'],
    [/Ã•/g, 'Õ'],
    [/Ã‚/g, 'Â'],
    [/ÃŠ/g, 'Ê'],
    [/Ã"/g, 'Ô'],
    // Ç
    [/Ã‡/g, 'Ç'],
    // À
    [/Ã€/g, 'À'],
    // Ü
    [/Ãœ/g, 'Ü'],
    // ñ, Ñ
    [/Ã±/g, 'ñ'],
    [/Ã'/g, 'Ñ'],
    // Remove replacement character
    [/\uFFFD/g, ''],
  ];

  let result = text;
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }

  return result;
};
