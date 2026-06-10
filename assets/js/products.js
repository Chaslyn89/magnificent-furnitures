/* ============================================
   MAGNIFICENT FURNITURES LIMITED - PRODUCTS JS
   Load products, display cards, filtering, featured products
   Version 2.1 - With global exports & renderProductDetail
   ============================================ */

// ---------- GLOBAL VARIABLES ----------
let allProducts = [];
let currentCategory = null;
let currentFilters = {
    category: null,
    minPrice: null,
    maxPrice: null,
    search: null
};

// ---------- LOAD ALL PRODUCTS FROM ALL CATEGORIES ----------
async function loadAllProducts() {
    const categories = await loadCategoriesFromFile();
    allProducts = [];
    
    for (const category of categories) {
        if (!category.isActive) continue;
        
        try {
            const response = await fetch(`data/${category.slug}.json`);
            if (response.ok) {
                const data = await response.json();
                if (data.products && Array.isArray(data.products)) {
                    // Add category info to each product
                    data.products.forEach(product => {
                        product.categoryId = category.id;
                        product.categorySlug = category.slug;
                        product.categoryName = category.name;
                    });
                    allProducts.push(...data.products);
                }
            }
        } catch (error) {
            console.warn(`Could not load ${category.slug}.json:`, error);
        }
    }
    
    return allProducts;
}

// ---------- LOAD CATEGORIES FROM JSON FILE ----------
async function loadCategoriesFromFile() {
    try {
        const response = await fetch('data/categories.json');
        const data = await response.json();
        let categories = data.categories;
        
        // Sort: featured first, then alphabetical
        categories = categories.sort((a, b) => {
            if (a.featured !== b.featured) {
                return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
            }
            return a.name.localeCompare(b.name);
        });
        
        return categories;
    } catch (error) {
        console.error('Error loading categories:', error);
        return [];
    }
}

// ---------- LOAD SINGLE CATEGORY PRODUCTS ----------
async function loadCategoryProducts(categorySlug) {
    try {
        const response = await fetch(`data/${categorySlug}.json`);
        if (!response.ok) {
            throw new Error(`Category ${categorySlug} not found`);
        }
        const data = await response.json();
        
        // Add category info to each product
        if (data.products && Array.isArray(data.products)) {
            data.products.forEach(product => {
                product.categoryId = data.categoryId;
                product.categorySlug = data.categorySlug;
                product.categoryName = data.categoryName;
            });
        }
        
        return data;
    } catch (error) {
        console.error(`Error loading category ${categorySlug}:`, error);
        return null;
    }
}

// ---------- GET PRODUCT BY ID (across all categories) ----------
async function getProductById(productId) {
    const products = await loadAllProducts();
    return products.find(p => p.id === productId);
}

// ---------- GET PRODUCT BY SLUG (across all categories) ----------
async function getProductBySlug(productSlug) {
    const products = await loadAllProducts();
    return products.find(p => p.slug === productSlug);
}

