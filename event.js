// Events Page JavaScript with Session Integration and Authentication

class EventsManager {
    constructor() {
        this.allEvents = [];
        this.filteredEvents = [];
        this.appliedEvents = [];
        this.currentEventForApplication = null;
        this.currentUser = null;
        this.isLoading = false;
        this.init();
    }

    async init() {
        this.showLoadingScreen();
        await this.checkAuthAndLoadEvents();
        this.initializeEventListeners();
        this.hideLoadingScreen();
    }

    // Authentication and Session Management (similar to profile.js)
    async checkAuthAndLoadEvents() {
    try {
        console.log('Checking authentication...');

        // ✅ ENDPOINT FIXED - /api/auth/check-session se /api/check-session
        const response = await fetch('http://localhost:5000/api/check-session', {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        console.log('Session check response:', data);

        if (!data.loggedIn || data.userType !== 'user') {
            console.log('Not authenticated or not a user, redirecting to login');
            alert('Please login to view events');
            window.location.href = '/userLogin.html';
            return;
        }

        console.log('User authenticated:', data.username, 'ID:', data.userId);
        this.currentUser = data;
        
        // Load events after authentication
        await this.fetchEvents();

    } catch (error) {
        console.error('Auth check failed:', error);
        alert('Please login to view events');
        window.location.href = '/userLogin.html';
    }
}

    // UI Management
    showLoadingScreen() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }
        
        const container = document.querySelector('.events-container');
        if (container) {
            container.style.display = 'none';
        }
    }

