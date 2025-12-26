// Become Donor Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeBecomeDonorPage();
});

function initializeBecomeDonorPage() {
    // Initialize eligibility checker
    initializeEligibilityChecker();
    
    // Initialize smooth scrolling
    initializeSmoothScrolling();
    
    // Initialize section navigation
    initializeSectionNavigation();
    
    // Initialize animations
    initializeAnimations();
    
    // Initialize testimonial interactions
    initializeTestimonials();
    
    // Initialize FAQ functionality
    initializeFAQ();
}

// Section Navigation
function initializeSectionNavigation() {
    // Handle dropdown menu clicks
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToSection(targetId);
        });
    });
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        
        // Add highlight effect
        section.style.background = 'rgba(220, 38, 38, 0.05)';
        section.style.transition = 'background 0.5s ease';
        
        setTimeout(() => {
            section.style.background = '';
        }, 2000);
    }
}

// Eligibility Checker
function initializeEligibilityChecker() {
    const eligibilityForm = document.getElementById('eligibilityForm');
    
    if (eligibilityForm) {
        // Add change listeners to radio buttons
        const radioButtons = eligibilityForm.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', function() {
                updateEligibilityPreview();
            });
        });
    }
}

function checkEligibility() {
    const form = document.getElementById('eligibilityForm');
    const formData = new FormData(form);
    
    const eligibilityData = {
        age: formData.get('age'),
        weight: formData.get('weight'),
        health: formData.get('health')
    };

    // Validate that all questions are answered
    if (!eligibilityData.age || !eligibilityData.weight || !eligibilityData.health) {
        showNotification('Please answer all questions to check your eligibility', 'warning');
        return;
    }

    // Calculate eligibility
    const result = calculateEligibility(eligibilityData);
    
    // Show result
    showEligibilityResult(result);
}

function calculateEligibility(data) {
    const issues = [];
    let eligible = true;

    // Age check
    if (data.age === 'under-17') {
        eligible = false;
        issues.push({
            type: 'age',
            message: 'You must be at least 17 years old to donate blood',
            solution: 'Wait until you reach the minimum age requirement'
        });
    } else if (data.age === 'over-65') {
        issues.push({
            type: 'age-warning',
            message: 'Donors over 65 may need additional medical clearance',
            solution: 'Consult with your doctor before donating'
        });
    }

    // Weight check
    if (data.weight === 'under-50') {
        eligible = false;
        issues.push({
            type: 'weight',
            message: 'You must weigh at least 50kg to donate blood',
            solution: 'Maintain a healthy weight and try again when you meet the requirement'
        });
    }

    // Health check
    if (data.health === 'issues') {
        eligible = false;
        issues.push({
            type: 'health',
            message: 'You must be in good health to donate blood',
            solution: 'Address any health issues and consult with your doctor'
        });
    }

    return {
        eligible,
        issues,
        score: eligible ? 100 : Math.max(0, 100 - (issues.filter(i => i.type !== 'age-warning').length * 25))
    };
}

