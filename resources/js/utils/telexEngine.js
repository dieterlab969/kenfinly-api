/**
 * Vietnamese Telex Engine
 * A robust implementation of the Telex input method.
 */

const VOWELS = 'aeiouy';
const TONES = {
    's': '\u0301', // Acute
    'f': '\u0300', // Grave
    'r': '\u0309', // Hook
    'x': '\u0303', // Tilde
    'j': '\u0323'  // Dot
};

const MODIFIERS = {
    'a': { 'a': 'â', 'w': 'ă' },
    'e': { 'e': 'ê' },
    'o': { 'o': 'ô', 'w': 'ơ' },
    'u': { 'w': 'ư' },
    'd': { 'd': 'đ' }
};

const COMBINED_MODIFIERS = {
    'â': { 's': 'ấ', 'f': 'ầ', 'r': 'ẩ', 'x': 'ẫ', 'j': 'ậ' },
    'ă': { 's': 'ắ', 'f': 'ằ', 'r': 'ẳ', 'x': 'ẵ', 'j': 'ặ' },
    'ê': { 's': 'ế', 'f': 'ề', 'r': 'ể', 'x': 'ễ', 'j': 'ệ' },
    'ô': { 's': 'ố', 'f': 'ồ', 'r': 'ổ', 'x': 'ỗ', 'j': 'ộ' },
    'ơ': { 's': 'ớ', 'f': 'ờ', 'r': 'ở', 'x': 'ỡ', 'j': 'ợ' },
    'ư': { 's': 'ứ', 'f': 'ừ', 'r': 'ử', 'x': 'ữ', 'j': 'ự' }
};

const BASIC_DIACRITICS = {
    'a': { 's': 'á', 'f': 'à', 'r': 'ả', 'x': 'ã', 'j': 'ạ' },
    'e': { 's': 'é', 'f': 'è', 'r': 'ẻ', 'x': 'ẽ', 'j': 'ẹ' },
    'i': { 's': 'í', 'f': 'ì', 'r': 'ỉ', 'x': 'ĩ', 'j': 'ị' },
    'o': { 's': 'ó', 'f': 'ò', 'r': 'ỏ', 'x': 'õ', 'j': 'ọ' },
    'u': { 's': 'ú', 'f': 'ù', 'r': 'ủ', 'x': 'ũ', 'j': 'ụ' },
    'y': { 's': 'ý', 'f': 'ỳ', 'r': 'ỷ', 'x': 'ỹ', 'j': 'ỵ' }
};

const REVERSE_MAP = {
    'â': 'a', 'ă': 'a', 'ê': 'e', 'ô': 'o', 'ơ': 'o', 'ư': 'u', 'đ': 'd',
    'á': 'a', 'à': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'é': 'e', 'è': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'í': 'i', 'ì': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    'ó': 'o', 'ò': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ú': 'u', 'ù': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ý': 'y', 'ỳ': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    'ấ': 'â', 'ầ': 'â', 'ẩ': 'â', 'ẫ': 'â', 'ậ': 'â',
    'ắ': 'ă', 'ằ': 'ă', 'ẳ': 'ă', 'ẵ': 'ă', 'ặ': 'ă',
    'ế': 'ê', 'ề': 'ê', 'ể': 'ê', 'ễ': 'ê', 'ệ': 'ê',
    'ố': 'ô', 'ồ': 'ô', 'ổ': 'ô', 'ỗ': 'ô', 'ộ': 'ô',
    'ớ': 'ơ', 'ờ': 'ơ', 'ở': 'ơ', 'ỡ': 'ơ', 'ợ': 'ơ',
    'ứ': 'ư', 'ừ': 'ư', 'ử': 'ư', 'ữ': 'ư', 'ự': 'ư'
};

/**
 * Finds the correct vowel to place the tone mark in a Vietnamese word.
 */
function findToneVowel(word) {
    const lower = word.toLowerCase();
    const vowels = [];
    for (let i = 0; i < word.length; i++) {
        if (VOWELS.includes(REVERSE_MAP[lower[i]] || lower[i])) {
            vowels.push(i);
        }
    }

    if (vowels.length === 0) return -1;
    if (vowels.length === 1) return vowels[0];

    // Rules for multiple vowels:
    // 1. If there's an 'ê' or 'ô', it gets the tone.
    for (let idx of vowels) {
        if (['ê', 'ô'].includes(lower[idx])) return idx;
    }

    // 2. If it's a diphthong/triphthong ending with a vowel, usually the second to last vowel gets it
    // unless it's a special case like 'uo', 'ie'.
    if (vowels.length === 2) {
        const pair = (REVERSE_MAP[lower[vowels[0]]] || lower[vowels[0]]) + (REVERSE_MAP[lower[vowels[1]]] || lower[vowels[1]]);
        if (['oa', 'oe', 'uy', 'ue'].includes(pair)) return vowels[1];
        return vowels[0];
    }

    if (vowels.length === 3) return vowels[1];

    return vowels[vowels.length - 1];
}

/**
 * Main Telex conversion logic
 */
export function convertTelex(text) {
    if (!text) return '';

    const words = text.split(/(\s+)/);
    const convertedWords = words.map(word => {
        if (!word.trim()) return word;

        let result = '';
        for (let i = 0; i < word.length; i++) {
            const char = word[i].toLowerCase();
            const prevChar = result[result.length - 1]?.toLowerCase();
            
            // Handle Modifiers (aa, aw, ee, oo, ow, uw, dd)
            if (MODIFIERS[prevChar] && MODIFIERS[prevChar][char]) {
                const isUpper = result[result.length - 1] === result[result.length - 1].toUpperCase();
                result = result.slice(0, -1) + (isUpper ? MODIFIERS[prevChar][char].toUpperCase() : MODIFIERS[prevChar][char]);
                continue;
            }

            // Handle Tones (s, f, r, x, j)
            if (TONES[char]) {
                const toneIdx = findToneVowel(result);
                if (toneIdx !== -1) {
                    const vowelToChange = result[toneIdx];
                    const baseVowel = REVERSE_MAP[vowelToChange.toLowerCase()] || vowelToChange.toLowerCase();
                    const isUpper = vowelToChange === vowelToChange.toUpperCase();
                    
                    let newVowel = null;
                    if (COMBINED_MODIFIERS[vowelToChange.toLowerCase()]) {
                        newVowel = COMBINED_MODIFIERS[vowelToChange.toLowerCase()][char];
                    } else if (BASIC_DIACRITICS[baseVowel]) {
                        newVowel = BASIC_DIACRITICS[baseVowel][char];
                    }

                    if (newVowel) {
                        result = result.slice(0, toneIdx) + (isUpper ? newVowel.toUpperCase() : newVowel) + result.slice(toneIdx + 1);
                        continue;
                    }
                }
            }

            result += word[i];
        }
        return result;
    });

    return convertedWords.join('');
}