    hideLoadingScreen() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        const container = document.querySelector('.events-container');
        if (container) {
            container.style.display = 'block';
        }
    }

    // Event Fetching
    async fetchEvents() {
    try {
        this.showLoading(true);
        console.log('Fetching events from server...');
        
        // ✅ ENDPOINT FIXED - /api/events
        const response = await fetch('http://localhost:5000/api/events', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const responseText = await response.text();
            console.log('Raw response:', responseText);
            
            if (responseText.trim() === '') {
                this.allEvents = [];
            } else {
                try {
                    this.allEvents = JSON.parse(responseText);
                    console.log('Fetched events:', this.allEvents);
                } catch (parseError) {
                    console.error('JSON parse error:', parseError);
                    this.allEvents = [];
                }
            }
            
            this.filteredEvents = [...this.allEvents];
            this.renderEvents();
            this.updateEventsCount();
            
        } else if (response.status === 401) {
            console.log('Session expired, redirecting to login');
            alert('Session expired. Please login again.');
            window.location.href = '/userLogin.html';
        } else {
            console.error('Failed to fetch events. Status:', response.status);
            this.showError('Failed to load events. Please try again later.');
        }
    } catch (error) {
        console.error('Network error fetching events:', error);
        this.showError('Failed to connect to server. Make sure server is running.');
    } finally {
        this.showLoading(false);
    }
}

    async checkApplicationStatus(eventId) {
    try {
        console.log('Checking application status for event:', eventId);
        
        // ✅ ENDPOINT FIXED
        const response = await fetch(`http://localhost:5000/api/applications/check/${eventId}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Application status result:', result);
            return result;
        } else if (response.status === 401) {
            console.log('Session expired during application check');
            alert('Session expired. Please login again.');
            window.location.href = '/userLogin.html';
            return { hasApplied: false };
        }
        return { hasApplied: false };
    } catch (error) {
        console.error('Error checking application status:', error);
        return { hasApplied: false };
    }
}


   async submitApplication(eventData) {
    try {
        console.log('Submitting application for event:', eventData.id);
        
        // Application data - session will provide user details
        const applicationData = {
            eventId: eventData.id,
            eventName: eventData.name
        };

        // ✅ ENDPOINT FIXED
        const response = await fetch('http://localhost:5000/api/applications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(applicationData)
        });

        const result = await response.json();
        console.log('Application response:', result);

        if (response.ok && result.success) {
            console.log('Application submitted successfully:', result);
            alert('Application submitted successfully!\nApplication ID: ' + result.applicationId);
            return true;
        } else if (response.status === 401) {
            alert('Session expired. Please login again.');
            window.location.href = '/userLogin.html';
            return false;
        } else {
            console.error('Application submission failed:', result);
            alert(result.error || 'Failed to submit application');
            return false;
        }
    } catch (error) {
        console.error('Network error submitting application:', error);
        alert('Network error. Please check your connection and try again.');
        return false;
    }
}
    // Event Listing and UI Methods (keeping original functionality)
    showLoading(show) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        const container = document.querySelector('.events-container');
        
        if (loadingIndicator) loadingIndicator.style.display = show ? 'block' : 'none';
        if (container) container.style.display = show ? 'none' : 'block';
    }

    showError(message) {
        const container = document.querySelector('.events-container');
        if (container) {
            container.innerHTML = `
                <div class="no-events">
                    <p>${message}</p>
                </div>
            `;
        }
    }

    updateEventsCount() {
        const count = this.filteredEvents.length;
        const eventsCount = document.getElementById('eventsCount');
        const noEventsMessage = document.getElementById('noEventsMessage');
        const container = document.querySelector('.events-container');
        
        if (eventsCount) {
            if (count === 0) {
                eventsCount.textContent = 'No events found';
                if (noEventsMessage) noEventsMessage.style.display = 'block';
                if (container) container.style.display = 'none';
            } else {
                eventsCount.textContent = `Found ${count} event${count === 1 ? '' : 's'}`;
                if (noEventsMessage) noEventsMessage.style.display = 'none';
                if (container) container.style.display = 'block';
            }
        }
    }

    renderEvents() {
        const container = document.querySelector('.events-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.filteredEvents.length === 0) {
            this.updateEventsCount();
            return;
        }

        this.filteredEvents.forEach((event) => {
            const card = document.createElement('div');
            card.classList.add('event-card');
            
            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            card.innerHTML = `
                <div class="event-id">ID: ${event.id}</div>
                <h2>${event.name}</h2>
                <p><strong>Payment:</strong> ₹${event.payment}</p>
                <p><strong>Location:</strong> ${event.location}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <span class="event-type">${event.type}</span>
            `;

            card.addEventListener('click', () => this.openModal(event));
            container.appendChild(card);
        });

        this.updateEventsCount();
    }

    // Search and Filter Methods (keeping original functionality)
    searchByEventId() {
        const eventIdSearch = document.getElementById('eventIdSearch');
        if (!eventIdSearch) return;
        
        const eventIdTerm = eventIdSearch.value.toLowerCase().trim();
        
        if (eventIdTerm === '') {
            this.applyAllFilters();
        } else {
            this.filteredEvents = this.allEvents.filter(event => 
                event.id.toLowerCase().includes(eventIdTerm)
            );
            this.renderEvents();
        }
    }

    searchEvents() {
        this.applyAllFilters();
    }

    applyAllFilters() {
        let filtered = [...this.allEvents];

        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        if (searchTerm !== '') {
            filtered = filtered.filter(event => {
                return (
                    event.name.toLowerCase().includes(searchTerm) ||
                    event.location.toLowerCase().includes(searchTerm) ||
                    event.type.toLowerCase().includes(searchTerm)
                );
            });
        }

        const eventTypeSelect = document.getElementById('eventType');
        const selectedType = eventTypeSelect ? eventTypeSelect.value : '';
        if (selectedType) {
            filtered = filtered.filter(event => event.type === selectedType);
        }

        const locationInput = document.getElementById('location');
        const locationFilter = locationInput ? locationInput.value.toLowerCase().trim() : '';
        if (locationFilter) {
            filtered = filtered.filter(event => 
                event.location.toLowerCase().includes(locationFilter)
            );
        }

        const paymentSlider = document.getElementById('paymentSlider');
        const maxPayment = paymentSlider ? parseInt(paymentSlider.value) : 0;
        if (maxPayment > 0) {
            filtered = filtered.filter(event => event.payment <= maxPayment);
        }

        const weekendFilter = document.getElementById('weekendEvent');
        if (weekendFilter && weekendFilter.checked) {
            filtered = filtered.filter(event => {
                const eventDate = new Date(event.date);
                const dayOfWeek = eventDate.getDay();
                return dayOfWeek === 0 || dayOfWeek === 6;
            });
        }

        this.filteredEvents = filtered;
        this.renderEvents();
    }

    clearAllFilters() {
        const searchInput = document.getElementById('searchInput');
        const eventIdSearch = document.getElementById('eventIdSearch');
        const eventTypeSelect = document.getElementById('eventType');
        const locationInput = document.getElementById('location');
        const paymentSlider = document.getElementById('paymentSlider');
        const paymentValue = document.getElementById('paymentValue');

        if (searchInput) searchInput.value = '';
        if (eventIdSearch) eventIdSearch.value = '';
        if (eventTypeSelect) eventTypeSelect.value = '';
        if (locationInput) locationInput.value = '';

        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);

        if (paymentSlider) {
            paymentSlider.value = paymentSlider.min || 0;
            if (paymentValue) paymentValue.textContent = "₹" + paymentSlider.value;
        }

        this.filteredEvents = [...this.allEvents];
        this.renderEvents();
    }

    // Modal Management (keeping original functionality)
    async openModal(event) {
        this.currentEventForApplication = event;
        
        const modal = document.getElementById('eventModal');
        if (!modal) return;
        
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Update modal content
        this.updateModalContent('modalEventName', event.name);
        this.updateModalContent('modalEventId', event.id);
        this.updateModalContent('modalDate', formattedDate);
        this.updateModalContent('modalLocation', event.location);
        this.updateModalContent('modalType', event.type);
        this.updateModalContent('modalPayment', `₹${event.payment}`);
        this.updateModalContent('modalDress', event.dressCode || 'Not specified');
        this.updateModalContent('modalParticipants', event.participants || 'Not specified');
        this.updateModalContent('modalTiming', event.timing || 'Not specified');
        this.updateModalContent('modalDescription', event.description || 'No description available');

        // Check application status
        console.log('Checking application status for modal...');
        const applicationStatus = await this.checkApplicationStatus(event.id);
        
        const applyBtn = document.getElementById('applyBtn');
        if (applyBtn) {
            if (applicationStatus.hasApplied) {
                applyBtn.textContent = `Applied (${applicationStatus.status})`;
                applyBtn.classList.add('applied');
                applyBtn.disabled = true;
            } else {
                applyBtn.textContent = "Apply";
                applyBtn.classList.remove('applied');
                applyBtn.disabled = false;
            }
        }

        modal.style.display = 'block';
    }

    updateModalContent(elementId, content) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = content;
        }
    }

    closeModal() {
        const modal = document.getElementById('eventModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentEventForApplication = null;
    }

    // Event Listeners
    initializeEventListeners() {
        // Payment slider
        const paymentSlider = document.getElementById('paymentSlider');
        const paymentValue = document.getElementById('paymentValue');
        
        if (paymentSlider && paymentValue) {
            paymentValue.textContent = "₹" + paymentSlider.value;
            paymentSlider.addEventListener('input', function () {
                paymentValue.textContent = "₹" + this.value;
            });
        }

        // Search inputs
        const searchInput = document.getElementById('searchInput');
        const eventIdSearch = document.getElementById('eventIdSearch');

        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (searchInput.value.trim() !== '') {
                        if (eventIdSearch) eventIdSearch.value = '';
                    }
                    this.searchEvents();
                }
            });
        }

        if (eventIdSearch) {
            eventIdSearch.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (eventIdSearch.value.trim() !== '') {
                        this.clearOtherFilters();
                    }
                    this.searchByEventId();
                }
            });
        }

        // Search button
        const eventIdSearchBtn = document.getElementById('eventIdSearchBtn');
        if (eventIdSearchBtn) {
            eventIdSearchBtn.addEventListener('click', () => {
                if (eventIdSearch && eventIdSearch.value.trim() !== '') {
                    this.clearOtherFilters();
                }
                this.searchByEventId();
                
                eventIdSearchBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Searching...';
                setTimeout(() => {
                    eventIdSearchBtn.innerHTML = '<i class="fa fa-search"></i> Search';
                }, 1000);
            });
        }

        // Filter buttons
        const applyFiltersBtn = document.getElementById('applyFilters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                if (eventIdSearch && eventIdSearch.value.trim() !== '') {
                    this.searchByEventId();
                } else {
                    this.applyAllFilters();
                }
                
                applyFiltersBtn.textContent = 'Applied!';
                setTimeout(() => {
                    applyFiltersBtn.textContent = 'Apply Filters';
                }, 1500);
            });
        }

        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearAllFilters();
                
                clearFiltersBtn.textContent = 'Cleared!';
                setTimeout(() => {
                    clearFiltersBtn.textContent = 'Clear All';
                }, 1500);
            });
        }

        // Modal controls
        const closeBtn = document.querySelector('.close-btn');
        const modal = document.getElementById('eventModal');
        const applyBtn = document.getElementById('applyBtn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        if (applyBtn) {
            applyBtn.addEventListener('click', async () => {
                if (!this.currentEventForApplication) {
                    alert('No event selected');
                    return;
                }

                if (applyBtn.classList.contains('applied') || applyBtn.disabled) {
                    alert('You have already applied for this event');
                    return;
                }

                const originalText = applyBtn.textContent;
                applyBtn.textContent = 'Applying...';
                applyBtn.disabled = true;

                try {
                    const success = await this.submitApplication(this.currentEventForApplication);
                    
                    if (success) {
                        applyBtn.textContent = 'Applied (pending)';
                        applyBtn.classList.add('applied');
                        this.appliedEvents.push(this.currentEventForApplication.id);
                    } else {
                        applyBtn.textContent = originalText;
                        applyBtn.disabled = false;
                    }
                } catch (error) {
                    console.error('Application error:', error);
                    applyBtn.textContent = originalText;
                    applyBtn.disabled = false;
                    alert('Failed to submit application. Please try again.');
                }
            });
        }

        // Window event listeners
        window.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && modal.style.display === 'block') {
                this.closeModal();
            }
            
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (searchInput) searchInput.focus();
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                if (eventIdSearch) eventIdSearch.focus();
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (applyFiltersBtn) applyFiltersBtn.click();
            }
        });

        // Auto-refresh events every 30 seconds
        setInterval(() => {
            if (!this.isLoading) {
                console.log('Auto-refreshing events...');
                this.fetchEvents();
            }
        }, 30000);
    }

    clearOtherFilters() {
        const searchInput = document.getElementById('searchInput');
        const eventTypeSelect = document.getElementById('eventType');
        const locationInput = document.getElementById('location');
        const paymentSlider = document.getElementById('paymentSlider');
        const paymentValue = document.getElementById('paymentValue');

        if (searchInput) searchInput.value = '';
        if (eventTypeSelect) eventTypeSelect.value = '';
        if (locationInput) locationInput.value = '';
        if (paymentSlider) {
            paymentSlider.value = 0;
            if (paymentValue) paymentValue.textContent = "₹0";
        }
        
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    }

    // Error Handling (similar to profile.js)
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
        
        alert(message);
    }
}

// Initialize Events Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.eventsManager = new EventsManager();
        console.log('Events Manager initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Events Manager:', error);
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; font-family: 'Poppins', sans-serif;">
                <h2 style="color: #ff4757; margin-bottom: 16px;">Failed to Load Events</h2>
                <p style="color: #666; margin-bottom: 24px;">There was an error loading the events page.</p>
                <button onclick="window.location.reload()" style="padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Reload Page
                </button>
            </div>
        `;
    }
});

// Handle session timeout and page visibility
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.eventsManager) {
        // Refresh data when page becomes visible
        window.eventsManager.checkAuthAndLoadEvents();
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
    if (window.eventsManager) {
        window.eventsManager.isLoading = false;
    }
});

// Export for external access (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventsManager;
}