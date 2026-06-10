/* ============================================
   MAGNIFICENT FURNITURES LIMITED - SEARCH JS
   Global search across all products
   VERSION 3.2 - WITH LIVEWIRE FIXES & MOBILE SUPPORT
   ============================================ */

// ---------- UTILITIES ----------
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(match) {
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return escapeMap[match];
    });
}

function normalizeImage(product) {
    return product.thumbnail || product.images?.[0] || 'https://placehold.co/300x260?text=Product';
}

function formatCurrency(amount) {
    return 'KES ' + Number(amount).toLocaleString('en-KE');
}

// ---------- SEARCH INDEX (with precomputed lowercase) ----------
let searchIndex = [];
let indexBuildPromise = null;
let isIndexBuilt = false;

async function buildSearchIndex() {
    if (indexBuildPromise) return indexBuildPromise;
    
    indexBuildPromise = (async () => {
        try {
            // Load categories
            const categoriesResponse = await fetch('data/categories.json');
            if (!categoriesResponse.ok) {
                throw new Error('Failed to load categories.json');
            }
            const categoriesData = await categoriesResponse.json();
            const categories = categoriesData.categories.filter(c => c.isActive);
            
            // Parallel loading
            const productPromises = categories.map(async (category) => {
                try {
                    const response = await fetch(`data/${category.slug}.json`);
                    if (!response.ok) return [];
                    const data = await response.json();
                    
                    if (!data.products || !Array.isArray(data.products)) return [];
                    
                    return data.products.map(product => ({
                        ...product,
                        categorySlug: category.slug,
                        categoryName: category.name,
                        nameLower: (product.name || '').toLowerCase(),
                        descLower: (product.description || product.shortDescription || '').toLowerCase(),
                        tagLower: (product.tags || []).map(t => t.toLowerCase()),
                        skuLower: (product.sku || '').toLowerCase(),
                        normalizedImage: normalizeImage(product)
                    }));
                } catch (error) {
                    console.warn(`Could not load ${category.slug} for search:`, error);
                    return [];
                }
            });
            
            const results = await Promise.all(productPromises);
            searchIndex = results.flat();
            isIndexBuilt = true;
            
            if (window.location.hostname === 'localhost') {
                console.log(`🔍 Search index built: ${searchIndex.length} products`);
            }
            
            return searchIndex;
        } catch (error) {
            console.error('Error building search index:', error);
            searchIndex = [];
            return [];
        }
    })();
    
    return indexBuildPromise;
}

// ---------- SCORE AND FILTER IN ONE PASS ----------
function searchAndScore(query, products) {
    if (!query || query.trim() === '') {
        return [];
    }
    
    const searchTerm = query.toLowerCase().trim();
    const searchWords = searchTerm.split(' ').filter(w => w.length > 0);
    
    const scored = [];
    
    for (const product of products) {
        let score = 0;
        
        for (const word of searchWords) {
            // Name matches (highest weight)
            if (product.nameLower === word) score += 100;
            else if (product.nameLower.startsWith(word)) score += 50;
            else if (product.nameLower.includes(word)) score += 30;
            
            // Tag matches
            if (product.tagLower && product.tagLower.some(tag => tag.includes(word))) score += 15;
            
            // SKU matches
            if (product.skuLower && product.skuLower.includes(word)) score += 20;
            
            // Description matches (lowest weight)
            if (product.descLower.includes(word)) score += 5;
        }
        
        // Minimum threshold: at least 5 points to be considered relevant
        if (score >= 5) {
            scored.push({ product, score });
        }
    }
    
    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    
    return scored.map(item => item.product);
}

// ---------- GET SEARCH RESULTS (public API) ----------
async function getSearchResults(searchQuery, options = {}) {
    const { limit = 100 } = options;
    
    await buildSearchIndex();
    
    if (!searchQuery || searchQuery.trim() === '') {
        return [];
    }
    
    const results = searchAndScore(searchQuery, searchIndex);
    return results.slice(0, limit);
}

