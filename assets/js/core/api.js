/* ============================================
   MAGNIFICENT FURNITURES - API
   Fetch products and categories with caching
   ============================================ */

window.MF = window.MF || {};

window.MF.cache = {
    categories: null,
    products: new Map(),
    searchIndex: null
};

window.MF.fetchCategories = async function(forceRefresh = false) {
    if (window.MF.cache.categories && !forceRefresh) {
        return window.MF.cache.categories;
    }
    
    try {
        const response = await fetch('data/categories.json');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        
        window.MF.cache.categories = data.categories.sort((a, b) => {
            if (a.featured !== b.featured) {
                return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
            }
            return a.name.localeCompare(b.name);
        });
        
        return window.MF.cache.categories;
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
};

// FETCH PRODUCTS BY CATEGORY SLUG
window.MF.fetchProductsByCategory = async function(categorySlug, forceRefresh = false) {
    if (window.MF.cache.products.has(categorySlug) && !forceRefresh) {
        return window.MF.cache.products.get(categorySlug);
    }
    
    try {
        const response = await fetch(`data/${categorySlug}.json`);
        
        if (!response.ok) {
            console.warn(`File not found: data/${categorySlug}.json`);
            window.MF.cache.products.set(categorySlug, []);
            return [];
        }
        
        const text = await response.text();
        
        if (!text || text.trim() === '') {
            console.warn(`Empty file: data/${categorySlug}.json`);
            window.MF.cache.products.set(categorySlug, []);
            return [];
        }
        
        try {
            const data = JSON.parse(text);
            
            if (data.products && Array.isArray(data.products)) {
                data.products.forEach(product => {
                    product.categoryId = data.categoryId;
                    product.categorySlug = data.categorySlug;
                    product.categoryName = data.categoryName;
                });
                window.MF.cache.products.set(categorySlug, data.products);
                return data.products;
            }
            
            window.MF.cache.products.set(categorySlug, []);
            return [];
            
        } catch (parseError) {
            console.error(`Invalid JSON in data/${categorySlug}.json:`, parseError);
            window.MF.cache.products.set(categorySlug, []);
            return [];
        }
        
    } catch (error) {
        console.error(`Error fetching ${categorySlug}:`, error);
        window.MF.cache.products.set(categorySlug, []);
        return [];
    }
};

// UPDATED fetchAllProducts - THIS IS THE ONLY FUNCTION THAT CHANGED
window.MF.fetchAllProducts = async function(forceRefresh = false) {
    const categories = await window.MF.fetchCategories(forceRefresh);
    const activeCategories = categories.filter(c => c.isActive);
    
    console.log('📦 Loading categories:', activeCategories.map(c => c.slug));
    
    const productPromises = activeCategories.map(async (category) => {
        try {
            const products = await window.MF.fetchProductsByCategory(category.slug, forceRefresh);
            console.log(`✅ ${category.slug}: ${products.length} products`);
            return products;
        } catch (error) {
            console.error(`❌ Failed to load ${category.slug}:`, error);
            return [];
        }
    });
    
    const results = await Promise.all(productPromises);
    const totalProducts = results.flat().length;
    console.log(`📦 Total products loaded: ${totalProducts}`);
    return results.flat();
};

window.MF.fetchProductBySlug = async function(slug) {
    const allProducts = await window.MF.fetchAllProducts();
    return allProducts.find(p => p.slug === slug);
};

window.MF.fetchProductById = async function(id) {
    const allProducts = await window.MF.fetchAllProducts();
    return allProducts.find(p => p.id === id);
};

window.MF.buildSearchIndex = async function() {
    if (window.MF.cache.searchIndex) {
        return window.MF.cache.searchIndex;
    }
    
    const allProducts = await window.MF.fetchAllProducts();
    
    window.MF.cache.searchIndex = allProducts.map(product => ({
        ...product,
        nameLower: (product.name || '').toLowerCase(),
        descLower: (product.description || product.shortDescription || '').toLowerCase(),
        tagLower: (product.tags || []).map(t => t.toLowerCase()),
        skuLower: (product.sku || '').toLowerCase(),
        searchText: `${product.name} ${product.description || ''} ${product.shortDescription || ''} ${(product.tags || []).join(' ')} ${product.sku || ''}`.toLowerCase()
    }));
    
    return window.MF.cache.searchIndex;
};