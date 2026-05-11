const fs = require('fs');

const html = fs.readFileSync('old.html', 'utf-8');
const lines = html.split('\n');

const mapping = {};
let currentPrefix1 = null;
let currentPrefix2 = null;
let currentCat1 = null;
let currentCat2 = null;

const regex = /<strong>---(.*?)---<\/strong>/;
const linkRegex = /VY_32_INOVACE_(\d{2})/;

for (const line of lines) {
    if (line.includes('<tr>')) continue;
    if (line.includes('---')) {
        let match = line.match(regex);
        if (match) {
            console.log("Found title:", match[1]);
        }
    }
}
