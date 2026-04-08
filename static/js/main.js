document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const searchInput = document.getElementById('searchInput');
    const editBtn = document.getElementById('editBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeModal = document.getElementById('closeModal');
    const saveBtn = document.getElementById('saveBtn');
    const configJson = document.getElementById('configJson');

    const addCardBtn = document.getElementById('addCardBtn');
    const addCardModal = document.getElementById('addCardModal');
    const closeAddModal = document.getElementById('closeAddModal');
    const addCardForm = document.getElementById('addCardForm');
    const modalTitle = document.getElementById('modalTitle');

    // --- Search functionality ---
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.card-wrapper');

        cards.forEach(wrapper => {
            const card = wrapper.querySelector('.card');
            const title = card.getAttribute('data-title').toLowerCase();
            wrapper.style.display = title.includes(term) ? 'block' : 'none';
        });

        document.querySelectorAll('.category').forEach(category => {
            const visibleCards = category.querySelectorAll('.card-wrapper[style="display: block;"]');
            category.style.display = (visibleCards.length === 0 && term !== '') ? 'none' : 'block';
        });
    });

    // --- Modal Helpers ---
    const openModal = (modal) => modal.classList.add('active');
    const closeModalFunc = (modal) => {
        modal.classList.remove('active');
        if (modal === addCardModal) {
            addCardForm.reset();
            document.getElementById('originalTitle').value = '';
            document.getElementById('originalCategory').value = '';
            modalTitle.textContent = 'Add New Card';
        }
    };

    addCardBtn.addEventListener('click', () => openModal(addCardModal));
    closeAddModal.addEventListener('click', () => closeModalFunc(addCardModal));
    editBtn.addEventListener('click', async () => {
        const response = await fetch('/api/config');
        const data = await response.json();
        configJson.value = JSON.stringify(data, null, 2);
        openModal(settingsModal);
    });
    closeModal.addEventListener('click', () => closeModalFunc(settingsModal));

    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeModalFunc(settingsModal);
        if (e.target === addCardModal) closeModalFunc(addCardModal);
    });

    // --- Save Settings (JSON) ---
    saveBtn.addEventListener('click', async () => {
        try {
            const updatedConfig = JSON.parse(configJson.value);
            await saveConfig(updatedConfig);
        } catch (error) {
            alert('Invalid JSON format.');
        }
    });

    // --- Add/Edit Card Form ---
    addCardForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const categoryName = document.getElementById('cardCategory').value;
        const originalTitle = document.getElementById('originalTitle').value;
        const originalCategory = document.getElementById('originalCategory').value;

        const cardData = {
            title: document.getElementById('cardTitle').value,
            url: document.getElementById('cardUrl').value,
            icon: document.getElementById('cardIcon').value || 'favicon'
        };

        const config = await (await fetch('/api/config')).json();

        // If editing, remove old version
        if (originalTitle && originalCategory) {
            const oldCat = config.categories.find(c => c.name === originalCategory);
            if (oldCat) {
                oldCat.links = oldCat.links.filter(l => l.title !== originalTitle);
            }
        }

        // Add to new/existing category
        let category = config.categories.find(c => c.name === categoryName);
        if (category) {
            category.links.push(cardData);
        } else {
            config.categories.push({ name: categoryName, links: [cardData] });
        }

        // Clean up empty categories
        config.categories = config.categories.filter(c => c.links.length > 0);

        await saveConfig(config);
    });

    // --- Edit Card Button ---
    document.querySelectorAll('.edit-card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const { category, title, url, icon } = btn.dataset;
            
            document.getElementById('cardCategory').value = category;
            document.getElementById('cardTitle').value = title;
            document.getElementById('cardUrl').value = url;
            document.getElementById('cardIcon').value = icon;
            document.getElementById('originalTitle').value = title;
            document.getElementById('originalCategory').value = category;
            
            modalTitle.textContent = 'Edit Card';
            openModal(addCardModal);
        });
    });

    // --- Delete Card ---
    document.querySelectorAll('.delete-card').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const { category: catName, title } = btn.dataset;

            if (confirm(`Delete "${title}"?`)) {
                const config = await (await fetch('/api/config')).json();
                const category = config.categories.find(c => c.name === catName);
                if (category) {
                    category.links = category.links.filter(l => l.title !== title);
                    if (category.links.length === 0) {
                        config.categories = config.categories.filter(c => c.name !== catName);
                    }
                }
                await saveConfig(config);
            }
        });
    });

    async function saveConfig(config) {
        const response = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
        });
        if (response.ok) location.reload();
        else alert('Failed to save configuration.');
    }

    // --- Clock & Greeting ---
    function updateClock() {
        const now = new Date();
        document.getElementById('clock').textContent = now.toLocaleTimeString();
        document.getElementById('date').textContent = now.toLocaleDateString(undefined, { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });

        const hour = now.getHours();
        let greeting = 'Good Evening';
        if (hour < 12) greeting = 'Good Morning';
        else if (hour < 18) greeting = 'Good Afternoon';
        document.getElementById('greeting').textContent = greeting;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // --- Weather (Open-Meteo) ---
    async function fetchWeather() {
        try {
            // Get location via IP-API (Free, no key)
            const locRes = await fetch('http://ip-api.com/json');
            const loc = await locRes.json();
            
            // Get weather via Open-Meteo
            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current_weather=true`);
            const weather = await weatherRes.json();
            
            document.getElementById('temp').textContent = `${Math.round(weather.current_weather.temperature)}°C`;
            document.getElementById('condition').textContent = `In ${loc.city}`;
        } catch (e) {
            console.error('Weather error:', e);
            document.getElementById('condition').textContent = 'Weather unavailable';
        }
    }
    fetchWeather();

    // --- Health Checks ---
    async function checkHealth() {
        const dots = document.querySelectorAll('.status-dot');
        for (const dot of dots) {
            const url = dot.dataset.url;
            
            // Only ping local network links starting with 192
            const isLocal = url.includes('://192.') || url.includes('://localhost') || url.includes('.local');
            
            if (!isLocal) {
                dot.style.display = 'none';
                continue;
            }

            try {
                const res = await fetch(`/api/ping?url=${encodeURIComponent(url)}`);
                const data = await res.json();
                dot.className = `status-dot ${data.status}`;
            } catch (e) {
                dot.className = 'status-dot offline';
            }
        }
    }
    checkHealth();
    setInterval(checkHealth, 60000); // Check every minute

    // --- Drag and Drop (SortableJS) ---
    const gridContainers = document.querySelectorAll('.sortable-grid');
    gridContainers.forEach(grid => {
        new Sortable(grid, {
            group: 'cards',
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: saveOrder
        });
    });

    const categoriesContainer = document.getElementById('categoriesContainer');
    new Sortable(categoriesContainer, {
        animation: 150,
        handle: '.drag-handle-category',
        onEnd: saveOrder
    });

    async function saveOrder() {
        const config = { categories: [] };
        const categories = document.querySelectorAll('.category');
        
        categories.forEach(catEl => {
            const catName = catEl.dataset.category;
            const links = [];
            catEl.querySelectorAll('.card').forEach(cardEl => {
                links.push({
                    title: cardEl.dataset.title,
                    url: cardEl.dataset.url,
                    icon: cardEl.querySelector('i')?.dataset.lucide || 'favicon'
                });
            });
            config.categories.push({ name: catName, links });
        });

        await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
        });
    }
});
