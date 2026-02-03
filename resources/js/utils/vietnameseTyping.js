/**
 * Reusable Vietnamese Typing Input Library
 *
 * This library encapsulates core logic from VNTYPING for Vietnamese input processing.
 * Designed for integration into ReactJS frontend.
 *
 * Features:
 * - Buffer management for typed characters
 * - Vietnamese character mapping and conversion
 * - Speller state management and control flow
 * - Public API for key handling buffer control
 */
const VNTYPING = (() => {
    // Constants
    const CHAR_0x80 = String.fromCharCode(128);
    const vowels = "AIUEOYaiueoy";
    const separators = " !@#$%^&*()_+=-{}[]|\\:;\"'<>,.?/~`\r\n";

    // Vietnamese Unicode mappings (simplified for brevity)
    const vn_A0 = [65,193,192,7842,195,7840];
    const vn_a0 = [97,225,224,7843,227,7841];
    // ... (other mappings should be included here as needed)

    // Buffer and state
    let buffer = [];
    let off = 0;
    let dirty = false;

    // Speller state
    const Speller = {
        enabled: true,
        position: -1,
        count: 0,
        vowels: [],
        lasts: [],
        Set(position, char) {
            this.vowels[this.count] = this.position;
            this.lasts[this.count++] = char;
            this.position = position;
        },
        Clear() {
            this.position = -1;
            this.count = 0;
        },
        Last() {
            return this.lasts[this.count - 1];
        },
        Activate() {
            this.enabled = true;
        },
        Deactivate() {
            this.enabled = false;
        },
        Toggle() {
            this.enabled = !this.enabled;
        }
    };

    // Utility functions
    function CharIsUI(char) {
        // Placeholder for UI char check
        return -1; // Simplified
    }

    function CharPriorityCompare(char1, char2) {
        // Placeholder for priority comparison
        return 0; // Simplified
    }

    function SetCharAt(index, charCode) {
        buffer[index] = String.fromCharCode(charCode);
    }

    // Clear buffer
    function ClearBuffer() {
        off = 0;
        buffer = [];
        Speller.Clear();
    }

    // Append character to buffer with logic checks
    function Append(position, prevChar, newChar) {
        // Simplified logic: add character if not separator
        if (separators.indexOf(newChar) >= 0) {
            ClearBuffer();
            return;
        }
        if (Speller.enabled && !off) {
            // Example of vowel handling logic simplified
            const vowelIndex = vowels.indexOf(newChar);
            if (vowelIndex >= 0) {
                if (Speller.position < 0) {
                    Speller.Set(position, newChar);
                } else {
                    if (position - Speller.position > 1) {
                        off = position;
                    } else {
                        Speller.Set(position, newChar);
                    }
                }
            }
        }
        buffer.push(newChar);
    }

    // Add key input and process Vietnamese character conversion
    function AddKey(char) {
        if (!buffer.length || off !== 0) {
            Append(0, '', char);
            return -1;
        }
        // Simplified: just append for now
        Append(buffer.length, buffer[buffer.length - 1], char);
        return buffer.length - 1;
    }

    // Handle backspace
    function BackSpace() {
        if (buffer.length <= 0) {
            dirty = true;
            return;
        }
        buffer.pop();
        if (buffer.length === Speller.position) {
            Speller.position = Speller.vowels[--Speller.count];
        }
        if ((off < 0 && !buffer.length) || buffer.length <= off) {
            off = 0;
        }
    }

    // Public API
    return {
        buffer,
        Speller,
        AddKey,
        BackSpace,
        ClearBuffer,
        Append,
        ActivateSpeller: () => Speller.Activate(),
        DeactivateSpeller: () => Speller.Deactivate(),
        ToggleSpeller: () => Speller.Toggle(),
        GetBufferString: () => buffer.join(''),
        IsSpellerEnabled: () => Speller.enabled,
    };
})();

export default VNTYPING;
