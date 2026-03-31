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
}

// Populate categories in the sidebar
function populateCategories() {
    const categoriesList = document.getElementById('categoriesList');
    categoriesList.innerHTML = '';

    allCategories.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.innerHTML = `
            <span class="category-icon">${category.icon}</span>
            <span>${category.name}</span>
        `;
        categoryItem.addEventListener('click', () => {
            const wasActive = categoryItem.classList.contains('active');

            document.querySelectorAll('.category-item').forEach(item => {
                item.classList.remove('active');
            });

            if (!wasActive) {
                categoryItem.classList.add('active');
                updateCategoryFilter(category.id);
            } else {
                updateCategoryFilter(null);
            }
        });
        categoriesList.appendChild(categoryItem);
    });
}

// Populate grade filters
function populateGradeFilters() {
    const gradeFilters = document.getElementById('gradeFilters');
    gradeFilters.innerHTML = '';

    const grades = new Set();
    allCategories.forEach(category => {
        if (category.subcategories) {
            category.subcategories.forEach(sub => {
                grades.add(sub.name);
            });
        }
    });

    Array.from(grades).sort((a, b) => getGradeSortValue(a) - getGradeSortValue(b)).forEach(grade => {
        const gradeFilter = document.createElement('div');
        gradeFilter.className = 'grade-filter';
        gradeFilter.textContent = grade;
        gradeFilter.addEventListener('click', () => {
            const wasActive = gradeFilter.classList.contains('active');

            document.querySelectorAll('.grade-filter').forEach(item => {
                item.classList.remove('active');
            });

            if (!wasActive) {
                gradeFilter.classList.add('active');
                updateGradeFilter(grade);
            } else {
                updateGradeFilter(null);
            }
        });
        gradeFilters.appendChild(gradeFilter);
    });
}

// Populate subject filters
function populateSubjectFilters() {
    const subjectFilters = document.getElementById('subjectFilters');
    subjectFilters.innerHTML = '';

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
        const subjectFilter = document.createElement('div');
        subjectFilter.className = 'subject-filter';
        subjectFilter.textContent = subject;
        subjectFilter.addEventListener('click', () => {
            const wasActive = subjectFilter.classList.contains('active');

            document.querySelectorAll('.subject-filter').forEach(item => {
                item.classList.remove('active');
            });

            if (!wasActive) {
                subjectFilter.classList.add('active');
                updateSubjectFilter(subject);
            } else {
                updateSubjectFilter(null);
            }
        });
        subjectFilters.appendChild(subjectFilter);
    });
}

// Populate tags
function populateTags() {
    const tagsList = document.getElementById('tagsList');
    tagsList.innerHTML = '';

    const tagsCount = {};
    allMaterials.forEach(material => {
        material.tags.forEach(tag => {
            tagsCount[tag] = (tagsCount[tag] || 0) + 1;
        });
    });

    Object.keys(tagsCount).sort().forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag';
        tagElement.innerHTML = `${tag} <span class="tag-count">(${tagsCount[tag]})</span>`;
        tagElement.addEventListener('click', () => {
            tagElement.classList.toggle('active');
            updateTagFilter(tag);
        });
        tagsList.appendChild(tagElement);
    });
}

// Update filter functions
function updateCategoryFilter(categoryId) {
    selectedFilters.category = categoryId;
    applyFilters();
}

function updateGradeFilter(grade) {
    selectedFilters.grade = grade;
    applyFilters();
}

function updateSubjectFilter(subject) {
    selectedFilters.subject = subject;
    applyFilters();
}

function updateTagFilter(tag) {
    if (selectedFilters.tags.has(tag)) {
        selectedFilters.tags.delete(tag);
    } else {
        selectedFilters.tags.add(tag);
    }
    updateClearTagsButton();
    applyFilters();
}

function updateClearTagsButton() {
    const clearBtn = document.getElementById('clearTagsBtn');
    if (selectedFilters.tags.size > 0) {
        clearBtn.style.display = 'inline-block';
    } else {
        clearBtn.style.display = 'none';
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
                    <span class="material-duration">â±ï¸ ${material.duration}</span>
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

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    document.getElementById('searchInput').addEventListener('input', (e) => {
        selectedFilters.searchTerm = e.target.value.trim().toLowerCase();
        applyFilters();
    });

    // Type filter
    document.getElementById('typeFilter').addEventListener('change', (e) => {
        selectedFilters.type = e.target.value || null;
        applyFilters();
    });

    // Duration filter
    document.getElementById('durationFilter').addEventListener('change', (e) => {
        selectedFilters.duration = e.target.value || null;
        applyFilters();
    });

    // Clear tags button
    document.getElementById('clearTagsBtn').addEventListener('click', () => {
        selectedFilters.tags.clear();
        document.querySelectorAll('.tag').forEach(tag => {
            tag.classList.remove('active');
        });
        updateClearTagsButton();
        applyFilters();
    });

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
