// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Animated counters
    animateCounters();
    
    // Initialize charts
    initializeCharts();
    
    // Menu interactions
    initializeMenu();
    
    // Real-time updates simulation
    simulateRealTimeUpdates();
});

// Animated Counters
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000; // 2 seconds
        const increment = target / (duration / 16); // 60fps
        let current = 0;
        
        const updateCounter = () => {
            if (current < target) {
                current += increment;
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
}

// Initialize Charts
function initializeCharts() {
    // Blood Type Distribution Pie Chart
    const bloodTypeCtx = document.getElementById('bloodTypeChart');
    if (bloodTypeCtx) {
        new Chart(bloodTypeCtx, {
            type: 'doughnut',
            data: {
                labels: ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'],
                datasets: [{
                    data: [35, 28, 20, 8, 6, 2, 1, 0.5],
                    backgroundColor: [
                        '#dc2626',
                        '#ef4444',
                        '#f87171',
                        '#fca5a5',
                        '#10b981',
                        '#34d399',
                        '#f59e0b',
                        '#fbbf24'
                    ],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + '%';
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 1500
                }
            }
        });
    }

    // Monthly Donations Bar Chart
    const donationsCtx = document.getElementById('donationsChart');
    if (donationsCtx) {
        new Chart(donationsCtx, {
            type: 'bar',
            data: {
                labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Donations',
                    data: [120, 135, 98, 156, 142, 168],
                    backgroundColor: 'rgba(220, 38, 38, 0.8)',
                    borderColor: '#dc2626',
                    borderWidth: 1,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#dc2626',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#6b7280'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6b7280'
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeOutQuart'
                }
            }
        });
    }
}

// Menu Interactions
function initializeMenu() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all items
            menuItems.forEach(mi => mi.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Here you would typically load different dashboard views
            console.log('Menu item clicked:', this.textContent.trim());
        });
    });
}

// Simulate Real-time Updates
function simulateRealTimeUpdates() {
    // Update notification badge randomly
    setInterval(() => {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            const currentCount = parseInt(badge.textContent);
            const newCount = Math.max(0, currentCount + Math.floor(Math.random() * 3) - 1);
            badge.textContent = newCount;
            badge.style.display = newCount > 0 ? 'block' : 'none';
        }
    }, 30000); // Update every 30 seconds

    // Simulate new activity items
    setInterval(() => {
        addNewActivity();
    }, 45000); // Add new activity every 45 seconds
}

// Add New Activity Item
function addNewActivity() {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;

    const activities = [
        {
            icon: 'fas fa-user-plus',
            type: 'success',
            text: '<strong>Sarah Johnson</strong> registered as a donor',
            time: 'Just now'
        },
        {
            icon: 'fas fa-tint',
            type: 'primary',
            text: '<strong>General Hospital</strong> requested 3 units of A+ blood',
            time: 'Just now'
        },
        {
            icon: 'fas fa-check-circle',
            type: 'success',
            text: '<strong>Blood request</strong> fulfilled successfully',
            time: 'Just now'
        }
    ];

    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    activityItem.style.opacity = '0';
    activityItem.style.transform = 'translateY(-10px)';
    
    activityItem.innerHTML = `
        <div class="activity-icon ${randomActivity.type}">
            <i class="${randomActivity.icon}"></i>
        </div>
        <div class="activity-content">
            <p>${randomActivity.text}</p>
            <span class="activity-time">${randomActivity.time}</span>
        </div>
    `;

    // Insert at the beginning
    activityList.insertBefore(activityItem, activityList.firstChild);

    // Animate in
    setTimeout(() => {
        activityItem.style.transition = 'all 0.3s ease';
        activityItem.style.opacity = '1';
        activityItem.style.transform = 'translateY(0)';
    }, 100);

    // Remove oldest items if more than 4
    const items = activityList.querySelectorAll('.activity-item');
    if (items.length > 4) {
        items[items.length - 1].remove();
    }
}

// Quick Action Handlers
document.addEventListener('click', function(e) {
    if (e.target.closest('.action-btn')) {
        const btn = e.target.closest('.action-btn');
        const action = btn.querySelector('span').textContent;
        
        // Add click animation
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = '';
        }, 150);
        
        // Show notification (you would replace this with actual functionality)
        showNotification(`${action} clicked!`, 'info');
    }
    
    // Approval buttons
    if (e.target.classList.contains('btn-sm')) {
        const action = e.target.textContent;
        const row = e.target.closest('tr');
        const userName = row.querySelector('.user-cell span').textContent;
        
        if (action === 'Approve') {
            showNotification(`${userName} approved successfully!`, 'success');
            row.style.opacity = '0.5';
        } else if (action === 'Reject') {
            showNotification(`${userName} rejected.`, 'error');
            row.style.opacity = '0.5';
        }
    }
});

// Notification System
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Close button handler
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Responsive sidebar toggle for mobile
function toggleSidebar() {
    const sidebar = document.querySelector('.dashboard-sidebar');
    sidebar.classList.toggle('mobile-open');
}

// Add mobile sidebar styles
const mobileStyles = `
    @media (max-width: 768px) {
        .dashboard-sidebar {
            position: fixed;
            left: -280px;
            top: 70px;
            height: calc(100vh - 70px);
            z-index: 999;
            transition: left 0.3s ease;
        }
        
        .dashboard-sidebar.mobile-open {
            left: 0;
        }
        
        .dashboard-main {
            margin-left: 0;
        }
    }
`;

// Add mobile styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = mobileStyles;
document.head.appendChild(styleSheet);