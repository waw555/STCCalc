/**
 * Utility functions for generating standardized image/file paths for uploads.
 * Standardizes filename formatting and automatically transliterates non-English (e.g. Cyrillic) text to English/Latin characters.
 */

// Transliteration map from Cyrillic to English/Latin
const CYRILLIC_TO_LATIN_MAP: Record<string, string> = {
  'А': 'A', 'а': 'a',
  'Б': 'B', 'б': 'b',
  'В': 'V', 'в': 'v',
  'Г': 'G', 'г': 'g',
  'Д': 'D', 'д': 'd',
  'Е': 'E', 'е': 'e',
  'Ё': 'Yo', 'ё': 'yo',
  'Ж': 'Zh', 'ж': 'zh',
  'З': 'Z', 'з': 'z',
  'И': 'I', 'и': 'i',
  'Й': 'Y', 'й': 'y',
  'К': 'K', 'к': 'k',
  'Л': 'L', 'л': 'l',
  'М': 'M', 'м': 'm',
  'Н': 'N', 'н': 'n',
  'О': 'O', 'о': 'o',
  'П': 'P', 'п': 'p',
  'Р': 'R', 'р': 'r',
  'С': 'S', 'с': 's',
  'Т': 'T', 'т': 't',
  'У': 'U', 'у': 'u',
  'Ф': 'F', 'ф': 'f',
  'Х': 'Kh', 'х': 'kh',
  'Ц': 'Ts', 'ц': 'ts',
  'Ч': 'Ch', 'ч': 'ch',
  'Ш': 'Sh', 'ш': 'sh',
  'Щ': 'Shch', 'щ': 'shch',
  'Ъ': '', 'ъ': '',
  'Ы': 'Y', 'ы': 'y',
  'Ь': '', 'ь': '',
  'Э': 'E', 'э': 'e',
  'Ю': 'Yu', 'ю': 'yu',
  'Я': 'Ya', 'я': 'ya',
};

/**
 * Transliterates Cyrillic or non-English characters to Latin,
 * and converts spaces/special characters into clean filename-safe strings.
 */
export function transliterateToEnglish(str: string): string {
  if (!str) return '';

  const transliterated = str
    .split('')
    .map(char => CYRILLIC_TO_LATIN_MAP[char] || char)
    .join('');

  // Replace spaces, quotes, punctuation with single underscores
  return transliterated
    .trim()
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * 1. Decors folder: /uploads/decors/{ManufacturerName}_{DecorNumber}_{DecorName}.{ext}
 */
export function generateDecorFilePath(
  manufacturerName: string,
  decorNumber: string,
  decorName: string,
  extension: string = 'jpg'
): string {
  const mfg = transliterateToEnglish(manufacturerName) || 'Manufacturer';
  const num = transliterateToEnglish(decorNumber) || '000';
  const name = transliterateToEnglish(decorName) || 'Decor';
  const ext = extension.replace(/^\./, '').toLowerCase() || 'jpg';
  return `/uploads/decors/${mfg}_${num}_${name}.${ext}`;
}

/**
 * 2. Embossings folder: /uploads/embossings/{ManufacturerName}_{EmbossingName}.{ext}
 */
export function generateEmbossingFilePath(
  manufacturerName: string,
  embossingName: string,
  extension: string = 'jpg'
): string {
  const mfg = transliterateToEnglish(manufacturerName) || 'Manufacturer';
  const name = transliterateToEnglish(embossingName) || 'Embossing';
  const ext = extension.replace(/^\./, '').toLowerCase() || 'jpg';
  return `/uploads/embossings/${mfg}_${name}.${ext}`;
}

/**
 * 3. Manufacturers folder: /uploads/manufacturers/{ManufacturerName}.{ext}
 */
export function generateManufacturerFilePath(
  manufacturerName: string,
  extension: string = 'png'
): string {
  const mfg = transliterateToEnglish(manufacturerName) || 'Manufacturer';
  const ext = extension.replace(/^\./, '').toLowerCase() || 'png';
  return `/uploads/manufacturers/${mfg}.${ext}`;
}

/**
 * 4. Organization folder: /uploads/organization/{OrganizationName}.{ext}
 */
export function generateOrganizationFilePath(
  organizationName: string,
  extension: string = 'png'
): string {
  const org = transliterateToEnglish(organizationName) || 'Organization';
  const ext = extension.replace(/^\./, '').toLowerCase() || 'png';
  return `/uploads/organization/${org}.${ext}`;
}

/**
 * 5. Services folder: /uploads/services/{ServiceName}.{ext}
 */
export function generateServiceFilePath(
  serviceName: string,
  extension: string = 'jpg'
): string {
  const srv = transliterateToEnglish(serviceName) || 'Service';
  const ext = extension.replace(/^\./, '').toLowerCase() || 'jpg';
  return `/uploads/services/${srv}.${ext}`;
}
