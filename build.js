const fs = require('fs');
const https = require('https');

const url = 'https://docs.google.com/spreadsheets/d/1z6RZsAZC8hVF5W9g4F2NOdpuOSAKHI9LJMrB6TYwzIQ/export?format=csv&gid=0';

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            https.get(res.headers.location, (res2) => {
                let data2 = '';
                res2.on('data', chunk => data2 += chunk);
                res2.on('end', () => processData(data2));
            });
        } else {
            processData(data);
        }
    });
});

function parseCSV(text) {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    const result = [];
    
    for(let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        let obj = {};
        let cols = [];
        let inQuote = false;
        let currToken = '';
        for (let char of lines[i]) {
            if (char === '"') inQuote = !inQuote;
            else if (char === ',' && !inQuote) {
                cols.push(currToken);
                currToken = '';
            } else {
                currToken += char;
            }
        }
        cols.push(currToken);

        headers.forEach((h, idx) => {
            obj[h] = (cols[idx] || '').trim();
        });
        result.push(obj);
    }
    return result;
}

function processData(csvText) {
    const data = parseCSV(csvText);
    
    const mainItems = [];
    const attachments = [];

    // Rozdělení na hlavní materiály a přílohy (Excel)
    data.forEach(item => {
        const file = (item['Název souboru'] || '').trim().toLowerCase();
        if (file.endsWith('.xlsx') || file.endsWith('.xlsm') || file.endsWith('.xls')) {
            attachments.push(item);
        } else {
            item.attachments = [];
            mainItems.push(item);
        }
    });

    // Přiřazení příloh k hlavním materiálům
    attachments.forEach(att => {
        const file = (att['Název souboru'] || '').trim();
        // Extrakce základu názvu: VY_32_INOVACE_38-13-01.xlsx -> VY_32_INOVACE_38-13
        const baseName = file.replace(/(-\d{2})?\.[^.]+$/i, '');
        
        const mainItem = mainItems.find(m => {
            const mFile = (m['Název souboru'] || '').trim();
            const mBase = mFile.replace(/\.[^.]+$/i, '');
            return mBase === baseName;
        });

        if (mainItem) {
            mainItem.attachments.push(att);
        } else {
            att.attachments = [];
            mainItems.push(att);
        }
    });

    const subcategoryMap = {
        '04': 'Základy ekologie',
        '05': 'Soustavy člověka',
        '06': 'Přírodní zdroje',
        '46': 'EMCO Sinumerik 810 M - frézování',
        '47': 'AlphaCAM - soustružení',
        '48': 'AlphaCAM - frézování',
        '49': 'EMCO Sinumerik 810 T - soustružení',
        '50': 'SolidCAM - soustružení',
        '51': 'SolidCAM - frézování',
        '40': 'Stejnosměrné motory',
        '41': 'Střídavé motory',
        '42': 'Ostatní speciální motory',
        '43': 'Elektrický proud stejnosměrný',
        '44': 'Magnetizmus',
        '45': 'Elektrický proud střídavý',
        '04': 'Základy ekologie',
        '01': 'Funkce',
        '02': 'Planimetrie, Stereometrie',
        '03': 'Kombinatorika, PST, STAT',
        '07': 'Dopravní stroje a zařízení',
        '08': 'Pístové stroje',
        '09': 'Lopatkové stroje',
        '10': 'Mechanika, statika',
        '11': 'Mechanika, pružnost a pevnost',
        '12': 'Mechanika, kinematika',
        '13': 'Spoje a spojovací součásti',
        '14': 'Součásti točivého a přímočarého pohybu',
        '15': 'Převody a mechanizmy',
        '16': 'Základy parametrického modelování',
        '17': 'Pokročilé metody parametrického modelování',
        '18': 'Uživatelská nastavení parametrických modelářů, využití doplňkových modulů',
        '19': 'Obrábění',
        '20': 'Tváření',
        '21': 'Svařování',
        '22': 'Měřeni fyzikálních a technických veličin',
        '23': 'Kontrola a měření strojních součástí a jejich polotovarů',
        '24': 'Kontrola a měření strojních zařízení',
        '25': 'Algoritmizace úloh',
        '26': 'Základy programování',
        '27': 'Tvorba aplikací na platformě Windows',
        '28': 'Základy výpočetní techniky',
        '29': 'Technické vybavení',
        '30': 'Počítačová grafika',
        '31': 'Počítačová grafika - Corel Draw',
        '32': 'Databáze',
        '33': 'Tabulkový procesor (část)',
        '34': 'Počítačové sítě',
        '35': 'Tvorba webových stránek',
        '36': 'Design a vzhledové vlastnosti webových stránek',
        '37': 'Textový editor',
        '38': 'Tabulkový procesor',
        '39': 'Základní služby sítě internet'
    };

    const categories = {};
    mainItems.forEach(item => {
        const catRaw = (item['Kategorie'] || '').trim();
        const cat = catRaw ? catRaw : 'Ostatní soubory';
        
        // Extract subcategory
        const file = (item['Název souboru'] || '').trim();
        const subCatMatch = file.match(/VY_32_INOVACE_(\d{2})/i);
        let subCat = 'Ostatní';
        
        if (subCatMatch) {
            const num = subCatMatch[1];
            if (subcategoryMap[num]) {
                subCat = subcategoryMap[num];
            } else {
                subCat = `VY_32_INOVACE_${num}`;
            }
        }

        if (!categories[cat]) categories[cat] = {};
        if (!categories[cat][subCat]) categories[cat][subCat] = [];
        categories[cat][subCat].push(item);
    });

    const sortedCats = Object.keys(categories).sort((a, b) => {
        if (a.toUpperCase() === 'OSTATNÍ' || a.toUpperCase() === 'OSTATNÍ SOUBORY') return 1;
        if (b.toUpperCase() === 'OSTATNÍ' || b.toUpperCase() === 'OSTATNÍ SOUBORY') return -1;
        return a.localeCompare(b, 'cs');
    });
    let navHtml = '';
    let sectionsHtml = '';

    sortedCats.forEach(cat => {
        const catId = cat.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        navHtml += `<li><a href="#${catId}">${cat}</a></li>\n`;

        sectionsHtml += `\n        <section id="${catId}" class="category-section">
            <h2 class="category-title">${cat}</h2>
            <div class="category-content">\n`;

        // Sort subcategories
        const sortedSubCats = Object.keys(categories[cat]).sort((a, b) => a.localeCompare(b, 'cs'));
        
        sortedSubCats.forEach(subCat => {
            sectionsHtml += `                <div class="subcategory-group">
                    <h3 class="subcategory-title">${subCat}</h3>
                    <div class="grid-container">\n`;
            
            // Sort items in subcategory by file name
            const sortedItems = categories[cat][subCat].sort((a, b) => {
                const fa = (a['Název souboru'] || '').toLowerCase();
                const fb = (b['Název souboru'] || '').toLowerCase();
                return fa.localeCompare(fb, 'cs');
            });

            sortedItems.forEach(item => {
                sectionsHtml += createCardHtml(item);
            });
            
            sectionsHtml += `                    </div>
                </div>\n`;
        });

        sectionsHtml += `            </div>
        </section>\n`;
    });

    const template = `<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Materiály DUMy</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header class="glass-header">
        <div class="header-content">
            <h1>Materiály DUMy</h1>
            <nav id="navbar">
                <ul>
                    ${navHtml}
                </ul>
            </nav>
            <div class="search-container" style="display: flex; align-items: center; gap: 1rem;">
                <input type="text" id="searchInput" placeholder="Hledat v názvech souborů...">
                <button id="style-toggle" class="icon-btn" title="Přepnout moderní/klasický vzhled" aria-label="Toggle style">
                    <svg class="icon-modern" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect width="7" height="7" x="3" y="3" rx="1"></rect>
                        <rect width="7" height="7" x="14" y="3" rx="1"></rect>
                        <rect width="7" height="7" x="14" y="14" rx="1"></rect>
                        <rect width="7" height="7" x="3" y="14" rx="1"></rect>
                    </svg>
                    <svg class="icon-classic" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="8" x2="21" y1="6" y2="6"></line>
                        <line x1="8" x2="21" y1="12" y2="12"></line>
                        <line x1="8" x2="21" y1="18" y2="18"></line>
                        <line x1="3" x2="3.01" y1="6" y2="6"></line>
                        <line x1="3" x2="3.01" y1="12" y2="12"></line>
                        <line x1="3" x2="3.01" y1="18" y2="18"></line>
                    </svg>
                </button>
                <button id="themeToggle" class="icon-btn" title="Přepnout tmavý/světlý režim" aria-label="Toggle theme">
                    <svg class="icon-sun" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="4"></circle>
                        <path d="M12 2v2"></path>
                        <path d="M12 20v2"></path>
                        <path d="m4.93 4.93 1.41 1.41"></path>
                        <path d="m17.66 17.66 1.41 1.41"></path>
                        <path d="M2 12h2"></path>
                        <path d="M20 12h2"></path>
                        <path d="m6.34 17.66-1.41 1.41"></path>
                        <path d="m19.07 4.93-1.41 1.41"></path>
                    </svg>
                    <svg class="icon-moon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"></path>
                    </svg>
                </button>
            </div>
        </div>
    </header>

    <!-- Welcome Modal -->
    <div id="welcome-modal" class="modal-overlay">
        <div class="modal-content">
            <h2>Nové DUMy</h2>
            <p>Vážení uživatelé,</p>
            <p>v souvislosti s ukončením původního portálu DUMy Sokolská jsem vytvořil tento nezávislý rozcestník, aby výukové materiály zůstaly nadále snadno dostupné. Stránky můžete využívat v moderním uspořádání, případně si pomocí tlačítka vpravo nahoře přepnout design do původního, klasického vzhledu.</p>
            <p>Autorská práva k veškerým souborům plně náleží škole. Tento web slouží výhradně jako usnadnění přístupu ke studijním podkladům.</p>
            <p><em>Šimon Marák – Maturant 2026</em></p>
            <div class="modal-buttons">
                <button id="btn-classic" class="btn btn-secondary">Přepnout do klasického vzhledu</button>
                <button id="btn-modern" class="btn btn-primary">Rozumím (ponechat moderní)</button>
            </div>
        </div>
    </div>

    <main class="container">
        <div id="content">
            ${sectionsHtml}
        </div>
    </main>

    <footer class="glass-footer">
        <div class="footer-content">
            <h2>Přidat nový odkaz</h2>
            <iframe src="https://docs.google.com/forms/d/e/1FAIpQLSe6ltPuCF238QgkEJuDXcMuU3PmOZw51qNlx06xUNaI9Wnxkg/viewform?embedded=true" width="100%" height="600" frameborder="0" marginheight="0" marginwidth="0">Načítání…</iframe>
        </div>
        <p class="footer-text">©2026 Šimon Marák | Vytvořil <a href="https://www.instagram.com/simon_ma.r/" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">Šimon Marák</a></p>
    </footer>

    <script src="app.js"></script>
</body>
</html>`;

    fs.writeFileSync('index.html', template);
    console.log('HTML successfully built from scratch!');
}

