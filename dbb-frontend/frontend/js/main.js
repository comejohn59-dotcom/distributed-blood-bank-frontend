// Main JavaScript for BloodConnect Website
document.addEventListener('DOMContentLoaded', function() {
    initializeMainFunctionality();
});

function initializeMainFunctionality() {
    // Initialize navigation
    initializeNavigation();
    
    // Initialize scroll effects
    initializeScrollEffects();
    
    // Initialize animations
    initializeAnimations();
    
    // Initialize utility functions
    initializeUtilities();
    
    // Initialize blood type compatibility checker
    initializeBloodCompatibility();
}

// Navigation functionality
function initializeNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Mobile menu toggle
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
            
            // Animate hamburger
            const spans = navToggle.querySelectorAll('span');
            spans.forEach((span, index) => {
                span.style.transform = navToggle.classList.contains('active') 
                    ? `rotate(${index === 0 ? '45deg' : index === 1 ? '0deg' : '-45deg'}) translate(${index === 1 ? '100px' : '0px'}, ${index === 0 ? '6px' : index === 2 ? '-6px' : '0px'})`
                    : 'none';
                span.style.opacity = index === 1 && navToggle.classList.contains('active') ? '0' : '1';
            });
        });
    }
    
    // Close mobile menu when clicking on links
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    });
    
    // Navbar scroll effect
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add/remove scrolled class
        if (scrollTop > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Hide/show navbar on scroll
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
}

// Scroll effects and animations
function initializeScrollEffects() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Parallax effect for hero sections
    const heroSections = document.querySelectorAll('.hero-section, .hero');
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        
        heroSections.forEach(hero => {
            const rate = scrolled * -0.5;
            hero.style.transform = `translateY(${rate}px)`;
        });
    });
}

// Animation system
function initializeAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Special handling for counters
                if (entry.target.classList.contains('counter')) {
                    animateCounter(entry.target);
                }
                
                // Special handling for progress bars
                if (entry.target.classList.contains('progress-bar')) {
                    animateProgressBar(entry.target);
                }
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll(
        '.fade-in-up, .blood-card, .step, .feature-card, .stat-card, .counter, .progress-bar, .testimonial-card'
    );
    
    animateElements.forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });
}

// Counter animation
function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target')) || parseInt(element.textContent);
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    };
    
    updateCounter();
}

// Progress bar animation
function animateProgressBar(element) {
    const progress = element.querySelector('.progress-fill');
    const percentage = element.getAttribute('data-percentage') || '0';
    
    if (progress) {
        setTimeout(() => {
            progress.style.width = percentage + '%';
        }, 200);
    }
}

// Utility functions
function initializeUtilities() {
    // Back to top button
    createBackToTopButton();
    
    // Loading states
    initializeLoadingStates();
    
    // Form utilities
    initializeFormUtilities();
    
    // Modal utilities
    initializeModalUtilities();
}

function createBackToTopButton() {
    const backToTop = document.createElement('button');
    backToTop.className = 'back-to-top';
    backToTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTop.setAttribute('aria-label', 'Back to top');
    
    document.body.appendChild(backToTop);
    
    // Show/hide based on scroll position
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });
    
    // Scroll to top on click
    backToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

function initializeLoadingStates() {
    // Add loading spinner utility
    window.showLoadingSpinner = function(element) {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        element.appendChild(spinner);
        element.classList.add('loading');
    };
    
    window.hideLoadingSpinner = function(element) {
        const spinner = element.querySelector('.loading-spinner');
        if (spinner) {
            spinner.remove();
        }
        element.classList.remove('loading');
    };
}

function initializeFormUtilities() {
    // Auto-resize textareas
    document.querySelectorAll('textarea').forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    });
    
    // Phone number formatting
    document.querySelectorAll('input[type="tel"]').forEach(input => {
        input.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            if (value.length >= 6) {
                value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
            } else if (value.length >= 3) {
                value = value.replace(/(\d{3})(\d{0,3})/, '($1) $2');
            }
            this.value = value;
        });
    });
    
    // Form validation utilities
    window.validateForm = function(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                showFieldError(input, 'This field is required');
                isValid = false;
            }
        });
        
        return isValid;
    };
    
    window.showFieldError = function(field, message) {
        // Remove existing error
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error class
        field.classList.add('error');
        
        // Create error message
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        
        field.parentNode.appendChild(errorElement);
    };
    
    window.clearFieldError = function(field) {
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
        field.classList.remove('error');
    };
}

