document.addEventListener('DOMContentLoaded', () => {
    // URL pro stažení CSV dat (Google Sheets Export)
    const csvUrl = 'https://docs.google.com/spreadsheets/d/1z6RZsAZC8hVF5W9g4F2NOdpuOSAKHI9LJMrB6TYwzIQ/export?format=csv';

    const loader = document.getElementById('loader');
    const contentDiv = document.getElementById('content');
    const navbar = document.getElementById('navbar');
    const searchInput = document.getElementById('searchInput');

    // Fetch and parse the CSV data using PapaParse
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            loader.classList.add('hidden');
            contentDiv.classList.remove('hidden');
            processData(results.data);
        },
        error: function(err) {
            loader.innerText = 'Nepodařilo se načíst data z Google Tabulky. Zkuste to prosím později.';
            console.error('PapaParse error:', err);
        }
    });

    // Helper: Mapování zkratek na hezčí názvy (pokud jsou k dispozici, jinak zůstane původní)
    const categoryNames = {
        'VYT': 'Výpočetní technika (VYT)',
        'STT, KOM': 'Strojírenství (STT, KOM)',
        'SPS, MEC, CAD': 'Strojírenství (SPS, MEC, CAD)',
        'MAT': 'Matematika (MAT)',
        'ELE': 'Elektrotechnika (ELE)',
        'CNC': 'Programování CNC (CNC)'
    };

    let allItems = [];

    function processData(data) {
        allItems = data;
        const categories = {};

        // Skupinování dat do kategorií
        data.forEach(item => {
            const catRaw = (item['Kategorie'] || '').trim();
            // Pokud nemá kategorii, dáme do 'Ostatní soubory'
            const cat = catRaw ? catRaw : 'Ostatní soubory';
            
            if (!categories[cat]) {
                categories[cat] = [];
            }
            categories[cat].push(item);
        });

        // Vygenerování navigačních odkazů a sekcí
        for (const [catCode, items] of Object.entries(categories)) {
            // Přeskočíme ostatní soubory (mají vlastní statickou sekci dole)
            if (catCode === 'Ostatní soubory') continue;

            const catDisplayName = categoryNames[catCode] || catCode;
            const sectionId = 'cat-' + catCode.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

            // 1. Přidat odkaz do navigace
            const navLink = document.createElement('a');
            navLink.href = '#' + sectionId;
            navLink.innerText = catDisplayName;
            navbar.appendChild(navLink);

            // 2. Vytvořit sekci pro kategorii
            const section = document.createElement('section');
            section.id = sectionId;
            section.className = 'category-section';

            const h2 = document.createElement('h2');
            h2.className = 'category-title';
            h2.innerText = catDisplayName;
            section.appendChild(h2);

            const grid = document.createElement('div');
            grid.className = 'cards-grid';

            // Vytvořit karty
            items.forEach(item => {
                grid.appendChild(createCard(item));
            });

            section.appendChild(grid);
            contentDiv.appendChild(section);
        }

        // Zpracování kategorie 'Ostatní soubory'
        if (categories['Ostatní soubory'] && categories['Ostatní soubory'].length > 0) {
            const ostatniSection = document.getElementById('ostatni-soubory');
            const ostatniGrid = document.getElementById('ostatni-grid');
            
            categories['Ostatní soubory'].forEach(item => {
                // Přidáme jen pokud má aspoň nějaký název nebo odkaz
                if(item['Název souboru'] || item['Název'] || item['Odkaz']) {
                    ostatniGrid.appendChild(createCard(item));
                }
            });
            ostatniSection.classList.remove('hidden');
        }

        // Setup vyhledávání
        setupSearch();
    }

    function createCard(item) {
        const file = item['Název souboru'] || '';
        const title = item['Název'] || '';
        const url = item['Odkaz'] || '#';

        const card = document.createElement('div');
        card.className = 'card';
        // Uložit text pro fulltext vyhledávání
        card.dataset.searchText = (file + ' ' + title).toLowerCase();

        // Titulek
        const h3 = document.createElement('h3');
        h3.className = 'card-title';
        h3.innerText = title || file || 'Neznámý soubor';
        card.appendChild(h3);

        // Podtitulek (Název souboru, pokud existuje 'Název')
        if (title && file) {
            const p = document.createElement('p');
            p.className = 'card-subtitle';
            p.innerText = file;
            card.appendChild(p);
        } else if (!title && !file) {
            const p = document.createElement('p');
            p.className = 'card-subtitle';
            p.innerText = 'Chybí název souboru';
            card.appendChild(p);
        }

        // Tlačítko
        const a = document.createElement('a');
        a.className = 'card-link';
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.innerText = 'Zobrazit materiál';
        card.appendChild(a);

        return card;
    }

    function setupSearch() {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const sections = document.querySelectorAll('.category-section');

            sections.forEach(section => {
                let hasVisibleCards = false;
                const cards = section.querySelectorAll('.card');
                
                cards.forEach(card => {
                    const text = card.dataset.searchText;
                    if (text.includes(query)) {
                        card.style.display = 'flex';
                        hasVisibleCards = true;
                    } else {
                        card.style.display = 'none';
                    }
                });

                // Skrýt celou sekci, pokud nemá žádnou viditelnou kartu
                if (hasVisibleCards) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
        });
    }
});
