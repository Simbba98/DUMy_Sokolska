const https = require('https');
https.get('https://docs.google.com/spreadsheets/d/1z6RZsAZC8hVF5W9g4F2NOdpuOSAKHI9LJMrB6TYwzIQ/edit', res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
        // Look for the initialization JSON
        const match = d.match(/var bootstrapData = ({.*});/);
        if (match) {
            try {
                const data = JSON.parse(match[1]);
                console.log("Bootstrap data found!");
            } catch (e) {
                console.log("Could not parse bootstrapData");
            }
        }
        
        // Alternatively, just dump all occurrences of "gid":
        const matches = [...d.matchAll(/\["([^"]+)",(\d+)\]/g)];
        console.log(matches.slice(0, 15).map(m => m[1] + " => " + m[2]));
    });
});