function createCardHtml(item) {
    const file = item['Název souboru'] || '';
    const title = item['Název'] || '';
    let url = item['Odkaz'] || '#';
    
    // Upravení odkazu z Google disku pro čistší zobrazení bez zbytečného UI
    if (url.includes('drive.google.com/file/d/')) {
        url = url.replace(/\/view.*$/, '/preview');
    }

    const searchText = (file + ' ' + title).toLowerCase();

    let subtitleHtml = '';
    if (title && file) {
        subtitleHtml = `<p class="card-subtitle">${file}</p>`;
    } else if (!title && !file) {
        subtitleHtml = `<p class="card-subtitle">Chybí název souboru</p>`;
    }

    let attachmentsHtml = '';
    if (item.attachments && item.attachments.length > 0) {
        attachmentsHtml = '<div class="attachments-list">';
        item.attachments.forEach(att => {
            let attUrl = att['Odkaz'] || '#';
            if (attUrl.includes('drive.google.com/file/d/')) {
                attUrl = attUrl.replace(/\/view.*$/, '/preview');
            }
            const attFile = att['Název souboru'] || 'Příloha';
            const extMatch = attFile.match(/\.([^.]+)$/);
            const ext = extMatch ? extMatch[1].toUpperCase() : 'SOUBOR';
            attachmentsHtml += `<a class="attachment-link" href="${attUrl}" target="_blank" rel="noopener noreferrer">📊 ${ext} (${attFile})</a>`;
        });
        attachmentsHtml += '</div>';
    }

    return `                <div class="card" data-search-text="${searchText.replace(/"/g, '&quot;')}">
                    <h3 class="card-title">${title || file || 'Neznámý soubor'}</h3>
                    ${subtitleHtml}
                    <div style="margin-top: auto;">
                        <a class="card-link" href="${url}" target="_blank" rel="noopener noreferrer">
                            <span class="modern-link-text">Zobrazit materiál</span>
                            <span class="classic-link-text">${file ? file.replace(/\.[^.]+$/, '') : 'Zobrazit materiál'}</span>
                        </a>
                        ${attachmentsHtml}
                    </div>
                </div>\n`;
}
