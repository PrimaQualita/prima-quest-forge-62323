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
    return new TextDecoder('utf-8').decode(arrayBuffer);
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
  
  // Debug: Show sample with potential issues
  const sampleUtf8 = extractSampleWithAccents(utf8Text);
  const sampleLatin1 = extractSampleWithAccents(latin1Text);
  console.log('UTF-8 sample:', sampleUtf8);
  console.log('Latin-1 sample:', sampleLatin1);
  
  // Choose the encoding with fewer problems
  if (latin1Problems < utf8Problems) {
    console.log('Using windows-1252 encoding (fewer problems)');
    return latin1Text;
  } else if (utf8Problems < latin1Problems) {
    console.log('Using UTF-8 encoding (fewer problems)');
    return utf8Text;
  } else {
    // If equal, prefer Latin-1 for Brazilian CSVs from Excel
    console.log('Using windows-1252 encoding (default for Brazilian Excel)');
    return latin1Text;
  }
};

/**
 * Count encoding problems in text
 */
const countEncodingProblems = (text: string): number => {
  let problems = 0;
  
  // Replacement character (indicates encoding failure)
  const replacementChars = (text.match(/\uFFFD/g) || []).length;
  problems += replacementChars * 100; // Heavy penalty
  
  // Mojibake patterns (UTF-8 read as Latin-1)
  const mojibakePatterns = [
    /Ã¡/g, /Ã©/g, /Ã­/g, /Ã³/g, /Ãº/g,  // á, é, í, ó, ú
    /Ã£/g, /Ãµ/g, /Ã¢/g, /Ãª/g, /Ã´/g,  // ã, õ, â, ê, ô
    /Ã§/g, /Ã‡/g,  // ç, Ç
    /Ãš/g, /Ã‰/g,  // Ú, É
  ];
  
  for (const pattern of mojibakePatterns) {
    const matches = (text.match(pattern) || []).length;
    problems += matches * 10;
  }
  
  // Check for valid Portuguese characters (good sign)
  const validChars = (text.match(/[áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ]/g) || []).length;
  problems -= validChars; // Reduce problems for each valid char found
  
  return Math.max(0, problems);
};

/**
 * Extract a sample of text that might contain accented characters
 */
const extractSampleWithAccents = (text: string): string => {
  // Find lines that might contain accented words
  const lines = text.split('\n').slice(0, 20);
  const samples: string[] = [];
  
  for (const line of lines) {
    // Look for words that typically have accents in Portuguese
    if (line.includes('SA') || line.includes('Farm') || line.includes('III') || 
        line.includes('Ú') || line.includes('á') || line.includes('ã')) {
      samples.push(line.substring(0, 150));
      if (samples.length >= 3) break;
    }
  }
  
  return samples.join(' | ');
};

/**
 * Legacy function - kept for backward compatibility
 */
export const fixCsvEncoding = (text: string): string => {
  return text;
};
