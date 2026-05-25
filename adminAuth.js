// adminAuth.js - Authentication and Session Management

class AdminAuth {
    constructor() {
        this.currentAdmin = null;
    }

    /* ---------- SESSION & AUTHENTICATION ---------- */

    // Check admin session on page load
    async checkAdminSession() {
        try {
            const response = await fetch('http://localhost:5000/api/check-session', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.loggedIn && data.userType === 'admin') {
                    this.currentAdmin = { username: data.username };
                    this.updateSidebarAdminName(data.username);

                    // Fetch full admin details after session is confirmed
                    await this.fetchAdminDetails();

                    return true;
                } else {
                    this.redirectToLogin();
                    return false;
                }
            } else {
                this.redirectToLogin();
                return false;
            }
        } catch (error) {
            console.error('Session check failed:', error);
            this.redirectToLogin();
            return false;
        }
    }

    // Update sidebar admin name
    updateSidebarAdminName(name) {
        const sidebarNameElement = document.getElementById('sidebarAdminName');
        if (sidebarNameElement) {
            sidebarNameElement.textContent = name || 'Admin';
        }
    }

    // Redirect to login if not authenticated
    redirectToLogin() {
        alert('Please login first');
        window.location.href = 'adminLogin.html';
    }

    /* ---------- PROFILE FUNCTIONALITY ---------- */

    // Fetch admin details from database
    async fetchAdminDetails() {
        try {
            console.log('Fetching admin profile...');
            const response = await fetch('http://localhost:5000/api/admin/profile', {
                credentials: 'include'
            });

            console.log('Profile response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Admin profile data received:', data);
                this.currentAdmin = data.admin;

                // Update sidebar name with full name if available
                this.updateSidebarAdminName(this.currentAdmin.fullName || this.currentAdmin.username);

                // If "Your Details" section is currently active, render the profile
                const yourDetailsSection = document.getElementById('your-details');
                if (yourDetailsSection && yourDetailsSection.classList.contains('active')) {
                    this.renderAdminProfile(this.currentAdmin);
                }

            } else {
                const errorData = await response.json();
                console.error('Profile fetch error:', errorData);
                this.showProfileError('Failed to load profile details: ' + (errorData.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Failed to fetch admin details:', error);
            this.showProfileError('Network error loading profile');
        }
    }

    // Render admin profile in the details section
    renderAdminProfile(admin) {
        if (!admin) {
            console.error('No admin data provided to renderAdminProfile');
            this.showProfileError('No profile data available');
            return;
        }

        console.log('Rendering admin profile:', admin);

        // Wait for DOM elements to be available
        setTimeout(() => {
            // Update profile image and name section
            const profileFullName = document.getElementById('profileFullName');
            const profileUsername = document.getElementById('profileUsername');

            if (profileFullName) {
                profileFullName.textContent = admin.fullName || 'N/A';
                console.log('Updated profileFullName to:', admin.fullName);
            } else {
                console.error('profileFullName element not found');
            }

            if (profileUsername) {
                profileUsername.textContent = `@${admin.username || 'N/A'}`;
                console.log('Updated profileUsername to:', admin.username);
            } else {
                console.error('profileUsername element not found');
            }

            // Update profile details
            const updates = [
                { id: 'displayFullName', value: admin.fullName || 'N/A' },
                { id: 'displayUsername', value: admin.username || 'N/A' },
                { id: 'displayEmail', value: admin.email || 'N/A' },
                { id: 'displayMobile', value: admin.mobile || 'N/A' },
                { id: 'displayGender', value: admin.gender ? admin.gender.charAt(0).toUpperCase() + admin.gender.slice(1) : 'N/A' }
            ];

            updates.forEach(update => {
                const element = document.getElementById(update.id);
                if (element) {
                    element.textContent = update.value;
                    console.log(`Updated ${update.id} to:`, update.value);
                } else {
                    console.error(`${update.id} element not found`);
                }
            });

            // Format and update date of birth
            const displayDateOfBirth = document.getElementById('displayDateOfBirth');
            if (displayDateOfBirth) {
                if (admin.dateOfBirth) {
                    try {
                        const dob = new Date(admin.dateOfBirth);
                        if (dob.getFullYear() > 1900) {
                            displayDateOfBirth.textContent = dob.toLocaleDateString('en-IN');
                            console.log('Updated displayDateOfBirth to:', dob.toLocaleDateString('en-IN'));
                        } else {
                            displayDateOfBirth.textContent = 'Invalid Date';
                            console.warn('Invalid date of birth detected:', admin.dateOfBirth);
                        }
                    } catch (error) {
                        displayDateOfBirth.textContent = 'Invalid Date';
                        console.error('Date parsing error:', error);
                    }
                } else {
                    displayDateOfBirth.textContent = 'N/A';
                }
            }

            // Format and update registration date
            const displayRegistrationDate = document.getElementById('displayRegistrationDate');
            if (displayRegistrationDate) {
                if (admin.createdAt) {
                    try {
                        const regDate = new Date(admin.createdAt);
                        displayRegistrationDate.textContent = regDate.toLocaleDateString('en-IN');
                        console.log('Updated displayRegistrationDate to:', regDate.toLocaleDateString('en-IN'));
                    } catch (error) {
                        displayRegistrationDate.textContent = 'Invalid Date';
                        console.error('Registration date parsing error:', error);
                    }
                } else {
                    displayRegistrationDate.textContent = 'N/A';
                }
            }

            console.log('Profile rendering completed');
        }, 100); // Small delay to ensure DOM is ready
    }

    // Show profile loading state
    showProfileLoading() {
        const profileContainer = document.querySelector('.profile-details-container');
        if (profileContainer) {
            profileContainer.innerHTML = `
                <div class="profile-loading" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #007bff;"></i>
                    <p style="margin-top: 1rem; color: #666;">Loading your profile...</p>
                </div>
            `;
        }
    }

    // Show profile error
    showProfileError(message) {
        const profileContainer = document.querySelector('.profile-details-container');
        if (profileContainer) {
            profileContainer.innerHTML = `
                <div class="profile-error" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #dc3545;"></i>
                    <p style="margin: 1rem 0; color: #666;">${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    }

    /* ---------- EDIT PROFILE MODAL ---------- */

    initializeEditProfileModal() {
        const editProfileModal = document.getElementById('editProfileModal');
        const editProfileBtn = document.getElementById('editProfileBtn');
        const closeEditProfileBtn = document.getElementById('closeEditProfileBtn');
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        const editProfileForm = document.getElementById('editProfileForm');

        // Open edit profile modal
        editProfileBtn.addEventListener('click', () => {
            if (this.currentAdmin) {
                this.populateEditForm(this.currentAdmin);
                editProfileModal.style.display = 'block';
            } else {
                alert('Profile data not loaded');
            }
        });

        // Close edit profile modal
        closeEditProfileBtn.addEventListener('click', () => this.closeEditProfileModal());
        cancelEditBtn.addEventListener('click', () => this.closeEditProfileModal());
        window.addEventListener('click', (e) => {
            if (e.target === editProfileModal) {
                this.closeEditProfileModal();
            }
        });

        // Handle edit profile form submission
        editProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(editProfileForm);
            const updatedData = {
                fullName: formData.get('fullName').trim(),
                username: formData.get('username').trim(),
                email: formData.get('email').toLowerCase().trim(),
                mobile: formData.get('mobile').trim(),
                gender: formData.get('gender'),
                dateOfBirth: formData.get('dateOfBirth')
            };

            try {
                const response = await fetch('http://localhost:5000/api/admin/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(updatedData)
                });

                if (response.ok) {
                    const result = await response.json();
                    this.currentAdmin = result.admin;
                    this.renderAdminProfile(this.currentAdmin);
                    this.updateSidebarAdminName(this.currentAdmin.fullName);
                    this.closeEditProfileModal();
                    this.showMessage('Profile updated successfully!', 'success');
                } else {
                    const error = await response.json();
                    this.showMessage(error.error || 'Failed to update profile', 'error');
                }
            } catch (error) {
                console.error('Profile update error:', error);
                this.showMessage('Network error updating profile', 'error');
            }
        });
    }

    closeEditProfileModal() {
        const editProfileModal = document.getElementById('editProfileModal');
        const editProfileForm = document.getElementById('editProfileForm');
        editProfileModal.style.display = 'none';
        editProfileForm.reset();
    }

    // Populate edit form with current admin data
    populateEditForm(admin) {
        document.getElementById('editFullName').value = admin.fullName || '';
        document.getElementById('editUsername').value = admin.username || '';
        document.getElementById('editEmail').value = admin.email || '';
        document.getElementById('editMobile').value = admin.mobile || '';
        document.getElementById('editGender').value = admin.gender || '';

        if (admin.dateOfBirth) {
            try {
                const dob = new Date(admin.dateOfBirth);
                document.getElementById('editDateOfBirth').value = dob.toISOString().split('T')[0];
            } catch (error) {
                console.error('Error formatting date for edit form:', error);
            }
        }
    }

    /* ---------- LOGOUT FUNCTIONALITY ---------- */

    initializeLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to logout?')) {
                try {
                    const response = await fetch('http://localhost:5000/api/logout', {
                        method: 'POST',
                        credentials: 'include'
                    });

                    if (response.ok) {
                        alert('Logged out successfully');
                        window.location.href = 'adminLogin.html';
                    } else {
                        alert('Logout failed');
                    }
                } catch (error) {
                    console.error('Logout error:', error);
                    alert('Network error during logout');
                }
            }
        });
    }

    /* ---------- MESSAGE SYSTEM ---------- */

    showMessage(text, type = 'success') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        // Create message container if it doesn't exist
        let messageContainer = document.querySelector('.message-container');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.className = 'message-container';
            messageContainer.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
            `;
            document.body.appendChild(messageContainer);
        }

        // Create and show message
        const message = document.createElement('div');
        message.className = `message message-${type}`;
        message.style.cssText = `
            padding: 12px 24px;
            margin-bottom: 10px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            background-color: ${type === 'success' ? '#28a745' : '#dc3545'};
        `;
        message.textContent = text;
        messageContainer.appendChild(message);

        // Auto remove after 5 seconds
        setTimeout(() => {
            message.remove();
        }, 5000);
    }

    // Initialize all authentication-related functionality
    initialize() {
        this.initializeEditProfileModal();
        this.initializeLogout();
    }

    // Get current admin data
    getCurrentAdmin() {
        return this.currentAdmin;
    }

    // Set current admin data
    setCurrentAdmin(admin) {
        this.currentAdmin = admin;
    }
}