// Global variables
let allMaterials = [];
let allCategories = [];
let selectedFilters = {
    category: null,
    grade: null,
    subject: null,
    type: null,
    duration: null,
    searchTerm: '',
    tags: new Set()
};

const mockAuthors = [
    'Ma. Cristina Ramos',
    'John Michael Santos',
    'Elena P. Villanueva',
    'Rafael T. Mendoza',
    'Angela C. Dizon',
    'Luis Carlo Reyes',
    'Patricia Anne Cruz',
    'Daniel M. Flores'
];

const categoryIconMap = {
    'k12-senior': 'bi-mortarboard-fill',
    'k12-junior': 'bi-journal-bookmark-fill',
    elementary: 'bi-backpack2-fill',
    als: 'bi-lightbulb-fill'
};

// Load data from JSON
async function loadData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        allMaterials = data.materials;
        allCategories = data.categories;
        
        initializeUI();
        displayMaterials(allMaterials);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Initialize the user interface
function initializeUI() {
    populateCategories();
    populateGradeFilters();
    populateSubjectFilters();
    populateTags();
    setupEventListeners();
    setupMobileCustomSelects();
    setupMobileFilterSheet();
    setupDesktopTagsToggle();
}

function closeAllMobileCustomSelects() {
    document.querySelectorAll('.custom-mobile-select.open').forEach((wrapper) => {
        wrapper.classList.remove('open');
        const trigger = wrapper.querySelector('.custom-select-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
}

function syncCustomSelectDisplay(selectId) {
    const select = document.getElementById(selectId);
    const wrapper = document.querySelector(`.custom-mobile-select[data-target="${selectId}"]`);
    if (!select || !wrapper) return;

    const triggerLabel = wrapper.querySelector('.custom-select-trigger span');
    const options = wrapper.querySelectorAll('.custom-select-option');
    const selectedOption = select.options[select.selectedIndex];

    if (triggerLabel) {
        triggerLabel.textContent = selectedOption ? selectedOption.textContent : '';
    }

    options.forEach((optionButton) => {
        optionButton.classList.toggle('active', optionButton.dataset.value === select.value);
    });
}

function setupMobileCustomSelects() {
    const wrappers = Array.from(document.querySelectorAll('.custom-mobile-select'));

    wrappers.forEach((wrapper) => {
        const selectId = wrapper.dataset.target;
        const select = document.getElementById(selectId);
        const trigger = wrapper.querySelector('.custom-select-trigger');
        const menu = wrapper.querySelector('.custom-select-menu');

        if (!select || !trigger || !menu) return;

        menu.innerHTML = Array.from(select.options)
            .map((opt) => `<button type="button" class="custom-select-option" data-value="${opt.value}">${opt.textContent}</button>`)
            .join('');

        syncCustomSelectDisplay(selectId);

        trigger.addEventListener('click', () => {
            const willOpen = !wrapper.classList.contains('open');
            closeAllMobileCustomSelects();
            if (willOpen) {
                wrapper.classList.add('open');
                trigger.setAttribute('aria-expanded', 'true');
            }
        });

        menu.addEventListener('click', (event) => {
            const optionButton = event.target.closest('.custom-select-option');
            if (!optionButton) return;

            const nextValue = optionButton.dataset.value || '';
            if (select.value !== nextValue) {
                select.value = nextValue;
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }

            syncCustomSelectDisplay(selectId);
            closeAllMobileCustomSelects();
        });

        select.addEventListener('change', () => {
            syncCustomSelectDisplay(selectId);
        });
    });

    document.addEventListener('click', (event) => {
        const insideCustom = event.target.closest('.custom-mobile-select');
        if (!insideCustom) closeAllMobileCustomSelects();
    });
}

// Populate categories in the sidebar
function populateCategories() {
    const categoriesList = document.getElementById('categoriesList');
    const mobileCategoriesList = document.getElementById('mobileCategoriesList');
    const targets = [categoriesList, mobileCategoriesList].filter(Boolean);
    targets.forEach(target => {
        target.innerHTML = '';
    });

    allCategories.forEach(category => {
        targets.forEach(target => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.dataset.categoryId = category.id;
            const iconClass = categoryIconMap[category.id] || 'bi-bookmark-star-fill';
            categoryItem.innerHTML = `
                <span class="category-icon" aria-hidden="true"><i class="bi ${iconClass}"></i></span>
                <span>${category.name}</span>
            `;
            categoryItem.addEventListener('click', () => {
                const nextCategory = selectedFilters.category === category.id ? null : category.id;
                updateCategoryFilter(nextCategory);
            });
            target.appendChild(categoryItem);
        });
    });

    syncCategoryActiveStates();
}

// Populate grade filters
function populateGradeFilters() {
    const gradeFilters = document.getElementById('gradeFilters');
    const mobileGradeFilters = document.getElementById('mobileGradeFilters');
    const targets = [gradeFilters, mobileGradeFilters].filter(Boolean);
    targets.forEach(target => {
        target.innerHTML = '';
    });

    const grades = new Set();
    allCategories.forEach(category => {
        if (category.subcategories) {
            category.subcategories.forEach(sub => {
                grades.add(sub.name);
            });
        }
    });

    Array.from(grades).sort((a, b) => getGradeSortValue(a) - getGradeSortValue(b)).forEach(grade => {
        targets.forEach(target => {
            const gradeFilter = document.createElement('div');
            gradeFilter.className = 'grade-filter';
            gradeFilter.textContent = grade;
            gradeFilter.dataset.grade = grade;
            gradeFilter.addEventListener('click', () => {
                const nextGrade = selectedFilters.grade === grade ? null : grade;
                updateGradeFilter(nextGrade);
            });
            target.appendChild(gradeFilter);
        });
    });

    syncGradeActiveStates();
}

// Populate subject filters
function populateSubjectFilters() {
    const subjectFilters = document.getElementById('subjectFilters');
    const mobileSubjectFilters = document.getElementById('mobileSubjectFilters');
    const targets = [subjectFilters, mobileSubjectFilters].filter(Boolean);
    targets.forEach(target => {
        target.innerHTML = '';
    });

    const subjects = new Set();
    allCategories.forEach(category => {
        if (category.subcategories) {
            category.subcategories.forEach(sub => {
                if (sub.subjects) {
                    sub.subjects.forEach(subject => {
                        subjects.add(subject.name);
                    });
                }
            });
        }
    });

    Array.from(subjects).sort().forEach(subject => {
        targets.forEach(target => {
            const subjectFilter = document.createElement('div');
            subjectFilter.className = 'subject-filter';
            subjectFilter.textContent = subject;
            subjectFilter.dataset.subject = subject;
            subjectFilter.addEventListener('click', () => {
                const nextSubject = selectedFilters.subject === subject ? null : subject;
                updateSubjectFilter(nextSubject);
            });
            target.appendChild(subjectFilter);
        });
    });

    syncSubjectActiveStates();
}

// Populate tags
function populateTags() {
    const tagsList = document.getElementById('tagsList');
    const mobileTagsList = document.getElementById('mobileTagsList');
    if (tagsList) tagsList.innerHTML = '';
    if (mobileTagsList) mobileTagsList.innerHTML = '';

    const tagsCount = {};
    allMaterials.forEach(material => {
        material.tags.forEach(tag => {
            tagsCount[tag] = (tagsCount[tag] || 0) + 1;
        });
    });

    Object.keys(tagsCount).sort().forEach(tag => {
        const createTagElement = () => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag';
            tagElement.innerHTML = `${tag} <span class="tag-count">(${tagsCount[tag]})</span>`;
            tagElement.addEventListener('click', () => {
                updateTagFilter(tag);
            });
            return tagElement;
        };

        if (tagsList) tagsList.appendChild(createTagElement());
        if (mobileTagsList) mobileTagsList.appendChild(createTagElement());
    });
}

// Update filter functions
function updateCategoryFilter(categoryId) {
    selectedFilters.category = categoryId;
    syncCategoryActiveStates();
    applyFilters();
}

function updateGradeFilter(grade) {
    selectedFilters.grade = grade;
    syncGradeActiveStates();
    applyFilters();
}

function updateSubjectFilter(subject) {
    selectedFilters.subject = subject;
    syncSubjectActiveStates();
    applyFilters();
}

function syncCategoryActiveStates() {
    document.querySelectorAll('.category-item').forEach((item) => {
        item.classList.toggle('active', item.dataset.categoryId === selectedFilters.category);
    });
}

function syncGradeActiveStates() {
    document.querySelectorAll('.grade-filter').forEach((item) => {
        item.classList.toggle('active', item.dataset.grade === selectedFilters.grade);
    });
}

function syncSubjectActiveStates() {
    document.querySelectorAll('.subject-filter').forEach((item) => {
        item.classList.toggle('active', item.dataset.subject === selectedFilters.subject);
    });
}

function updateTagFilter(tag) {
    if (selectedFilters.tags.has(tag)) {
        selectedFilters.tags.delete(tag);
    } else {
        selectedFilters.tags.add(tag);
    }
    syncTagActiveStates();
    updateClearTagsButton();
    applyFilters();
}

function syncTagActiveStates() {
    document.querySelectorAll('.tag').forEach((tagEl) => {
        const rawText = tagEl.textContent || '';
        const tagName = rawText.split('(')[0].trim();
        tagEl.classList.toggle('active', selectedFilters.tags.has(tagName));
    });
}

function updateClearTagsButton() {
    const clearBtn = document.getElementById('clearTagsBtn');
    const mobileClearBtn = document.getElementById('mobileClearTagsBtn');
    const showMobileClear = selectedFilters.tags.size > 0 && document.body.classList.contains('mobile-tags-visible');
    if (selectedFilters.tags.size > 0) {
        if (clearBtn) clearBtn.style.display = 'inline-block';
        if (mobileClearBtn) mobileClearBtn.style.display = showMobileClear ? 'inline-block' : 'none';
    } else {
        if (clearBtn) clearBtn.style.display = 'none';
        if (mobileClearBtn) mobileClearBtn.style.display = 'none';
    }
}

// Apply all active filters
function applyFilters() {
    const filtered = allMaterials.filter(material => {
        const searchTerm = selectedFilters.searchTerm;
        if (searchTerm) {
            const searchable = `${material.title} ${material.description} ${material.subject} ${(material.tags || []).join(' ')}`.toLowerCase();
            if (!searchable.includes(searchTerm)) {
                return false;
            }
        }

        // Category filter
        if (selectedFilters.category && material.category !== selectedFilters.category) {
            return false;
        }

        // Grade filter
        if (selectedFilters.grade) {
            if (getGradeLabel(material) !== selectedFilters.grade) {
                return false;
            }
        }

        // Subject filter
        if (selectedFilters.subject && material.subject !== selectedFilters.subject) {
            return false;
        }

        // Type filter
        if (selectedFilters.type && material.type !== selectedFilters.type) {
            return false;
        }

        // Duration filter
        if (selectedFilters.duration) {
            const duration = parseInt(material.duration);
            if (selectedFilters.duration === '0-30' && duration >= 30) return false;
            if (selectedFilters.duration === '30-50' && (duration < 30 || duration > 50)) return false;
            if (selectedFilters.duration === '50+' && duration <= 50) return false;
        }

        // Tags filter
        if (selectedFilters.tags.size > 0) {
            const hasTags = Array.from(selectedFilters.tags).some(tag => 
                material.tags.includes(tag)
            );
            if (!hasTags) {
                return false;
            }
        }

        return true;
    });

    displayMaterials(filtered);
}

// Display materials
function displayMaterials(materials) {
    const materialsList = document.getElementById('materialsList');
    const noResults = document.getElementById('noResults');
    const resultCount = document.getElementById('resultCount');

    materialsList.innerHTML = '';

    if (materials.length === 0) {
        noResults.style.display = 'block';
        resultCount.textContent = 'No materials found';
        return;
    }

    noResults.style.display = 'none';
    resultCount.textContent = `Showing ${materials.length} material${materials.length !== 1 ? 's' : ''}`;

    materials.forEach(material => {
        const gradeLabel = getGradeLabel(material);
        const author = material.author || getMockAuthor(material.id);
        const card = document.createElement('div');
        card.className = 'material-card';
        card.innerHTML = `
            <div class="material-thumbnail">${material.thumbnail}</div>
            <div class="material-content">
                <div class="material-title">${material.title}</div>
                <div class="material-byline"><span class="author-label">Author:</span><span class="material-author">${author}</span></div>
                <div class="material-description">${material.description}</div>
                <div class="material-subject">${material.subject}</div>
                <div class="material-meta">
                    <span class="material-grade">${gradeLabel}</span>
                    <span class="material-type">${material.type}</span>
                    <span class="material-duration"><i class="bi bi-clock" aria-hidden="true"></i> ${material.duration}</span>
                </div>
                <div class="material-tags">
                    ${material.tags.map(tag => `<span class="material-tag">${tag}</span>`).join('')}
                </div>
            </div>
            <div class="material-actions">
                <button class="material-cta view" data-material-id="${material.id}">View Material</button>
                <button class="material-cta download" data-material-id="${material.id}">Download</button>
            </div>
        `;
        materialsList.appendChild(card);
    });
}

function getMockAuthor(id) {
    const numeric = parseInt((id || '').replace(/\D/g, ''), 10);
    const index = isNaN(numeric) ? 0 : numeric % mockAuthors.length;
    return mockAuthors[index];
}

function getGradeLabel(material) {
    if (material.category === 'als') {
        return 'ALS';
    }
    if (!isNaN(parseInt(material.grade, 10))) {
        return `Grade ${material.grade}`;
    }
    return material.grade;
}

function getGradeSortValue(gradeLabel) {
    if (gradeLabel.startsWith('Grade ')) {
        const n = parseInt(gradeLabel.replace('Grade ', ''), 10);
        return isNaN(n) ? 999 : n;
    }
    if (gradeLabel.includes('ALS')) {
        return 1000;
    }
    return 998;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const suggestionsPanel = document.getElementById('searchSuggestionsPanel');
    const mobileSearchInput = document.getElementById('mobileUnifiedSearchInput');
    const mobileSuggestionsPanel = document.getElementById('mobileUnifiedSuggestions');

    const findSearchMatches = (query) => {
        const q = query.trim().toLowerCase();
        if (!q) return [];

        return allMaterials.filter((material) => {
            const searchable = `${material.title} ${material.subject} ${(material.tags || []).join(' ')}`.toLowerCase();
            return searchable.includes(q);
        });
    };

    const navigateToMaterial = (materialId) => {
        if (!materialId) return;
        window.location.href = `view-material.html?id=${encodeURIComponent(materialId)}`;
    };

    const syncSearchTerm = (value, sourceInput) => {
        selectedFilters.searchTerm = value.trim().toLowerCase();
        applyFilters();

        if (searchInput && sourceInput !== searchInput) {
            searchInput.value = value;
        }
        if (mobileSearchInput && sourceInput !== mobileSearchInput) {
            mobileSearchInput.value = value;
        }
    };

    const setupSuggestionsForInput = (inputEl, panelEl, containerSelector, itemClass, titleClass, metaClass) => {
        if (!inputEl || !panelEl) {
            return { hide: () => {} };
        }

        let activeIndex = -1;
        let suggestions = [];

        const hide = () => {
            panelEl.style.display = 'none';
            panelEl.innerHTML = '';
            activeIndex = -1;
            suggestions = [];
        };

        const applyActive = () => {
            const items = panelEl.querySelectorAll(`.${itemClass}`);
            items.forEach((item) => item.classList.remove('active'));
            if (activeIndex >= 0 && items[activeIndex]) {
                items[activeIndex].classList.add('active');
            }
        };

        const render = (materials) => {
            suggestions = materials;
            activeIndex = -1;

            if (materials.length === 0) {
                hide();
                return;
            }

            panelEl.innerHTML = materials
                .map((material, index) => {
                    const gradeLabel = getGradeLabel(material);
                    return `
                        <button type="button" class="${itemClass}" data-index="${index}" data-id="${material.id}">
                            <div class="${titleClass}">${escapeHtml(material.title)}</div>
                            <div class="${metaClass}">${escapeHtml(material.subject)} | ${escapeHtml(gradeLabel)}</div>
                        </button>
                    `;
                })
                .join('');

            panelEl.style.display = 'block';
        };

        inputEl.addEventListener('input', (event) => {
            const value = event.target.value;
            syncSearchTerm(value, inputEl);
            render(findSearchMatches(value));
        });

        inputEl.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowDown') {
                if (suggestions.length === 0) return;
                event.preventDefault();
                activeIndex = (activeIndex + 1) % suggestions.length;
                applyActive();
                return;
            }

            if (event.key === 'ArrowUp') {
                if (suggestions.length === 0) return;
                event.preventDefault();
                activeIndex = activeIndex <= 0 ? suggestions.length - 1 : activeIndex - 1;
                applyActive();
                return;
            }

            if (event.key === 'Enter' && activeIndex >= 0 && suggestions[activeIndex]) {
                event.preventDefault();
                navigateToMaterial(suggestions[activeIndex].id);
                return;
            }

            if (event.key === 'Escape') {
                hide();
            }
        });

        panelEl.addEventListener('click', (event) => {
            const suggestion = event.target.closest(`.${itemClass}`);
            if (!suggestion) return;
            navigateToMaterial(suggestion.dataset.id);
        });

        document.addEventListener('click', (event) => {
            if (!event.target.closest(containerSelector)) {
                hide();
            }
        });

        return { hide };
    };

    const desktopSearch = setupSuggestionsForInput(
        searchInput,
        suggestionsPanel,
        '.search-bar-container',
        'search-suggestion-item',
        'search-suggestion-title',
        'search-suggestion-meta'
    );

    const mobileSearch = setupSuggestionsForInput(
        mobileSearchInput,
        mobileSuggestionsPanel,
        '.apple-search-header',
        'mobile-unified-option',
        'mobile-unified-option-title',
        'mobile-unified-option-meta'
    );

    document.addEventListener('mobileUnifiedSearchClose', () => {
        desktopSearch.hide();
        mobileSearch.hide();
    });

    // Type filter
    const typeFilter = document.getElementById('typeFilter');
    const mobileTypeFilter = document.getElementById('mobileTypeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', (e) => {
            selectedFilters.type = e.target.value || null;
            if (mobileTypeFilter) mobileTypeFilter.value = e.target.value;
            syncCustomSelectDisplay('mobileTypeFilter');
            applyFilters();
        });
    }
    if (mobileTypeFilter) {
        mobileTypeFilter.addEventListener('change', (e) => {
            selectedFilters.type = e.target.value || null;
            if (typeFilter) typeFilter.value = e.target.value;
            applyFilters();
        });
    }

    // Duration filter
    const durationFilter = document.getElementById('durationFilter');
    const mobileDurationFilter = document.getElementById('mobileDurationFilter');
    if (durationFilter) {
        durationFilter.addEventListener('change', (e) => {
            selectedFilters.duration = e.target.value || null;
            if (mobileDurationFilter) mobileDurationFilter.value = e.target.value;
            syncCustomSelectDisplay('mobileDurationFilter');
            applyFilters();
        });
    }
    if (mobileDurationFilter) {
        mobileDurationFilter.addEventListener('change', (e) => {
            selectedFilters.duration = e.target.value || null;
            if (durationFilter) durationFilter.value = e.target.value;
            applyFilters();
        });
    }

    // Clear tags button
    const clearTagsBtn = document.getElementById('clearTagsBtn');
    const mobileClearTagsBtn = document.getElementById('mobileClearTagsBtn');

    const clearTags = () => {
        selectedFilters.tags.clear();
        syncTagActiveStates();
        updateClearTagsButton();
        applyFilters();
    };

    if (clearTagsBtn) clearTagsBtn.addEventListener('click', clearTags);
    if (mobileClearTagsBtn) mobileClearTagsBtn.addEventListener('click', clearTags);

    // Material action handlers
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('material-cta')) {
            const card = e.target.closest('.material-card');
            const title = card.querySelector('.material-title').textContent;
            const materialId = e.target.dataset.materialId;

            if (e.target.classList.contains('view')) {
                window.location.href = `view-material.html?id=${encodeURIComponent(materialId)}`;
            }

            if (e.target.classList.contains('download')) {
                alert(`Download started: ${title}\n\nThis would download the selected learning material file.`);
            }
        }
    });
}

