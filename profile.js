// Main Profile Manager - Coordinates all profile functionality
class ProfileManager {
    constructor() {
        this.auth = new ProfileAuth();
        this.data = new ProfileData(this.auth);
        this.ui = new ProfileUI(this.auth, this.data);
        this.init();
    }

    async init() {
        this.ui.showLoadingScreen();
        await this.checkAuthAndLoadProfile();
        this.ui.initializeEventListeners();
        this.ui.hideLoadingScreen();
    }

    // Main initialization flow
    async checkAuthAndLoadProfile() {
        try {
            // Check authentication first
            const currentUser = await this.auth.checkAuthAndLoadProfile();
            
            if (!currentUser) {
                console.log('Authentication failed, redirecting...');
                return;
            }

            // Load full user profile from database
            const profileData = await this.data.loadUserProfile(currentUser._id);
            
            if (profileData) {
                // Update UI with profile data
                this.ui.updateProfileDisplay(profileData);
            }
            
            // Load user applications using email
            await this.loadAndDisplayApplications(currentUser.email);

        } catch (error) {
            console.error('Initialization failed:', error);
            this.auth.showNotification('Failed to load profile. Please try again.', 'error');
        }
    }

    // Load and display applications
    async loadAndDisplayApplications(userEmail) {
        try {
            const applications = await this.data.loadUserApplications(userEmail);
            
            if (applications !== null) {
                this.ui.displayApplications(applications);
            }
        } catch (error) {
            console.error('Failed to load applications:', error);
            this.ui.displayEmptyApplications();
        }
    }

    // Public methods for external access
    getCurrentUser() {
        return this.auth.getCurrentUser();
    }

    refreshProfile() {
        return this.checkAuthAndLoadProfile();
    }

    showNotification(message, type = 'info') {
        return this.auth.showNotification(message, type);
    }
}

// Initialize Profile Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Load required scripts first
        if (typeof ProfileAuth === 'undefined' || 
            typeof ProfileData === 'undefined' || 
            typeof ProfileUI === 'undefined') {
            console.error('Required profile modules not loaded. Please ensure all profile scripts are included.');
            document.body.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; font-family: 'Poppins', sans-serif;">
                    <h2 style="color: #ff4757; margin-bottom: 16px;">Missing Dependencies</h2>
                    <p style="color: #666; margin-bottom: 24px;">Please ensure all profile scripts are loaded:</p>
                    <ul style="color: #666; margin-bottom: 24px;">
                        <li>profileAuth.js</li>
                        <li>profileData.js</li>
                        <li>profileUI.js</li>
                    </ul>
                    <button onclick="window.location.reload()" style="padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Reload Page
                    </button>
                </div>
            `;
            return;
        }

        window.profileManager = new ProfileManager();
        console.log('Profile Manager initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Profile Manager:', error);
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; font-family: 'Poppins', sans-serif;">
                <h2 style="color: #ff4757; margin-bottom: 16px;">Failed to Load Profile</h2>
                <p style="color: #666; margin-bottom: 24px;">There was an error loading the profile page.</p>
                <button onclick="window.location.reload()" style="padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Reload Page
                </button>
            </div>
        `;
    }
});

// Handle session timeout and page visibility
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.profileManager) {
        // Refresh data when page becomes visible
        window.profileManager.checkAuthAndLoadProfile();
    }
});

// Handle browser back/forward buttons
window.addEventListener('popstate', (e) => {
    // Handle browser navigation if needed
    console.log('Browser navigation detected');
});

// Handle beforeunload for cleanup
window.addEventListener('beforeunload', () => {
    // Cleanup any ongoing operations
    if (window.profileManager) {
        window.profileManager.data.isLoading = false;
    }
});

// Export for external access (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfileManager;
}