function showEligibilityResult(result) {
    const resultContainer = document.getElementById('eligibilityResult');
    
    let resultHTML = '';
    
    if (result.eligible) {
        resultHTML = `
            <div class="eligibility-success">
                <div class="result-icon success">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="result-content">
                    <h3>Great! You're Eligible to Donate</h3>
                    <p>Based on your answers, you meet the basic requirements for blood donation.</p>
                    ${result.issues.length > 0 ? `
                        <div class="result-notes">
                            <h4>Please Note:</h4>
                            <ul>
                                ${result.issues.map(issue => `<li>${issue.message}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    <div class="result-actions">
                        <a href="auth/register.html" class="btn btn-primary btn-lg">
                            <i class="fas fa-heart"></i>
                            Register to Donate
                        </a>
                        <button class="btn btn-outline-primary" onclick="findDonationCenters()">
                            <i class="fas fa-map-marker-alt"></i>
                            Find Centers Near Me
                        </button>
                    </div>
                </div>
            </div>
        `;
    } else {
        resultHTML = `
            <div class="eligibility-failure">
                <div class="result-icon failure">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="result-content">
                    <h3>Not Eligible at This Time</h3>
                    <p>Based on your answers, you don't currently meet the requirements for blood donation.</p>
                    <div class="result-issues">
                        <h4>Issues to Address:</h4>
                        <ul>
                            ${result.issues.map(issue => `
                                <li>
                                    <strong>${issue.message}</strong>
                                    <br><small>${issue.solution}</small>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    <div class="result-actions">
                        <button class="btn btn-primary" onclick="retakeEligibilityTest()">
                            <i class="fas fa-redo"></i>
                            Retake Test
                        </button>
                        <a href="contact.html" class="btn btn-outline-primary">
                            <i class="fas fa-question-circle"></i>
                            Have Questions?
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
    
    resultContainer.innerHTML = resultHTML;
    resultContainer.style.display = 'block';
    
    // Scroll to result
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function updateEligibilityPreview() {
    const form = document.getElementById('eligibilityForm');
    const formData = new FormData(form);
    
    const eligibilityData = {
        age: formData.get('age'),
        weight: formData.get('weight'),
        health: formData.get('health')
    };

    // Count answered questions
    const answeredQuestions = Object.values(eligibilityData).filter(value => value !== null && value !== '').length;
    const totalQuestions = 3;
    
    // Update progress if there's a progress indicator
    const progressBar = document.querySelector('.eligibility-progress');
    if (progressBar) {
        const progress = (answeredQuestions / totalQuestions) * 100;
        progressBar.style.width = progress + '%';
    }
}

function retakeEligibilityTest() {
    const form = document.getElementById('eligibilityForm');
    const resultContainer = document.getElementById('eligibilityResult');
    
    // Reset form
    form.reset();
    
    // Hide result
    resultContainer.style.display = 'none';
    
    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth' });
}

function findDonationCenters() {
    // In a real application, this would integrate with a maps API
    showNotification('Opening donation center locator...', 'info');
    
    // Simulate opening a map or location finder
    setTimeout(() => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>Find Donation Centers Near You</h3>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="location-finder">
                        <div class="finder-form">
                            <div class="form-group">
                                <label>Enter your location</label>
                                <div class="input-group">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <input type="text" class="form-control" placeholder="City, State or ZIP code">
                                    <button class="btn btn-primary">
                                        <i class="fas fa-search"></i>
                                        Search
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="centers-list">
                            <div class="center-item">
                                <div class="center-info">
                                    <h4>City General Hospital Blood Center</h4>
                                    <p>123 Medical Drive, Downtown</p>
                                    <p><i class="fas fa-clock"></i> Mon-Fri: 8AM-6PM, Sat: 9AM-4PM</p>
                                    <p><i class="fas fa-phone"></i> (555) 123-4567</p>
                                </div>
                                <div class="center-distance">
                                    <span class="distance">2.3 miles</span>
                                    <button class="btn btn-outline-primary btn-sm">
                                        <i class="fas fa-directions"></i>
                                        Directions
                                    </button>
                                </div>
                            </div>
                            <div class="center-item">
                                <div class="center-info">
                                    <h4>Metro Blood Bank</h4>
                                    <p>456 Health Avenue, Midtown</p>
                                    <p><i class="fas fa-clock"></i> Mon-Sat: 7AM-7PM, Sun: 10AM-4PM</p>
                                    <p><i class="fas fa-phone"></i> (555) 987-6543</p>
                                </div>
                                <div class="center-distance">
                                    <span class="distance">4.1 miles</span>
                                    <button class="btn btn-outline-primary btn-sm">
                                        <i class="fas fa-directions"></i>
                                        Directions
                                    </button>
                                </div>
                            </div>
                            <div class="center-item">
                                <div class="center-info">
                                    <h4>Community Health Center</h4>
                                    <p>789 Wellness Street, Uptown</p>
                                    <p><i class="fas fa-clock"></i> Tue, Thu, Sat: 9AM-5PM</p>
                                    <p><i class="fas fa-phone"></i> (555) 456-7890</p>
                                </div>
                                <div class="center-distance">
                                    <span class="distance">6.8 miles</span>
                                    <button class="btn btn-outline-primary btn-sm">
                                        <i class="fas fa-directions"></i>
                                        Directions
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-close">Close</button>
                </div>
            </div>
        `;
        
        showModal(modal);
    }, 1000);
}

// Smooth Scrolling
function initializeSmoothScrolling() {
    // Add smooth scrolling to anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function scrollToEligibility() {
    const eligibilitySection = document.getElementById('eligibility');
    if (eligibilitySection) {
        eligibilitySection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Animations
function initializeAnimations() {
    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.impact-card, .requirement-item, .process-step, .benefit-card, .myth-card, .testimonial-card');
    
    animateElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = `all 0.6s ease ${index * 0.1}s`;
        observer.observe(element);
    });

    // Animate stats on scroll
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStats();
                statsObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        statsObserver.observe(heroStats);
    }
}

function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number, .impact-number');
    
    statNumbers.forEach(stat => {
        const finalValue = stat.textContent;
        const isPercentage = finalValue.includes('%');
        const numericValue = parseInt(finalValue.replace(/[^\d]/g, ''));
        
        if (!isNaN(numericValue)) {
            let currentValue = 0;
            const increment = numericValue / 50; // 50 steps
            const timer = setInterval(() => {
                currentValue += increment;
                if (currentValue >= numericValue) {
                    currentValue = numericValue;
                    clearInterval(timer);
                }
                
                stat.textContent = isPercentage ? 
                    Math.floor(currentValue) + '%' : 
                    Math.floor(currentValue).toString();
            }, 30);
        }
    });
}

// Testimonials
function initializeTestimonials() {
    const testimonialCards = document.querySelectorAll('.testimonial-card-mini');
    
    testimonialCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// FAQ Functionality
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item-mini');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question-mini');
        
        question.addEventListener('click', function() {
            const isActive = item.classList.contains('active');
            
            // Close all other FAQ items
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });
            
            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

// Utility Functions
function showModal(modal) {
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    document.body.appendChild(modal);

    setTimeout(() => {
        modal.style.opacity = '1';
    }, 10);

    modal.addEventListener('click', function(e) {
        if (e.target === modal || e.target.classList.contains('modal-close')) {
            closeModal();
        }
    });

    function closeModal() {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add notification styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10001;
        max-width: 400px;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);

    // Auto remove after 5 seconds
    setTimeout(() => {
        removeNotification(notification);
    }, 5000);

    // Handle close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        removeNotification(notification);
    });

    function removeNotification(notif) {
        notif.style.transform = 'translateX(100%)';
        setTimeout(() => notif.remove(), 300);
    }
}

// Add become-donor specific styles
const becomeDonorStyles = `
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }

    .eligibility-success, .eligibility-failure {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        margin-top: 2rem;
        display: flex;
        gap: 1.5rem;
        align-items: flex-start;
    }

    .eligibility-success {
        border-left: 4px solid #10b981;
    }

    .eligibility-failure {
        border-left: 4px solid #ef4444;
    }

    .result-icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        color: white;
        flex-shrink: 0;
    }

    .result-icon.success {
        background: #10b981;
    }

    .result-icon.failure {
        background: #ef4444;
    }

    .result-content {
        flex: 1;
    }

    .result-content h3 {
        margin-bottom: 0.5rem;
        color: #1f2937;
    }

    .result-notes, .result-issues {
        background: #f9fafb;
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
    }

    .result-notes h4, .result-issues h4 {
        color: #1f2937;
        margin-bottom: 0.5rem;
        font-size: 1rem;
    }

    .result-notes ul, .result-issues ul {
        list-style-type: disc;
        padding-left: 1.5rem;
        color: #4b5563;
    }

    .result-notes li, .result-issues li {
        margin-bottom: 0.5rem;
    }

    .result-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
        flex-wrap: wrap;
    }

    .location-finder {
        max-width: 800px;
        margin: 0 auto;
    }

    .finder-form {
        margin-bottom: 2rem;
    }

    .centers-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .center-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        transition: all 0.3s ease;
    }

    .center-item:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
    }

    .center-info h4 {
        margin-bottom: 0.5rem;
        color: #1f2937;
    }

    .center-info p {
        margin-bottom: 0.25rem;
        color: #6b7280;
        font-size: 0.875rem;
    }

    .center-info i {
        width: 16px;
        margin-right: 0.5rem;
        color: #9ca3af;
    }

    .center-distance {
        text-align: right;
    }

    .distance {
        display: block;
        font-weight: 600;
        color: #3b82f6;
        margin-bottom: 0.5rem;
    }

    .notification {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }

    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        transition: background-color 0.3s ease;
    }

    .notification-close:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    @media (max-width: 768px) {
        .eligibility-success, .eligibility-failure {
            flex-direction: column;
            text-align: center;
        }

        .result-actions {
            justify-content: center;
        }

        .center-item {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
        }

        .center-distance {
            text-align: center;
        }

        .notification {
            top: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
        }
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = becomeDonorStyles;
document.head.appendChild(styleSheet);