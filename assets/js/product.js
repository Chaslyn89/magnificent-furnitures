/* ============================================
   MAGNIFICENT FURNITURES LIMITED - PRODUCT JS
   Single product page - Load by slug from URL
   Version 2.0 - With full product details display
   ============================================ */

// ---------- GLOBAL VARIABLES ----------
let currentProduct = null;

// ---------- GET PRODUCT BY SLUG (across all categories) ----------
async function getProductBySlug(productSlug) {
    try {
        // First, load categories list
        const categoriesResponse = await fetch('data/categories.json');
        const categoriesData = await categoriesResponse.json();
        const categories = categoriesData.categories;
        
        // Search through each category's product file
        for (const category of categories) {
            if (!category.isActive) continue;
            
            try {
                const response = await fetch(`data/${category.slug}.json`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.products && Array.isArray(data.products)) {
                        const found = data.products.find(p => p.slug === productSlug);
                        if (found) {
                            // Add category info to product
                            found.categoryId = category.id;
                            found.categorySlug = category.slug;
                            found.categoryName = category.name;
                            return found;
                        }
                    }
                }
            } catch (error) {
                console.warn(`Could not search in ${category.slug}:`, error);
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error loading product:', error);
        return null;
    }
}

// ---------- GET PRODUCT BY ID (fallback) ----------
async function getProductById(productId) {
    try {
        const categoriesResponse = await fetch('data/categories.json');
        const categoriesData = await categoriesResponse.json();
        const categories = categoriesData.categories;
        
        for (const category of categories) {
            if (!category.isActive) continue;
            
            try {
                const response = await fetch(`data/${category.slug}.json`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.products && Array.isArray(data.products)) {
                        const found = data.products.find(p => p.id === productId);
                        if (found) {
                            found.categoryId = category.id;
                            found.categorySlug = category.slug;
                            found.categoryName = category.name;
                            return found;
                        }
                    }
                }
            } catch (error) {
                console.warn(`Could not search in ${category.slug}:`, error);
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error loading product:', error);
        return null;
    }
}

// ---------- RENDER PRODUCT DETAIL PAGE ----------
function renderProductDetail(product) {
    if (!product) {
        showErrorPage();
        return;
    }
    
    currentProduct = product;
    
    // Update page title and meta
    document.title = `${product.name} | Magnificent Furnitures Limited`;
    updateMetaTags(product);
    
    // Render breadcrumb
    renderBreadcrumb(product);
    
    // Render product images
    renderProductImages(product);
    
    // Render product info
    renderProductInfo(product);
    
    // Render specifications
    renderSpecifications(product);
    
    // Render features list
    renderFeatures(product);
    
    // Setup WhatsApp button
    setupWhatsAppButton(product);
    
    // Load related products
    loadRelatedProducts(product);
}

// ---------- UPDATE META TAGS FOR SEO ----------
function updateMetaTags(product) {
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
    }
    metaDescription.content = product.seoDescription || product.shortDescription || `${product.name} available at Magnificent Furnitures Limited. ${product.description?.substring(0, 160) || ''}`;
    
    // Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.name = 'keywords';
        document.head.appendChild(metaKeywords);
    }
    metaKeywords.content = product.keywords ? product.keywords.join(', ') : `${product.name}, ${product.categoryName}, furniture Kenya`;
    
    // Update Open Graph tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
    }
    ogTitle.content = product.seoTitle || product.name;
    
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescription);
    }
    ogDescription.content = product.seoDescription || product.shortDescription || product.description?.substring(0, 200) || '';
    
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
    }
    ogImage.content = product.images && product.images[0] ? product.images[0] : '';
}

// ---------- RENDER BREADCRUMB ----------
function renderBreadcrumb(product) {
    const breadcrumbContainer = document.getElementById('breadcrumb');
    if (!breadcrumbContainer) return;
    
    breadcrumbContainer.innerHTML = `
        <ul class="breadcrumb-list">
            <li><a href="index.html">Home</a></li>
            <li><a href="products.html">Products</a></li>
            <li><a href="products.html?category=${product.categorySlug}">${product.categoryName}</a></li>
            <li>${product.name}</li>
        </ul>
    `;
}

