/* ============================================
   MAGNIFICENT FURNITURES LIMITED - WHATSAPP JS
   WhatsApp integration, pre-filled messages, floating button
   VERSION 3.2 - WITH MOBILE FLOATING BUTTON FIXES
   ============================================ */

// ---------- CONFIGURATION ----------
const WHATSAPP_CONFIG = {
    phoneNumber: '254726100242',
    defaultMessage: 'Hello Magnificent Furnitures, I am interested in your furniture collection. Please share more details.',
    floatingButtonEnabled: true,
    trackInquiries: true,
    showConfirmation: true,
    maxStoredInquiries: 100
};

// ---------- STORAGE KEYS ----------
const STORAGE_KEYS = {
    inquiries: 'mf_whatsapp_inquiries_array',
    lastInquiry: 'mf_last_inquiry'
};

// ---------- PRODUCT STORE (Shared module) ----------
window.ProductStore = window.ProductStore || {
    cache: new Map(),
    
    async getById(id) {
        if (this.cache.has(id)) return this.cache.get(id);
        
        if (window.allProducts && Array.isArray(window.allProducts)) {
            const product = window.allProducts.find(p => p.id === id || p.slug === id);
            if (product) {
                this.cache.set(id, product);
                return product;
            }
        }
        
        try {
            const categoriesResponse = await fetch('data/categories.json');
            const categoriesData = await categoriesResponse.json();
            const categories = categoriesData.categories || [];
            
            for (const category of categories) {
                try {
                    const res = await fetch(`data/${category.slug}.json`);
                    if (res.ok) {
                        const data = await res.json();
                        const found = data.products?.find(p => p.id === id || p.slug === id);
                        if (found) {
                            found.categoryName = category.name;
                            this.cache.set(id, found);
                            return found;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
        } catch (error) {
            console.warn('ProductStore fallback failed:', error);
        }
        
        return null;
    },
    
    async getBySlug(slug) {
        return this.getById(slug);
    }
};

// ---------- SANITIZATION ----------
function sanitizeInput(str) {
    if (!str) return '';
    return str.replace(/[<>]/g, '').trim();
}

// ---------- FORMAT CURRENCY ----------
function formatCurrency(amount) {
    if (typeof window.formatCurrency === 'function') {
        return window.formatCurrency(amount);
    }
    return 'KES ' + Number(amount).toLocaleString('en-KE');
}

// ---------- WHATSAPP URL ----------
function generateWhatsAppUrl(message) {
    return `https://wa.me/${WHATSAPP_CONFIG.phoneNumber}?text=${encodeURIComponent(message)}`;
}

// ---------- SIMPLIFIED MESSAGE TEMPLATES ----------
function generateProductInquiry(product) {
    if (!product) return WHATSAPP_CONFIG.defaultMessage;
    
    const hasSale = product.oldPrice && product.oldPrice > product.price;
    const priceDisplay = hasSale 
        ? `${formatCurrency(product.oldPrice)} → ${formatCurrency(product.price)}`
        : formatCurrency(product.price);
    
    return `Hello Magnificent Furnitures,

Product Inquiry

Product: ${product.name}
Price: ${priceDisplay}
SKU: ${product.sku || 'N/A'}
Category: ${product.categoryName || 'Furniture'}

Please provide:
- Current stock availability
- Delivery options
- Payment methods
- Warranty information

Thank you!`;
}

function generateGeneralInquiry(contactInfo = {}) {
    const name = sanitizeInput(contactInfo.name);
    const email = sanitizeInput(contactInfo.email);
    const phone = sanitizeInput(contactInfo.phone);
    const product = sanitizeInput(contactInfo.product);
    const quantity = sanitizeInput(contactInfo.quantity);
    const message = sanitizeInput(contactInfo.message);
    
    let msg = `Hello Magnificent Furnitures,

New Customer Inquiry`;

    if (name) msg += `\n\nName: ${name}`;
    if (email) msg += `\nEmail: ${email}`;
    if (phone) msg += `\nPhone: ${phone}`;
    if (product) msg += `\nProduct: ${product}`;
    if (quantity) msg += `\nQuantity: ${quantity}`;
    if (message) msg += `\nMessage: ${message}`;

    msg += `\n\nPlease get back to me. Thank you!`;
    
    return msg;
}

// ---------- IMPROVED TRACKING SYSTEM ----------
function trackInquiry(productInfo = null, sourcePage = null) {
    if (!WHATSAPP_CONFIG.trackInquiries) return;
    
    try {
        let inquiries = [];
        const stored = localStorage.getItem(STORAGE_KEYS.inquiries);
        if (stored) {
            try {
                inquiries = JSON.parse(stored);
            } catch (e) {}
        }
        
        const newInquiry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('en-KE'),
            time: new Date().toLocaleTimeString('en-KE'),
            product: productInfo ? {
                id: productInfo.id,
                name: productInfo.name,
                sku: productInfo.sku,
                price: productInfo.price,
                category: productInfo.categoryName || productInfo.category
            } : null,
            sourcePage: sourcePage || window.location.pathname,
            userAgent: navigator.userAgent.substring(0, 200)
        };
        
        inquiries.unshift(newInquiry);
        
        if (inquiries.length > WHATSAPP_CONFIG.maxStoredInquiries) {
            inquiries = inquiries.slice(0, WHATSAPP_CONFIG.maxStoredInquiries);
        }
        
        localStorage.setItem(STORAGE_KEYS.inquiries, JSON.stringify(inquiries));
        localStorage.setItem(STORAGE_KEYS.lastInquiry, JSON.stringify(newInquiry));
        
        if (window.location.hostname === 'localhost') {
            console.log(`📊 WhatsApp inquiry tracked. Total: ${inquiries.length}`);
        }
    } catch (error) {
        console.warn('Could not track inquiry:', error);
    }
}

function getInquiryStats() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.inquiries);
        let inquiries = [];
        if (stored) {
            try {
                inquiries = JSON.parse(stored);
            } catch (e) {}
        }
        
        const lastInquiry = localStorage.getItem(STORAGE_KEYS.lastInquiry);
        
        const productStats = {};
        inquiries.forEach(inq => {
            if (inq.product && inq.product.name) {
                productStats[inq.product.name] = (productStats[inq.product.name] || 0) + 1;
            }
        });
        
        const topProducts = Object.entries(productStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
        
        return {
            totalInquiries: inquiries.length,
            lastInquiry: lastInquiry ? JSON.parse(lastInquiry) : null,
            topProducts: topProducts,
            inquiriesByDay: inquiries.reduce((acc, inq) => {
                const day = inq.date;
                acc[day] = (acc[day] || 0) + 1;
                return acc;
            }, {})
        };
    } catch (error) {
        return { totalInquiries: 0, lastInquiry: null, topProducts: [], inquiriesByDay: {} };
    }
}

// ---------- CONFIRMATION MODAL ----------
function showWhatsAppConfirmation(message, onConfirm) {
    if (!WHATSAPP_CONFIG.showConfirmation) {
        onConfirm();
        return;
    }
    
    let modal = document.getElementById('waConfirmModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'waConfirmModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>Confirm WhatsApp</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>You will be redirected to WhatsApp to continue this conversation.</p>
                    <p style="font-size: 0.85rem; color: #666;">Message preview:</p>
                    <div style="background: #f5f5f5; padding: 10px; border-radius: 8px; font-size: 0.85rem; max-height: 150px; overflow-y: auto;" id="waMessagePreview"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" id="waCancelBtn">Cancel</button>
                    <button class="btn btn-primary" id="waConfirmBtn">Continue →</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }
    
    const preview = modal.querySelector('#waMessagePreview');
    if (preview) {
        preview.textContent = message.length > 300 ? message.substring(0, 300) + '...' : message;
    }
    
    const confirmBtn = modal.querySelector('#waConfirmBtn');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    newConfirmBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        onConfirm();
    });
    
    const cancelBtn = modal.querySelector('#waCancelBtn');
    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.classList.add('active');
}

