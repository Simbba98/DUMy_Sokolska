document.addEventListener('DOMContentLoaded', () => {
    // 1. Render Materials immediately
    renderMaterials();

    const searchInput = document.getElementById('searchInput');
    // Get cards AFTER rendering is done
    const cards = document.querySelectorAll('.card');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            // Scroll to top when searching
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            cards.forEach(card => {
                const text = card.getAttribute('data-search-text') || '';
                if (text.includes(searchTerm)) {
                    card.style.display = 'flex'; // Use flex because of classic view styling
                } else {
                    card.style.display = 'none';
                }
            });

            // Hide empty subcategories and categories
            document.querySelectorAll('.subcategory-group').forEach(group => {
                const visibleCards = group.querySelectorAll('.card[style="display: flex;"], .card:not([style*="display: none"])');
                group.style.display = visibleCards.length > 0 ? 'block' : 'none';
            });

            document.querySelectorAll('.category-section').forEach(section => {
                const visibleGroups = section.querySelectorAll('.subcategory-group[style="display: block;"], .subcategory-group:not([style*="display: none"])');
                section.style.display = visibleGroups.length > 0 ? 'block' : 'none';
            });
        });
    }

    // Theme functionality (Dark/Light mode)
    const themeToggle = document.getElementById('themeToggle');
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
    
    const currentTheme = localStorage.getItem("theme");
    if (currentTheme == "dark") {
        document.body.classList.add("dark-mode");
    } else if (currentTheme == "light") {
        document.body.classList.remove("dark-mode");
    } else if (prefersDarkScheme.matches) {
        document.body.classList.add("dark-mode");
    }

    if (themeToggle) {
        themeToggle.addEventListener("click", function () {
            document.body.classList.toggle("dark-mode");
            let theme = "light";
            if (document.body.classList.contains("dark-mode")) {
                theme = "dark";
            }
            localStorage.setItem("theme", theme);
        });
    }

    // Style functionality (Classic/Modern view)
    const styleToggle = document.getElementById('style-toggle');
    const currentStyle = localStorage.getItem("viewStyle");
    if (currentStyle === "classic") {
        document.body.classList.add("classic-view");
    } else {
        document.body.classList.remove("classic-view");
    }

    if (styleToggle) {
        styleToggle.addEventListener("click", function() {
            document.body.classList.toggle("classic-view");
            let style = "modern";
            if (document.body.classList.contains("classic-view")) {
                style = "classic";
            }
            localStorage.setItem("viewStyle", style);
        });
    }

    // Welcome Modal Logic
    const welcomeModal = document.getElementById('welcome-modal');
    const btnClassic = document.getElementById('btn-classic');
    const btnModern = document.getElementById('btn-modern');

    if (welcomeModal && !localStorage.getItem('welcomeShown')) {
        welcomeModal.classList.add('active');
        
        btnClassic.addEventListener('click', () => {
            document.body.classList.add('classic-view');
            localStorage.setItem("viewStyle", "classic");
            closeModal();
        });

        btnModern.addEventListener('click', () => {
            document.body.classList.remove('classic-view');
            localStorage.setItem("viewStyle", "modern");
            closeModal();
        });
    }

    function closeModal() {
        welcomeModal.classList.remove('active');
        localStorage.setItem('welcomeShown', 'true');
    }

    function renderMaterials() {
        const container = document.getElementById('materials-container');
        if (!container || typeof materialsData === 'undefined') return;

        let html = '';
        materialsData.forEach(category => {
            html += `
            <section id="${category.id}" class="category-section">
                <h2 class="category-title">${category.title}</h2>
                <div class="category-content">
                    ${category.subcategories.map(sub => `
                    <div class="subcategory-group">
                        <h3 class="subcategory-title">${sub.title}</h3>
                        <div class="grid-container">
                            ${sub.items.map(item => `
                            <div class="card" data-search-text="${item.searchText.toLowerCase()}">
                                <h3 class="card-title">${item.title}</h3>
                                <p class="card-subtitle">${item.subtitle}</p>
                                <div style="margin-top: auto;">
                                    <a class="card-link" href="${item.link}" target="_blank" rel="noopener noreferrer">
                                        <span class="modern-link-text">Zobrazit materiál</span>
                                        <span class="classic-link-text">${item.classicLinkText}</span>
                                    </a>
                                </div>
                            </div>
                            `).join('')}
                        </div>
                    </div>
                    `).join('')}
                </div>
            </section>
            `;
        });
        container.innerHTML = html;
    }
});
