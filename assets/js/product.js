/* ============================================
   MAGNIFICENT FURNITURES - PRODUCT JS
   Single product page - Load from Supabase
   ============================================ */

let currentProduct = null;

// ============================================
// GET PRODUCT BY SLUG FROM SUPABASE
// ============================================
async function getProductBySlug(productSlug) {
    try {
        console.log('🔍 Looking for product with slug:', productSlug);
        
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('slug', productSlug)
            .single();

        if (error) {
            console.error('❌ Error fetching product:', error);
            return null;
        }
        
        console.log('✅ Product found:', data);
        return data;
    } catch (error) {
        console.error('❌ Error loading product:', error);
        return null;
    }
}

// ============================================
// FORMAT CURRENCY
// ============================================
function formatCurrency(amount) {
    return 'KES ' + Number(amount).toLocaleString('en-KE');
}

// ============================================
// RENDER PRODUCT
// ============================================
function renderProduct(product) {
    if (!product) {
        showErrorPage();
        return;
    }
    
    currentProduct = product;
    console.log('🎨 Rendering product:', product);
    
    // Update page title
    document.title = product.name + ' | Magnificent Furnitures Limited';
    
    // Hide skeleton, show content
    const skeleton = document.getElementById('skeletonLoader');
    const content = document.getElementById('productContent');
    const error = document.getElementById('errorState');
    
    if (skeleton) skeleton.style.display = 'none';
    if (error) error.style.display = 'none';
    if (content) content.style.display = 'block';
    
    // Update breadcrumb - ONLY show category in breadcrumb
    const breadcrumb = document.getElementById('breadcrumbCategory');
    if (breadcrumb) {
        breadcrumb.innerHTML = '<a href="products.html?category=' + product.category_slug + '">' + (product.category_slug || 'Category') + '</a>';
    }
    
    // Build product HTML
    const container = document.getElementById('productContent');
    if (!container) {
        console.error('❌ productContent element not found');
        return;
    }
    
    const hasSale = product.old_price && product.old_price > product.price;
    const discountPercent = hasSale ? Math.round(((product.old_price - product.price) / product.old_price) * 100) : 0;
    const saveAmount = hasSale ? product.old_price - product.price : 0;
    
    const mainImage = product.thumbnail || 'https://placehold.co/600x400?text=No+Image';
    const images = product.images || [mainImage];
    
    // Build thumbnails HTML
    let thumbnailsHtml = '';
    if (images && images.length > 0) {
        thumbnailsHtml = images.map((img, index) => `
            <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeImage('${img}', this)">
                <img src="${img}" alt="${product.name}" onerror="this.src='https://placehold.co/100x100?text=No+Image'">
            </div>
        `).join('');
    }
    
    // Build specs HTML - ONLY show if specs exist
    let specsHtml = '';
    if (product.specifications && Object.keys(product.specifications).length > 0) {
        const specMapping = {
            material: 'Material',
            frameMaterial: 'Frame Material',
            color: 'Color',
            colorOptions: 'Available Colors',
            dimensions: 'Dimensions',
            seatHeight: 'Seat Height',
            weightCapacity: 'Weight Capacity',
            weight: 'Weight',
            assembly: 'Assembly',
            warranty: 'Warranty'
        };
        
        let tableRows = '';
        for (const [key, value] of Object.entries(product.specifications)) {
            if (specMapping[key] && value) {
                let displayValue = value;
                if (key === 'colorOptions' && Array.isArray(value)) {
                    displayValue = value.join(', ');
                }
                tableRows += `
                    <tr>
                        <td class="spec-label">${specMapping[key]}</td>
                        <td class="spec-value">${displayValue}</td>
                    </tr>
                `;
            }
        }
        
        if (tableRows) {
            specsHtml = `
                <div class="specs-section">
                    <h3>Specifications</h3>
                    <table class="specs-table">${tableRows}</table>
                </div>
            `;
        }
    }
    
    // Build features HTML - ONLY show if features exist
    let featuresHtml = '';
    const features = product.specifications?.features || [];
    if (features.length > 0) {
        featuresHtml = `
            <div class="features-section">
                <h3>Features</h3>
                <ul class="features-list">${features.map(f => `<li>${f}</li>`).join('')}</ul>
            </div>
        `;
    }
    
    // Build WhatsApp message
    const waMessage = `Hello Magnificent Furnitures,%0A%0AI am interested in:%0A%0A🏷️ Product: ${product.name}%0A💰 Price: ${formatCurrency(product.price)}%0A📦 SKU: ${product.sku || 'N/A'}%0A%0APlease send me more details including availability, delivery options, and payment methods.%0A%0AThank you!`;
    
    container.innerHTML = `
        <div class="product-detail-grid">
            <!-- Gallery -->
            <div class="product-gallery">
                <div class="product-main-image">
                    <img id="mainImage" src="${mainImage}" alt="${product.name}" onerror="this.src='https://placehold.co/600x400?text=No+Image'">
                </div>
                <div class="product-thumbnails">
                    ${thumbnailsHtml}
                </div>
            </div>
            
            <!-- Info -->
            <div class="product-info">
                <div class="product-category">
                    <a href="products.html?category=${product.category_slug}">${product.category_slug || 'Category'}</a>
                </div>
                <h1 class="product-title-detail">${product.name}</h1>
                <div class="product-sku">SKU: ${product.sku || 'N/A'}</div>
                
                <div class="product-price-detail">
                    ${hasSale ? `<span class="old-price">${formatCurrency(product.old_price)}</span>` : ''}
                    <span class="current-price">${formatCurrency(product.price)}</span>
                    ${hasSale ? `<span class="discount-badge">-${discountPercent}%</span>` : ''}
                    ${hasSale ? `<span class="save-badge">Save KES ${saveAmount.toLocaleString()}</span>` : ''}
                </div>
                
                <div class="product-stock">
                    ${product.in_stock ? 
                        `<span class="in-stock">✅ In Stock (${product.stock_quantity || 'Available'})</span>` : 
                        `<span class="out-of-stock">❌ Out of Stock</span>`
                    }
                </div>
                
                <div class="product-description">
                    <h3>Product Description</h3>
                    <p>${product.description || product.short_description || 'No description available.'}</p>
                </div>
                
                <div class="product-actions">
                    <a href="https://wa.me/254726100242?text=${waMessage}" class="btn btn-whatsapp btn-lg" target="_blank">
                        💬 Order via WhatsApp
                    </a>
                    <a href="products.html?category=${product.category_slug}" class="btn btn-outline btn-lg">
                        ← Browse More
                    </a>
                </div>
            </div>
        </div>
        
        ${specsHtml}
        ${featuresHtml}
    `;
    
    console.log('✅ Product rendered successfully');
}

