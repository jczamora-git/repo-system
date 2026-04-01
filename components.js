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
            menu.hidden = true;
            dropdown.setAttribute('aria-expanded', 'false');
        };

        const openDropdown = () => {
            menu.hidden = false;
            menu.classList.add('active');
            dropdown.setAttribute('aria-expanded', 'true');
        };

        // Default state is collapsed.
        closeDropdown();

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
            if (!e.target.closest('.dropdown-container') && !e.target.closest('#topnavToggle')) {
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

function initTopNavMobileTools() {
    const nav = document.querySelector('.mock-topnav');
    const searchShell = document.getElementById('topnavMobileSearch');
    const searchToggle = document.getElementById('topnavSearchToggle');
    const searchInput = document.getElementById('topnavSearchInput');

    if (!nav || !searchShell || !searchToggle || !searchInput) return;

    const hasUnifiedIndexSearch = Boolean(
        document.getElementById('mobileFilterToggle') &&
        document.getElementById('mobileUnifiedSearchInput')
    );

    let searchMaterials = [];
    let hasLoadedSearchData = false;
    let activeSuggestionIndex = -1;
    let currentSuggestions = [];

    const suggestionsPanel = document.createElement('div');
    suggestionsPanel.className = 'topnav-search-suggestions';
    searchShell.appendChild(suggestionsPanel);

    const escapeHtml = (value) => {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    const hideSuggestions = () => {
        suggestionsPanel.style.display = 'none';
        suggestionsPanel.innerHTML = '';
        activeSuggestionIndex = -1;
        currentSuggestions = [];
    };

    let breadcrumbActiveSuggestionIndex = -1;
    let breadcrumbCurrentSuggestions = [];

    const hideBreadcrumbSuggestions = () => {
        const panel = document.querySelector('.mobile-breadcrumb-suggestions');
        if (!panel) return;
        panel.style.display = 'none';
        panel.innerHTML = '';
        breadcrumbActiveSuggestionIndex = -1;
        breadcrumbCurrentSuggestions = [];
    };

    const applyBreadcrumbActiveSuggestion = () => {
        const panel = document.querySelector('.mobile-breadcrumb-suggestions');
        if (!panel) return;
        const options = panel.querySelectorAll('.mobile-breadcrumb-option');
        options.forEach((option) => option.classList.remove('active'));
        if (breadcrumbActiveSuggestionIndex >= 0 && options[breadcrumbActiveSuggestionIndex]) {
            options[breadcrumbActiveSuggestionIndex].classList.add('active');
        }
    };

    const applyActiveSuggestion = () => {
        const options = suggestionsPanel.querySelectorAll('.topnav-search-option');
        options.forEach((option) => option.classList.remove('active'));
        if (activeSuggestionIndex >= 0 && options[activeSuggestionIndex]) {
            options[activeSuggestionIndex].classList.add('active');
        }
    };

    const loadSearchData = async () => {
        if (hasLoadedSearchData) return;
        hasLoadedSearchData = true;
        try {
            const response = await fetch('data.json');
            if (!response.ok) return;
            const data = await response.json();
            searchMaterials = data.materials || [];
        } catch (_) {
            searchMaterials = [];
        }
    };

    const findMatches = (query) => {
        const q = query.trim().toLowerCase();
        if (!q) return [];

        return searchMaterials.filter((material) => {
            const searchable = `${material.title} ${material.subject} ${(material.tags || []).join(' ')}`.toLowerCase();
            return searchable.includes(q);
        }).slice(0, 6);
    };

    const renderSuggestions = (materials) => {
        currentSuggestions = materials;
        activeSuggestionIndex = -1;

        if (materials.length === 0) {
            hideSuggestions();
            return;
        }

        suggestionsPanel.innerHTML = materials
            .map((material, index) => {
                const gradeLabel = material.category === 'als' ? 'ALS' : `Grade ${material.grade}`;
                return `
                    <button type="button" class="topnav-search-option" data-index="${index}" data-id="${material.id}">
                        <div class="topnav-search-option-title">${escapeHtml(material.title)}</div>
                        <div class="topnav-search-option-meta">${escapeHtml(material.subject)} | ${escapeHtml(gradeLabel)}</div>
                    </button>
                `;
            })
            .join('');

        suggestionsPanel.style.display = 'block';
    };

    const navigateToMaterial = (materialId) => {
        if (!materialId) return;
        window.location.href = `view-material.html?id=${encodeURIComponent(materialId)}`;
    };

    const getPageSearchInput = () => {
        return (
            document.getElementById('searchInput') ||
            document.getElementById('pathSearchInput') ||
            document.getElementById('materialSearchInput')
        );
    };

    const closeSearch = () => {
        searchShell.classList.remove('search-open');
        nav.classList.remove('search-open');
        searchToggle.setAttribute('aria-expanded', 'false');
        hideSuggestions();
        searchInput.blur();
    };

    const openSearch = () => {
        searchShell.classList.add('search-open');
        nav.classList.add('search-open');
        searchToggle.setAttribute('aria-expanded', 'true');
        loadSearchData();
        window.setTimeout(() => searchInput.focus(), 80);
    };

    const openUnifiedIndexSearch = () => {
        const mobileFilterTrigger = document.getElementById('mobileFilterToggle');
        const unifiedInput = document.getElementById('mobileUnifiedSearchInput');

        if (!mobileFilterTrigger || !unifiedInput) return false;

        if (!document.body.classList.contains('mobile-filters-open')) {
            mobileFilterTrigger.click();
        }

        const pageSearch = getPageSearchInput();
        const currentValue = (pageSearch && pageSearch.value) || searchInput.value || '';
        unifiedInput.value = currentValue;
        unifiedInput.dispatchEvent(new Event('input', { bubbles: true }));
        window.setTimeout(() => unifiedInput.focus(), 80);
        return true;
    };

    const syncSearchValueToPage = (value, submit = false) => {
        const pageSearch = getPageSearchInput();
        if (!pageSearch) return;

        pageSearch.value = value;
        pageSearch.dispatchEvent(new Event('input', { bubbles: true }));

        if (submit) {
            const pathButton = document.getElementById('pathSearchBtn');
            const materialButton = document.getElementById('materialSearchBtn');

            if (pathButton) pathButton.click();
            if (materialButton) materialButton.click();
        }
    };

    const getBreadcrumbSheetTargets = () => {
        const panel = document.getElementById('pathBreadcrumbMore') || document.getElementById('breadcrumbMore');
        const toggle = document.getElementById('pathBreadcrumbToggle') || document.getElementById('breadcrumbToggle');
        return { panel, toggle };
    };

    const ensureBreadcrumbSheetHeader = (panel, closeHandler) => {
        if (!panel || panel.querySelector('.mobile-breadcrumb-sheet-head')) return;

        const header = document.createElement('div');
        header.className = 'mobile-breadcrumb-sheet-head';

        const title = document.createElement('h3');
        title.textContent = 'More Options';

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'mobile-breadcrumb-sheet-close';
        closeBtn.setAttribute('aria-label', 'Close options');
        closeBtn.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>';
        closeBtn.addEventListener('click', closeHandler);

        header.appendChild(title);
        header.appendChild(closeBtn);
        panel.prepend(header);
    };

    const ensureBreadcrumbSheetSearch = (panel) => {
        if (!panel) return null;

        let wrap = panel.querySelector('.mobile-breadcrumb-search-wrap');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.className = 'mobile-breadcrumb-search-wrap';
            wrap.innerHTML = `
                <span class="mobile-breadcrumb-search-icon" aria-hidden="true"><i class="bi bi-search"></i></span>
                <input type="search" class="mobile-breadcrumb-search-input" placeholder="Search materials" autocomplete="off">
            `;

            const suggestions = document.createElement('div');
            suggestions.className = 'mobile-breadcrumb-suggestions';

            const header = panel.querySelector('.mobile-breadcrumb-sheet-head');
            if (header) {
                header.insertAdjacentElement('afterend', wrap);
                wrap.insertAdjacentElement('afterend', suggestions);
            } else {
                panel.prepend(suggestions);
                panel.prepend(wrap);
            }
        }

        const input = wrap.querySelector('.mobile-breadcrumb-search-input');
        const suggestions = panel.querySelector('.mobile-breadcrumb-suggestions');
        if (!input || !suggestions) return null;

        if (wrap.dataset.bound === 'true') {
            return { input, suggestions };
        }

        wrap.dataset.bound = 'true';

        input.addEventListener('input', () => {
            syncSearchValueToPage(input.value);
            if (!input.value.trim()) {
                hideBreadcrumbSuggestions();
                return;
            }

            loadSearchData().then(() => {
                const materials = findMatches(input.value);
                breadcrumbCurrentSuggestions = materials;
                breadcrumbActiveSuggestionIndex = -1;

                if (materials.length === 0) {
                    hideBreadcrumbSuggestions();
                    return;
                }

                suggestions.innerHTML = materials
                    .map((material, index) => {
                        const gradeLabel = material.category === 'als' ? 'ALS' : `Grade ${material.grade}`;
                        return `
                            <button type="button" class="mobile-breadcrumb-option" data-index="${index}" data-id="${material.id}">
                                <div class="mobile-breadcrumb-option-title">${escapeHtml(material.title)}</div>
                                <div class="mobile-breadcrumb-option-meta">${escapeHtml(material.subject)} | ${escapeHtml(gradeLabel)}</div>
                            </button>
                        `;
                    })
                    .join('');

                suggestions.style.display = 'block';
            });
        });

        input.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowDown') {
                if (breadcrumbCurrentSuggestions.length === 0) return;
                event.preventDefault();
                breadcrumbActiveSuggestionIndex = (breadcrumbActiveSuggestionIndex + 1) % breadcrumbCurrentSuggestions.length;
                applyBreadcrumbActiveSuggestion();
                return;
            }

            if (event.key === 'ArrowUp') {
                if (breadcrumbCurrentSuggestions.length === 0) return;
                event.preventDefault();
                breadcrumbActiveSuggestionIndex = breadcrumbActiveSuggestionIndex <= 0
                    ? breadcrumbCurrentSuggestions.length - 1
                    : breadcrumbActiveSuggestionIndex - 1;
                applyBreadcrumbActiveSuggestion();
                return;
            }

            if (event.key === 'Enter') {
                if (breadcrumbActiveSuggestionIndex >= 0 && breadcrumbCurrentSuggestions[breadcrumbActiveSuggestionIndex]) {
                    event.preventDefault();
                    navigateToMaterial(breadcrumbCurrentSuggestions[breadcrumbActiveSuggestionIndex].id);
                    return;
                }

                syncSearchValueToPage(input.value, true);
            }

            if (event.key === 'Escape') {
                hideBreadcrumbSuggestions();
            }
        });

        suggestions.addEventListener('click', (event) => {
            const option = event.target.closest('.mobile-breadcrumb-option');
            if (!option) return;
            navigateToMaterial(option.dataset.id);
        });

        return { input, suggestions };
    };

    let breadcrumbBackdrop = null;
    const getBreadcrumbBackdrop = (closeHandler) => {
        if (breadcrumbBackdrop) return breadcrumbBackdrop;

        const existing = document.getElementById('mobileBreadcrumbBackdrop');
        if (existing) {
            breadcrumbBackdrop = existing;
            return breadcrumbBackdrop;
        }

        const backdrop = document.createElement('div');
        backdrop.id = 'mobileBreadcrumbBackdrop';
        backdrop.className = 'mobile-breadcrumb-sheet-backdrop';
        backdrop.hidden = true;
        backdrop.addEventListener('click', closeHandler);
        document.body.appendChild(backdrop);
        breadcrumbBackdrop = backdrop;
        return breadcrumbBackdrop;
    };

    const closeBreadcrumbSheet = () => {
        const { panel, toggle } = getBreadcrumbSheetTargets();
        if (!panel) return;

        panel.classList.remove('mobile-sheet-open');
        panel.setAttribute('hidden', 'hidden');
        document.body.classList.remove('mobile-breadcrumb-sheet-open');
        if (toggle) {
            toggle.setAttribute('aria-expanded', 'false');
        }

        const backdrop = getBreadcrumbBackdrop(closeBreadcrumbSheet);
        backdrop.hidden = true;
        hideBreadcrumbSuggestions();
    };

    const openBreadcrumbSheet = () => {
        const { panel, toggle } = getBreadcrumbSheetTargets();
        if (!panel) return;

        ensureBreadcrumbSheetHeader(panel, closeBreadcrumbSheet);
        const searchUI = ensureBreadcrumbSheetSearch(panel);
        panel.removeAttribute('hidden');
        panel.classList.add('mobile-sheet-open');
        document.body.classList.add('mobile-breadcrumb-sheet-open');
        if (toggle) {
            toggle.setAttribute('aria-expanded', 'true');
        }

        const backdrop = getBreadcrumbBackdrop(closeBreadcrumbSheet);
        backdrop.hidden = false;

        if (searchUI && searchUI.input) {
            const pageSearch = getPageSearchInput();
            searchUI.input.value = (pageSearch && pageSearch.value) || '';
            if (searchUI.input.value.trim()) {
                searchUI.input.dispatchEvent(new Event('input', { bubbles: true }));
            }
            window.setTimeout(() => searchUI.input.focus(), 80);
        }
    };

    searchToggle.addEventListener('click', () => {
        if (window.innerWidth <= 760 && hasUnifiedIndexSearch) {
            openUnifiedIndexSearch();
            return;
        }

        if (window.innerWidth <= 760) {
            const { panel } = getBreadcrumbSheetTargets();
            if (panel) {
                if (panel.classList.contains('mobile-sheet-open')) {
                    closeBreadcrumbSheet();
                } else {
                    openBreadcrumbSheet();
                }
                return;
            }
        }

        if (searchShell.classList.contains('search-open')) {
            closeSearch();
        } else {
            openSearch();
        }
    });

    searchInput.addEventListener('input', () => {
        syncSearchValueToPage(searchInput.value);
        if (!searchInput.value.trim()) {
            hideSuggestions();
            return;
        }
        loadSearchData().then(() => {
            renderSuggestions(findMatches(searchInput.value));
        });
    });

    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown') {
            if (currentSuggestions.length === 0) return;
            event.preventDefault();
            activeSuggestionIndex = (activeSuggestionIndex + 1) % currentSuggestions.length;
            applyActiveSuggestion();
            return;
        }

        if (event.key === 'ArrowUp') {
            if (currentSuggestions.length === 0) return;
            event.preventDefault();
            activeSuggestionIndex = activeSuggestionIndex <= 0 ? currentSuggestions.length - 1 : activeSuggestionIndex - 1;
            applyActiveSuggestion();
            return;
        }

        if (event.key === 'Enter') {
            if (activeSuggestionIndex >= 0 && currentSuggestions[activeSuggestionIndex]) {
                event.preventDefault();
                navigateToMaterial(currentSuggestions[activeSuggestionIndex].id);
                return;
            }
            syncSearchValueToPage(searchInput.value, true);
        }
        if (event.key === 'Escape') {
            closeSearch();
        }
    });

    suggestionsPanel.addEventListener('click', (event) => {
        const option = event.target.closest('.topnav-search-option');
        if (!option) return;
        navigateToMaterial(option.dataset.id);
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('#topnavMobileSearch')) {
            closeSearch();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeBreadcrumbSheet();
        }
    });

    const linkedPageSearch = getPageSearchInput();
    if (linkedPageSearch && linkedPageSearch.value) {
        searchInput.value = linkedPageSearch.value;
    }

    window.addEventListener('resize', () => {
        if (window.innerWidth > 760) {
            closeSearch();
            closeBreadcrumbSheet();
        }
    });
}

