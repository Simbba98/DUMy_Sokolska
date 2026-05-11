const fs = require('fs');
const https = require('https');

https.get('https://docs.google.com/spreadsheets/d/1z6RZsAZC8hVF5W9g4F2NOdpuOSAKHI9LJMrB6TYwzIQ/export?format=csv&gid=0', res => {
    if (res.statusCode > 300) {
        https.get(res.headers.location, res2 => {
            let data = '';
            res2.on('data', chunk => data += chunk);
            res2.on('end', () => {
                const lines = data.split('\n').slice(1); // skip header
                const catSubcatMap = {};
                lines.forEach(line => {
                    const parts = line.split(',');
                    const filename = parts[0].replace(/^"|"$/g, '').trim();
                    let category = (parts[3] || '').replace(/^"|"$/g, '').trim();
                    if (!category) category = 'Ostatní soubory';
                    
                    const match = filename.match(/VY_32_INOVACE_(\d{2})/i);
                    const prefix = match ? `VY_32_INOVACE_${match[1]}` : 'Ostatní';

                    if (!catSubcatMap[category]) catSubcatMap[category] = new Set();
                    catSubcatMap[category].add(prefix);
                });
                
                for (const cat in catSubcatMap) {
                    console.log(`[${cat}]:`, Array.from(catSubcatMap[cat]));
                }
            });
        });
    }
});