function initializeModalUtilities() {
    // Global modal functions
    window.openModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Focus trap
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        }
    };
    
    window.closeModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };
    
    // Close modals with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal-overlay[style*="flex"]');
            openModals.forEach(modal => {
                modal.style.display = 'none';
            });
            document.body.style.overflow = 'auto';
        }
    });
    
    // Close modals when clicking outside
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal-overlay')) {
            event.target.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

// Blood type compatibility checker
function initializeBloodCompatibility() {
    window.getCompatibleDonors = function(recipientType) {
        const compatibility = {
            'A+': ['A+', 'A-', 'O+', 'O-'],
            'A-': ['A-', 'O-'],
            'B+': ['B+', 'B-', 'O+', 'O-'],
            'B-': ['B-', 'O-'],
            'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            'AB-': ['A-', 'B-', 'AB-', 'O-'],
            'O+': ['O+', 'O-'],
            'O-': ['O-']
        };
        
        return compatibility[recipientType] || [];
    };
    
    window.getCompatibleRecipients = function(donorType) {
        const compatibility = {
            'A+': ['A+', 'AB+'],
            'A-': ['A+', 'A-', 'AB+', 'AB-'],
            'B+': ['B+', 'AB+'],
            'B-': ['B+', 'B-', 'AB+', 'AB-'],
            'AB+': ['AB+'],
            'AB-': ['AB+', 'AB-'],
            'O+': ['A+', 'B+', 'AB+', 'O+'],
            'O-': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        };
        
        return compatibility[donorType] || [];
    };
}

// Notification system
window.showNotification = function(message, type = 'info', duration = 5000) {
    // Remove existing notifications of the same type
    const existingNotifications = document.querySelectorAll(`.notification.${type}`);
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 type === 'warning' ? 'fa-exclamation-triangle' : 
                 'fa-info-circle';
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto remove
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove('show');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, duration);
    }
};

// Local storage utilities
window.BloodConnectStorage = {
    set: function(key, value) {
        try {
            localStorage.setItem(`bloodconnect_${key}`, JSON.stringify(value));
        } catch (e) {
            console.warn('LocalStorage not available:', e);
        }
    },
    
    get: function(key) {
        try {
            const item = localStorage.getItem(`bloodconnect_${key}`);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.warn('LocalStorage not available:', e);
            return null;
        }
    },
    
    remove: function(key) {
        try {
            localStorage.removeItem(`bloodconnect_${key}`);
        } catch (e) {
            console.warn('LocalStorage not available:', e);
        }
    },
    
    clear: function() {
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('bloodconnect_')) {
                    localStorage.removeItem(key);
                }
            });
        } catch (e) {
            console.warn('LocalStorage not available:', e);
        }
    }
};

// Performance optimization
function initializePerformanceOptimizations() {
    // Lazy loading for images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
    
    // Debounce scroll events
    let scrollTimeout;
    const originalScrollHandler = window.onscroll;
    
    window.onscroll = function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (originalScrollHandler) {
                originalScrollHandler();
            }
        }, 16); // ~60fps
    };
}

// Initialize performance optimizations
initializePerformanceOptimizations();

// Error handling
window.addEventListener('error', function(event) {
    console.error('JavaScript error:', event.error);
    // Could send to error tracking service here
});

// Service worker registration (for future PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Uncomment when service worker is implemented
        // navigator.serviceWorker.register('/sw.js');
    });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showNotification: window.showNotification,
        BloodConnectStorage: window.BloodConnectStorage,
        getCompatibleDonors: window.getCompatibleDonors,
        getCompatibleRecipients: window.getCompatibleRecipients
    };
}
// Enhanced Visual Functionality

