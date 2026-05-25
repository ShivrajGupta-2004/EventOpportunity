// Data Management and API Calls
class ProfileData {
    constructor(authInstance) {
        this.auth = authInstance;
        this.isLoading = false;
    }

    // Load user profile from database
    async loadUserProfile(userId) {
        try {
            console.log('Loading profile for user ID:', userId);
            
            const response = await fetch(`http://localhost:5000/api/user/profile/${userId}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.auth.handleSessionTimeout();
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Profile data loaded:', data);
            
            // Handle different response formats and merge with session data
            const profileData = data.user || data;
            const currentUser = this.auth.getCurrentUser();
            const mergedUser = { ...currentUser, ...profileData };
            this.auth.updateCurrentUser(mergedUser);
            
            return mergedUser;

        } catch (error) {
            console.error('Profile loading failed:', error);
            this.auth.showNotification('Failed to load profile data', 'error');
            return null;
        }
    }

    // Profile Image Upload
    async handleImageUpload(file) {
        if (!file) return false;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.auth.showNotification('Please select a valid image file', 'error');
            return false;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.auth.showNotification('Image size should be less than 5MB', 'error');
            return false;
        }

        try {
            this.auth.showNotification('Uploading image...', 'info');
            
            const formData = new FormData();
            formData.append('profileImage', file);

            const response = await fetch('http://localhost:5000/api/user/upload-image', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                // Update current user data
                const currentUser = this.auth.getCurrentUser();
                currentUser.profileImage = data.imageUrl;
                this.auth.updateCurrentUser(currentUser);
                
                this.auth.showNotification('Profile image updated successfully!', 'success');
                return data.imageUrl;
            } else {
                throw new Error(data.message || 'Failed to upload image');
            }

        } catch (error) {
            console.error('Image upload failed:', error);
            this.auth.showNotification('Failed to upload image. Please try again.', 'error');
            return false;
        }
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

    // Profile Update
    async handleProfileUpdate(updateData) {
        // Validate form
        const errors = this.validateForm(updateData);
        if (Object.keys(errors).length > 0) {
            return { success: false, errors };
        }

        this.isLoading = true;

        try {
            console.log('Updating profile:', updateData);
            
            const currentUser = this.auth.getCurrentUser();
            const response = await fetch(`http://localhost:5000/api/user/profile/${currentUser._id}`, {
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
                const updatedUser = { ...currentUser, ...data.user };
                this.auth.updateCurrentUser(updatedUser);
                this.auth.showNotification('Profile updated successfully!', 'success');
                return { success: true, user: updatedUser };
            } else {
                throw new Error(data.message || 'Failed to update profile');
            }

        } catch (error) {
            console.error('Profile update failed:', error);
            
            if (error.message.includes('duplicate') || error.message.includes('already exists')) {
                this.auth.showNotification('Email or mobile number already exists', 'error');
                return { success: false, message: 'Email or mobile number already exists' };
            } else {
                this.auth.showNotification('Failed to update profile. Please try again.', 'error');
                return { success: false, message: 'Failed to update profile' };
            }
        } finally {
            this.isLoading = false;
        }
    }

    // Load User Applications - FIXED to fetch by email from applications collection
    async loadUserApplications(userEmail) {
        try {
            console.log('Loading user applications for email:', userEmail);
            
            // First try the new endpoint for applications by email
            let response = await fetch(`http://localhost:5000/api/applications/email/${encodeURIComponent(userEmail)}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Applications loaded by email:', data);
                
                if (data.success && data.applications) {
                    return data.applications;
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
                    return data.applications;
                } else {
                    return [];
                }
            } else if (response.status === 401) {
                console.log('Not authenticated for applications');
                this.auth.handleSessionTimeout();
                return null;
            } else {
                console.log('No applications found');
                return [];
            }
        } catch (error) {
            console.error('Failed to load applications:', error);
            return [];
        }
    }

    // NEW FUNCTION: Fetch Event Details by Event ID
    async fetchEventDetails(eventId) {
        try {
            console.log('Fetching event details for ID:', eventId);
            
            const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.auth.handleSessionTimeout();
                    return null;
                }
                if (response.status === 404) {
                    console.log('Event not found:', eventId);
                    this.auth.showNotification('Event not found', 'error');
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const eventData = await response.json();
            console.log('Event details loaded:', eventData.name || eventData.id);
            
            return eventData;

        } catch (error) {
            console.error('Event details loading failed:', error);
            this.auth.showNotification('Failed to load event details', 'error');
            return null;
        }
    }

    // ENHANCED: Load User Applications with Event Details
    async loadUserApplicationsWithEventDetails(userEmail) {
        try {
            console.log('Loading user applications with event details for email:', userEmail);
            
            // Get applications first
            const applications = await this.loadUserApplications(userEmail);
            
            if (!applications || applications.length === 0) {
                return applications;
            }

            // Fetch event details for each application
            const applicationsWithEventDetails = await Promise.all(
                applications.map(async (app) => {
                    if (app.eventId) {
                        const eventDetails = await this.fetchEventDetails(app.eventId);
                        if (eventDetails) {
                            return {
                                ...app,
                                eventDetails: eventDetails,
                                eventName: eventDetails.name || app.eventName,
                                eventDate: eventDetails.date || null,
                                eventLocation: eventDetails.location || null,
                                eventType: eventDetails.type || null,
                                eventPayment: eventDetails.payment || null,
                                eventDescription: eventDetails.description || null
                            };
                        }
                    }
                    return app;
                })
            );

            console.log(`Enhanced ${applicationsWithEventDetails.length} applications with event details`);
            return applicationsWithEventDetails;

        } catch (error) {
            console.error('Failed to load applications with event details:', error);
            // Fallback to basic applications
            return await this.loadUserApplications(userEmail);
        }
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
            this.auth.handleSessionTimeout();
            return;
        } else if (error.message.includes('forbidden') || error.status === 403) {
            message = 'Access denied.';
        } else if (error.message.includes('not found') || error.status === 404) {
            message = 'Requested data not found.';
        }
        
        this.auth.showNotification(message, 'error');
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfileData;
}