// ---------- RENDER SEARCH RESULTS (dynamic container) ----------
function renderSearchResults(results, containerElement, options = {}) {
    const { showAddToCart = false, limit = 12 } = options;
    
    if (!containerElement) return;
    
    const displayResults = results.slice(0, limit);
    
    if (!displayResults || displayResults.length === 0) {
        containerElement.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>No products found</h3>
                <p>Try different keywords or browse our categories</p>
                <a href="products.html" class="btn btn-primary mt-3">Browse All Products</a>
            </div>
        `;
        return;
    }
    
    // Use global renderProductCards if available
    if (typeof window.renderProductCards === 'function') {
        window.renderProductCards(displayResults, containerElement.id || 'results');
    } else {
        // Fallback rendering with escaped content
        containerElement.innerHTML = displayResults.map(product => `
            <div class="product-card">
                ${product.featured ? '<div class="featured-badge">FEATURED</div>' : ''}
                <div class="product-image">
                    <img src="${escapeHtml(product.normalizedImage)}" alt="${escapeHtml(product.name)}" loading="lazy">
                </div>
                <div class="product-info">
                    <h3 class="product-title">${escapeHtml(product.name)}</h3>
                    <div class="product-price">${formatCurrency(product.price)}</div>
                    <div class="product-specs">${escapeHtml(product.categoryName)}</div>
                    <div class="product-buttons">
                        <a href="product.html?slug=${escapeHtml(product.slug)}" class="btn-sm btn-outline-sm">View Details</a>
                        <a href="https://wa.me/254726100242?text=${encodeURIComponent(`Hello Magnificent Furnitures,\n\nI am interested in:\n\n${product.name}\nPrice: ${formatCurrency(product.price)}\n\nPlease send me more details.`)}" class="btn-sm btn-whatsapp-sm" target="_blank">WhatsApp</a>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// ---------- LIVE SEARCH UI ----------
class LiveSearchUI {
    constructor(inputElement, resultsContainer, options = {}) {
        this.input = inputElement;
        this.resultsContainer = resultsContainer;
        this.minChars = options.minChars || 1;
        this.debounceTime = options.debounceTime || 300;
        this.maxSuggestions = options.maxSuggestions || 5;
        this.timeout = null;
        
        this.init();
    }
    
    async init() {
        await buildSearchIndex();
        this.input.addEventListener('input', (e) => this.handleInput(e));
        
        // Close results when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.input.contains(e.target) && !this.resultsContainer.contains(e.target)) {
                this.resultsContainer.classList.remove('active');
            }
        });
    }
    
    handleInput(e) {
        const query = e.target.value;
        
        if (this.timeout) clearTimeout(this.timeout);
        
        // 1 char shows suggestions, 2+ shows full results
        if (query.length < this.minChars) {
            this.resultsContainer.classList.remove('active');
            this.resultsContainer.innerHTML = '';
            return;
        }
        
        this.timeout = setTimeout(async () => {
            let results = await getSearchResults(query);
            
            if (query.length === 1) {
                // Single character: show limited suggestions
                results = results.slice(0, this.maxSuggestions);
            }
            
            if (results.length > 0) {
                this.renderSuggestions(results, query);
                this.resultsContainer.classList.add('active');
            } else {
                this.resultsContainer.classList.add('active');
                this.resultsContainer.innerHTML = '<div class="search-no-results">No products found</div>';
            }
        }, this.debounceTime);
    }
    
    renderSuggestions(results, query) {
        this.resultsContainer.innerHTML = results.map(product => `
            <div class="search-result-item" onclick="window.location.href='product.html?slug=${escapeHtml(product.slug)}'">
                <img src="${escapeHtml(product.normalizedImage)}" alt="${escapeHtml(product.name)}" onerror="this.src='https://placehold.co/50x50?text=Product'">
                <div class="search-result-info">
                    <div class="search-result-name">${escapeHtml(product.name)}</div>
                    <div class="search-result-price">${formatCurrency(product.price)}</div>
                    <div class="search-result-category">${escapeHtml(product.categoryName)}</div>
                </div>
            </div>
        `).join('');
        
        if (results.length >= this.maxSuggestions) {
            this.resultsContainer.innerHTML += `
                <div class="search-view-all" onclick="window.location.href='products.html?search=${encodeURIComponent(query)}'">
                    View all ${results.length}+ results →
                </div>
            `;
        }
    }
}

// ---------- HOMEPAGE SEARCH (redirect) ----------
async function executeSearchAndRedirect(query) {
    if (!query || query.trim() === '') {
        window.location.href = 'products.html';
        return;
    }
    window.location.href = `products.html?search=${encodeURIComponent(query.trim())}`;
}

// ---------- PRODUCTS PAGE SEARCH (load results directly) ----------
async function loadSearchResultsPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    const productsGrid = document.getElementById('all-products-grid');
    const pageTitle = document.getElementById('products-page-title');
    
    if (!searchQuery || !productsGrid) return;
    
    if (pageTitle) {
        pageTitle.textContent = `Search Results: "${escapeHtml(searchQuery)}"`;
        document.title = `${searchQuery} | Search Results | Magnificent Furnitures`;
    }
    
    productsGrid.innerHTML = '<div class="loading">Searching products...</div>';
    
    const results = await getSearchResults(searchQuery);
    renderSearchResults(results, productsGrid, { limit: 24 });
}

// ---------- INITIALIZATION ----------
document.addEventListener('DOMContentLoaded', async function() {
    // Pre-build search index in background
    buildSearchIndex();
    
    // Setup homepage live search
    const homepageSearchInput = document.getElementById('homepageSearch');
    const searchResultsContainer = document.getElementById('searchResults');
    
    if (homepageSearchInput && searchResultsContainer) {
        new LiveSearchUI(homepageSearchInput, searchResultsContainer, {
            minChars: 1,
            debounceTime: 300,
            maxSuggestions: 5
        });
    }
    
    // Handle homepage search button
    const homepageSearchBtn = document.getElementById('homepageSearchBtn');
    if (homepageSearchBtn && homepageSearchInput) {
        // Remove any existing listeners to prevent duplicates
        const newBtn = homepageSearchBtn.cloneNode(true);
        homepageSearchBtn.parentNode.replaceChild(newBtn, homepageSearchBtn);
        
        newBtn.addEventListener('click', () => {
            executeSearchAndRedirect(homepageSearchInput.value);
        });
        
        homepageSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                executeSearchAndRedirect(homepageSearchInput.value);
            }
        });
    }
    
    // Load search results on products page
    await loadSearchResultsPage();
});

// ---------- EXPORTS ----------
window.getSearchResults = getSearchResults;
window.renderSearchResults = renderSearchResults;
window.executeSearchAndRedirect = executeSearchAndRedirect;
window.formatCurrency = formatCurrency;
window.escapeHtml = escapeHtml;
window.buildSearchIndex = buildSearchIndex;