// Initialize enhanced visual features
function initializeEnhancedVisuals() {
    // Initialize progress rings
    initializeProgressRings();
    
    // Initialize interactive cards
    initializeInteractiveCards();
    
    // Initialize status indicators
    initializeStatusIndicators();
    
    // Initialize chart animations
    initializeChartAnimations();
    
    // Initialize floating action button
    initializeFAB();
}

// Progress Ring Animations
function initializeProgressRings() {
    const progressRings = document.querySelectorAll('.progress-ring');
    
    const ringObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const ring = entry.target;
                const progress = ring.getAttribute('data-progress') || 75;
                
                setTimeout(() => {
                    ring.classList.add('animate');
                    ring.style.setProperty('--progress', progress);
                }, 200);
                
                ringObserver.unobserve(ring);
            }
        });
    });
    
    progressRings.forEach(ring => ringObserver.observe(ring));
}

// Interactive Card Enhancements
function initializeInteractiveCards() {
    const cards = document.querySelectorAll('.interactive-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
        
        // Add click ripple effect
        card.addEventListener('click', function(e) {
            const ripple = document.createElement('div');
            ripple.className = 'ripple-effect';
            
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Status Indicator Animations
function initializeStatusIndicators() {
    const indicators = document.querySelectorAll('.status-indicator');
    
    indicators.forEach(indicator => {
        if (indicator.classList.contains('urgent')) {
            // Add pulsing animation for urgent status
            setInterval(() => {
                indicator.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    indicator.style.transform = 'scale(1)';
                }, 300);
            }, 2000);
        }
    });
}

// Chart Animation Enhancements
function initializeChartAnimations() {
    const charts = document.querySelectorAll('.chart-container');
    
    const chartObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const chart = entry.target;
                chart.classList.add('animate-chart');
                
                // Animate chart elements
                const chartElements = chart.querySelectorAll('.chart-bar, .chart-line, .chart-point');
                chartElements.forEach((element, index) => {
                    setTimeout(() => {
                        element.classList.add('animate-in');
                    }, index * 100);
                });
                
                chartObserver.unobserve(chart);
            }
        });
    });
    
    charts.forEach(chart => chartObserver.observe(chart));
}

// Floating Action Button
function initializeFAB() {
    const fab = document.querySelector('.fab');
    if (!fab) return;
    
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 200) {
            // Scrolling down - hide FAB
            fab.style.transform = 'translateY(100px)';
        } else {
            // Scrolling up - show FAB
            fab.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
    
    // Add click animation
    fab.addEventListener('click', function() {
        this.style.transform = 'scale(0.9)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
    });
}

// Blood Drop Animation
function createBloodDropAnimation(container) {
    const drop = document.createElement('div');
    drop.className = 'blood-drop-particle';
    drop.innerHTML = '💧';
    
    const startX = Math.random() * container.offsetWidth;
    const duration = 2000 + Math.random() * 1000;
    
    drop.style.left = startX + 'px';
    drop.style.top = '-20px';
    drop.style.position = 'absolute';
    drop.style.fontSize = '20px';
    drop.style.pointerEvents = 'none';
    drop.style.zIndex = '1';
    
    container.appendChild(drop);
    
    // Animate the drop falling
    drop.animate([
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        { transform: `translateY(${container.offsetHeight + 40}px) rotate(360deg)`, opacity: 0 }
    ], {
        duration: duration,
        easing: 'ease-in'
    }).onfinish = () => {
        drop.remove();
    };
}

// Enhanced Notification System with Icons
window.showEnhancedNotification = function(message, type = 'info', duration = 5000, icon = null) {
    const notification = document.createElement('div');
    notification.className = `notification ${type} enhanced`;
    
    const iconMap = {
        success: icon || 'fa-check-circle',
        error: icon || 'fa-exclamation-circle',
        warning: icon || 'fa-exclamation-triangle',
        info: icon || 'fa-info-circle',
        emergency: icon || 'fa-exclamation'
    };
    
    const notificationIcon = iconMap[type];
    
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon ${type}">
                <i class="fas ${notificationIcon}"></i>
            </div>
            <div class="notification-text">
                <span>${message}</span>
            </div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto remove
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove('show');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, duration);
    }
    
    return notification;
};

// Initialize enhanced visuals when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeEnhancedVisuals();
});