// ---------- RENDER PRODUCT CARDS ----------
function renderProductCards(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>No products found</h3>
                <p>Try adjusting your search or filter criteria</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        if (product.featured) {
            card.classList.add('product-card-featured');
        }
        
        const hasSale = product.oldPrice && product.oldPrice > product.price;
        
        // Get image with fallback
        const productImage = product.thumbnail || (product.images && product.images[0]) || 'https://placehold.co/300x260?text=Product';
        
        card.innerHTML = `
            ${hasSale ? '<div class="sale-badge">SALE</div>' : ''}
            ${product.featured ? '<div class="featured-badge">FEATURED</div>' : ''}
            <div class="product-image">
                <img src="${productImage}" alt="${product.name}" loading="lazy" onerror="this.src='https://placehold.co/300x260?text=No+Image'">
            </div>
            <div class="product-info">
                <h3 class="product-title">${escapeHtml(product.name)}</h3>
                <div class="product-price">
                    ${hasSale ? `<span class="old-price">${formatCurrency(product.oldPrice)}</span>` : ''}
                    ${formatCurrency(product.price)}
                </div>
                <div class="product-specs">${escapeHtml(product.shortDescription || product.specifications?.material || product.categoryName || '')}</div>
                <div class="product-buttons">
                    <a href="product.html?slug=${product.slug}" class="btn-sm btn-outline-sm">View Details</a>
                    <a href="https://wa.me/254726100242?text=${encodeURIComponent(`Hello Magnificent Furnitures,\n\nI am interested in:\n\n${product.name}\nPrice: ${formatCurrency(product.price)}\n\nPlease send me more details.`)}" class="btn-sm btn-whatsapp-sm" target="_blank">WhatsApp</a>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// ---------- ESCAPE HTML (security) ----------
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ---------- FILTER PRODUCTS ----------
function filterProducts(products, filters) {
    let filtered = [...products];
    
    // Filter by category
    if (filters.category) {
        filtered = filtered.filter(p => p.categorySlug === filters.category);
    }
    
    // Filter by price range
    if (filters.minPrice) {
        filtered = filtered.filter(p => p.price >= filters.minPrice);
    }
    if (filters.maxPrice) {
        filtered = filtered.filter(p => p.price <= filters.maxPrice);
    }
    
    // Filter by search query
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchLower) ||
            (p.description && p.description.toLowerCase().includes(searchLower)) ||
            (p.shortDescription && p.shortDescription.toLowerCase().includes(searchLower)) ||
            (p.sku && p.sku.toLowerCase().includes(searchLower)) ||
            (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchLower)))
        );
    }
    
    return filtered;
}

// ---------- SORT PRODUCTS ----------
function sortProducts(products, sortBy = 'featured') {
    const sorted = [...products];
    
    switch (sortBy) {
        case 'price-low':
            return sorted.sort((a, b) => a.price - b.price);
        case 'price-high':
            return sorted.sort((a, b) => b.price - a.price);
        case 'name-asc':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'name-desc':
            return sorted.sort((a, b) => b.name.localeCompare(a.name));
        case 'featured':
        default:
            return sorted.sort((a, b) => {
                if (a.featured !== b.featured) {
                    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
                }
                return a.name.localeCompare(b.name);
            });
    }
}

// ---------- LOAD FEATURED PRODUCTS (for homepage) ----------
async function loadFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if (!container) return;
    
    try {
        const allProductsData = await loadAllProducts();
        const featured = allProductsData.filter(p => p.featured === true);
        const topFeatured = featured.slice(0, 8);
        
        renderProductCards(topFeatured, 'featured-products');
    } catch (error) {
        console.error('Error loading featured products:', error);
        container.innerHTML = '<div class="loading">Unable to load products. Please try again later.</div>';
    }
}

// ---------- LOAD PRODUCTS PAGE (based on URL parameter) ----------
async function loadProductsPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const categorySlug = urlParams.get('category');
    const searchQuery = urlParams.get('search');
    
    let products = [];
    let pageTitle = 'All Products';
    
    if (categorySlug) {
        // Load specific category
        const categoryData = await loadCategoryProducts(categorySlug);
        if (categoryData && categoryData.products) {
            products = categoryData.products;
            pageTitle = categoryData.categoryName;
            currentCategory = categorySlug;
        }
    } else if (searchQuery) {
        // Search across all products
        const allProductsData = await loadAllProducts();
        products = filterProducts(allProductsData, { search: searchQuery });
        pageTitle = `Search Results: "${escapeHtml(searchQuery)}"`;
        currentFilters.search = searchQuery;
    } else {
        // Load all products
        products = await loadAllProducts();
        pageTitle = 'All Products';
    }
    
    // Sort products
    products = sortProducts(products, 'featured');
    
    // Update page title
    const titleElement = document.getElementById('products-page-title');
    if (titleElement) {
        titleElement.textContent = pageTitle;
        document.title = `${pageTitle} | Magnificent Furnitures Limited`;
    }
    
    // Render products
    renderProductCards(products, 'all-products-grid');
    
    // Store products for filtering
    window.currentProducts = products;
    
    // Setup filter listeners if on products page
    setupFilterListeners();
}

// ---------- SETUP FILTER LISTENERS ----------
function setupFilterListeners() {
    const priceFilter = document.getElementById('price-filter');
    const sortSelect = document.getElementById('sort-products');
    
    if (priceFilter) {
        priceFilter.addEventListener('change', function() {
            if (window.currentProducts) {
                let filtered = [...window.currentProducts];
                const value = this.value;
                
                if (value === 'under-10k') {
                    filtered = filtered.filter(p => p.price < 10000);
                } else if (value === '10k-25k') {
                    filtered = filtered.filter(p => p.price >= 10000 && p.price <= 25000);
                } else if (value === '25k-50k') {
                    filtered = filtered.filter(p => p.price >= 25000 && p.price <= 50000);
                } else if (value === 'above-50k') {
                    filtered = filtered.filter(p => p.price > 50000);
                }
                
                renderProductCards(filtered, 'all-products-grid');
            }
        });
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            if (window.currentProducts) {
                const sorted = sortProducts([...window.currentProducts], this.value);
                renderProductCards(sorted, 'all-products-grid');
            }
        });
    }
}

// ---------- FORMAT CURRENCY (KES) ----------
function formatCurrency(amount) {
    return 'KES ' + Number(amount).toLocaleString('en-KE');
}

// ---------- BUILD CATEGORY DROPDOWN DYNAMICALLY ----------
async function buildCategoryDropdown() {
    const categories = await loadCategoriesFromFile();
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    if (!dropdownMenu) return;
    
    dropdownMenu.innerHTML = '';
    
    // Add featured categories first
    const featuredCategories = categories.filter(cat => cat.featured).slice(0, 8);
    
    featuredCategories.forEach(cat => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="products.html?category=${cat.slug}">${escapeHtml(cat.name)}</a>`;
        dropdownMenu.appendChild(li);
    });
    
    // Add separator and "All Categories" link
    const allLi = document.createElement('li');
    allLi.innerHTML = '<a href="products.html">All Categories →</a>';
    dropdownMenu.appendChild(allLi);
}

