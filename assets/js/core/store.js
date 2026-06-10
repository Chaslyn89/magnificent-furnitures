/* ============================================
   MAGNIFICENT FURNITURES - STORE
   Centralized state management
   ============================================ */

window.MF = window.MF || {};

window.MF.store = {
    products: [],
    categories: [],
    currentProduct: null,
    currentCategory: null,
    filters: {
        category: null,
        minPrice: null,
        maxPrice: null,
        materials: [],
        inStockOnly: false,
        search: null
    },
    sortBy: 'featured',
    subscribers: [],
    
    subscribe: function(callback) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    },
    
    notify: function() {
        this.subscribers.forEach(callback => callback(this.getState()));
    },
    
    getState: function() {
        return {
            products: this.products,
            categories: this.categories,
            currentProduct: this.currentProduct,
            currentCategory: this.currentCategory,
            filters: { ...this.filters },
            sortBy: this.sortBy
        };
    },
    
    setProducts: function(products) {
        this.products = products;
        this.notify();
    },
    
    setCategories: function(categories) {
        this.categories = categories;
        this.notify();
    },
    
    setCurrentProduct: function(product) {
        this.currentProduct = product;
        this.notify();
    },
    
    setCurrentCategory: function(category) {
        this.currentCategory = category;
        this.notify();
    },
    
    updateFilters: function(newFilters) {
        this.filters = { ...this.filters, ...newFilters };
        this.notify();
    },
    
    clearFilters: function() {
        this.filters = {
            category: null,
            minPrice: null,
            maxPrice: null,
            materials: [],
            inStockOnly: false,
            search: null
        };
        this.notify();
    },
    
    setSortBy: function(sortBy) {
        this.sortBy = sortBy;
        this.notify();
    },
    
    getFilteredProducts: function() {
        let filtered = [...this.products];
        
        if (this.filters.category) {
            filtered = filtered.filter(p => p.categorySlug === this.filters.category);
        }
        if (this.filters.minPrice) {
            filtered = filtered.filter(p => p.price >= this.filters.minPrice);
        }
        if (this.filters.maxPrice) {
            filtered = filtered.filter(p => p.price <= this.filters.maxPrice);
        }
        if (this.filters.materials.length > 0) {
            filtered = filtered.filter(p => {
                const material = (p.specifications?.material || '').toLowerCase();
                return this.filters.materials.some(m => material.includes(m.toLowerCase()));
            });
        }
        if (this.filters.inStockOnly) {
            filtered = filtered.filter(p => p.inStock === true);
        }
        if (this.filters.search) {
            const searchLower = this.filters.search.toLowerCase();
            filtered = filtered.filter(p => 
                (p.nameLower && p.nameLower.includes(searchLower)) ||
                (p.descLower && p.descLower.includes(searchLower)) ||
                (p.skuLower && p.skuLower.includes(searchLower))
            );
        }
        
        return this.sortProducts(filtered);
    },
    
    sortProducts: function(products) {
        const sorted = [...products];
        switch (this.sortBy) {
            case 'price-low':
                return sorted.sort((a, b) => a.price - b.price);
            case 'price-high':
                return sorted.sort((a, b) => b.price - a.price);
            case 'name-asc':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'name-desc':
                return sorted.sort((a, b) => b.name.localeCompare(a.name));
            default:
                return sorted.sort((a, b) => {
                    if (a.featured !== b.featured) {
                        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
                    }
                    return a.name.localeCompare(b.name);
                });
        }
    }
};