// ---------- RENDER PRODUCT IMAGES ----------
function renderProductImages(product) {
    const mainImageContainer = document.getElementById('product-main-image');
    const thumbnailsContainer = document.getElementById('product-thumbnails');
    
    if (!mainImageContainer) return;
    
    const images = product.images || [product.thumbnail || 'https://placehold.co/600x400?text=No+Image'];
    const mainImage = images[0];
    
    mainImageContainer.innerHTML = `
        <img id="mainImage" src="${mainImage}" alt="${product.name}" onerror="this.src='https://placehold.co/600x400?text=Product+Image'">
    `;
    
    if (thumbnailsContainer && images.length > 1) {
        thumbnailsContainer.innerHTML = images.map((img, index) => `
            <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeMainImage('${img}', this)">
                <img src="${img}" alt="${product.name} - view ${index + 1}" onerror="this.src='https://placehold.co/100x100?text=Thumb'">
            </div>
        `).join('');
    } else if (thumbnailsContainer) {
        thumbnailsContainer.innerHTML = '';
    }
}

// ---------- CHANGE MAIN IMAGE (for thumbnail click) ----------
window.changeMainImage = function(imageSrc, thumbnailElement) {
    const mainImage = document.getElementById('mainImage');
    if (mainImage) {
        mainImage.src = imageSrc;
        
        // Update active thumbnail styling
        document.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.classList.remove('active');
        });
        thumbnailElement.classList.add('active');
    }
};

// ---------- RENDER PRODUCT INFO ----------
function renderProductInfo(product) {
    const infoContainer = document.getElementById('product-info');
    if (!infoContainer) return;
    
    const hasSale = product.oldPrice && product.oldPrice > product.price;
    const discountPercent = hasSale ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
    
    infoContainer.innerHTML = `
        <div class="product-category">
            <a href="products.html?category=${product.categorySlug}">${product.categoryName}</a>
        </div>
        <h1 class="product-title-detail">${product.name}</h1>
        <div class="product-sku">SKU: ${product.sku || 'N/A'}</div>
        
        <div class="product-price-detail">
            ${hasSale ? `<span class="old-price">${formatCurrency(product.oldPrice)}</span>` : ''}
            <span class="current-price">${formatCurrency(product.price)}</span>
            ${hasSale ? `<span class="discount-badge">Save ${discountPercent}%</span>` : ''}
        </div>
        
        <div class="product-stock">
            ${product.inStock ? 
                `<span class="in-stock">✓ In Stock (${product.stockQuantity || 'Available'})</span>` : 
                `<span class="out-of-stock">✗ Out of Stock</span>`
            }
        </div>
        
        <div class="product-description">
            <h3>Product Description</h3>
            <p>${product.description || product.shortDescription || 'No description available.'}</p>
        </div>
        
        <div class="product-actions">
            <a href="https://wa.me/254726100242?text=${encodeURIComponent(getWhatsAppMessage(product))}" class="btn btn-whatsapp btn-lg" id="whatsappProductBtn" target="_blank">
                💬 Order via WhatsApp
            </a>
            <button class="btn btn-outline btn-lg" onclick="window.location.href='products.html?category=${product.categorySlug}'">
                ← Browse More ${product.categoryName}
            </button>
        </div>
    `;
}

// ---------- RENDER SPECIFICATIONS ----------
function renderSpecifications(product) {
    const specsContainer = document.getElementById('product-specifications');
    if (!specsContainer) return;
    
    if (!product.specifications || Object.keys(product.specifications).length === 0) {
        specsContainer.innerHTML = '<p>No specifications available for this product.</p>';
        return;
    }
    
    // Define which specs to show and their display names
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
    
    let specsHtml = '<table class="specs-table">';
    
    for (const [key, value] of Object.entries(product.specifications)) {
        if (specMapping[key] && value) {
            let displayValue = value;
            if (key === 'colorOptions' && Array.isArray(value)) {
                displayValue = value.join(', ');
            }
            specsHtml += `
                <tr>
                    <td class="spec-label">${specMapping[key]}</td>
                    <td class="spec-value">${displayValue}</td>
                </tr>
            `;
        }
    }
    
    specsHtml += '</table>';
    specsContainer.innerHTML = specsHtml;
}