// Blood compatibility visual indicator
window.showBloodCompatibility = function(donorType, recipientType) {
    const compatible = getCompatibleDonors(recipientType).includes(donorType);
    
    const indicator = document.createElement('div');
    indicator.className = `compatibility-indicator ${compatible ? 'compatible' : 'incompatible'}`;
    indicator.innerHTML = `
        <div class="compatibility-icon">
            <i class="fas ${compatible ? 'fa-check' : 'fa-times'}"></i>
        </div>
        <div class="compatibility-text">
            ${donorType} → ${recipientType}: ${compatible ? 'Compatible' : 'Incompatible'}
        </div>
    `;
    
    return indicator;
};

// Emergency alert system
window.triggerEmergencyAlert = function(message, location = null) {
    const alert = document.createElement('div');
    alert.className = 'emergency-alert';
    alert.innerHTML = `
        <div class="emergency-alert-content">
            <div class="emergency-alert-icon emergency-pulse">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="emergency-alert-text">
                <h3>Emergency Blood Request</h3>
                <p>${message}</p>
                ${location ? `<p class="alert-location"><i class="fas fa-map-marker-alt"></i> ${location}</p>` : ''}
            </div>
            <div class="emergency-alert-actions">
                <button class="btn btn-danger" onclick="respondToEmergency()">
                    <i class="fas fa-heart"></i>
                    Respond Now
                </button>
                <button class="btn btn-outline-light" onclick="this.closest('.emergency-alert').remove()">
                    <i class="fas fa-times"></i>
                    Dismiss
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(alert);
    
    // Auto-remove after 30 seconds for emergency alerts
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 30000);
    
    return alert;
};

// Scroll to element with visual feedback
window.scrollToElementWithFeedback = function(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Add highlight effect
    element.classList.add('highlight-target');
    
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
    
    // Remove highlight after animation
    setTimeout(() => {
        element.classList.remove('highlight-target');
    }, 2000);
};

// Initialize blood drop particles for hero sections
function initializeBloodDropParticles() {
    const heroSections = document.querySelectorAll('.hero, .hero-section');
    
    heroSections.forEach(hero => {
        if (hero.classList.contains('enable-particles')) {
            setInterval(() => {
                if (Math.random() < 0.3) { // 30% chance every interval
                    createBloodDropAnimation(hero);
                }
            }, 3000);
        }
    });
}

// Initialize particles
setTimeout(initializeBloodDropParticles, 2000);
// Ultra-Compact Layout Functions
function scrollToOptions() {
    const element = document.getElementById('options');
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function scrollToEligibility() {
    const element = document.getElementById('eligibility');
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function scrollToAvailability() {
    const element = document.getElementById('availability');
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Ultra-Compact Availability Results
function displayCompactAvailabilityResults(results) {
    const resultsContainer = document.getElementById('availabilityResults');
    
    if (!results || results.hospitals.length === 0) {
        resultsContainer.innerHTML = `
            <div style="text-align: center; padding: var(--spacing-2); color: var(--gray-600); font-size: 11px;">
                No results found. Try different criteria.
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = `
        <div style="font-size: 11px; font-weight: 600; margin-bottom: var(--spacing-1); color: var(--gray-900);">
            Found ${results.totalUnits} units of ${results.bloodType}
        </div>
        ${results.hospitals.slice(0, 3).map(hospital => `
            <div class="hospital-result-mini">
                <div class="hospital-info-mini">
                    <h4>${hospital.name}</h4>
                    <p>${hospital.distance}</p>
                </div>
                <div class="hospital-availability-mini">
                    <div class="units-available-mini">${hospital.units}</div>
                    <div class="units-label-mini">units</div>
                    <div class="availability-status-mini ${hospital.status}">
                        ${hospital.status === 'available' ? 'Available' : 
                          hospital.status === 'low' ? 'Low' : 'Critical'}
                    </div>
                </div>
            </div>
        `).join('')}
    `;
}

