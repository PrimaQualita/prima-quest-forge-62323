/**
 * Decode CSV file with proper encoding detection.
 * Most CSV files from Excel in Brazil are saved in Windows-1252 (Latin-1) encoding.
 * This function attempts to decode the file correctly.
 */
export const decodeCSVFile = async (file: File): Promise<string> => {
  // Try reading as Windows-1252 first (most common for Brazilian Excel files)
  try {
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder('windows-1252');
    const text = decoder.decode(arrayBuffer);
    
    // Check if the text looks correct (has proper Portuguese characters)
    if (hasValidPortugueseChars(text)) {
      console.log('CSV decoded successfully with windows-1252');
      return text;
    }
  } catch (e) {
    console.log('windows-1252 decoding failed, trying UTF-8');
  }
  
  // Fallback to UTF-8
  try {
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(arrayBuffer);
    console.log('CSV decoded with UTF-8');
    return text;
  } catch (e) {
    console.log('UTF-8 decoding failed, using default');
  }
  
  // Last resort: read as text with browser default
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

/**
 * Check if text contains valid Portuguese accented characters
 * (not mojibake/garbled text)
 */
const hasValidPortugueseChars = (text: string): boolean => {
  // Valid Portuguese characters
  const validChars = /[áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ]/;
  // Mojibake patterns (UTF-8 misread as Latin-1)
  const mojibakePattern = /Ã[¡©­³º£µ¢ª´§€‰]/;
  
  const hasMojibake = mojibakePattern.test(text);
  const hasValid = validChars.test(text);
  
  // If we have mojibake patterns, the encoding is wrong
  if (hasMojibake) {
    return false;
  }
  
  return true;
};

/**
 * Legacy function - kept for backward compatibility but now just returns the input
 * The proper fix is to decode with the correct encoding from the start
 */
export const fixCsvEncoding = (text: string): string => {
  // This function is deprecated - use decodeCSVFile instead
  return text;
};