// ============================================
// CHANGE MAIN IMAGE
// ============================================
function changeImage(src, element) {
    const mainImage = document.getElementById('mainImage');
    if (mainImage) {
        mainImage.src = src;
    }
    document.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
    });
    if (element) {
        element.classList.add('active');
    }
}

// ============================================
// LOAD RELATED PRODUCTS
// ============================================
async function loadRelatedProducts(product) {
    const container = document.getElementById('relatedProductsGrid');
    if (!container) return;
    
    try {
        const allProducts = await fetchAllProducts();
        const related = allProducts
            .filter(p => p.id !== product.id && p.category_slug === product.category_slug)
            .slice(0, 4);
        
        if (related.length === 0) {
            const section = document.getElementById('relatedProductsSection');
            if (section) section.style.display = 'none';
            return;
        }
        
        const section = document.getElementById('relatedProductsSection');
        if (section) section.style.display = 'block';
        
        container.innerHTML = related.map(p => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${p.thumbnail || 'https://placehold.co/300x260?text=No+Image'}" alt="${p.name}" loading="lazy" onerror="this.src='https://placehold.co/300x260?text=No+Image'">
                </div>
                <div class="product-info">
                    <h3 class="product-title">${p.name}</h3>
                    <div class="product-price">${formatCurrency(p.price)}</div>
                    ${p.old_price ? `<span class="old-price" style="font-size:0.8rem;">${formatCurrency(p.old_price)}</span>` : ''}
                    <a href="product.html?slug=${p.slug}" class="btn-sm btn-outline-sm" style="margin-top:10px;display:inline-block;">View Details</a>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading related products:', error);
        const section = document.getElementById('relatedProductsSection');
        if (section) section.style.display = 'none';
    }
}

// ============================================
// SHOW ERROR PAGE
// ============================================
function showErrorPage() {
    const skeleton = document.getElementById('skeletonLoader');
    const content = document.getElementById('productContent');
    const error = document.getElementById('errorState');
    
    if (skeleton) skeleton.style.display = 'none';
    if (content) content.style.display = 'none';
    if (error) error.style.display = 'block';
    
    document.title = 'Product Not Found | Magnificent Furnitures Limited';
}

// ============================================
// WHATSAPP FUNCTION FOR STICKY CTA
// ============================================
window.triggerProductWhatsApp = function() {
    if (currentProduct) {
        const message = `Hello Magnificent Furnitures,%0A%0AI am interested in:%0A%0A🏷️ Product: ${currentProduct.name}%0A💰 Price: ${formatCurrency(currentProduct.price)}%0A📦 SKU: ${currentProduct.sku || 'N/A'}%0A%0APlease send me more details.%0A%0AThank you!`;
        window.open('https://wa.me/254726100242?text=' + message, '_blank');
    }
};

// ============================================
// INITIALIZE PAGE
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔄 Product page loaded');
    
    // Make sure supabaseClient is available
    if (typeof supabaseClient === 'undefined') {
        console.error('❌ supabaseClient is not defined. Make sure supabase-client.js is loaded.');
        showErrorPage();
        return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const productSlug = urlParams.get('slug');
    const productId = urlParams.get('id');
    
    console.log('📋 URL params:', { productSlug, productId });
    
    if (!productSlug && !productId) {
        console.log('❌ No slug or ID provided');
        showErrorPage();
        return;
    }
    
    let product = null;
    
    if (productSlug) {
        product = await getProductBySlug(productSlug);
    } else if (productId) {
        product = await getProductById(productId);
    }
    
    console.log('📦 Product result:', product);
    
    if (product) {
        renderProduct(product);
        loadRelatedProducts(product);
    } else {
        showErrorPage();
    }
});

// Make functions available globally
window.changeImage = changeImage;
window.formatCurrency = formatCurrency;