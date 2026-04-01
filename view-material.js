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

const mockOutcomes = [
    'Understand core concepts and terminology for this lesson.',
    'Apply the lesson through guided examples and activities.',
    'Evaluate understanding through short formative checks.',
    'Connect the topic to real-world and cross-subject contexts.'
];

const mockResources = [
    'Teacher Guide (PDF)',
    'Learner Worksheet (DOCX)',
    'Slide Deck (PPTX)',
    'Assessment Quiz (PDF)'
];

const embeddedPreviewByMaterialId = {
    'mat-001': {
        embedUrl: 'https://docs.google.com/document/d/1FK80P5suvZmiXREBQuu8w-wODbgJY-qIuWdQERN_fQ0/preview?rm=minimal',
        openUrl: 'https://docs.google.com/document/d/1FK80P5suvZmiXREBQuu8w-wODbgJY-qIuWdQERN_fQ0/edit?tab=t.0'
    }
};

let materialsCache = [];

const gradeMapByCategory = {
    'k12-senior': [
        { label: 'G11', value: 'Grade 11' },
        { label: 'G12', value: 'Grade 12' }
    ],
    'k12-junior': [
        { label: 'G7', value: 'Grade 7' },
        { label: 'G8', value: 'Grade 8' },
        { label: 'G9', value: 'Grade 9' },
        { label: 'G10', value: 'Grade 10' }
    ],
    elementary: [
        { label: 'G1', value: 'Grade 1' },
        { label: 'G2', value: 'Grade 2' },
        { label: 'G3', value: 'Grade 3' },
        { label: 'G4', value: 'Grade 4' },
        { label: 'G5', value: 'Grade 5' },
        { label: 'G6', value: 'Grade 6' }
    ],
    als: [
        { label: 'ALS', value: 'Grade ALS' }
    ]
};

async function loadMaterialDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        showNotFound();
        return;
    }

    try {
        const response = await fetch('data.json');
        const data = await response.json();
        materialsCache = data.materials || [];
        const categories = data.categories || [];

        initMaterialFinder(materialsCache, id);

        const material = materialsCache.find((item) => item.id === id);
        if (!material) {
            showNotFound();
            return;
        }

        renderBreadcrumb(material);
        renderBreadcrumbFilters(categories, materialsCache, material);
        setupBreadcrumbMoreToggle('breadcrumbToggle', 'breadcrumbMore');
        renderMaterial(material);
        renderRecommended(material, materialsCache);
        bindActions(material);
    } catch (error) {
        console.error('Failed to load material details:', error);
        showNotFound();
    }
}

function initMaterialFinder(allMaterials, currentId) {
    const input = document.getElementById('materialSearchInput');
    const button = document.getElementById('materialSearchBtn');
    const panel = document.getElementById('suggestionsPanel');

    const current = allMaterials.find((item) => item.id === currentId);
    if (current) {
        input.value = current.title;
    }

    let activeIndex = -1;
    let currentSuggestions = [];

    function renderSuggestions(items) {
        currentSuggestions = items.slice(0, 5);
        activeIndex = -1;

        if (currentSuggestions.length === 0) {
            panel.style.display = 'none';
            panel.innerHTML = '';
            return;
        }

        panel.innerHTML = currentSuggestions
            .map((item, index) => `
                <button type="button" class="suggestion-item" data-index="${index}" data-id="${item.id}">
                    <div class="suggestion-title">${escapeHtml(item.title)}</div>
                    <div class="suggestion-meta">${escapeHtml(item.subject)}</div>
                </button>
            `)
            .join('');

        panel.style.display = 'block';
    }

    function hideSuggestions() {
        panel.style.display = 'none';
    }

    function applyActiveSuggestion() {
        const buttons = panel.querySelectorAll('.suggestion-item');
        buttons.forEach((btn) => btn.classList.remove('active'));
        if (activeIndex >= 0 && buttons[activeIndex]) {
            buttons[activeIndex].classList.add('active');
        }
    }

    function findMatches(query) {
        const value = query.trim().toLowerCase();
        if (!value) return [];

        return allMaterials.filter((item) => {
            const searchable = `${item.title} ${item.subject} ${(item.tags || []).join(' ')}`.toLowerCase();
            return searchable.includes(value);
        });
    }

    function navigateToMaterial(materialId) {
        if (!materialId) return;
        window.location.href = `view-material.html?id=${encodeURIComponent(materialId)}`;
    }

    function findAndNavigate() {
        const query = input.value.trim().toLowerCase();
        if (!query) {
            return;
        }

        const exact = allMaterials.find((item) => item.title.toLowerCase() === query);
        const loose = allMaterials.find((item) => {
            const searchable = `${item.title} ${item.subject} ${(item.tags || []).join(' ')}`.toLowerCase();
            return searchable.includes(query);
        });

        const target = exact || loose;
        if (!target) {
            alert('No matching material found. Try another keyword.');
            return;
        }

        navigateToMaterial(target.id);
    }

    input.addEventListener('input', () => {
        renderSuggestions(findMatches(input.value));
    });

    input.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (currentSuggestions.length === 0) return;
            activeIndex = (activeIndex + 1) % currentSuggestions.length;
            applyActiveSuggestion();
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (currentSuggestions.length === 0) return;
            activeIndex = activeIndex <= 0 ? currentSuggestions.length - 1 : activeIndex - 1;
            applyActiveSuggestion();
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            if (activeIndex >= 0 && currentSuggestions[activeIndex]) {
                navigateToMaterial(currentSuggestions[activeIndex].id);
            } else {
                findAndNavigate();
            }
            return;
        }

        if (event.key === 'Escape') {
            hideSuggestions();
        }
    });

    panel.addEventListener('click', (event) => {
        const buttonEl = event.target.closest('.suggestion-item');
        if (!buttonEl) return;
        navigateToMaterial(buttonEl.dataset.id);
    });

    button.addEventListener('click', findAndNavigate);

    document.addEventListener('click', (event) => {
        const insideFinder = event.target.closest('.finder-input-wrap');
        if (!insideFinder) {
            hideSuggestions();
        }
    });
}

