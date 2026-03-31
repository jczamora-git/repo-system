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

function initMobileTopNav() {
    const nav = document.querySelector('.mock-topnav');
    const toggle = document.getElementById('topnavToggle');
    const menu = document.getElementById('topnavMenu');

    if (!nav || !toggle || !menu) return;

    const closeMenu = () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', () => {
        const willOpen = !nav.classList.contains('open');
        nav.classList.toggle('open', willOpen);
        toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    nav.querySelectorAll('.topnav-links a').forEach((link) => {
        link.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 760) closeMenu();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await mountComponent('topNavMount', 'components/topnav.html');
    await mountComponent('footerMount', 'components/footer.html');
    initMobileTopNav();
});
