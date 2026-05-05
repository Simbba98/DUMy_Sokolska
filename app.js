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
});
