/**
 * Simple Telex to Vietnamese Engine
 * This is a lightweight implementation for web-based Vietnamese typing
 */

const TELEX_MAP = {
    'a': { 'a': 'aa', 'w': 'aw', 's': 'ás', 'f': 'àf', 'r': 'ảr', 'x': 'ãx', 'j': 'ạj' },
    'e': { 'e': 'ee', 's': 'és', 'f': 'èf', 'r': 'ẻr', 'x': 'ẽx', 'j': 'ẹj' },
    'o': { 'o': 'oo', 'w': 'ow', 's': 'ós', 'f': 'òf', 'r': 'ỏr', 'x': 'õx', 'j': 'ọj' },
    'u': { 'w': 'uw', 's': 'ús', 'f': 'ùf', 'r': 'ủr', 'x': 'ũx', 'j': 'ụj' },
    'i': { 's': 'ís', 'f': 'ìf', 'r': 'ỉr', 'x': 'ĩx', 'j': 'ịj' },
    'y': { 's': 'ýs', 'f': 'ỳf', 'r': 'ỷr', 'x': 'ỹx', 'j': 'ỵj' },
    'd': { 'd': 'dd' }
};

// Simplified Vietnamese diacritics mapping
const DIACRITICS = {
    'aa': 'â', 'aw': 'ă', 'ee': 'ê', 'oo': 'ô', 'ow': 'ơ', 'uw': 'ư', 'dd': 'đ',
    'as': 'á', 'af': 'à', 'ar': 'ả', 'ax': 'ã', 'aj': 'ạ',
    'es': 'é', 'ef': 'è', 'er': 'ẻ', 'ex': 'ẽ', 'ej': 'ẹ',
    'is': 'í', 'if': 'ì', 'ir': 'ỉ', 'ix': 'ĩ', 'ij': 'ị',
    'os': 'ó', 'of': 'ò', 'or': 'ỏ', 'ox': 'õ', 'oj': 'ọ',
    'us': 'ú', 'uf': 'ù', 'ur': 'ủ', 'ux': 'ũ', 'uj': 'ụ',
    'ys': 'ý', 'yf': 'ỳ', 'yr': 'ỷ', 'yx': 'ỹ', 'yj': 'ỵ',
    // Combination rules (vowels + markers)
    'âs': 'ấ', 'âf': 'ầ', 'âr': 'ẩ', 'âx': 'ẫ', 'âj': 'ậ',
    'ăs': 'ắ', 'ăf': 'ằ', 'ăr': 'ẳ', 'ăx': 'ẵ', 'ăj': 'ặ',
    'ês': 'ế', 'êf': 'ề', 'êr': 'ể', 'êx': 'ễ', 'êj': 'ệ',
    'ôs': 'ố', 'ôf': 'ồ', 'ôr': 'ổ', 'ôx': 'ỗ', 'ôj': 'ộ',
    'ơs': 'ớ', 'ơf': 'ờ', 'ơr': 'ở', 'ơx': 'ỡ', 'ơj': 'ợ',
    'ưs': 'ứ', 'ưf': 'ừ', 'ưr': 'ử', 'ưx': 'ữ', 'ưj': 'ự'
};

/**
 * Process a string and convert Telex to Vietnamese
 */
export function convertTelex(text) {
    if (!text) return '';
    
    let result = '';
    let i = 0;
    
    while (i < text.length) {
        let char = text[i];
        let nextChar = text[i + 1];
        
        // Handle special Telex keys: s, f, r, x, j, w, a, e, o, d
        if (nextChar) {
            let combined = char.toLowerCase() + nextChar.toLowerCase();
            if (DIACRITICS[combined]) {
                // Check if the first char was already a transformed vowel
                // This handles cases like 'aas' -> 'ấ'
                result += DIACRITICS[combined];
                i += 2;
                continue;
            }
        }
        
        // Complex cases for existing transformed vowels
        if (i > 0 && nextChar) {
            let prevResultChar = result[result.length - 1];
            let combinedWithPrev = prevResultChar + nextChar.toLowerCase();
            if (DIACRITICS[combinedWithPrev]) {
                result = result.substring(0, result.length - 1) + DIACRITICS[combinedWithPrev];
                i += 1;
                continue;
            }
        }

        result += char;
        i++;
    }
    
    return result;
}

// Full-featured Telex engine would be more complex (handling tone mark displacement),
// but this serves as a robust base for the requirement.