function initMobileTopNav() {
    const nav = document.querySelector('.mock-topnav');
    const toggle = document.getElementById('topnavToggle');
    const menu = document.getElementById('topnavMenu');
    const toggleIcon = toggle ? toggle.querySelector('.bi') : null;

    if (!nav || !toggle || !menu) return;

    const syncLrmsExpanded = (expanded) => {
        const lrmsMenu = document.getElementById('lrmsMenu');
        const lrmsDropdown = document.getElementById('lrmsDropdown');
        if (!lrmsMenu || !lrmsDropdown) return;

        lrmsMenu.classList.toggle('active', expanded);
        lrmsMenu.hidden = !expanded;
        lrmsDropdown.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    };

    const closeMenu = () => {
        nav.classList.remove('open');
        document.body.classList.remove('topnav-menu-open');
        toggle.setAttribute('aria-expanded', 'false');
        if (toggleIcon) {
            toggleIcon.classList.remove('bi-x-lg');
            toggleIcon.classList.add('bi-list');
        }
        // Also close any open dropdowns
        syncLrmsExpanded(false);
    };

    toggle.addEventListener('click', () => {
        const willOpen = !nav.classList.contains('open');
        nav.classList.toggle('open', willOpen);
        document.body.classList.toggle('topnav-menu-open', willOpen);
        toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        if (toggleIcon) {
            toggleIcon.classList.toggle('bi-list', !willOpen);
            toggleIcon.classList.toggle('bi-x-lg', willOpen);
        }

        // Show LRMS options immediately when menu opens on mobile.
        syncLrmsExpanded(willOpen);
    });

    // Close menu when clicking on non-dropdown links
    nav.querySelectorAll('.topnav-links > a:not(.dropdown-toggle)').forEach((link) => {
        link.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 760) closeMenu();
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMenu();
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await mountComponent('topNavMount', 'components/topnav.html');
    await mountComponent('footerMount', 'components/footer.html');
    await initLRMSDropdown();
    initTopNavMobileTools();
    initMobileTopNav();
});
