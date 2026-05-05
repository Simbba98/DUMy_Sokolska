document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const sections = document.querySelectorAll('.category-section');

            sections.forEach(section => {
                let hasVisibleCards = false;
                const cards = section.querySelectorAll('.card');
                
                cards.forEach(card => {
                    const text = card.getAttribute('data-search-text') || '';
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

    // Dark mode toggle logic
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeToggle) themeToggle.innerText = '☀️';
    } else {
        if (themeToggle) themeToggle.innerText = '🌙';
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            let theme = 'light';
            if (document.body.classList.contains('dark-mode')) {
                theme = 'dark';
                themeToggle.innerText = '☀️';
            } else {
                themeToggle.innerText = '🌙';
            }
            localStorage.setItem('theme', theme);
        });
    }
});
