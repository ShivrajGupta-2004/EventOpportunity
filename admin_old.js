document.addEventListener('DOMContentLoaded', function () {
    /* 1. EMPTY EVENTS ARRAY – will be populated from MongoDB */
    let events = [];
    let currentAdmin = null; // Store current admin details

    let applicantsApplied = [
        { id: 1, name: 'Ethan Harper', email: 'ethan.harper@email.com', phone: '555-123-4567', eventName: 'Tech Summit 2024', applicationDate: '2024-03-15', status: 'Pending' },
        { id: 2, name: 'Olivia Bennett', email: 'olivia.bennett@email.com', phone: '555-987-6543', eventName: 'Marketing Conference', applicationDate: '2024-03-10', status: 'Approved' },
        { id: 3, name: 'Noah Carter', email: 'noah.carter@email.com', phone: '555-246-8013', eventName: 'Design Workshop', applicationDate: '2024-03-05', status: 'Rejected' },
        { id: 4, name: 'Ava Davis', email: 'ava.davis@email.com', phone: '555-369-1470', eventName: 'Finance Symposium', applicationDate: '2024-02-28', status: 'Pending' },
        { id: 5, name: 'Liam Evans', email: 'liam.evans@email.com', phone: '555-789-0123', eventName: 'Healthcare Forum', applicationDate: '2024-02-20', status: 'Approved' }
    ];

    let applicantsSelected = [
        { id: 1, name: 'Ethan Harper', email: 'ethan.harper@email.com', eventName: 'Tech Innovators Summit', selectionDate: '2024-07-20', notes: 'Promising candidate' },
        { id: 2, name: 'Olivia Bennett', email: 'olivia.bennett@email.com', eventName: 'Creative Media Workshop', selectionDate: '2024-07-21', notes: 'Excellent portfolio' },
        { id: 3, name: 'Noah Carter', email: 'noah.carter@email.com', eventName: 'Digital Marketing Conference', selectionDate: '2024-07-27', notes: 'Strong recommendations' },
        { id: 4, name: 'Ava Mitchell', email: 'ava.mitchell@email.com', eventName: 'Sustainable Solutions Forum', selectionDate: '2024-07-23', notes: 'Passionate about sustainability' },
        { id: 5, name: 'Liam Foster', email: 'liam.foster@email.com', eventName: 'Financial Analysts Symposium', selectionDate: '2024-07-24', notes: 'Analytical skills' }
    ];

    let currentEditingEventId = null;

    /* ---------- SESSION & AUTHENTICATION ---------- */

    // Check admin session on page load
    async function checkAdminSession() {
        try {
            const response = await fetch('http://localhost:5000/api/check-session', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.loggedIn && data.userType === 'admin') {
                    currentAdmin = { username: data.username };
                    updateSidebarAdminName(data.username);
                    
                    // Fetch full admin details after session is confirmed
                    await fetchAdminDetails();
                    
                    return true;
                } else {
                    redirectToLogin();
                    return false;
                }
            } else {
                redirectToLogin();
                return false;
            }
        } catch (error) {
            console.error('Session check failed:', error);
            redirectToLogin();
            return false;
        }
    }

    // Update sidebar admin name
    function updateSidebarAdminName(name) {
        const sidebarNameElement = document.getElementById('sidebarAdminName');
        if (sidebarNameElement) {
            sidebarNameElement.textContent = name || 'Admin';
        }
    }

    // Redirect to login if not authenticated
    function redirectToLogin() {
        alert('Please login first');
        window.location.href = 'adminLogin.html';
    }

    /* ---------- PROFILE FUNCTIONALITY ---------- */

    // Fetch admin details from database
    async function fetchAdminDetails() {
        try {
            console.log('Fetching admin profile...');
            const response = await fetch('http://localhost:5000/api/admin/profile', {
                credentials: 'include'
            });

            console.log('Profile response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Admin profile data received:', data);
                currentAdmin = data.admin;
                
                // Update sidebar name with full name if available
                updateSidebarAdminName(currentAdmin.fullName || currentAdmin.username);
                
                // If "Your Details" section is currently active, render the profile
                const yourDetailsSection = document.getElementById('your-details');
                if (yourDetailsSection && yourDetailsSection.classList.contains('active')) {
                    renderAdminProfile(currentAdmin);
                }
                
            } else {
                const errorData = await response.json();
                console.error('Profile fetch error:', errorData);
                showProfileError('Failed to load profile details: ' + (errorData.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Failed to fetch admin details:', error);
            showProfileError('Network error loading profile');
        }
    }

    // Render admin profile in the details section
    function renderAdminProfile(admin) {
        if (!admin) {
            console.error('No admin data provided to renderAdminProfile');
            showProfileError('No profile data available');
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
    function showProfileLoading() {
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
    function showProfileError(message) {
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

    const editProfileModal = document.getElementById('editProfileModal');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const closeEditProfileBtn = document.getElementById('closeEditProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const editProfileForm = document.getElementById('editProfileForm');

    // Open edit profile modal
    editProfileBtn.addEventListener('click', () => {
        if (currentAdmin) {
            populateEditForm(currentAdmin);
            editProfileModal.style.display = 'block';
        } else {
            alert('Profile data not loaded');
        }
    });

    // Close edit profile modal
    closeEditProfileBtn.addEventListener('click', closeEditProfileModal);
    cancelEditBtn.addEventListener('click', closeEditProfileModal);
    window.addEventListener('click', (e) => {
        if (e.target === editProfileModal) {
            closeEditProfileModal();
        }
    });

    function closeEditProfileModal() {
        editProfileModal.style.display = 'none';
        editProfileForm.reset();
    }

    // Populate edit form with current admin data
    function populateEditForm(admin) {
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
                currentAdmin = result.admin;
                renderAdminProfile(currentAdmin);
                updateSidebarAdminName(currentAdmin.fullName);
                closeEditProfileModal();
                showMessage('Profile updated successfully!', 'success');
            } else {
                const error = await response.json();
                showMessage(error.error || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            showMessage('Network error updating profile', 'error');
        }
    });

    /* ---------- LOGOUT FUNCTIONALITY ---------- */

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

    /* ---------- MESSAGE SYSTEM ---------- */

    function showMessage(text, type = 'success') {
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
                top: 20px;
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

    /* ---------- API FUNCTIONS ---------- */

    // Fetch events from MongoDB
    async function fetchEvents() {
        try {
            console.log('Fetching events from server...');
            const response = await fetch('http://localhost:5000/api/events', {
                credentials: 'include'
            });

            console.log('Response status:', response.status);

            if (response.ok) {
                const responseText = await response.text();
                console.log('Raw response:', responseText);

                if (responseText.trim() === '') {
                    console.log('Empty response received');
                    events = [];
                } else {
                    try {
                        events = JSON.parse(responseText);
                        console.log('Parsed events:', events);
                    } catch (parseError) {
                        console.error('JSON parse error:', parseError);
                        events = [];
                    }
                }
                renderEventsTable();
            } else {
                console.error('Failed to fetch events. Status:', response.status);
                const errorText = await response.text();
                console.error('Error response:', errorText);
            }
        } catch (error) {
            console.error('Network error fetching events:', error);
            alert('Failed to connect to server. Make sure server is running on port 5000.');
        }
    }

    // Save event to MongoDB
    async function saveEvent(eventData) {
        try {
            console.log('Saving event:', eventData);
            const response = await fetch('http://localhost:5000/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(eventData)
            });

            console.log('Save response status:', response.status);
            const responseText = await response.text();

            if (response.ok) {
                console.log('Event saved successfully');
                showMessage('Event saved successfully!', 'success');
                await fetchEvents(); // Refresh the events list
                return true;
            } else {
                let errorMessage = 'Failed to save event';
                if (responseText.trim() !== '') {
                    try {
                        const error = JSON.parse(responseText);
                        errorMessage = error.error || errorMessage;
                    } catch (parseError) {
                        errorMessage = responseText;
                    }
                }
                console.error('Failed to save event:', errorMessage);
                showMessage('Failed to save event: ' + errorMessage, 'error');
                return false;
            }
        } catch (error) {
            console.error('Network error saving event:', error);
            showMessage('Network error saving event: ' + error.message, 'error');
            return false;
        }
    }

    // Delete event from MongoDB
    async function deleteEventFromDB(eventId) {
        try {
            console.log('Deleting event:', eventId);
            const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                console.log('Event deleted successfully');
                showMessage('Event deleted successfully!', 'success');
                await fetchEvents(); // Refresh the events list
                return true;
            } else {
                const errorText = await response.text();
                console.error('Failed to delete event:', errorText);
                showMessage('Failed to delete event: ' + errorText, 'error');
                return false;
            }
        } catch (error) {
            console.error('Network error deleting event:', error);
            showMessage('Network error deleting event: ' + error.message, 'error');
            return false;
        }
    }

    /* ---------- NAVIGATION ---------- */
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', function () {
            navItems.forEach(n => n.classList.remove('active'));
            this.classList.add('active');
            contentSections.forEach(s => s.classList.remove('active'));

            const sectionId = this.dataset.section;
            document.getElementById(sectionId).classList.add('active');

            // Load profile data when Your Details section is opened
            if (sectionId === 'your-details') {
                if (currentAdmin) {
                    renderAdminProfile(currentAdmin);
                } else {
                    showProfileLoading();
                    // Try to fetch admin details if not already loaded
                    fetchAdminDetails();
                }
            }
        });
    });

    /* ---------- EVENT MODAL ---------- */
    const modal = document.getElementById('eventModal');
    const postEventBtn = document.getElementById('postEventBtn');
    const closeBtn = document.querySelector('.close-btn');
    const cancelBtn = document.getElementById('cancelBtn');
    const eventForm = document.getElementById('eventForm');
    const modalTitle = document.getElementById('modalTitle');

    postEventBtn.addEventListener('click', () => openModal());
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    window.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    function openModal(eventId = null) {
        modal.style.display = 'block';
        currentEditingEventId = eventId;
        if (eventId) {
            modalTitle.textContent = 'Edit Event';
            const event = events.find(e => e.id === eventId);
            if (event) {
                populateForm(event);
            }
        } else {
            modalTitle.textContent = 'Post New Event';
            eventForm.reset();
        }
    }

    function closeModal() {
        modal.style.display = 'none';
        currentEditingEventId = null;
        eventForm.reset();
    }

    function populateForm(event) {
        document.getElementById('eventId').value = event.id;
        document.getElementById('eventName').value = event.name;
        document.getElementById('eventDate').value = event.date.split('T')[0];
        document.getElementById('eventLocation').value = event.location;
        document.getElementById('eventType').value = event.type;
        document.getElementById('eventPayment').value = event.payment;
        document.getElementById('eventTiming').value = event.timing;
        document.getElementById('dressCode').value = event.dressCode;
        document.getElementById('participants').value = event.participants;
        document.getElementById('eventDescription').value = event.description;
    }

    /* ---------- FORM SUBMIT ---------- */
    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted');

        const formData = new FormData(eventForm);

        const eventData = {
            id: formData.get('eventId'),
            name: formData.get('eventName'),
            date: formData.get('eventDate'),
            location: formData.get('eventLocation'),
            description: formData.get('eventDescription'),
            type: formData.get('eventType'),
            payment: parseInt(formData.get('eventPayment'), 10),
            timing: formData.get('eventTiming'),
            dressCode: formData.get('dressCode'),
            participants: formData.get('participants')
        };

        console.log('Event data to save:', eventData);

        // Check for duplicate Event ID (only for new events)
        if (!currentEditingEventId) {
            const existingEvent = events.find(e => e.id === eventData.id);
            if (existingEvent) {
                showMessage('Event ID already exists! Please use a unique Event ID.', 'error');
                return;
            }
        }

        const success = await saveEvent(eventData);
        if (success) {
            closeModal();
        }
    });

    /* ---------- TABLES ---------- */
    function renderEventsTable() {
        const tbody = document.getElementById('eventsTableBody');
        if (!tbody) {
            console.error('Events table body not found');
            return;
        }

        tbody.innerHTML = '';
        console.log('Rendering events table with', events.length, 'events');

        events.forEach(ev => {
            const tr = document.createElement('tr');
            const eventDate = new Date(ev.date);
            tr.innerHTML = `
                <td>${ev.name}</td>
                <td>${eventDate.toLocaleDateString()}</td>
                <td>${ev.location}</td>
                <td>${ev.description || 'N/A'}</td>
                <td class="table-actions">
                    <button class="btn btn-small btn-edit" onclick="editEvent('${ev.id}')">Edit</button>
                    <button class="btn btn-small btn-delete" onclick="deleteEvent('${ev.id}')">Delete</button>
                </td>`;
            tbody.appendChild(tr);
        });
    }

    function renderApplicantsAppliedTable() {
        const tbody = document.getElementById('applicantsAppliedTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        applicantsApplied.forEach((ap, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${i + 1}</td>
                <td>${ap.name}</td>
                <td>${ap.email}</td>
                <td>${ap.phone}</td>
                <td>${ap.eventName}</td>
                <td>${new Date(ap.applicationDate).toLocaleDateString()}</td>
                <td><span class="status-badge status-${ap.status.toLowerCase()}">${ap.status}</span></td>`;
            tbody.appendChild(tr);
        });
    }

    function renderApplicantsSelectedTable() {
        const tbody = document.getElementById('applicantsSelectedTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        applicantsSelected.forEach((ap, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${i + 1}</td>
                <td>${ap.name}</td>
                <td>${ap.email}</td>
                <td>${ap.eventName}</td>
                <td>${new Date(ap.selectionDate).toLocaleDateString()}</td>
                <td>${ap.notes}</td>
                <td class="table-actions">
                    <button class="btn btn-small btn-edit">View</button>
                    <button class="btn btn-small btn-delete">Remove</button>
                </td>`;
            tbody.appendChild(tr);
        });
    }

    /* ---------- UTILS ---------- */
    window.editEvent = id => openModal(id);
    window.deleteEvent = async (id) => {
        if (confirm('Are you sure you want to delete this event?')) {
            await deleteEventFromDB(id);
        }
    };

    /* ---------- INITIALIZATION ---------- */

    async function init() {
        console.log('Initializing admin page...');

        // Check session first
        const isAuthenticated = await checkAdminSession();
        if (!isAuthenticated) {
            return; // Will redirect to login
        }

        // Load initial data
        await fetchEvents(); // Load events from MongoDB
        renderApplicantsAppliedTable();
        renderApplicantsSelectedTable();

        console.log('Admin page initialized');
    }

    // Test server connection on page load
    setTimeout(() => {
        console.log('Testing server connection...');
        fetch('http://localhost:5000/api/events', {
            credentials: 'include'
        })
            .then(response => {
                console.log('Server connection test - Status:', response.status);
                return response.text();
            })
            .then(text => {
                console.log('Server connection test - Response:', text);
            })
            .catch(error => {
                console.error('Server connection test failed:', error);
                alert('Cannot connect to server. Please make sure:\n1. Server is running (node server.js)\n2. Server is running on port 5000\n3. MongoDB is running');
            });
    }, 1000);

    init();
})