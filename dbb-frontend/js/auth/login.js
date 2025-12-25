// Updated frontend/js/auth/login.js with real API integration
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const loginSpinner = document.getElementById('loginSpinner');

    // API Base URL - adjust this to your backend location
    // If your project is served at http://localhost/dbb-frontend, include that path.
    const API_BASE_URL = 'http://localhost/dbb-frontend/backend/api';

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        // Clear previous errors
        clearErrors();

        // Basic validation
        if (!validateForm(email, password, role)) {
            return;
        }

        // Show loading state
        loginBtn.disabled = true;
        loginSpinner.style.display = 'inline-block';
        loginBtn.innerHTML = '<span>Signing In...</span>';

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login.php`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    role: role
                })
            });

            // Get the raw response text first
            const responseText = await response.text();
            console.log('Raw response:', responseText);

            // Determine content type and parse safely
            let data;
            const contentType = (response.headers.get('content-type') || '').toLowerCase();

            if (contentType.includes('application/json') || contentType.includes('text/json')) {
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('JSON Parse Error:', parseError);
                    showError('login', 'Server returned invalid data format. Please contact administrator.');
                    return;
                }
            } else {
                // Try to extract JSON embedded in HTML or mixed response
                const jsonMatch = responseText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
                if (jsonMatch) {
                    try {
                        data = JSON.parse(jsonMatch[0]);
                        console.log('Extracted JSON successfully:', data);
                    } catch (secondError) {
                        console.error('Failed to parse extracted JSON:', secondError);
                        showError('login', 'Server returned invalid data format. Please contact administrator.');
                        return;
                    }
                } else {
                    // Not JSON: try to extract readable text from possible HTML response
                    try {
                        const doc = new DOMParser().parseFromString(responseText, 'text/html');
                        const text = (doc && doc.body && doc.body.textContent) ? doc.body.textContent.trim() : responseText;
                        const message = text || 'Server returned an unexpected response.';
                        showError('login', message);
                    } catch (e) {
                        showError('login', 'Server returned an unexpected response.');
                    }
                    return;
                }
            }

            if (data.success) {
                // ✅ Store token
                localStorage.setItem('token', data.data.token);

                // ✅ Store FULL user object (dashboard expects this)
                localStorage.setItem('user', JSON.stringify({
                    user_id: data.data.user_id,
                    email: data.data.email,
                    role: data.data.role,
                    first_name: data.data.name, // safe mapping
                    last_name: ''
                }));

                // Also store role separately for backward compatibility
                localStorage.setItem('user_role', data.data.role);
                localStorage.setItem('auth_token', data.data.token);

                showMessage('success', 'Login successful! Redirecting...');

                setTimeout(() => {
                    redirectToDashboard(data.data.role);
                }, 1000);
            } else {
                showError('login', data.message || 'Invalid credentials. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('login', 'Network error. Please check your connection and try again.');
        } finally {
            // Reset loading state
            loginBtn.disabled = false;
            loginSpinner.style.display = 'none';
            loginBtn.innerHTML = '<span>Sign In</span>';
        }
    });

    function validateForm(email, password, role) {
        let isValid = true;

        if (!email || !email.includes('@')) {
            showError('email', 'Please enter a valid email address');
            isValid = false;
        }

        if (!password || password.length < 6) {
            showError('password', 'Password must be at least 6 characters');
            isValid = false;
        }

        if (!role) {
            showError('role', 'Please select a role');
            isValid = false;
        }

        return isValid;
    }

    function showError(field, message) {
        const errorElement = document.getElementById(`${field}Error`);
        if (errorElement) {
            errorElement.textContent = message;
            const inputElement = document.getElementById(field);
            if (inputElement) {
                inputElement.classList.add('error');
            }
        } else {
            // Fallback: show error at login error element
            const loginErrorElement = document.getElementById('loginError');
            if (loginErrorElement) {
                loginErrorElement.textContent = message;
            }
        }
    }

    function showMessage(type, message) {
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
            background-color: ${type === 'success' ? '#d4edda' : '#f8d7da'};
            color: ${type === 'success' ? '#155724' : '#721c24'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
        `;

        // Insert before form
        loginForm.parentNode.insertBefore(messageDiv, loginForm);

        // Remove after 3 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    function clearErrors() {
        const errorElements = document.querySelectorAll('.form-error');
        errorElements.forEach(element => {
            element.textContent = '';
        });

        const inputElements = document.querySelectorAll('.form-control');
        inputElements.forEach(element => {
            element.classList.remove('error');
        });
    }

    function redirectToDashboard(role) {
        const base = '/dbb-frontend/pages';
        const mapping = {
            'donor': `${base}/donor/donor-dashboard.html`,
            'hospital': `${base}/hospital/dashboard.html`,
            'blood_bank': `${base}/blood-bank/bank-dashboard.html`,
            'admin': `${base}/admin/admin-dashboard.html`
        };

        const path = mapping[role];
        if (path) {
            window.location.href = path;
        } else {
            showError('login', 'Invalid role configuration');
        }
    }

    // Auto-focus email field on page load
    document.getElementById('email').focus();

    // Check if user is already logged in; validate token with server before redirecting
    checkExistingSession();

    async function checkExistingSession() {
        const token = localStorage.getItem('auth_token');
        const role = localStorage.getItem('user_role');
        const userRaw = localStorage.getItem('user');

        // Basic sanity checks to avoid accidental redirects from stale values
        if (!token || token === 'null' || token === 'undefined') return;
        if (!role) return;
        if (!userRaw) return;

        let user;
        try {
            user = JSON.parse(userRaw);
        } catch (e) {
            return;
        }

        if (!user || !user.user_id) return; // require an actual user id

        // Call server to validate token/session. If invalid, clear local storage.
        try {
            const url = `${API_BASE_URL}/auth/validate_token.php`;
            const resp = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            const text = await resp.text();
            let data = null;
            try { data = JSON.parse(text); } catch (e) { data = null; }

            if (data && data.success && data.data && data.data.user && data.data.user.user_id) {
                showMessage('info', 'You are already logged in. Redirecting...');
                setTimeout(() => redirectToDashboard(role), 1200);
            } else {
                // Invalid or expired session/token: clear stored auth info
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_role');
                localStorage.removeItem('user');
            }
        } catch (e) {
            // Network or server error: do not redirect but keep page usable
            console.warn('Token validation failed:', e);
        }
    }
});