
// Profile Dashboard JavaScript with Session Integration - FIXED VERSION

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.isLoading = false;
        this.init();
    }

    async init() {
        this.showLoadingScreen();
        await this.checkAuthAndLoadProfile();
        this.initializeEventListeners();
        this.hideLoadingScreen();
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
                return;
            }

            // Store user info from session
            this.currentUser = {
                _id: data.userId,
                username: data.username,
                email: data.email
            };

            console.log('User authenticated:', data.username, 'ID:', data.userId);
            
            // Load full user profile from database
            await this.loadUserProfile(data.userId);
            
            // Load user applications using email
            await this.loadUserApplications(data.email);

        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = '/userLogin.html';
        }
    }

    async loadUserProfile(userId) {
        try {
            console.log('Loading profile for user ID:', userId);
            
            const response = await fetch(`http://localhost:5000/api/user/profile/${userId}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/userLogin.html';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Profile data loaded:', data);
            
            // Handle different response formats and merge with session data
            const profileData = data.user || data;
            this.currentUser = { ...this.currentUser, ...profileData };
            
            this.updateProfileDisplay(this.currentUser);

        } catch (error) {
            console.error('Profile loading failed:', error);
            this.showNotification('Failed to load profile data', 'error');
            
            // If profile fails to load, still show basic info from session
            if (this.currentUser.username) {
                this.updateProfileDisplay(this.currentUser);
            }
        }
    }

    // UI Management
    showLoadingScreen() {
        document.getElementById('loading-screen').style.display = 'flex';
        document.getElementById('main-content').style.display = 'none';
    }

    hideLoadingScreen() {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
    }

    updateProfileDisplay(user) {
        // Update profile header
        document.getElementById('profile-name').textContent = user.fullName || user.username || 'User';
        document.getElementById('profile-username').textContent = `@${user.username || 'user'}`;
        
        // Update profile image
        if (user.profileImage) {
            document.getElementById('profile-img').src = user.profileImage;
        }

        // Update personal details
        document.getElementById('detail-fullname').textContent = user.fullName || user.username || '-';
        document.getElementById('detail-email').textContent = user.email || '-';
        document.getElementById('detail-mobile').textContent = user.mobile || user.phone || '-';
        document.getElementById('detail-gender').textContent = user.gender || '-';
        
        // Format date of birth
        if (user.dateOfBirth || user.dob) {
            const dob = new Date(user.dateOfBirth || user.dob);
            document.getElementById('detail-dob').textContent = dob.toLocaleDateString('en-IN');
        } else {
            document.getElementById('detail-dob').textContent = '-';
        }
        
        document.getElementById('detail-age').textContent = user.age || '-';
        
        // Format registration date
        if (user.registrationDate || user.createdAt) {
            const regDate = new Date(user.registrationDate || user.createdAt);
            document.getElementById('detail-registration').textContent = regDate.toLocaleDateString('en-IN');
        } else {
            document.getElementById('detail-registration').textContent = '-';
        }
        
        // Email verification status
        const emailStatusEl = document.getElementById('detail-email-status');
        if (user.isEmailVerified) {
            emailStatusEl.textContent = 'Verified';
            emailStatusEl.className = 'detail-value verified';
        } else {
            emailStatusEl.textContent = 'Not Verified';
            emailStatusEl.className = 'detail-value';
            emailStatusEl.style.color = '#ff4757';
        }
    }

    // Event Listeners
    initializeEventListeners() {
        // Edit Profile Button
        document.getElementById('edit-profile-btn').addEventListener('click', () => {
            this.openEditModal();
        });

        // Logout Button
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Profile Image Upload
        document.querySelector('.profile-image').addEventListener('click', () => {
            document.getElementById('image-upload').click();
        });

        document.getElementById('image-upload').addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });

        // Modal Controls
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeEditModal();
        });

        document.getElementById('cancel-edit').addEventListener('click', () => {
            this.closeEditModal();
        });

        // Edit Form
        document.getElementById('edit-form').addEventListener('submit', (e) => {
            this.handleProfileUpdate(e);
        });

        // Tab Navigation
        this.initializeTabs();

        // Close modal on outside click
        document.getElementById('edit-modal').addEventListener('click', (e) => {
            if (e.target.id === 'edit-modal') {
                this.closeEditModal();
            }
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeEditModal();
            }
        });
    }

    // Tab Management
    initializeTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const eventSections = document.querySelectorAll('.events-section');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetTab = this.getAttribute('data-tab');
                
                // Remove active class from all tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Hide all sections
                eventSections.forEach(section => {
                    section.classList.add('hidden');
                });
                
                // Show target section
                const targetSection = document.getElementById(`${targetTab}-events`);
                if (targetSection) {
                    targetSection.classList.remove('hidden');
                    targetSection.classList.add('fade-in');
                }
            });
        });
    }

    // Profile Image Upload
    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showNotification('Please select a valid image file', 'error');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('Image size should be less than 5MB', 'error');
            return;
        }

        try {
            this.showNotification('Uploading image...', 'info');
            
            const formData = new FormData();
            formData.append('profileImage', file);

            const response = await fetch('http://localhost:5000/api/user/upload-image', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                // Update profile image display
                document.getElementById('profile-img').src = data.imageUrl;
                this.currentUser.profileImage = data.imageUrl;
                this.showNotification('Profile image updated successfully!', 'success');
            } else {
                throw new Error(data.message || 'Failed to upload image');
            }

        } catch (error) {
            console.error('Image upload failed:', error);
            this.showNotification('Failed to upload image. Please try again.', 'error');
        }
    }

    // Edit Profile Modal
    openEditModal() {
        const modal = document.getElementById('edit-modal');
        
        // Populate form with current data
        document.getElementById('edit-fullname').value = this.currentUser.fullName || this.currentUser.username || '';
        document.getElementById('edit-email').value = this.currentUser.email || '';
        document.getElementById('edit-mobile').value = this.currentUser.mobile || this.currentUser.phone || '';
        document.getElementById('edit-gender').value = this.currentUser.gender || '';
        
        if (this.currentUser.dateOfBirth || this.currentUser.dob) {
            const dob = new Date(this.currentUser.dateOfBirth || this.currentUser.dob);
            const formattedDate = dob.toISOString().split('T')[0];
            document.getElementById('edit-dob').value = formattedDate;
        }

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Clear any previous errors
        this.clearFormErrors();
    }

    closeEditModal() {
        document.getElementById('edit-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
        this.clearFormErrors();
    }

    clearFormErrors() {
        const errorElements = document.querySelectorAll('.error-msg');
        errorElements.forEach(el => el.textContent = '');
        
        const inputElements = document.querySelectorAll('.form-group input, .form-group select');
        inputElements.forEach(el => el.style.borderColor = '#eee');
    }

    // Form Validation
    validateForm(formData) {
        const errors = {};

        // Full Name validation
        if (!formData.fullName || formData.fullName.trim().length < 2) {
            errors.fullname = 'Full name must be at least 2 characters';
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email || !emailRegex.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        // Mobile validation
        const mobileRegex = /^[0-9]{10}$/;
        if (!formData.mobile || !mobileRegex.test(formData.mobile)) {
            errors.mobile = 'Please enter a valid 10-digit mobile number';
        }

        // Gender validation
        if (!formData.gender) {
            errors.gender = 'Please select your gender';
        }

        // Date of Birth validation
        if (!formData.dateOfBirth) {
            errors.dob = 'Please select your date of birth';
        } else {
            const dob = new Date(formData.dateOfBirth);
            const today = new Date();
            const age = today.getFullYear() - dob.getFullYear();
            
            if (age < 13 || age > 100) {
                errors.dob = 'Age must be between 13 and 100 years';
            }
        }

        return errors;
    }

    displayFormErrors(errors) {
        // Clear previous errors
        this.clearFormErrors();

        // Display new errors
        Object.keys(errors).forEach(field => {
            const errorElement = document.getElementById(`error-${field}`);
            const inputElement = document.getElementById(`edit-${field}`);
            
            if (errorElement) {
                errorElement.textContent = errors[field];
            }
            
            if (inputElement) {
                inputElement.style.borderColor = '#ff4757';
            }
        });
    }

    // Profile Update
    async handleProfileUpdate(event) {
        event.preventDefault();
        
        if (this.isLoading) return;
        
        const formData = new FormData(event.target);
        const updateData = {
            fullName: formData.get('fullName').trim(),
            email: formData.get('email').trim().toLowerCase(),
            mobile: formData.get('mobile').trim(),
            gender: formData.get('gender'),
            dateOfBirth: formData.get('dateOfBirth')
        };

        // Validate form
        const errors = this.validateForm(updateData);
        if (Object.keys(errors).length > 0) {
            this.displayFormErrors(errors);
            return;
        }

        this.isLoading = true;
        const saveButton = document.querySelector('.save-btn');
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving...';
        saveButton.disabled = true;

        try {
            console.log('Updating profile:', updateData);
            
            const response = await fetch(`http://localhost:5000/api/user/profile/${this.currentUser._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (response.ok) {
                // Update local user data
                this.currentUser = { ...this.currentUser, ...data.user };
                this.updateProfileDisplay(this.currentUser);
                this.closeEditModal();
                this.showNotification('Profile updated successfully!', 'success');
            } else {
                throw new Error(data.message || 'Failed to update profile');
            }

        } catch (error) {
            console.error('Profile update failed:', error);
            
            if (error.message.includes('duplicate') || error.message.includes('already exists')) {
                this.showNotification('Email or mobile number already exists', 'error');
            } else {
                this.showNotification('Failed to update profile. Please try again.', 'error');
            }
        } finally {
            this.isLoading = false;
            saveButton.innerHTML = originalText;
            saveButton.disabled = false;
        }
    }

    // Logout
    async handleLogout() {
        const confirmLogout = confirm('Are you sure you want to logout?');
        
        if (!confirmLogout) return;

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
            } else {
                throw new Error('Logout failed');
            }

        } catch (error) {
            console.error('Logout error:', error);
            this.showNotification('Failed to logout. Please try again.', 'error');
            
            logoutBtn.innerHTML = originalHTML;
            logoutBtn.disabled = false;
        }
    }

    // Load User Applications - FIXED to fetch by email from applications collection
    async loadUserApplications(userEmail) {
        try {
            console.log('Loading user applications for email:', userEmail);
            
            // First try the new endpoint for applications by email
            let response = await fetch(`http://localhost:5000/api/applications/by-email/${encodeURIComponent(userEmail)}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Applications loaded by email:', data);
                
                if (data.success && data.applications) {
                    this.displayApplications(data.applications);
                    return;
                }
            }

            // Fallback to original endpoint
            response = await fetch('http://localhost:5000/api/applications/my-applications', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Applications loaded (fallback):', data);
                
                if (data.success && data.applications) {
                    this.displayApplications(data.applications);
                } else {
                    this.displayEmptyApplications();
                }
            } else if (response.status === 401) {
                console.log('Not authenticated for applications');
                window.location.href = '/userLogin.html';
            } else {
                console.log('No applications found');
                this.displayEmptyApplications();
            }
        } catch (error) {
            console.error('Failed to load applications:', error);
            this.displayEmptyApplications();
        }
    }

    displayEmptyApplications() {
        const appliedSection = document.getElementById('applied-events');
        const selectedSection = document.getElementById('selected-events');
        const paymentSection = document.getElementById('payment-events');

        if (appliedSection) {
            appliedSection.innerHTML = this.getEmptyStateHTML('calendar-o', 'No Applications Yet', 'You haven\'t applied for any events. Browse events to get started!');
        }
        
        if (selectedSection) {
            selectedSection.innerHTML = this.getEmptyStateHTML('check-circle-o', 'No Selected Events', 'You haven\'t been selected for any events yet.');
        }
        
        if (paymentSection) {
            paymentSection.innerHTML = this.getEmptyStateHTML('credit-card', 'No Payment History', 'Your payment history will appear here.');
        }
    }

    displayApplications(applications) {
        const appliedSection = document.getElementById('applied-events');
        const selectedSection = document.getElementById('selected-events');
        const paymentSection = document.getElementById('payment-events');

        // Clear existing content
        if (appliedSection) appliedSection.innerHTML = '';
        if (selectedSection) selectedSection.innerHTML = '';
        if (paymentSection) paymentSection.innerHTML = '';

        if (!applications || applications.length === 0) {
            this.displayEmptyApplications();
            return;
        }

        console.log('Processing applications:', applications);

        // Separate applications by status
        const appliedEvents = applications.filter(app => 
            app.status === 'pending' || 
            app.status === 'submitted' || 
            app.status === 'applied' ||
            app.status === 'under_review'
        );
        
        const selectedEvents = applications.filter(app => 
            app.status === 'approved' || 
            app.status === 'selected' ||
            app.status === 'accepted'
        );
        
        const paidEvents = applications.filter(app => 
            app.status === 'paid' || 
            app.paymentStatus === 'completed' ||
            app.status === 'completed'
        );

        // Display applied events
        if (appliedEvents.length > 0 && appliedSection) {
            appliedEvents.forEach(app => {
                appliedSection.appendChild(this.createEventBox(app, 'applied'));
            });
        } else if (appliedSection) {
            appliedSection.innerHTML = this.getEmptyStateHTML('calendar-o', 'No Pending Applications', 'You have no pending applications.');
        }

        // Display selected events
        if (selectedEvents.length > 0 && selectedSection) {
            selectedEvents.forEach(app => {
                selectedSection.appendChild(this.createEventBox(app, 'selected'));
            });
        } else if (selectedSection) {
            selectedSection.innerHTML = this.getEmptyStateHTML('check-circle-o', 'No Selected Events', 'You haven\'t been selected for any events yet.');
        }

        // Display payment history
        if (paidEvents.length > 0 && paymentSection) {
            paidEvents.forEach(app => {
                paymentSection.appendChild(this.createEventBox(app, 'paid'));
            });
        } else if (paymentSection) {
            paymentSection.innerHTML = this.getEmptyStateHTML('credit-card', 'No Payment History', 'Your payment history will appear here.');
        }
    }

    createEventBox(application, type) {
        const eventBox = document.createElement('div');
        eventBox.className = 'event-box';
        
        // Handle application data structure - more flexible field mapping
        const eventName = application.eventName || application.eventTitle || application.title || 'Event';
        const eventDate = application.applicationDate || application.createdAt || application.submittedAt;
        const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-IN') : 'N/A';
        const applicationId = application._id || application.applicationId || 'N/A';
        
        let statusHTML = '';
        if (type === 'paid') {
            const amount = application.amount || application.fee || 0;
            statusHTML = `
                <span class="amount">₹${Number(amount).toFixed(2)}</span>
                <span class="status paid">Paid</span>
            `;
        } else {
            const displayStatus = application.status || type;
            const statusClass = type === 'selected' ? 'selected' : type === 'applied' ? 'pending' : type;
            statusHTML = `<span class="status ${statusClass}">${displayStatus}</span>`;
        }
        
        // Add event description if available
        const description = application.description || application.eventDescription || '';
        const descriptionHTML = description ? `<p class="event-description">${description.substring(0, 100)}${description.length > 100 ? '...' : ''}</p>` : '';
        
        eventBox.innerHTML = `
            <div class="event-content">
                <h4 class="event-title">${eventName}</h4>
                <p class="event-id">Application ID: ${applicationId}</p>
                <p class="event-date">Applied: ${formattedDate}</p>
                ${descriptionHTML}
            </div>
            <div class="event-status">
                ${statusHTML}
            </div>
        `;
        
        // Add click event for event details
        eventBox.addEventListener('click', () => {
            this.showEventDetails(application);
        });
        
        return eventBox;
    }

    showEventDetails(application) {
        const eventName = application.eventName || application.eventTitle || 'Event';
        
        // Create a modal or navigate to details page
        const details = {
            name: eventName,
            status: application.status,
            appliedDate: application.applicationDate || application.createdAt,
            email: application.email,
            phone: application.phone,
            experience: application.experience,
            motivation: application.motivation
        };
        
        console.log('Application details:', details);
        this.showNotification(`Viewing ${eventName} details...`, 'info');
        
        // You can expand this to show a proper modal with all details
        this.showApplicationModal(application);
    }

    showApplicationModal(application) {
        // Create a simple modal to show application details
        const modal = document.createElement('div');
        modal.className = 'application-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${application.eventName || 'Application Details'}</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <p><strong>Status:</strong> ${application.status}</p>
                    <p><strong>Applied Date:</strong> ${new Date(application.applicationDate || application.createdAt).toLocaleDateString('en-IN')}</p>
                    <p><strong>Email:</strong> ${application.email}</p>
                    <p><strong>Phone:</strong> ${application.phone || 'N/A'}</p>
                    ${application.experience ? `<p><strong>Experience:</strong> ${application.experience}</p>` : ''}
                    ${application.motivation ? `<p><strong>Motivation:</strong> ${application.motivation}</p>` : ''}
                </div>
            </div>
        `;
        
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        modal.querySelector('.modal-content').style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 500px;
            width: 90%;
            max-height: 80%;
            overflow-y: auto;
        `;
        
        modal.querySelector('.close-modal').style.cssText = `
            float: right;
            font-size: 24px;
            cursor: pointer;
            color: #999;
        `;
        
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        document.body.appendChild(modal);
    }

    getEmptyStateHTML(icon, title, description) {
        return `
            <div class="empty-state">
                <i class="fa fa-${icon}"></i>
                <h4>${title}</h4>
                <p>${description}</p>
            </div>
        `;
    }

    // Notification System
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

    // Utility Methods
    formatDate(dateString) {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('en-IN', options);
    }

    formatCurrency(amount) {
        if (!amount && amount !== 0) return '₹0.00';
        return `₹${Number(amount).toFixed(2)}`;
    }

    // Error Handling
    handleError(error, context = 'Operation') {
        console.error(`${context} failed:`, error);
        
        let message = `${context} failed. Please try again.`;
        
        if (error.message.includes('network') || error.message.includes('fetch')) {
            message = 'Network error. Please check your connection.';
        } else if (error.message.includes('unauthorized') || error.status === 401) {
            message = 'Session expired. Please login again.';
            setTimeout(() => {
                window.location.href = '/userLogin.html';
            }, 2000);
        } else if (error.message.includes('forbidden') || error.status === 403) {
            message = 'Access denied.';
        } else if (error.message.includes('not found') || error.status === 404) {
            message = 'Requested data not found.';
        }
        
        this.showNotification(message, 'error');
    }
}

// Initialize Profile Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
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
        window.profileManager.isLoading = false;
    }
});

// Export for external access (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfileManager;
}