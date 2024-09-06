// 摩尔斯电码表,可自行添加
const morseCodeMap = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
    ' ': '/', '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--',
    ':': '---...', ';': '-.-.-.', '\'': '.----.', '"': '.-..-.', '(': '-.--.',
    ')': '-.--.-', '&': '.-...', '+': '.-.-.', '-': '-....-', '/': '-..-.',
    '=': '-...-', '_': '..--.-', '@': '.--.-.'
};

const reverseMorseCodeMap = Object.entries(morseCodeMap).reduce((acc, [char, morse]) => {
    acc[morse] = char;
    return acc;
}, {});

export function encodeToMorse(msg) {
    return msg.split('').map(char => morseCodeMap[char.toUpperCase()] || char).join(' ');
}

export function decodeFromMorse(morseStr) {
    return morseStr.split(' ').map(morse => reverseMorseCodeMap[morse] || morse).join('');
}

export class MorsePlugin extends plugin {
    constructor() {
        super({
            name: 'morse',
            dsc: '摩尔斯电码加密和解密',
            event: 'message',
            priority: 6,
            rule: [
                {
                    reg: '^#?摩尔斯编码\\s*(.+)',
                    fnc: 'encodeToMorseHandler'
                },
                {
                    reg: '^#?摩尔斯解码\\s*(.+)',
                    fnc: 'decodeFromMorseHandler'
                }
            ]
        });
    }

    async encodeToMorseHandler(e) {
        let msg = e.msg.match(/^#?摩尔斯编码\s*(.+)/)[1].trim();
        const encodedMsg = encodeToMorse(msg);
        try {
            await e.reply(`编码结果: ${encodedMsg}`, true);
        } catch (error) {
            await e.reply(`Error: ${error.message}`, true);
        }
    }

    async decodeFromMorseHandler(e) {
        let msg = e.msg.match(/^#?摩尔斯解码\s*(.+)/)[1].trim();
        const decodedMsg = decodeFromMorse(msg);
        try {
            await e.reply(`解码结果: ${decodedMsg}`);
        } catch (error) {
            await e.reply(`Error: ${error.message}`);
        }
    }
}