function setupMobileFilterSheet() {
    const toggleBtn = document.getElementById('mobileFilterToggle');
    const closeBtn = document.getElementById('mobileFilterClose');
    const backdrop = document.getElementById('mobileFilterBackdrop');
    const mobileTagToggleBtn = document.getElementById('mobileToggleTagsBtn');

    if (!toggleBtn || !closeBtn || !backdrop) {
        return;
    }

    const syncMobileTagToggleLabel = () => {
        if (!mobileTagToggleBtn) return;
        const isVisible = document.body.classList.contains('mobile-tags-visible');
        mobileTagToggleBtn.textContent = isVisible ? 'Hide Tags' : 'Show Tags';
        mobileTagToggleBtn.setAttribute('aria-expanded', isVisible ? 'true' : 'false');
    };

    const openSheet = () => {
        document.body.classList.add('mobile-filters-open');
        toggleBtn.setAttribute('aria-expanded', 'true');
    };

    const closeSheet = () => {
        document.body.classList.remove('mobile-filters-open');
        closeAllMobileCustomSelects();
        toggleBtn.setAttribute('aria-expanded', 'false');
        document.dispatchEvent(new Event('mobileUnifiedSearchClose'));
    };

    if (mobileTagToggleBtn) {
        syncMobileTagToggleLabel();
        mobileTagToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('mobile-tags-visible');
            syncMobileTagToggleLabel();
            updateClearTagsButton();
        });
    }

    toggleBtn.addEventListener('click', () => {
        if (document.body.classList.contains('mobile-filters-open')) {
            closeSheet();
        } else {
            openSheet();
        }
    });

    closeBtn.addEventListener('click', closeSheet);
    backdrop.addEventListener('click', closeSheet);

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeSheet();
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 780) {
            document.body.classList.remove('mobile-tags-visible');
            syncMobileTagToggleLabel();
            updateClearTagsButton();
            closeSheet();
        }
    });
}

function setupDesktopTagsToggle() {
    const toggleBtn = document.getElementById('toggleTagsBtn');
    if (!toggleBtn) return;

    const syncLabel = () => {
        const isVisible = document.body.classList.contains('tags-visible');
        toggleBtn.textContent = isVisible ? 'Hide Tags' : 'Show Tags';
        toggleBtn.setAttribute('aria-expanded', isVisible ? 'true' : 'false');
    };

    syncLabel();

    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('tags-visible');
        syncLabel();
    });
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initHeroGallery();
});

function initHeroGallery() {
    const slides = Array.from(document.querySelectorAll('.hero-slide'));
    if (slides.length < 2) {
        return;
    }

    let current = 0;
    setInterval(() => {
        slides[current].classList.remove('active');
        current = (current + 1) % slides.length;
        slides[current].classList.add('active');
    }, 4500);
}