// ---------- RENDER FEATURES LIST ----------
function renderFeatures(product) {
    const featuresContainer = document.getElementById('product-features');
    if (!featuresContainer) return;
    
    const features = product.specifications?.features || product.features || [];
    
    if (!features.length) {
        featuresContainer.innerHTML = '<p>No features listed for this product.</p>';
        return;
    }
    
    featuresContainer.innerHTML = `
        <ul class="features-list">
            ${features.map(feature => `<li>✓ ${feature}</li>`).join('')}
        </ul>
    `;
}

// ---------- SETUP WHATSAPP BUTTON ----------
function setupWhatsAppButton(product) {
    const whatsappBtn = document.getElementById('whatsappProductBtn');
    if (whatsappBtn) {
        whatsappBtn.href = `https://wa.me/254726100242?text=${encodeURIComponent(getWhatsAppMessage(product))}`;
    }
}

// ---------- GENERATE WHATSAPP MESSAGE ----------
function getWhatsAppMessage(product) {
    return `Hello Magnificent Furnitures,

I am interested in:

🏷️ Product: ${product.name}
💰 Price: ${formatCurrency(product.price)}
📦 SKU: ${product.sku || 'N/A'}

Please send me more details including:
- Availability
- Delivery options
- Payment methods

Thank you!`;
}

// ---------- LOAD RELATED PRODUCTS ----------
async function loadRelatedProducts(product) {
    const relatedContainer = document.getElementById('related-products');
    if (!relatedContainer) return;
    
    try {
        const response = await fetch(`data/${product.categorySlug}.json`);
        if (response.ok) {
            const data = await response.json();
            if (data.products && Array.isArray(data.products)) {
                // Get 4 related products (excluding current)
                let related = data.products.filter(p => p.id !== product.id);
                related = related.slice(0, 4);
                
                if (related.length === 0) {
                    relatedContainer.innerHTML = '<p class="text-center">No related products found.</p>';
                    return;
                }
                
                // Use the existing renderProductCards function
                if (typeof renderProductCards === 'function') {
                    renderProductCards(related, 'related-products');
                } else {
                    // Fallback rendering
                    relatedContainer.innerHTML = related.map(p => `
                        <div class="product-card">
                            <div class="product-image">
                                <img src="${p.thumbnail || p.images?.[0]}" alt="${p.name}" loading="lazy">
                            </div>
                            <div class="product-info">
                                <h3 class="product-title">${p.name}</h3>
                                <div class="product-price">${formatCurrency(p.price)}</div>
                                <a href="product.html?slug=${p.slug}" class="btn-sm btn-outline-sm">View Details</a>
                            </div>
                        </div>
                    `).join('');
                }
            }
        }
    } catch (error) {
        console.error('Error loading related products:', error);
        relatedContainer.innerHTML = '<p class="text-center">Unable to load related products.</p>';
    }
}

// ---------- SHOW ERROR PAGE ----------
function showErrorPage() {
    const container = document.getElementById('product-detail-container');
    if (container) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 80px 20px; text-align: center;">
                <div class="empty-icon">🔍</div>
                <h2>Product Not Found</h2>
                <p>The product you're looking for doesn't exist or has been removed.</p>
                <a href="products.html" class="btn btn-primary mt-3">Browse All Products</a>
            </div>
        `;
    }
    document.title = 'Product Not Found | Magnificent Furnitures Limited';
}

// ---------- FORMAT CURRENCY ----------
function formatCurrency(amount) {
    return 'KES ' + amount.toLocaleString('en-KE');
}

// ---------- INITIALIZE PAGE ----------
document.addEventListener('DOMContentLoaded', async function() {
    // Get product slug from URL
    const urlParams = new URLSearchParams(window.location.search);
    let productSlug = urlParams.get('slug');
    let productId = urlParams.get('id');
    
    let product = null;
    
    if (productSlug) {
        product = await getProductBySlug(productSlug);
    } else if (productId) {
        product = await getProductById(productId);
    }
    
    if (product) {
        renderProductDetail(product);
    } else {
        showErrorPage();
    }
});

// ---------- EXPORT FUNCTIONS FOR GLOBAL USE ----------
window.changeMainImage = changeMainImage;
window.formatCurrency = formatCurrency;