function getMockAuthor(id) {
    const numeric = parseInt((id || '').replace(/\D/g, ''), 10);
    const index = isNaN(numeric) ? 0 : numeric % mockAuthors.length;
    return mockAuthors[index];
}

function getMockYear(id) {
    const numeric = parseInt((id || '').replace(/\D/g, ''), 10);
    const offset = isNaN(numeric) ? 0 : numeric % 5;
    return 2022 + offset;
}

function getGradeLabel(material) {
    if (material.category === 'als') {
        return 'Grade ALS';
    }

    const numericGrade = parseInt(material.grade, 10);
    if (!isNaN(numericGrade)) {
        return `Grade ${material.grade}`;
    }

    return material.grade;
}

function getPathSegments(material) {
    const gradeLabel = getGradeLabel(material);

    if (material.category === 'k12-senior') {
        return [
            { label: 'K-12', href: 'material-path.html?track=k12' },
            { label: 'Senior High', href: 'material-path.html?category=k12-senior' },
            { label: gradeLabel, href: `material-path.html?category=k12-senior&grade=${encodeURIComponent(gradeLabel)}` },
            { label: material.subject, href: `material-path.html?category=k12-senior&grade=${encodeURIComponent(gradeLabel)}&subject=${encodeURIComponent(material.subject)}` },
            { label: material.title, current: true }
        ];
    }

    if (material.category === 'k12-junior') {
        return [
            { label: 'K-12', href: 'material-path.html?track=k12' },
            { label: 'Junior High', href: 'material-path.html?category=k12-junior' },
            { label: gradeLabel, href: `material-path.html?category=k12-junior&grade=${encodeURIComponent(gradeLabel)}` },
            { label: material.subject, href: `material-path.html?category=k12-junior&grade=${encodeURIComponent(gradeLabel)}&subject=${encodeURIComponent(material.subject)}` },
            { label: material.title, current: true }
        ];
    }

    if (material.category === 'elementary') {
        return [
            { label: 'Elementary', href: 'material-path.html?category=elementary' },
            { label: gradeLabel, href: `material-path.html?category=elementary&grade=${encodeURIComponent(gradeLabel)}` },
            { label: material.subject, href: `material-path.html?category=elementary&grade=${encodeURIComponent(gradeLabel)}&subject=${encodeURIComponent(material.subject)}` },
            { label: material.title, current: true }
        ];
    }

    return [
        { label: 'ALS', href: 'material-path.html?category=als' },
        { label: material.subject, href: `material-path.html?category=als&subject=${encodeURIComponent(material.subject)}` },
        { label: material.title, current: true }
    ];
}