// ---------- OPEN WHATSAPP ----------
function openWhatsApp(message, product = null, sourcePage = null, skipConfirm = false) {
    trackInquiry(product, sourcePage);
    
    const open = () => {
        const url = generateWhatsAppUrl(message);
        window.open(url, '_blank');
    };
    
    if (skipConfirm) {
        open();
    } else {
        showWhatsAppConfirmation(message, open);
    }
}

// ---------- EVENT DELEGATION FOR PRODUCT BUTTONS ----------
function setupProductWhatsAppDelegation() {
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-whatsapp-product]');
        if (!btn) return;
        
        e.preventDefault();
        
        const productId = btn.getAttribute('data-product-id');
        const productSlug = btn.getAttribute('data-product-slug');
        
        let product = null;
        
        if (productId) {
            product = await window.ProductStore.getById(productId);
        } else if (productSlug) {
            product = await window.ProductStore.getBySlug(productSlug);
        }
        
        if (!product) {
            const productName = btn.getAttribute('data-product-name');
            const productPrice = btn.getAttribute('data-product-price');
            const productSku = btn.getAttribute('data-product-sku');
            
            if (productName) {
                product = {
                    name: productName,
                    price: productPrice,
                    sku: productSku
                };
            }
        }
        
        const message = generateProductInquiry(product);
        openWhatsApp(message, product, window.location.pathname);
    });
}

