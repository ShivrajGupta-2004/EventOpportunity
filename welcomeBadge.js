// Welcome Badge Manager - Works on all pages
class WelcomeBadgeManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        await this.checkAuthAndSetupUI();
        this.initializeMenuToggle();
    }

    // Check authentication and setup UI
    async checkAuthAndSetupUI() {
        try {
            const response = await fetch('http://localhost:5000/api/check-session', {
                method: 'GET',
                credentials: 'include'
            });

            const data = await response.json();
           
            if (data.loggedIn && data.userType === 'user') {
                this.currentUser = data;
                // Show welcome badge in navigation
                this.showWelcomeBadge();
            } else {
                // User not logged in - badge remains hidden
                console.log('User not logged in');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            // Don't redirect on other pages, just hide badge
        }
    }

    // Show welcome badge in navigation
    showWelcomeBadge() {
        const professionalBadge = document.getElementById('professional-badge');
        const usernameDisplay = document.getElementById('username-display');
        
        if (professionalBadge && usernameDisplay && this.currentUser) {
            usernameDisplay.textContent = this.currentUser.username || 'User';
            professionalBadge.style.display = 'block';
            console.log('Welcome badge displayed for:', this.currentUser.username);
        } else {
            console.error('Badge elements not found in DOM');
        }
    }

    // Initialize menu toggle functions
    initializeMenuToggle() {
        window.showMenu = function() {
            const navLinks = document.getElementById("navLinks");
            if (navLinks) navLinks.style.right = "0";
        };

        window.hideMenu = function() {
            const navLinks = document.getElementById("navLinks");
            if (navLinks) navLinks.style.right = "-200px";
        };
    }

    // Method to manually set user (optional - for testing)
    setUser(username) {
        this.currentUser = { username: username };
        this.showWelcomeBadge();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.welcomeBadgeManager = new WelcomeBadgeManager();
});