function renderBreadcrumb(material) {
    const breadcrumb = document.getElementById('breadcrumb');
    const segments = getPathSegments(material);

    breadcrumb.innerHTML = segments
        .map((segment, index) => {
            const isCurrent = Boolean(segment.current);
            const node = isCurrent
                ? `<span class="crumb current">${escapeHtml(segment.label)}</span>`
                : `<a class="crumb" href="${segment.href}">${escapeHtml(segment.label)}</a>`;
            const sep = index === segments.length - 1 ? '' : '<span class="crumb-sep">/</span>';
            return `${node}${sep}`;
        })
        .join('');
}

function buildPathHref(category, grade, subject, tag) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (grade) params.set('grade', grade);
    if (subject) params.set('subject', subject);
    if (tag) params.set('tag', tag);
    return `material-path.html?${params.toString()}`;
}

function getGradeOptions(categoryId) {
    return gradeMapByCategory[categoryId] || [];
}

function renderBreadcrumbFilters(categories, allMaterials, material) {
    const categoryContainer = document.getElementById('breadcrumbCategories');
    const gradeContainer = document.getElementById('breadcrumbGrades');
    const subjectContainer = document.getElementById('breadcrumbSubjects');
    const tagContainer = document.getElementById('breadcrumbTags');

    if (!categoryContainer || !gradeContainer || !subjectContainer || !tagContainer) return;

    const selectedCategory = material.category;
    const selectedGrade = getGradeLabel(material);
    const selectedSubject = material.subject;
    const selectedTag = new URLSearchParams(window.location.search).get('tag') || '';

    categoryContainer.innerHTML = categories
        .map((category) => {
            const href = buildPathHref(category.id, '', '', '');
            const activeClass = category.id === selectedCategory ? ' active' : '';
            return `<a class="breadcrumb-tag${activeClass}" href="${href}">${escapeHtml(category.name)}</a>`;
        })
        .join('');

    const gradeOptions = getGradeOptions(selectedCategory);
    gradeContainer.innerHTML = gradeOptions
        .map((grade) => {
            const href = buildPathHref(selectedCategory, grade.value, '', '');
            const activeClass = grade.value === selectedGrade ? ' active' : '';
            return `<a class="breadcrumb-tag${activeClass}" href="${href}">${escapeHtml(grade.label)}</a>`;
        })
        .join('');

    const subjectSet = new Set(
        allMaterials
            .filter((item) => item.category === selectedCategory)
            .filter((item) => !selectedGrade || getGradeLabel(item) === selectedGrade)
            .map((item) => item.subject)
    );

    const subjects = Array.from(subjectSet).sort();
    subjectContainer.innerHTML = subjects
        .map((subject) => {
            const href = buildPathHref(selectedCategory, selectedGrade, subject, '');
            const activeClass = subject === selectedSubject ? ' active' : '';
            return `<a class="breadcrumb-tag${activeClass}" href="${href}">${escapeHtml(subject)}</a>`;
        })
        .join('');

    const tagSet = new Set(
        allMaterials
            .filter((item) => item.category === selectedCategory)
            .filter((item) => !selectedGrade || getGradeLabel(item) === selectedGrade)
            .filter((item) => !selectedSubject || item.subject === selectedSubject)
            .flatMap((item) => item.tags || [])
    );

    const tags = Array.from(tagSet).sort((a, b) => a.localeCompare(b));
    tagContainer.innerHTML = tags
        .map((tag) => {
            const href = buildPathHref(selectedCategory, selectedGrade, selectedSubject, tag);
            const activeClass = tag === selectedTag ? ' active' : '';
            return `<a class="breadcrumb-tag${activeClass}" href="${href}">${escapeHtml(tag)}</a>`;
        })
        .join('');
}

function setupBreadcrumbMoreToggle(toggleId, panelId) {
    const toggle = document.getElementById(toggleId);
    const panel = document.getElementById(panelId);
    if (!toggle || !panel) return;

    const sync = () => {
        const expanded = !panel.hasAttribute('hidden');
        toggle.textContent = expanded ? 'Show Less' : 'Show More';
        toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    };

    sync();

    toggle.addEventListener('click', () => {
        if (panel.hasAttribute('hidden')) {
            panel.removeAttribute('hidden');
        } else {
            panel.setAttribute('hidden', 'hidden');
        }
        sync();
    });
}