// ---------- GENERAL INQUIRY FORMS (WITH IDEMPOTENT BINDING) ----------
function setupGeneralInquiryForms() {
    document.addEventListener('submit', (e) => {
        const form = e.target.closest('[data-whatsapp-form]');
        if (!form) return;
        
        // IDEMPOTENT BINDING - Prevent double submission
        if (form.dataset.bound === 'true') return;
        form.dataset.bound = 'true';
        
        e.preventDefault();
        
        const contactInfo = {
            name: form.querySelector('[name="name"]')?.value,
            email: form.querySelector('[name="email"]')?.value,
            phone: form.querySelector('[name="phone"]')?.value,
            product: form.querySelector('[name="product"]')?.value,
            quantity: form.querySelector('[name="quantity"]')?.value,
            message: form.querySelector('[name="message"]')?.value
        };
        
        const inquiryMessage = generateGeneralInquiry(contactInfo);
        openWhatsApp(inquiryMessage, null, window.location.pathname);
        
        if (form.hasAttribute('data-clear-on-submit')) {
            form.reset();
        }
        
        const successMsg = document.getElementById('form-success');
        if (successMsg) {
            successMsg.style.display = 'block';
            setTimeout(() => {
                successMsg.style.display = 'none';
            }, 3000);
        }
        
        // Re-enable form for next submission (after timeout)
        setTimeout(() => {
            delete form.dataset.bound;
        }, 3000);
    });
}

// ---------- FLOATING BUTTON (Mobile Optimized) ----------
function setupFloatingWhatsAppButton() {
    if (!WHATSAPP_CONFIG.floatingButtonEnabled) return;
    
    if (document.getElementById('wa-floating-btn')) return;
    
    const floatingDiv = document.createElement('div');
    floatingDiv.className = 'floating-wa';
    floatingDiv.id = 'wa-floating-btn';
    floatingDiv.innerHTML = `
        <a href="#" class="whatsapp-float" id="floatingWhatsAppBtn" aria-label="Chat on WhatsApp">
            💬
        </a>
    `;
    
    document.body.appendChild(floatingDiv);
    
    const btn = document.getElementById('floatingWhatsAppBtn');
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openWhatsApp(WHATSAPP_CONFIG.defaultMessage, null, window.location.pathname);
        });
    }
}

// ---------- CREATE DIRECT PRODUCT WHATSAPP LINK ----------
function createProductWhatsAppLink(product) {
    const message = generateProductInquiry(product);
    return generateWhatsAppUrl(message);
}

// ---------- RESET INQUIRY STATISTICS ----------
function resetInquiryStats() {
    if (window.location.hostname !== 'localhost') {
        console.warn('Statistics reset only available in development');
        return;
    }
    localStorage.removeItem(STORAGE_KEYS.inquiries);
    localStorage.removeItem(STORAGE_KEYS.lastInquiry);
    console.log('📊 Inquiry statistics reset');
}

// ---------- EXPORT TO GLOBAL ----------
window.openWhatsApp = openWhatsApp;
window.generateProductInquiry = generateProductInquiry;
window.createProductWhatsAppLink = createProductWhatsAppLink;
window.getInquiryStats = getInquiryStats;
window.generateWhatsAppUrl = generateWhatsAppUrl;
window.resetInquiryStats = resetInquiryStats;
window.ProductStore = ProductStore;

// ---------- INITIALIZE ----------
document.addEventListener('DOMContentLoaded', function() {
    setupFloatingWhatsAppButton();
    setupProductWhatsAppDelegation();
    setupGeneralInquiryForms();
    
    if (window.location.hostname === 'localhost') {
        console.log('📱 WhatsApp module initialized');
    }
});