// Enhanced checkAvailability function for compact layout
window.checkAvailability = function() {
    const bloodType = document.getElementById('checkBloodType').value;
    const location = document.getElementById('checkLocation').value;
    const resultsContainer = document.getElementById('availabilityResults');
    
    if (!bloodType || !location) {
        resultsContainer.innerHTML = `
            <div style="text-align: center; padding: var(--spacing-2); color: var(--danger-color); font-size: 11px;">
                Please select blood type and enter location
            </div>
        `;
        return;
    }
    
    // Show loading state
    resultsContainer.innerHTML = `
        <div style="text-align: center; padding: var(--spacing-2); color: var(--gray-600); font-size: 11px;">
            <i class="fas fa-spinner fa-spin"></i> Checking...
        </div>
    `;
    
    // Simulate API call
    setTimeout(() => {
        const mockResults = {
            bloodType,
            location,
            totalUnits: Math.floor(Math.random() * 50) + 10,
            hospitals: [
                { name: 'City General', distance: '2.3 mi', units: Math.floor(Math.random() * 20) + 5, status: 'available' },
                { name: 'Memorial Medical', distance: '4.7 mi', units: Math.floor(Math.random() * 15) + 3, status: 'available' },
                { name: 'Regional Blood Bank', distance: '6.1 mi', units: Math.floor(Math.random() * 10) + 2, status: 'low' }
            ]
        };
        displayCompactAvailabilityResults(mockResults);
    }, 1500);
};

// Enhanced eligibility checker for compact layout
window.checkEligibility = function() {
    const form = document.getElementById('eligibilityForm');
    const resultDiv = document.getElementById('eligibilityResult');
    
    if (!form || !resultDiv) return;
    
    const formData = new FormData(form);
    const age = formData.get('age');
    const weight = formData.get('weight');
    const health = formData.get('health');
    
    if (!age || !weight || !health) {
        showNotification('Please answer all questions', 'error');
        return;
    }
    
    let eligible = true;
    let message = '';
    
    if (age === 'under-17' || age === 'over-65') {
        eligible = false;
        message = 'Age requirements: 17-65 years old';
    } else if (weight === 'under-50') {
        eligible = false;
        message = 'Weight requirement: minimum 50kg';
    } else if (health === 'issues') {
        eligible = false;
        message = 'Health screening required';
    } else {
        message = 'You meet the basic requirements!';
    }
    
    resultDiv.className = `eligibility-result ${eligible ? 'eligible' : 'not-eligible'}`;
    resultDiv.innerHTML = `
        <h3>${eligible ? '✓ Eligible' : '✗ Not Eligible'}</h3>
        <p>${message}</p>
        ${eligible ? `
            <a href="auth/register.html" class="btn btn-primary" style="margin-top: var(--spacing-2);">
                <i class="fas fa-heart"></i> Register Now
            </a>
        ` : ''}
    `;
    resultDiv.style.display = 'block';
};

// Initialize ultra-compact features
document.addEventListener('DOMContentLoaded', function() {
    // Add ultra-compact class to body for specific styling
    document.body.classList.add('ultra-compact');
    
    // Initialize compact counters with faster animation
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target')) || parseInt(counter.textContent);
        const duration = 1000; // Faster animation
        const increment = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };
        
        // Start animation when element is visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(entry.target);
                }
            });
        });
        
        observer.observe(counter);
    });
});
// Index Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        initializeIndexPage();
    }
});

function initializeIndexPage() {
    // Initialize blood availability
    initializeBloodAvailability();
    
    // Initialize hospitals section
    initializeHospitalsSection();
    
    // Initialize filters
    initializeFilters();
    
    // Update last updated time
    updateLastUpdatedTime();
    
    // Set up auto-refresh
    setInterval(refreshBloodData, 300000); // Refresh every 5 minutes
}

// Blood Availability Functions
function initializeBloodAvailability() {
    // Simulate real-time data updates
    updateBloodAvailability();
    
    // Add click handlers for blood type cards
    const bloodCards = document.querySelectorAll('.blood-type-card');
    bloodCards.forEach(card => {
        card.addEventListener('click', function() {
            const bloodType = this.dataset.type;
            showBloodTypeDetails(bloodType);
        });
    });
}