// ---------- RENDER CATEGORY GRID ON HOMEPAGE ----------
async function renderCategoryGrid() {
    const categoryGrid = document.getElementById('categoryGrid');
    if (!categoryGrid) return;
    
    const categories = await loadCategoriesFromFile();
    const featuredCategories = categories.filter(cat => cat.featured).slice(0, 6);
    
    categoryGrid.innerHTML = '';
    
    featuredCategories.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'category-card';
        const catImage = cat.image || `https://placehold.co/300x200?text=${encodeURIComponent(cat.name)}`;
        card.innerHTML = `
            <div class="category-image">
                <img src="${catImage}" alt="${escapeHtml(cat.name)}" loading="lazy" onerror="this.src='https://placehold.co/300x200?text=${encodeURIComponent(cat.name)}'">
            </div>
            <h3>${escapeHtml(cat.name)}</h3>
            <p>${cat.count}+ models</p>
            <a href="products.html?category=${cat.slug}" class="btn-category">View →</a>
        `;
        categoryGrid.appendChild(card);
    });
}

// ---------- RENDER PRODUCT DETAIL PAGE ----------
function renderProductDetail(product) {
    const container = document.getElementById('product-detail-container');
    if (!container) return;
    
    const productImage = product.thumbnail || (product.images && product.images[0]) || 'https://placehold.co/600x600?text=Product';
    const hasSale = product.oldPrice && product.oldPrice > product.price;
    
    container.innerHTML = `
        <div class="product-detail" style="display:flex;gap:40px;padding:40px;flex-wrap:wrap;max-width:1200px;margin:0 auto;">
            <div class="product-detail-image" style="flex:1;min-width:280px;">
                <img src="${productImage}" alt="${escapeHtml(product.name)}" style="width:100%;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
            </div>
            <div class="product-detail-info" style="flex:1;">
                <h1 style="font-size:2rem;margin-bottom:15px;">${escapeHtml(product.name)}</h1>
                <div class="product-price" style="font-size:2rem;color:#D4A017;font-weight:700;margin-bottom:15px;">
                    ${hasSale ? `<span style="text-decoration:line-through;font-size:1.2rem;color:#999;margin-right:10px;">${formatCurrency(product.oldPrice)}</span>` : ''}
                    ${formatCurrency(product.price)}
                </div>
                <div class="product-category" style="margin-bottom:15px;">
                    <strong>Category:</strong> ${escapeHtml(product.categoryName || '')}
                </div>
                <div class="product-description" style="margin-bottom:25px;line-height:1.8;">
                    <p>${escapeHtml(product.description || product.shortDescription || 'No description available.')}</p>
                </div>
                ${product.sku ? `<div class="product-sku" style="margin-bottom:15px;color:#666;"><strong>SKU:</strong> ${escapeHtml(product.sku)}</div>` : ''}
                <a href="https://wa.me/254726100242?text=${encodeURIComponent(`Hello Magnificent Furnitures,\n\nI am interested in:\n\n${product.name}\nPrice: ${formatCurrency(product.price)}\n\nPlease send me more details.`)}" class="btn btn-whatsapp" style="display:inline-block;padding:14px 35px;font-size:1.1rem;">📱 Order on WhatsApp</a>
            </div>
        </div>
    `;
}

// ---------- MAKE FUNCTIONS GLOBAL (for search.js and others) ----------
window.renderProductCards = renderProductCards;
window.formatCurrency = formatCurrency;
window.loadFeaturedProducts = loadFeaturedProducts;
window.renderCategoryGrid = renderCategoryGrid;
window.filterProducts = filterProducts;
window.sortProducts = sortProducts;
window.renderProductDetail = renderProductDetail;
window.loadAllProducts = loadAllProducts;
window.loadCategoriesFromFile = loadCategoriesFromFile;
window.escapeHtml = escapeHtml;

// ---------- INITIALIZE BASED ON PAGE ----------
document.addEventListener('DOMContentLoaded', async function() {
    // Build category dropdown on all pages
    await buildCategoryDropdown();
    
    // Render category grid on homepage
    if (document.getElementById('categoryGrid')) {
        await renderCategoryGrid();
    }
    
    // Load products on products page
    if (document.getElementById('all-products-grid')) {
        await loadProductsPage();
    }
    
    // Load featured products on homepage
    if (document.getElementById('featured-products')) {
        await loadFeaturedProducts();
    }
});