/**
 * Decode CSV file with proper encoding detection.
 * Most CSV files from Excel in Brazil are saved in Windows-1252 (Latin-1) encoding.
 * This function attempts to decode the file correctly.
 */
export const decodeCSVFile = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Check for BOM (Byte Order Mark) to detect UTF-8
  const hasUtf8Bom = uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF;
  
  if (hasUtf8Bom) {
    console.log('UTF-8 BOM detected, using UTF-8');
    const text = new TextDecoder('utf-8').decode(arrayBuffer);
    return fixCorruptedCharacters(text);
  }
  
  // Try both encodings and pick the one that looks correct
  const utf8Text = new TextDecoder('utf-8').decode(arrayBuffer);
  const latin1Text = new TextDecoder('windows-1252').decode(arrayBuffer);
  
  // Count problems in each encoding
  const utf8Problems = countEncodingProblems(utf8Text);
  const latin1Problems = countEncodingProblems(latin1Text);
  
  console.log('Encoding analysis:');
  console.log('UTF-8 problems:', utf8Problems);
  console.log('Latin-1 problems:', latin1Problems);
  
  // Choose the encoding with fewer problems
  let selectedText: string;
  if (latin1Problems < utf8Problems) {
    console.log('Using windows-1252 encoding (fewer problems)');
    selectedText = latin1Text;
  } else if (utf8Problems < latin1Problems) {
    console.log('Using UTF-8 encoding (fewer problems)');
    selectedText = utf8Text;
  } else {
    // If equal, prefer Latin-1 for Brazilian CSVs from Excel
    console.log('Using windows-1252 encoding (default for Brazilian Excel)');
    selectedText = latin1Text;
  }
  
  // Always attempt to fix corrupted characters
  return fixCorruptedCharacters(selectedText);
};

/**
 * Fix corrupted characters that commonly appear in Brazilian CSVs
 * This handles cases where the file was saved with wrong encoding
 */
export const fixCorruptedCharacters = (text: string): string => {
  let result = text;
  
  // Step 1: Fix replacement characters in known patterns
  // "SAUDE" often appears corrupted - fix to "SAUDE" (ASCII) or detect the pattern
  result = result.replace(/SA[\uFFFD\x00\x80-\x9F]DE/gi, 'SAUDE');
  result = result.replace(/PRIMA QUALITA SA.DE/gi, 'PRIMA QUALITA SAUDE');
  
  // Step 2: Fix Roman numerals where 'l' (lowercase L) or 'L' (uppercase L) is used instead of 'I'
  // These patterns appear at the end of job titles - using case-insensitive matching
  const romanNumeralPatterns: Array<{ pattern: RegExp; replacement: string }> = [
    // Match V + lll/LLL (VIII)
    { pattern: /\sV[lL][lL][lL](?=\s*[-;,]|\s*$)/gi, replacement: ' VIII' },
    // Match V + ll/LL (VII)
    { pattern: /\sV[lL][lL](?=\s*[-;,]|\s*$)/gi, replacement: ' VII' },
    // Match V + l/L (VI)
    { pattern: /\sV[lL](?=\s*[-;,]|\s*$)/gi, replacement: ' VI' },
    // Match lll/LLL (III)
    { pattern: /\s[lL][lL][lL](?=\s*[-;,]|\s*$)/g, replacement: ' III' },
    // Match ll/LL (II)
    { pattern: /\s[lL][lL](?=\s*[-;,]|\s*$)/g, replacement: ' II' },
    // Match l/L + V (IV)
    { pattern: /\s[lL]V(?=\s*[-;,]|\s*$)/g, replacement: ' IV' },
    // Match l/L + X (IX)
    { pattern: /\s[lL]X(?=\s*[-;,]|\s*$)/g, replacement: ' IX' },
    // Match single l/L at end (I) - must be last to not interfere with others
    { pattern: /\s[lL](?=\s*[-;,]|\s*$)/g, replacement: ' I' },
  ];
  
  for (const item of romanNumeralPatterns) {
    result = result.replace(item.pattern, item.replacement);
  }
  
  // Step 3: Also fix Roman numerals followed by hyphen (like "I-RT")
  result = result.replace(/\sV[lL][lL][lL]-/gi, ' VIII-');
  result = result.replace(/\sV[lL][lL]-/gi, ' VII-');
  result = result.replace(/\sV[lL]-/gi, ' VI-');
  result = result.replace(/\s[lL][lL][lL]-/g, ' III-');
  result = result.replace(/\s[lL][lL]-/g, ' II-');
  result = result.replace(/\s[lL]V-/g, ' IV-');
  result = result.replace(/\s[lL]X-/g, ' IX-');
  result = result.replace(/\s[lL]-/g, ' I-');
  
  // Step 4: Fix UTF-8 mojibake patterns (UTF-8 bytes read as Latin-1)
  // Using character codes to avoid encoding issues in the source file
  const mojibakeMap: Record<string, string> = {
    '\u00C3\u00A1': '\u00E1', // a with acute
    '\u00C3\u00A9': '\u00E9', // e with acute
    '\u00C3\u00AD': '\u00ED', // i with acute
    '\u00C3\u00B3': '\u00F3', // o with acute
    '\u00C3\u00BA': '\u00FA', // u with acute
    '\u00C3\u00A3': '\u00E3', // a with tilde
    '\u00C3\u00B5': '\u00F5', // o with tilde
    '\u00C3\u00A2': '\u00E2', // a with circumflex
    '\u00C3\u00AA': '\u00EA', // e with circumflex
    '\u00C3\u00B4': '\u00F4', // o with circumflex
    '\u00C3\u00A7': '\u00E7', // c with cedilla
    '\u00C3\u0087': '\u00C7', // C with cedilla
    '\u00C3\u009A': '\u00DA', // U with acute
    '\u00C3\u0089': '\u00C9', // E with acute
    '\u00C3\u0080': '\u00C0', // A with grave
  };
  
  for (const [corrupted, fixed] of Object.entries(mojibakeMap)) {
    result = result.split(corrupted).join(fixed);
  }
  
  // Step 5: Remove any remaining replacement characters
  result = result.replace(/\uFFFD/g, '');
  
  return result;
};

/**
 * Count encoding problems in text
 */
const countEncodingProblems = (text: string): number => {
  let problems = 0;
  
  // Replacement character (indicates encoding failure)
  const replacementChars = (text.match(/\uFFFD/g) || []).length;
  problems += replacementChars * 100; // Heavy penalty
  
  // Mojibake patterns (UTF-8 read as Latin-1) - check for double-byte sequences
  const mojibakePattern = /\u00C3[\u0080-\u00BF]/g;
  const mojibakeMatches = (text.match(mojibakePattern) || []).length;
  problems += mojibakeMatches * 10;
  
  // Check for valid Portuguese characters (good sign)
  const validCharsPattern = /[\u00E1\u00E0\u00E2\u00E3\u00E9\u00EA\u00ED\u00F3\u00F4\u00F5\u00FA\u00FC\u00E7\u00C1\u00C0\u00C2\u00C3\u00C9\u00CA\u00CD\u00D3\u00D4\u00D5\u00DA\u00DC\u00C7]/g;
  const validChars = (text.match(validCharsPattern) || []).length;
  problems -= validChars; // Reduce problems for each valid char found
  
  return Math.max(0, problems);
};

/**
 * Legacy function - kept for backward compatibility
 */
export const fixCsvEncoding = (text: string): string => {
  return fixCorruptedCharacters(text);
};
