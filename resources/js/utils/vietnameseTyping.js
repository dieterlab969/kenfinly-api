/**
 * Vietnamese Typing Input Library (Multi-Engine)
 * Supports Telex, VNI, VIQR, and OFF
 */
const VNTYPING = (() => {
    const VOWELS = 'aeiouy';
    
    const MODES = {
        TELEX: 'telex',
        VNI: 'vni',
        VIQR: 'viqr',
        OFF: 'off'
    };

    let currentMode = MODES.TELEX;

    const RULES = {
        [MODES.TELEX]: {
            modifiers: {
                'a': { 'a': 'â', 'w': 'ă' },
                'e': { 'e': 'ê' },
                'o': { 'o': 'ô', 'w': 'ơ' },
                'u': { 'w': 'ư' },
                'd': { 'd': 'đ' }
            },
            tones: { 's': 'á', 'f': 'à', 'r': 'ả', 'x': 'ã', 'j': 'ạ' }
        },
        [MODES.VNI]: {
            modifiers: {
                'a': { '6': 'â', '8': 'ă' },
                'e': { '6': 'ê' },
                'o': { '6': 'ô', '7': 'ơ' },
                'u': { '7': 'ư' },
                'd': { '9': 'đ' }
            },
            tones: { '1': 'á', '2': 'à', '3': 'ả', '4': 'ã', '5': 'ạ' }
        },
        [MODES.VIQR]: {
            modifiers: {
                'a': { '^': 'â', '(': 'ă' },
                'e': { '^': 'ê' },
                'o': { '^': 'ô', '+': 'ơ' },
                'u': { '+': 'ư' },
                'd': { 'd': 'đ' }
            },
            tones: { "'": 'á', '`': 'à', '?': 'ả', '~': 'ã', '.': 'ạ' }
        }
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

    const COMBINED_MAP = {
        'â': { s: 'ấ', f: 'ầ', r: 'ẩ', x: 'ẫ', j: 'ậ', '1': 'ấ', '2': 'ầ', '3': 'ẩ', '4': 'ẫ', '5': 'ậ', "'": 'ấ', "`": 'ầ', "?": 'ẩ', "~": 'ẫ', ".": 'ậ' },
        'ă': { s: 'ắ', f: 'ằ', r: 'ẳ', x: 'ẵ', j: 'ặ', '1': 'ắ', '2': 'ằ', '3': 'ẳ', '4': 'ẵ', '5': 'ặ', "'": 'ắ', "`": 'ằ', "?": 'ẳ', "~": 'ẵ', ".": 'ậ' },
        'ê': { s: 'ế', f: 'ề', r: 'ể', x: 'ễ', j: 'ệ', '1': 'ế', '2': 'ề', '3': 'ể', '4': 'ễ', '5': 'ệ', "'": 'ế', "`": 'ề', "?": 'ể', "~": 'ễ', ".": 'ậ' },
        'ô': { s: 'ố', f: 'ồ', r: 'ổ', x: 'ỗ', j: 'ộ', '1': 'ố', '2': 'ồ', '3': 'ổ', '4': 'ỗ', '5': 'ộ', "'": 'ố', "`": 'ồ', "?": 'ổ', "~": 'ỗ', ".": 'ậ' },
        'ơ': { s: 'ớ', f: 'ờ', r: 'ở', x: 'ỡ', j: 'ợ', '1': 'ớ', '2': 'ờ', '3': 'ở', '4': 'ỡ', '5': 'ợ', "'": 'ớ', "`": 'ờ', "?": 'ở', "~": 'ỡ', ".": 'ậ' },
        'ư': { s: 'ứ', f: 'ừ', r: 'ử', x: 'ữ', j: 'ự', '1': 'ứ', '2': 'ừ', '3': 'ử', '4': 'ữ', '5': 'ự', "'": 'ứ', "`": 'ừ', "?": 'ử', "~": 'ữ', ".": 'ậ' }
    };

    const BASIC_TONE_MAP = {
        'a': { s: 'á', f: 'à', r: 'ả', x: 'ã', j: 'ạ', '1': 'á', '2': 'à', '3': 'ả', '4': 'ã', '5': 'ạ', "'": 'á', "`": 'à', "?": 'ả', "~": 'ã', ".": 'ạ' },
        'e': { s: 'é', f: 'è', r: 'ẻ', x: 'ẽ', j: 'ẹ', '1': 'é', '2': 'è', '3': 'ẻ', '4': 'ẽ', '5': 'ẹ', "'": 'é', "`": 'è', "?": 'ẻ', "~": 'ẽ', ".": 'ẹ' },
        'i': { s: 'í', f: 'ì', r: 'ỉ', x: 'ĩ', j: 'ị', '1': 'í', '2': 'ì', '3': 'ỉ', '4': 'ĩ', '5': 'ị', "'": 'í', "`": 'ì', "?": 'ỉ', "~": 'ĩ', ".": 'ị' },
        'o': { s: 'ó', f: 'ò', r: 'ỏ', x: 'õ', j: 'ọ', '1': 'ó', '2': 'ò', '3': 'ỏ', '4': 'õ', '5': 'ọ', "'": 'ó', "`": 'ò', "?": 'ỏ', "~": 'õ', ".": 'ọ' },
        'u': { s: 'ú', f: 'ù', r: 'ủ', x: 'ũ', j: 'ụ', '1': 'ú', '2': 'ù', '3': 'ủ', '4': 'ũ', '5': 'ụ', "'": 'ú', "`": 'ù', "?": 'ủ', "~": 'ũ', ".": 'ụ' },
        'y': { s: 'ý', f: 'ỳ', r: 'ỷ', x: 'ỹ', j: 'ỵ', '1': 'ý', '2': 'ỳ', '3': 'ỷ', '4': 'ỹ', '5': 'ỵ', "'": 'ý', "`": 'ỳ', "?": 'ỷ', "~": 'ỹ', ".": 'y.' }
    };

    function getBase(char) {
        return REVERSE_MAP[char.toLowerCase()] || char.toLowerCase();
    }

    function findToneVowel(word) {
        const lower = word.toLowerCase();
        const vowelsFound = [];
        for (let i = 0; i < word.length; i++) {
            if (VOWELS.includes(getBase(lower[i]))) {
                vowelsFound.push(i);
            }
        }
        if (vowelsFound.length === 0) return -1;
        if (vowelsFound.length === 1) return vowelsFound[0];
        for (let idx of vowelsFound) {
            if (['ê', 'ô'].includes(lower[idx])) return idx;
        }
        if (vowelsFound.length === 2) {
            const pair = getBase(lower[vowelsFound[0]]) + getBase(lower[vowelsFound[1]]);
            if (['oa', 'oe', 'uy', 'ue'].includes(pair)) return vowelsFound[1];
            return vowelsFound[0];
        }
        if (vowelsFound.length === 3) return vowelsFound[1];
        return vowelsFound[vowelsFound.length - 1];
    }

    function processWord(word, key) {
        if (currentMode === MODES.OFF) return word + key;
        const rule = RULES[currentMode];
        const lastChar = word[word.length - 1];
        
        // Handle modifiers
        if (lastChar && rule.modifiers[lastChar.toLowerCase()] && rule.modifiers[lastChar.toLowerCase()][key.toLowerCase()]) {
            const isUpper = lastChar === lastChar.toUpperCase();
            const newChar = rule.modifiers[lastChar.toLowerCase()][key.toLowerCase()];
            return word.slice(0, -1) + (isUpper ? newChar.toUpperCase() : newChar);
        }

        // Handle tones
        if (rule.tones[key.toLowerCase()]) {
            const toneIdx = findToneVowel(word);
            if (toneIdx !== -1) {
                const target = word[toneIdx];
                const targetLower = target.toLowerCase();
                const isUpper = target === target.toUpperCase();
                let newChar = null;
                
                if (COMBINED_MAP[targetLower]) {
                    newChar = COMBINED_MAP[targetLower][key.toLowerCase()];
                } else {
                    const base = getBase(targetLower);
                    if (BASIC_TONE_MAP[base]) {
                        newChar = BASIC_TONE_MAP[base][key.toLowerCase()];
                    }
                }

                if (newChar) {
                    return word.slice(0, toneIdx) + (isUpper ? newChar.toUpperCase() : newChar) + word.slice(toneIdx + 1);
                }
            }
        }

        return word + key;
    }

    return {
        setMode: (mode) => { if (Object.values(MODES).includes(mode)) currentMode = mode; },
        getMode: () => currentMode,
        process: (currentText, key, selectionStart) => {
            if (currentMode === MODES.OFF) return null;
            
            const before = currentText.slice(0, selectionStart);
            const after = currentText.slice(selectionStart);
            
            // Find last word boundary
            const match = before.match(/(\S+)$/);
            if (!match) return before + key + after;

            const word = match[1];
            const prefix = before.slice(0, -word.length);
            const newWord = processWord(word, key);
            
            if (newWord === word + key) return null; // No change made by IME
            return prefix + newWord + after;
        }
    };
})();

export default VNTYPING;
