/* ============================================
   MAGNIFICENT FURNITURES LIMITED - MAIN JS
   Core functionality - Mobile menu, dropdowns, utilities
   VERSION 3.0 - JOYSISTERLOCKS STYLE MOBILE MENU
   ============================================ */

// ---------- CENTRALIZED DOM REFERENCES ----------
const DOM = {
    mobileMenuBtn: null,
    navLinks: null,
    navbar: null,
    mobileNav: null
};

// ---------- WAIT FOR DOM ----------
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize DOM references
    DOM.mobileMenuBtn = document.getElementById('mobileMenuBtn');
    DOM.navLinks = document.getElementById('navLinks');
    DOM.navbar = document.querySelector('.navbar');
    
    // ========== MOBILE MENU (EXACTLY LIKE JOYSISTERLOCKS) ==========
    const body = document.body;
    
    // Create mobile menu from desktop nav links
    if (DOM.navLinks && !document.querySelector('.nav-links-mobile')) {
        const mobileNav = document.createElement('div');
        mobileNav.className = 'nav-links-mobile';
        // Clone the desktop navigation content
        const navClone = DOM.navLinks.cloneNode(true);
        mobileNav.appendChild(navClone);
        document.body.appendChild(mobileNav);
        DOM.mobileNav = mobileNav;
        
        // Update all links in mobile menu to work properly
        DOM.mobileNav.querySelectorAll('a').forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('#')) {
                link.addEventListener('click', function(e) {
                    closeMobileMenu();
                });
            }
        });
        
        // Handle dropdown toggles in mobile menu
        DOM.mobileNav.querySelectorAll('.dropdown').forEach(dropdown => {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            if (toggle) {
                toggle.addEventListener('click', function(e) {
                    e.preventDefault();
                    dropdown.classList.toggle('active');
                });
            }
        });
    } else {
        DOM.mobileNav = document.querySelector('.nav-links-mobile');
    }
    
    // Create overlay if it doesn't exist
    let menuOverlay = document.querySelector('.mobile-overlay');
    if (!menuOverlay) {
        menuOverlay = document.createElement('div');
        menuOverlay.className = 'mobile-overlay';
        document.body.appendChild(menuOverlay);
    }
    
    function openMobileMenu() {
        if (DOM.mobileNav) DOM.mobileNav.classList.add('active');
        menuOverlay.classList.add('active');
        body.classList.add('no-scroll');
        if (DOM.mobileMenuBtn) {
            DOM.mobileMenuBtn.innerHTML = '✕';
        }
    }
    
    function closeMobileMenu() {
        if (DOM.mobileNav) DOM.mobileNav.classList.remove('active');
        menuOverlay.classList.remove('active');
        body.classList.remove('no-scroll');
        if (DOM.mobileMenuBtn) {
            DOM.mobileMenuBtn.innerHTML = '<span></span><span></span><span></span>';
        }
    }
    
    if (DOM.mobileMenuBtn) {
        DOM.mobileMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (DOM.mobileNav && DOM.mobileNav.classList.contains('active')) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });
    }
    
    // Close menu when clicking overlay
    menuOverlay.addEventListener('click', function(e) {
        e.preventDefault();
        closeMobileMenu();
    });
    
    // Close menu when pressing Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && DOM.mobileNav && DOM.mobileNav.classList.contains('active')) {
            closeMobileMenu();
        }
    });
    
    // ---------- COMBINED SCROLL HANDLER (Performance) ----------
    let lastScroll = window.pageYOffset;
    let ticking = false;
    
    function handleScroll() {
        if (!DOM.navbar) return;
        
        const currentScroll = window.pageYOffset;
        const clampedScroll = Math.max(0, currentScroll);
        
        // Hide/show navbar based on direction
        if (clampedScroll > lastScroll && clampedScroll > 100) {
            DOM.navbar.style.transform = 'translateY(-100%)';
        } else {
            DOM.navbar.style.transform = 'translateY(0)';
        }
        
        // Back to top button visibility
        const backToTop = document.querySelector('.back-to-top');
        if (backToTop) {
            if (clampedScroll > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }
        
        lastScroll = clampedScroll;
        ticking = false;
    }
    
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(handleScroll);
            ticking = true;
        }
    });
    
    // ---------- MOBILE DROPDOWN HANDLING (Desktop) ----------
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        if (toggle) {
            toggle.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    dropdown.classList.toggle('active');
                }
            });
        }
    });
    
    // ---------- ACTIVE NAVIGATION LINK (Fixed path comparison) ----------
    const currentPath = window.location.pathname.replace(/\/$/, '').split('?')[0];
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    document.querySelectorAll('.nav-links li a, .nav-links-mobile li a').forEach(link => {
        const linkPath = new URL(link.href, window.location.origin).pathname.replace(/\/$/, '');
        const linkPage = linkPath.split('/').pop() || 'index.html';
        
        if (linkPage === currentPage) {
            link.style.color = 'var(--accent-color)';
        }
    });
    
    // ---------- BACK TO TOP BUTTON (CSS class only, no inline styles) ----------
    const createBackToTopButton = () => {
        const btn = document.createElement('button');
        btn.innerHTML = '↑';
        btn.setAttribute('aria-label', 'Back to top');
        btn.classList.add('back-to-top');
        document.body.appendChild(btn);
        
        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    };
    
    if (window.innerWidth > 768) {
        createBackToTopButton();
    }
    
    // ---------- TOAST SYSTEM (Prevents stacking) ----------
    window.showToast = function(message, type = 'info') {
        // Remove existing toasts first
        document.querySelectorAll('.toast').forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        
        const typeColors = {
            success: 'var(--success-color)',
            error: '#EF4444',
            warning: '#F59E0B',
            info: 'var(--primary-color)'
        };
        toast.style.backgroundColor = typeColors[type] || typeColors.info;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast && toast.remove) toast.remove();
        }, 3000);
    };
    
    // ---------- LOADING SPINNER ----------
    window.showLoading = function() {
        const existing = document.getElementById('loadingOverlay');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(overlay);
    };
    
    window.hideLoading = function() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.remove();
    };
    
    // ---------- LAZY LOADING IMAGES (IntersectionObserver) ----------
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                    }
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // ---------- SMOOTH SCROLL FOR ANCHORS ----------
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId && targetId !== '#') {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });
    
    // ---------- FORM DOUBLE-SUBMIT PROTECTION (Safe version) ----------
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', async function(e) {
            const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
            if (!submitBtn) return;
            
            if (submitBtn.hasAttribute('data-submitting')) {
                e.preventDefault();
                return;
            }
            
            submitBtn.setAttribute('data-submitting', 'true');
            submitBtn.disabled = true;
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            
            // Re-enable after fetch (to be used with actual form submission)
            // This is a safety reset - actual re-enable should happen in fetch response
            setTimeout(() => {
                if (submitBtn.hasAttribute('data-submitting')) {
                    submitBtn.removeAttribute('data-submitting');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }, 10000); // 10 second safety timeout
        });
    });
    
    // ---------- CLOSE MODAL ON ESC ----------
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
    
    // ---------- RESIZE HANDLER ----------
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && DOM.mobileNav) {
            if (DOM.mobileNav.classList.contains('active')) {
                closeMobileMenu();
            }
            document.querySelectorAll('.dropdown').forEach(dropdown => dropdown.classList.remove('active'));
        }
    });
    
    // ---------- DEV LOGGING ----------
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🔧 Magnificent Furnitures - Development Mode');
        console.log('✅ JavaScript loaded successfully');
    }
});