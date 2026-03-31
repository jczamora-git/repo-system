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

document.addEventListener('DOMContentLoaded', () => {
    mountComponent('topNavMount', 'components/topnav.html');
    mountComponent('footerMount', 'components/footer.html');
});
