/* ============================================
   MAGNIFICENT FURNITURES - UTILITIES
   Shared helper functions - MAIN GLOBAL
   ============================================ */

// Create the ONE global MF object
window.MF = window.MF || {};

// ---------- FORMAT CURRENCY (KES) ----------
window.MF.formatCurrency = function(amount) {
    if (!amount && amount !== 0) return 'KES 0';
    return 'KES ' + Number(amount).toLocaleString('en-KE');
};

// ---------- ESCAPE HTML (prevent XSS) ----------
window.MF.escapeHtml = function(str) {
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
};

// ---------- DEBOUNCE (for search inputs) ----------
window.MF.debounce = function(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
};

// ---------- THROTTLE (for scroll events) ----------
window.MF.throttle = function(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// ---------- VALIDATE PHONE (Kenyan format) ----------
window.MF.validatePhone = function(phone) {
    const cleaned = phone.replace(/\s/g, '');
    const regex = /^(07\d{8}|2547\d{8}|\+2547\d{8})$/;
    return regex.test(cleaned);
};

// ---------- VALIDATE EMAIL ----------
window.MF.validateEmail = function(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

// ---------- GET URL PARAMETER ----------
window.MF.getUrlParam = function(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
};

// ---------- SHOW TOAST NOTIFICATION ----------
window.MF.showToast = function(message, type = 'info') {
    document.querySelectorAll('.toast').forEach(toast => toast.remove());
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    const typeColors = { success: '#10B981', error: '#EF4444', warning: '#F59E0B', info: '#0F172A' };
    toast.style.backgroundColor = typeColors[type] || typeColors.info;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast && toast.remove) toast.remove(); }, 3000);
};

// ---------- SHOW/HIDE LOADING ----------
window.MF.showLoading = function() {
    const existing = document.getElementById('loadingOverlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);
};

window.MF.hideLoading = function() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.remove();
};