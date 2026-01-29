/**
 * Decode CSV file with proper encoding detection.
 * Most CSV files from Excel in Brazil are saved in Windows-1252 (Latin-1) encoding.
 * This function attempts to decode the file correctly.
 */
export const decodeCSVFile = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  
  // Try both encodings and pick the one that looks correct
  const utf8Text = new TextDecoder('utf-8').decode(arrayBuffer);
  const latin1Text = new TextDecoder('windows-1252').decode(arrayBuffer);
  
  // Count valid Portuguese characters vs mojibake patterns
  const utf8Score = scoreEncoding(utf8Text);
  const latin1Score = scoreEncoding(latin1Text);
  
  console.log('Encoding scores - UTF-8:', utf8Score, 'Latin-1:', latin1Score);
  console.log('UTF-8 sample:', utf8Text.substring(0, 200));
  console.log('Latin-1 sample:', latin1Text.substring(0, 200));
  
  // Use the encoding with the better score
  if (latin1Score > utf8Score) {
    console.log('Using windows-1252 encoding');
    return latin1Text;
  } else {
    console.log('Using UTF-8 encoding');
    return utf8Text;
  }
};

/**
 * Score how likely the text is correctly encoded
 * Higher score = more likely correct
 */
const scoreEncoding = (text: string): number => {
  let score = 0;
  
  // Valid Portuguese accented characters (good)
  const validChars = text.match(/[áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ]/g);
  score += (validChars?.length || 0) * 10;
  
  // Mojibake patterns (bad) - these appear when UTF-8 is read as Latin-1 or vice versa
  const mojibakePatterns = [
    /Ã¡/g, /Ã©/g, /Ã­/g, /Ã³/g, /Ãº/g,  // á, é, í, ó, ú as mojibake
    /Ã£/g, /Ãµ/g, /Ã¢/g, /Ãª/g, /Ã´/g,  // ã, õ, â, ê, ô as mojibake
    /Ã§/g, /Ã‡/g,  // ç, Ç as mojibake
    /Ã/g,  // General mojibake indicator
  ];
  
  for (const pattern of mojibakePatterns) {
    const matches = text.match(pattern);
    score -= (matches?.length || 0) * 20;
  }
  
  // Replacement character (very bad)
  const replacementChars = text.match(/\uFFFD/g);
  score -= (replacementChars?.length || 0) * 50;
  
  return score;
};

/**
 * Legacy function - kept for backward compatibility
 */
export const fixCsvEncoding = (text: string): string => {
  return text;
};