function updateBloodAvailability() {
    // Simulate fetching data from database
    const bloodData = {
        'A+': { units: Math.floor(Math.random() * 30) + 15, donors: Math.floor(Math.random() * 100) + 120 },
        'O+': { units: Math.floor(Math.random() * 25) + 10, donors: Math.floor(Math.random() * 150) + 180 },
        'B+': { units: Math.floor(Math.random() * 20) + 5, donors: Math.floor(Math.random() * 80) + 60 },
        'AB+': { units: Math.floor(Math.random() * 15) + 3, donors: Math.floor(Math.random() * 50) + 20 },
        'A-': { units: Math.floor(Math.random() * 20) + 8, donors: Math.floor(Math.random() * 70) + 50 },
        'O-': { units: Math.floor(Math.random() * 12) + 2, donors: Math.floor(Math.random() * 60) + 30 },
        'B-': { units: Math.floor(Math.random() * 15) + 4, donors: Math.floor(Math.random() * 50) + 25 },
        'AB-': { units: Math.floor(Math.random() * 10) + 1, donors: Math.floor(Math.random() * 30) + 15 }
    };

    // Update the UI
    Object.keys(bloodData).forEach(bloodType => {
        const data = bloodData[bloodType];
        const typeKey = bloodType.toLowerCase().replace('+', '-plus').replace('-', '-minus');
        
        // Update units count
        const unitsElement = document.getElementById(`${typeKey}-count`);
        if (unitsElement) {
            animateNumber(unitsElement, parseInt(unitsElement.textContent), data.units);
        }
        
        // Update donors count
        const donorsElement = document.getElementById(`${typeKey}-donors`);
        if (donorsElement) {
            animateNumber(donorsElement, parseInt(donorsElement.textContent), data.donors);
        }
        
        // Update status
        const card = document.querySelector(`[data-type="${bloodType}"]`);
        if (card) {
            const statusElement = card.querySelector('.availability-status');
            updateAvailabilityStatus(statusElement, data.units);
        }
    });
}

function updateAvailabilityStatus(statusElement, units) {
    statusElement.classList.remove('available', 'low', 'critical');
    
    if (units >= 15) {
        statusElement.classList.add('available');
        statusElement.innerHTML = '<i class="fas fa-check-circle"></i><span>Available</span>';
    } else if (units >= 8) {
        statusElement.classList.add('low');
        statusElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Low Stock</span>';
    } else {
        statusElement.classList.add('critical');
        statusElement.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Critical</span>';
    }
}

function animateNumber(element, start, end) {
    const duration = 1000;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (end - start) * progress);
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

function refreshBloodData() {
    // Show loading state
    const refreshBtn = document.querySelector('button[onclick="refreshBloodData()"]');
    if (refreshBtn) {
        const originalText = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        refreshBtn.disabled = true;
        
        setTimeout(() => {
            updateBloodAvailability();
            updateLastUpdatedTime();
            refreshBtn.innerHTML = originalText;
            refreshBtn.disabled = false;
            showNotification('Blood availability data updated successfully!', 'success');
        }, 2000);
    }
}

function updateLastUpdatedTime() {
    const lastUpdatedElement = document.getElementById('lastUpdated');
    if (lastUpdatedElement) {
        const now = new Date();
        lastUpdatedElement.textContent = now.toLocaleTimeString();
    }
}

