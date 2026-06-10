/* ============================================
   MAGNIFICENT FURNITURES - INIT
   Orchestrator - loads everything in order
   ============================================ */

window.MF = window.MF || {};

window.MF.init = async function() {
    try {
        if (typeof window.MF.showLoading === 'function') {
            window.MF.showLoading();
        }
        
        console.log('🔧 Initializing Magnificent Furnitures...');
        
        const categories = await window.MF.fetchCategories();
        window.MF.store.setCategories(categories);
        console.log(`✅ Loaded ${categories.length} categories`);
        
        const products = await window.MF.fetchAllProducts();
        window.MF.store.setProducts(products);
        console.log(`✅ Loaded ${products.length} products`);
        
        await window.MF.buildSearchIndex();
        console.log('✅ Search index built');
        
        await window.MF.initPage();
        
        if (typeof window.MF.hideLoading === 'function') {
            window.MF.hideLoading();
        }
        
        console.log('✅ MF App initialized successfully');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        if (typeof window.MF.showToast === 'function') {
            window.MF.showToast('Failed to load products. Please refresh the page.', 'error');
        }
        if (typeof window.MF.hideLoading === 'function') {
            window.MF.hideLoading();
        }
    }
};

window.MF.initPage = async function() {
    const path = window.location.pathname;
    const searchParam = window.MF.getUrlParam('search');
    const categoryParam = window.MF.getUrlParam('category');
    const productSlug = window.MF.getUrlParam('slug');
    
    console.log('📍 Current page:', path);
    
    if (path.includes('product.html') && productSlug) {
        const product = await window.MF.fetchProductBySlug(productSlug);
        if (product && typeof window.renderProductDetail === 'function') {
            window.MF.store.setCurrentProduct(product);
            window.renderProductDetail(product);
        } else if (typeof window.showErrorPage === 'function') {
            window.showErrorPage();
        }
    } else if (path.includes('products.html')) {
        if (searchParam) {
            window.MF.store.updateFilters({ search: searchParam });
        } else if (categoryParam) {
            window.MF.store.updateFilters({ category: categoryParam });
            const category = window.MF.store.categories.find(c => c.slug === categoryParam);
            if (category) {
                window.MF.store.setCurrentCategory(category);
                const titleEl = document.getElementById('products-page-title');
                if (titleEl) {
                    titleEl.textContent = category.displayName || category.name;
                }
            }
        }
        if (typeof window.loadProductsPage === 'function') {
            window.loadProductsPage();
        }
    } else if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
        if (typeof window.loadFeaturedProducts === 'function') {
            window.loadFeaturedProducts();
        }
        if (typeof window.renderCategoryGrid === 'function') {
            window.renderCategoryGrid();
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    window.MF.init();
});