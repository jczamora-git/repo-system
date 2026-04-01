async function mountComponent(targetId, componentPath) {
    const target = document.getElementById(targetId);
    if (!target) return;

    try {
        const response = await fetch(componentPath);
        if (!response.ok) return;
        target.innerHTML = await response.text();
    } catch (_) {
        // Keep page usable even if component fails to load.
    }
}

async function initLRMSDropdown() {
    const dropdown = document.getElementById('lrmsDropdown');
    const menu = document.getElementById('lrmsMenu');

    if (!dropdown || !menu) return;

    try {
        const response = await fetch('data.json');
        const data = await response.json();

        // Populate dropdown with categories
        menu.innerHTML = '';
        if (data.categories && data.categories.length > 0) {
            data.categories.forEach((category) => {
                const link = document.createElement('a');
                link.href = `material-path.html?category=${category.id}`;
                link.textContent = category.name;
                link.role = 'menuitem';
                menu.appendChild(link);
            });
        }

        const closeDropdown = () => {
            menu.classList.remove('active');
            dropdown.setAttribute('aria-expanded', 'false');
        };

        const openDropdown = () => {
            menu.classList.add('active');
            dropdown.setAttribute('aria-expanded', 'true');
        };

        // Toggle dropdown on click
        dropdown.addEventListener('click', (e) => {
            e.preventDefault();
            if (menu.classList.contains('active')) {
                closeDropdown();
            } else {
                openDropdown();
            }
        });

        // Close dropdown when clicking on a menu item
        menu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                closeDropdown();
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown-container')) {
                closeDropdown();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeDropdown();
            }
        });
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

function initMobileTopNav() {
    const nav = document.querySelector('.mock-topnav');
    const toggle = document.getElementById('topnavToggle');
    const menu = document.getElementById('topnavMenu');

    if (!nav || !toggle || !menu) return;

    const closeMenu = () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        // Also close any open dropdowns
        const lrmsMenu = document.getElementById('lrmsMenu');
        const lrmsDropdown = document.getElementById('lrmsDropdown');
        if (lrmsMenu) {
            lrmsMenu.classList.remove('active');
        }
        if (lrmsDropdown) {
            lrmsDropdown.setAttribute('aria-expanded', 'false');
        }
    };

    toggle.addEventListener('click', () => {
        const willOpen = !nav.classList.contains('open');
        nav.classList.toggle('open', willOpen);
        toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    // Close menu when clicking on non-dropdown links
    nav.querySelectorAll('.topnav-links > a:not(.dropdown-toggle)').forEach((link) => {
        link.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 760) closeMenu();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await mountComponent('topNavMount', 'components/topnav.html');
    await mountComponent('footerMount', 'components/footer.html');
    await initLRMSDropdown();
    initMobileTopNav();
});