function showBloodTypeDetails(bloodType) {
    // Create modal with blood type details
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content-modern">
            <div class="modal-header-modern">
                <h3>Blood Type ${bloodType} Details</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body-modern">
                <div class="blood-type-details">
                    <div class="detail-section">
                        <h4>Compatibility</h4>
                        <p><strong>Can donate to:</strong> ${getCompatibleRecipients(bloodType)}</p>
                        <p><strong>Can receive from:</strong> ${getCompatibleDonors(bloodType)}</p>
                    </div>
                    <div class="detail-section">
                        <h4>Current Status</h4>
                        <p>We have sufficient ${bloodType} blood available for immediate use.</p>
                    </div>
                    <div class="detail-section">
                        <h4>How to Help</h4>
                        <p>If you have ${bloodType} blood type, consider becoming a regular donor to help maintain our supply.</p>
                    </div>
                </div>
                <div class="modal-actions">
                    <a href="become-donor.html" class="btn btn-primary">Become a Donor</a>
                    <a href="request-blood.html" class="btn btn-secondary">Request Blood</a>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function getCompatibleRecipients(bloodType) {
    const compatibility = {
        'A+': 'A+, AB+',
        'A-': 'A+, A-, AB+, AB-',
        'B+': 'B+, AB+',
        'B-': 'B+, B-, AB+, AB-',
        'AB+': 'AB+',
        'AB-': 'AB+, AB-',
        'O+': 'A+, B+, AB+, O+',
        'O-': 'All blood types (Universal donor)'
    };
    return compatibility[bloodType] || 'Unknown';
}

function getCompatibleDonors(bloodType) {
    const compatibility = {
        'A+': 'A+, A-, O+, O-',
        'A-': 'A-, O-',
        'B+': 'B+, B-, O+, O-',
        'B-': 'B-, O-',
        'AB+': 'All blood types (Universal recipient)',
        'AB-': 'AB-, A-, B-, O-',
        'O+': 'O+, O-',
        'O-': 'O-'
    };
    return compatibility[bloodType] || 'Unknown';
}

// Hospitals Section Functions
function initializeHospitalsSection() {
    loadHospitals();
}

function loadHospitals(filter = 'all') {
    const hospitalsGrid = document.getElementById('hospitalsGrid');
    
    // Show loading state
    hospitalsGrid.innerHTML = `
        <div class="loading-hospitals">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading hospitals...</p>
        </div>
    `;
    
    // Simulate API call
    setTimeout(() => {
        const hospitals = generateHospitalData(filter);
        displayHospitals(hospitals);
    }, 1500);
}

function generateHospitalData(filter) {
    const hospitalTypes = ['general', 'specialty', 'trauma', 'blood-bank'];
    const hospitalNames = [
        'City General Hospital',
        'Metropolitan Medical Center',
        'St. Mary\'s Hospital',
        'Regional Trauma Center',
        'University Hospital',
        'Community Health Center',
        'Children\'s Hospital',
        'Heart & Vascular Institute',
        'Cancer Treatment Center',
        'Emergency Medical Center'
    ];
    
    const services = [
        'Emergency Care', 'Surgery', 'ICU', 'Blood Bank', 'Laboratory',
        'Radiology', 'Cardiology', 'Oncology', 'Pediatrics', 'Maternity'
    ];
    
    const hospitals = [];
    
    for (let i = 0; i < 12; i++) {
        const type = hospitalTypes[Math.floor(Math.random() * hospitalTypes.length)];
        
        if (filter !== 'all' && type !== filter) continue;
        
        const hospital = {
            id: i + 1,
            name: hospitalNames[i % hospitalNames.length],
            type: type,
            rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 to 5.0
            reviews: Math.floor(Math.random() * 500) + 50,
            address: `${Math.floor(Math.random() * 9999) + 1000} Medical Drive`,
            city: 'Healthcare City',
            phone: `(555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            beds: Math.floor(Math.random() * 300) + 50,
            services: services.slice(0, Math.floor(Math.random() * 5) + 3),
            bloodBank: Math.random() > 0.3,
            emergency: Math.random() > 0.2,
            verified: Math.random() > 0.1
        };
        
        hospitals.push(hospital);
    }
    
    return hospitals.sort((a, b) => b.rating - a.rating);
}

function displayHospitals(hospitals) {
    const hospitalsGrid = document.getElementById('hospitalsGrid');
    
    if (hospitals.length === 0) {
        hospitalsGrid.innerHTML = `
            <div class="loading-hospitals">
                <i class="fas fa-hospital"></i>
                <p>No hospitals found for this category.</p>
            </div>
        `;
        return;
    }
    
    hospitalsGrid.innerHTML = hospitals.map(hospital => `
        <div class="hospital-card" data-type="${hospital.type}">
            <div class="hospital-header">
                <div class="hospital-logo">
                    <i class="fas fa-hospital"></i>
                </div>
                <div class="hospital-info">
                    <h3>${hospital.name}</h3>
                    <span class="hospital-type">${formatHospitalType(hospital.type)}</span>
                </div>
            </div>
            
            <div class="hospital-rating">
                <div class="stars">
                    ${generateStars(hospital.rating)}
                </div>
                <span class="rating-text">${hospital.rating} (${hospital.reviews} reviews)</span>
            </div>
            
            <div class="hospital-details">
                <div class="detail-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${hospital.address}, ${hospital.city}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-phone"></i>
                    <span>${hospital.phone}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-bed"></i>
                    <span>${hospital.beds} beds</span>
                </div>
                ${hospital.emergency ? '<div class="detail-item"><i class="fas fa-ambulance"></i><span>24/7 Emergency</span></div>' : ''}
                ${hospital.bloodBank ? '<div class="detail-item"><i class="fas fa-tint"></i><span>Blood Bank Available</span></div>' : ''}
            </div>
            
            <div class="hospital-services">
                ${hospital.services.slice(0, 3).map(service => `<span class="service-tag">${service}</span>`).join('')}
                ${hospital.services.length > 3 ? `<span class="service-tag">+${hospital.services.length - 3} more</span>` : ''}
            </div>
            
            <div class="hospital-actions">
                <button class="btn btn-primary btn-sm" onclick="contactHospital(${hospital.id})">
                    <i class="fas fa-phone"></i> Contact
                </button>
                <button class="btn btn-secondary btn-sm" onclick="viewHospitalDetails(${hospital.id})">
                    <i class="fas fa-info-circle"></i> Details
                </button>
                ${hospital.bloodBank ? '<button class="btn btn-outline-primary btn-sm" onclick="requestBloodFromHospital(' + hospital.id + ')"><i class="fas fa-tint"></i> Request Blood</button>' : ''}
            </div>
        </div>
    `).join('');
}

function formatHospitalType(type) {
    const types = {
        'general': 'General Hospital',
        'specialty': 'Specialty Hospital',
        'trauma': 'Trauma Center',
        'blood-bank': 'Blood Bank'
    };
    return types[type] || type;
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star star"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt star"></i>';
    }
    
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star star empty"></i>';
    }
    
    return stars;
}

function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Load hospitals with filter
            const filter = this.dataset.filter;
            loadHospitals(filter);
        });
    });
}

function loadMoreHospitals() {
    const button = event.target;
    const originalText = button.innerHTML;
    
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    button.disabled = true;
    
    setTimeout(() => {
        // Simulate loading more hospitals
        const currentHospitals = document.querySelectorAll('.hospital-card').length;
        const additionalHospitals = generateHospitalData('all').slice(0, 6);
        
        const hospitalsGrid = document.getElementById('hospitalsGrid');
        additionalHospitals.forEach(hospital => {
            const hospitalCard = document.createElement('div');
            hospitalCard.className = 'hospital-card';
            hospitalCard.innerHTML = `
                <div class="hospital-header">
                    <div class="hospital-logo">
                        <i class="fas fa-hospital"></i>
                    </div>
                    <div class="hospital-info">
                        <h3>${hospital.name}</h3>
                        <span class="hospital-type">${formatHospitalType(hospital.type)}</span>
                    </div>
                </div>
                <!-- Add rest of hospital card content -->
            `;
            hospitalsGrid.appendChild(hospitalCard);
        });
        
        button.innerHTML = originalText;
        button.disabled = false;
        
        showNotification(`Loaded ${additionalHospitals.length} more hospitals`, 'success');
    }, 1500);
}

function contactHospital(hospitalId) {
    showNotification('Opening contact information...', 'info');
    // In a real app, this would open contact details or initiate a call
}

function viewHospitalDetails(hospitalId) {
    showNotification('Loading hospital details...', 'info');
    // In a real app, this would navigate to a detailed hospital page
}

function requestBloodFromHospital(hospitalId) {
    showNotification('Redirecting to blood request form...', 'info');
    setTimeout(() => {
        window.location.href = 'request-blood.html';
    }, 1000);
}

// Notification function (if not already defined)
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        z-index: 10001;
        max-width: 400px;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);

    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

function getNotificationColor(type) {
    switch (type) {
        case 'success': return '#10b981';
        case 'error': return '#ef4444';
        case 'warning': return '#f59e0b';
        default: return '#3b82f6';
    }
}