// Home Page JavaScript - Show Welcome in Navigation
class HomeManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        await this.checkAuthAndSetupUI();
        this.initializeEventListeners();
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
                // Show welcome message in navigation
                this.showWelcomeInNavigation();
            } else {
                // Redirect to login if not authenticated
                window.location.href = '/userLogin.html';
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = '/userLogin.html';
        }
    }

    // Show welcome message in navigation (professional badge area)
    showWelcomeInNavigation() {
        const professionalBadge = document.getElementById('professional-badge');
        const usernameDisplay = document.getElementById('username-display');
        
        if (professionalBadge && usernameDisplay && this.currentUser) {
            usernameDisplay.textContent = this.currentUser.username || 'User';
            professionalBadge.style.display = 'block';
        }
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Menu toggle functions
        window.showMenu = function() {
            const navLinks = document.getElementById("navLinks");
            if (navLinks) navLinks.style.right = "0";
        };

        window.hideMenu = function() {
            const navLinks = document.getElementById("navLinks");
            if (navLinks) navLinks.style.right = "-200px";
        };

        // Smooth scrolling for anchor links
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.homeManager = new HomeManager();
});