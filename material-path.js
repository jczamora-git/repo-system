function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getGradeLabel(material) {
    if (material.category === 'als') {
        return 'Grade ALS';
    }

    const n = parseInt(material.grade, 10);
    return isNaN(n) ? material.grade : `Grade ${material.grade}`;
}

function getPathSegments(category, grade, subject) {
    const segments = [];

    if (category === 'k12-senior' || category === 'k12-junior') {
        segments.push({ label: 'K-12', href: 'material-path.html?track=k12' });
        segments.push({
            label: category === 'k12-senior' ? 'Senior High' : 'Junior High',
            href: `material-path.html?category=${encodeURIComponent(category)}`
        });
    }

    if (category === 'elementary') {
        segments.push({ label: 'Elementary', href: 'material-path.html?category=elementary' });
    }

    if (category === 'als') {
        segments.push({ label: 'ALS', href: 'material-path.html?category=als' });
    }

    if (grade) {
        const sep = category ? '&' : '';
        segments.push({
            label: grade,
            href: `material-path.html?category=${encodeURIComponent(category)}${sep}grade=${encodeURIComponent(grade)}`
        });
    }

    if (subject) {
        const base = `material-path.html?category=${encodeURIComponent(category)}`;
        const gradePart = grade ? `&grade=${encodeURIComponent(grade)}` : '';
        segments.push({ label: subject, href: `${base}${gradePart}&subject=${encodeURIComponent(subject)}`, current: true });
    } else if (segments.length > 0) {
        segments[segments.length - 1].current = true;
    }

    if (segments.length === 0) {
        segments.push({ label: 'All Materials', current: true });
    }

    return segments;
}

function renderBreadcrumb(category, grade, subject) {
    const container = document.getElementById('pathBreadcrumb');
    const segments = getPathSegments(category, grade, subject);

    container.innerHTML = segments
        .map((segment, index) => {
            const node = segment.current
                ? `<span class="crumb current">${escapeHtml(segment.label)}</span>`
                : `<a class="crumb" href="${segment.href}">${escapeHtml(segment.label)}</a>`;
            const sep = index === segments.length - 1 ? '' : '<span class="crumb-sep">/</span>';
            return `${node}${sep}`;
        })
        .join('');
}

function matchFilters(material, category, grade, subject, track) {
    if (track === 'k12' && !(material.category === 'k12-senior' || material.category === 'k12-junior')) {
        return false;
    }

    if (category && material.category !== category) {
        return false;
    }

    if (grade && getGradeLabel(material) !== grade) {
        return false;
    }

    if (subject && material.subject !== subject) {
        return false;
    }

    return true;
}

function buildTitle(category, grade, subject, track) {
    if (subject && grade && category === 'k12-senior') {
        return `K-12 / Senior High / ${grade} / ${subject}`;
    }

    if (subject && grade && category === 'k12-junior') {
        return `K-12 / Junior High / ${grade} / ${subject}`;
    }

    if (subject && grade && category === 'elementary') {
        return `Elementary / ${grade} / ${subject}`;
    }

    if (subject && category === 'als') {
        return `ALS / ${subject}`;
    }

    if (track === 'k12') {
        return 'K-12 Materials';
    }

    return 'Path Materials';
}

function renderMaterials(list) {
    const container = document.getElementById('pathMaterialsList');
    const empty = document.getElementById('pathEmpty');
    const count = document.getElementById('pathCount');

    if (list.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'block';
        count.textContent = '0 materials';
        return;
    }

    empty.style.display = 'none';
    count.textContent = `${list.length} material${list.length > 1 ? 's' : ''}`;

    container.innerHTML = list
        .map((material) => `
            <article class="path-item">
                <a href="view-material.html?id=${encodeURIComponent(material.id)}">${escapeHtml(material.title)}</a>
                <div class="path-item-meta">${escapeHtml(getGradeLabel(material))} | ${escapeHtml(material.subject)} | ${escapeHtml(material.duration)}</div>
                <div class="path-item-tags">
                    ${(material.tags || []).map((tag) => `<span class="chip tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            </article>
        `)
        .join('');
}

function initPathFinder(allMaterials, filteredMaterials) {
    const input = document.getElementById('pathSearchInput');
    const button = document.getElementById('pathSearchBtn');
    const panel = document.getElementById('pathSuggestionsPanel');

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

    function applyActiveSuggestion() {
        const items = panel.querySelectorAll('.suggestion-item');
        items.forEach((item) => item.classList.remove('active'));
        if (activeIndex >= 0 && items[activeIndex]) {
            items[activeIndex].classList.add('active');
        }
    }

    function findMatches(query) {
        const q = query.trim().toLowerCase();
        if (!q) return [];

        return allMaterials.filter((item) => {
            const searchable = `${item.title} ${item.subject} ${(item.tags || []).join(' ')}`.toLowerCase();
            return searchable.includes(q);
        });
    }

    function findInFiltered(query) {
        const q = query.trim().toLowerCase();
        if (!q) return null;

        return filteredMaterials.find((item) => {
            const searchable = `${item.title} ${item.subject} ${(item.tags || []).join(' ')}`.toLowerCase();
            return searchable.includes(q);
        }) || null;
    }

    function navigateTo(id) {
        window.location.href = `view-material.html?id=${encodeURIComponent(id)}`;
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
                navigateTo(currentSuggestions[activeIndex].id);
                return;
            }

            const target = findInFiltered(input.value) || findMatches(input.value)[0];
            if (target) {
                navigateTo(target.id);
            }
        }
    });

    panel.addEventListener('click', (event) => {
        const btn = event.target.closest('.suggestion-item');
        if (!btn) return;
        navigateTo(btn.dataset.id);
    });

    button.addEventListener('click', () => {
        const target = findInFiltered(input.value) || findMatches(input.value)[0];
        if (target) {
            navigateTo(target.id);
        } else {
            alert('No matching material found. Try another keyword.');
        }
    });

    document.addEventListener('click', (event) => {
        const inside = event.target.closest('.finder-input-wrap');
        if (!inside) {
            panel.style.display = 'none';
        }
    });
}

async function initPathPage() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category') || '';
    const grade = params.get('grade') || '';
    const subject = params.get('subject') || '';
    const track = params.get('track') || '';

    try {
        const response = await fetch('data.json');
        const data = await response.json();
        const allMaterials = data.materials || [];

        const filtered = allMaterials.filter((material) => matchFilters(material, category, grade, subject, track));

        renderBreadcrumb(category, grade, subject);
        document.getElementById('pathTitle').textContent = buildTitle(category, grade, subject, track);
        renderMaterials(filtered);
        initPathFinder(allMaterials, filtered);
    } catch (error) {
        console.error('Failed to load path materials', error);
        document.getElementById('pathTitle').textContent = 'Failed to load materials';
        document.getElementById('pathEmpty').style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', initPathPage);
