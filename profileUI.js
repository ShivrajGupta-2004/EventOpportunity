// UI Management and Event Handlers
class ProfileUI {
    constructor(authInstance, dataInstance) {
        this.auth = authInstance;
        this.data = dataInstance;
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
            this.auth.handleLogout();
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
            button.addEventListener('click', function () {
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


    // Edit Profile Modal
    openEditModal() {
        const modal = document.getElementById('edit-modal');
        const currentUser = this.auth.getCurrentUser();

        // Populate form with current data
        document.getElementById('edit-fullname').value = currentUser.fullName || currentUser.username || '';
        document.getElementById('edit-email').value = currentUser.email || '';
        document.getElementById('edit-mobile').value = currentUser.mobile || currentUser.phone || '';
        document.getElementById('edit-gender').value = currentUser.gender || '';

        if (currentUser.dateOfBirth || currentUser.dob) {
            const dob = new Date(currentUser.dateOfBirth || currentUser.dob);
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

    // Profile Update Handler
    async handleProfileUpdate(event) {
        event.preventDefault();

        if (this.data.isLoading) return;

        const formData = new FormData(event.target);
        const updateData = {
            fullName: formData.get('fullName').trim(),
            email: formData.get('email').trim().toLowerCase(),
            mobile: formData.get('mobile').trim(),
            gender: formData.get('gender'),
            dateOfBirth: formData.get('dateOfBirth')
        };

        const saveButton = document.querySelector('.save-btn');
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving...';
        saveButton.disabled = true;

        const result = await this.data.handleProfileUpdate(updateData);

        if (result.success) {
            // Update UI with new data
            this.updateProfileDisplay(result.user);
            this.closeEditModal();
        } else if (result.errors) {
            // Display validation errors
            this.displayFormErrors(result.errors);
        }

        // Reset button
        saveButton.innerHTML = originalText;
        saveButton.disabled = false;
    }

    displayEmptyApplications() {
        const appliedSection = document.getElementById('applied-events');
        const selectedSection = document.getElementById('selected-events');
        const attendedSection = document.getElementById('attended-events');

        if (appliedSection) {
            appliedSection.innerHTML = this.getEmptyStateHTML('calendar-o', 'No Applications Yet', 'You haven\'t applied for any events. Browse events to get started!');
        }

        if (selectedSection) {
            selectedSection.innerHTML = this.getEmptyStateHTML('check-circle-o', 'No Selected Events', 'You haven\'t been selected for any events yet.');
        }

        if (attendedSection) {
            attendedSection.innerHTML = this.getEmptyStateHTML('check-circle', 'No Attended Events', 'Events you have attended will appear here.');
        }
    }

    displayApplications(applications) {
        const appliedSection = document.getElementById('applied-events');
        const selectedSection = document.getElementById('selected-events');
        const attendedSection = document.getElementById('attended-events');

        // Clear existing content
        if (appliedSection) appliedSection.innerHTML = '';
        if (selectedSection) selectedSection.innerHTML = '';
        if (attendedSection) attendedSection.innerHTML = '';

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

        const attendedEvents = applications.filter(app =>
            app.hasAttended === true &&
            app.status === 'approved'
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
        if (attendedEvents.length > 0 && attendedSection) {
            attendedEvents.forEach(app => {
                attendedSection.appendChild(this.createEventBox(app, 'attended'));
            });
        } else if (attendedSection) {
            attendedSection.innerHTML = this.getEmptyStateHTML('check-circle', 'No Attended Events', 'Events you have attended will appear here.');
        }
    }

    // ✅ MODIFIED FUNCTION
    createEventBox(application, type) {
        const eventBox = document.createElement('div');
        eventBox.className = 'event-box';

        // Handle application data structure - more flexible field mapping
        const eventName = application.eventName || application.eventTitle || application.title || 'Event';
        const eventDate = application.applicationDate || application.createdAt || application.submittedAt;
        const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-IN') : 'N/A';
        const applicationId = application._id || application.applicationId || 'N/A';

        let statusHTML = '';
        if (type === 'attended') {
    const attendanceDate = application.attendanceDate ? new Date(application.attendanceDate).toLocaleDateString('en-IN') : 'N/A';
    const paymentStatus = application.paymentStatus || 'pending';
    const paymentClass = paymentStatus === 'paid' ? 'paid' : 'pending';
    
    statusHTML = `
        <span class="attendance-date">Attended: ${attendanceDate}</span>
        <span class="status attended">Attended</span>
        <span class="payment-status ${paymentClass}">Payment: ${paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}</span>
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
                <h4 class="event-title" style="cursor: pointer; color: #667eea;">${eventName}</h4>
                <p class="event-id">Application ID: ${applicationId}</p>
                <p class="event-date">Applied Date: ${formattedDate}</p>
                ${descriptionHTML}
                <div class="event-actions" style="margin-top: 10px;">
                    <button class="view-event-btn" data-event-id="${application.eventId}" style="padding: 5px 15px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                        View Event Details
                    </button>
                    <button class="view-app-btn" style="padding: 5px 15px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        View Application
                    </button>
                </div>
            </div>
            <div class="event-status">
                ${statusHTML}
            </div>
        `;

        // Add click event for event title
        const eventTitle = eventBox.querySelector('.event-title');
        eventTitle.addEventListener('click', () => {
            this.fetchAndShowEventDetails(application.eventId);
        });

        // Add click event for "View Event Details" button
        const viewEventBtn = eventBox.querySelector('.view-event-btn');
        viewEventBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.fetchAndShowEventDetails(application.eventId);
        });

        // Add click event for "View Application" button  
        const viewAppBtn = eventBox.querySelector('.view-app-btn');
        viewAppBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showApplicationModal(application);
        });

        return eventBox;
    }

    // ✅ NEW FUNCTION: Fetch and show event details
    // ProfileUI.js mein ye function replace kar dijiye
    async fetchAndShowEventDetails(eventId) {
        if (!eventId) {
            this.auth.showNotification('Event ID not found', 'error');
            return;
        }

        try {
            this.auth.showNotification('Loading event details...', 'info');

            const eventData = await this.data.fetchEventDetails(eventId);

            if (eventData) {
                this.showEventDetailsModal(eventData);
            }

        } catch (error) {
            console.error('Error fetching event details:', error);
            this.auth.showNotification('Failed to load event details', 'error');
        }
    }

    // ✅ NEW FUNCTION: Show event details modal
    showEventDetailsModal(eventData) {
        // Create event details modal
        const modal = document.createElement('div');
        modal.className = 'event-details-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>${eventData.name || 'Event Details'}</h3>
                    <span class="close-modal" style="cursor: pointer; font-size: 24px; color: #999;">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="event-detail-item">
                        <strong>Event Name:</strong> ${eventData.name || 'N/A'}
                    </div>
                    <div class="event-detail-item">
                        <strong>Event ID:</strong> ${eventData.id || 'N/A'}
                    </div>
                    <div class="event-detail-item">
                        <strong>Event Date:</strong> ${eventData.date ? new Date(eventData.date).toLocaleDateString('en-IN') : 'N/A'}
                    </div>
                    <div class="event-detail-item">
                        <strong>Location:</strong> ${eventData.location || 'N/A'}
                    </div>
                    <div class="event-detail-item">
                        <strong>Type:</strong> ${eventData.type || 'N/A'}
                    </div>
                    <div class="event-detail-item">
                        <strong>Payment:</strong> ₹${eventData.payment ? Number(eventData.payment).toFixed(2) : '0.00'}
                    </div>
                    <div class="event-detail-item">
                        <strong>Duration:</strong> ${eventData.duration || 'N/A'}
                    </div>
                    <div class="event-detail-item">
                        <strong>Description:</strong> 
                        <p style="margin-top: 5px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                            ${eventData.description || 'No description available'}
                        </p>
                    </div>
                    ${eventData.requirements ? `
                    <div class="event-detail-item">
                        <strong>Requirements:</strong> 
                        <p style="margin-top: 5px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                            ${eventData.requirements}
                        </p>
                    </div>
                    ` : ''}
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
            max-width: 600px;
            width: 90%;
            max-height: 80%;
            overflow-y: auto;
        `;

        modal.querySelectorAll('.event-detail-item').forEach(item => {
            item.style.cssText = `
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
            `;
        });

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

    showEventDetails(application) {
        const eventName = application.eventName || application.eventTitle || 'Event';

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
        this.auth.showNotification(`Viewing ${eventName} details...`, 'info');

        this.showApplicationModal(application);
    }

    async showApplicationModal(application) {
    // First fetch event details to get location and payment
    let eventLocation = 'N/A';
    let eventPayment = '0.00';
    
    if (application.eventId) {
        try {
            const eventData = await this.data.fetchEventDetails(application.eventId);
            if (eventData) {
                eventLocation = eventData.location || 'N/A';
                eventPayment = eventData.payment ? Number(eventData.payment).toFixed(2) : '0.00';
            }
        } catch (error) {
            console.error('Error fetching event details:', error);
        }
    }

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
                <p><strong>Location:</strong> ${eventLocation}</p>
                <p><strong>Amount:</strong> ₹${eventPayment}</p>
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
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfileUI;
}