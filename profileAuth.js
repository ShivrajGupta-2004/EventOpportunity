// Authentication and Session Management
class ProfileAuth {
    constructor() {
        this.currentUser = null;
    }

    // Authentication and Session Management
    async checkAuthAndLoadProfile() {
        try {
            console.log('Checking authentication...');

            const response = await fetch('http://localhost:5000/api/check-session', {
                method: 'GET',
                credentials: 'include'
            });

            const data = await response.json();
            console.log('Session check response:', data);

            if (!data.loggedIn || data.userType !== 'user') {
                console.log('Not authenticated or not a user, redirecting to login');
                window.location.href = '/userLogin.html';
                return null;
            }

            // Store user info from session
            this.currentUser = {
                _id: data.userId,
                username: data.username,
                email: data.email
            };

            console.log('User authenticated:', data.username, 'ID:', data.userId);
            return this.currentUser;

        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = '/userLogin.html';
            throw error;
        }
    }

    // Logout
    async handleLogout() {
        const confirmLogout = confirm('Are you sure you want to logout?');
        
        if (!confirmLogout) return false;

        const logoutBtn = document.getElementById('logout-btn');
        const originalHTML = logoutBtn.innerHTML;
        
        logoutBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Logging out...';
        logoutBtn.disabled = true;

        try {
            const response = await fetch('http://localhost:5000/api/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                this.showNotification('Logged out successfully!', 'success');
                
                setTimeout(() => {
                    window.location.href = '/userLogin.html';
                }, 1500);
                return true;
            } else {
                throw new Error('Logout failed');
            }

        } catch (error) {
            console.error('Logout error:', error);
            this.showNotification('Failed to logout. Please try again.', 'error');
            
            logoutBtn.innerHTML = originalHTML;
            logoutBtn.disabled = false;
            return false;
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Update current user
    updateCurrentUser(userData) {
        this.currentUser = { ...this.currentUser, ...userData };
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Session timeout handling
    handleSessionTimeout() {
        this.currentUser = null;
        this.showNotification('Session expired. Please login again.', 'error');
        setTimeout(() => {
            window.location.href = '/userLogin.html';
        }, 2000);
    }

    // Notification System (shared utility)
    showNotification(message, type = 'info') {
        // Create notification container if it doesn't exist
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
            `;
            document.body.appendChild(container);
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'warning';
        
        notification.innerHTML = `
            <i class="fa fa-${icon}"></i>
            <span class="notification-message">${message}</span>
        `;
        
        notification.style.cssText = `
            display: flex;
            align-items: center;
            padding: 12px 16px;
            margin-bottom: 10px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            min-width: 250px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
        `;
        
        notification.querySelector('i').style.marginRight = '8px';
        
        container.appendChild(notification);
        
        // Show notification with animation
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfileAuth;
}