function renderMaterial(material) {
    const author = material.author || getMockAuthor(material.id);
    const year = material.year || getMockYear(material.id);
    const gradeLabel = getGradeLabel(material);
    const fileType = guessFileType(material);

    const overview = document.getElementById('materialOverview');
    overview.innerHTML = `
        <div class="overview-thumb">${material.thumbnail || ''}</div>
        <div>
            <h1 class="overview-title">${escapeHtml(material.title)}</h1>
            <p class="overview-author">Author: <strong>${escapeHtml(author)}</strong></p>
            <p class="overview-meta">Year: <strong>${year}</strong> | Category: <strong>${escapeHtml(material.subject)}</strong></p>
            <p class="overview-description">${escapeHtml(material.description)}</p>
            <div class="meta-row">
                <span class="chip grade">${escapeHtml(gradeLabel)}</span>
                <span class="chip type">${escapeHtml(material.type)}</span>
                <span class="chip duration">${escapeHtml(material.duration)}</span>
                <span class="chip tag">${escapeHtml(material.subject)}</span>
            </div>
            <div class="tags-row">
                ${(material.tags || []).map((tag) => `<span class="chip tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
        </div>
    `;

    const descriptionPanel = document.getElementById('descriptionPanel');
    descriptionPanel.innerHTML = `
        <h3>About This Material</h3>
        <p>${escapeHtml(material.description)}</p>
        <p>This resource belongs to <strong>${escapeHtml(material.subject)}</strong> and is designed for <strong>${escapeHtml(gradeLabel)}</strong> learners.</p>
    `;

    document.getElementById('outcomesList').innerHTML = mockOutcomes.map((outcome) => `<li>${escapeHtml(outcome)}</li>`).join('');
    document.getElementById('resourcesList').innerHTML = mockResources.map((resource) => `<li>${escapeHtml(resource)}</li>`).join('');

    document.getElementById('fileTypeBadge').textContent = fileType;

    document.getElementById('previewMeta').innerHTML = `
        <span>Format: <strong>${fileType}</strong></span>
        <span>Subject: <strong>${escapeHtml(material.subject)}</strong></span>
        <span>Duration: <strong>${escapeHtml(material.duration)}</strong></span>
    `;

    const previewViewport = document.getElementById('previewViewport');
    const embedConfig = embeddedPreviewByMaterialId[material.id];

    if (embedConfig && embedConfig.embedUrl) {
        previewViewport.classList.add('embedded-mode');
        previewViewport.innerHTML = `
            <iframe
                class="embedded-preview-iframe"
                src="${embedConfig.embedUrl}"
                title="${escapeHtml(material.title)} preview"
                loading="lazy"
                referrerpolicy="strict-origin-when-cross-origin"
                allow="fullscreen"
            ></iframe>
            <a class="embedded-open-link" href="${embedConfig.openUrl}" target="_blank" rel="noopener noreferrer">Open full document</a>
        `;
        return;
    }

    previewViewport.classList.remove('embedded-mode');

    previewViewport.innerHTML = `
        <div class="mock-document">
            <h4>${escapeHtml(material.title)}</h4>
            <p>Preview mode for ${fileType} document.</p>
            <p>This panel represents a file preview area for PDF, Word, or PowerPoint documents.</p>
        </div>
    `;
}

function renderRecommended(currentMaterial, allMaterials) {
    const recommendedList = document.getElementById('recommendedList');

    const related = allMaterials
        .filter((item) => item.id !== currentMaterial.id)
        .filter((item) => item.subject === currentMaterial.subject || item.category === currentMaterial.category)
        .slice(0, 5);

    if (related.length === 0) {
        recommendedList.innerHTML = '<li>No related materials available yet.</li>';
        return;
    }

    recommendedList.innerHTML = related
        .map((item) => {
            const gradeLabel = getGradeLabel(item);
            return `
                <li>
                    <a href="view-material.html?id=${encodeURIComponent(item.id)}">${escapeHtml(item.title)}</a>
                    <div class="rec-meta">${escapeHtml(gradeLabel)} | ${escapeHtml(item.subject)}</div>
                </li>
            `;
        })
        .join('');
}

function bindActions(material) {
    document.getElementById('downloadAction').addEventListener('click', () => {
        alert(`Download started: ${material.title}\n\nThis would download the selected material package.`);
    });
}

function guessFileType(material) {
    const typeValue = (material.type || '').toLowerCase();
    if (typeValue.includes('interactive') || typeValue.includes('quiz') || typeValue.includes('game')) return 'PPT';
    if (typeValue.includes('exercise') || typeValue.includes('workshop')) return 'DOCX';
    return 'PDF';
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function showNotFound() {
    document.getElementById('detailsContent').style.display = 'none';
    const breadcrumbWrap = document.querySelector('.breadcrumb-wrap');
    if (breadcrumbWrap) breadcrumbWrap.style.display = 'none';
    document.querySelector('.finder-bar').style.display = 'none';
    document.getElementById('notFound').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', loadMaterialDetails);
