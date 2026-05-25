// adminMain.js - Main Application Controller

// Global variables for cross-file access
let adminAuth;
let adminEvents;
let adminUI;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Admin Page Loading...');

    /* ---------- INITIALIZE CLASSES ---------- */
    
    // Initialize authentication manager
    adminAuth = new AdminAuth();
    
    // Initialize event manager (depends on auth for messages)
    adminEvents = new AdminEvents(adminAuth);
    
    // Initialize UI manager (depends on both auth and events)
    adminUI = new AdminUI(adminAuth, adminEvents);

    /* ---------- AUTHENTICATION CHECK ---------- */
    
    console.log('Checking admin session...');
    const isAuthenticated = await adminAuth.checkAdminSession();
    
    if (!isAuthenticated) {
        console.log('Authentication failed, redirecting to login');
        return; // Will redirect to login
    }

    console.log('Authentication successful, initializing components...');

    /* ---------- INITIALIZE COMPONENTS ---------- */
    
    try {
        // Initialize authentication-related functionality
        adminAuth.initialize();
        console.log('✓ AdminAuth initialized');

        // Initialize event management
        await adminEvents.initialize();
        console.log('✓ AdminEvents initialized');

        // Initialize UI components
        adminUI.initialize();
        console.log('✓ AdminUI initialized');

        // Make functions globally available for onclick handlers
        window.adminAuth = adminAuth;
        window.adminEvents = adminEvents;
        window.adminUI = adminUI;

        // Also make individual functions available for backward compatibility
        window.editEvent = (id) => adminEvents.editEvent(id);
        window.deleteEvent = (id) => adminEvents.deleteEvent(id);

        console.log('✅ Admin Page Successfully Initialized');
        
        // Show success message
        setTimeout(() => {
            adminAuth.showMessage('Welcome to Admin Dashboard!', 'success');
        }, 500);

    } catch (error) {
        console.error('❌ Error during initialization:', error);
        adminAuth.showMessage('Error initializing admin dashboard: ' + error.message, 'error');
    }

    /* ---------- PERIODIC UPDATES ---------- */
    
    // Refresh dashboard stats every 30 seconds
    setInterval(() => {
        adminUI.refreshStats();
    }, 30000);

    // Auto-save drafts every 2 minutes (if form is being filled)
    setInterval(() => {
        saveDraftIfNeeded();
    }, 120000);

    /* ---------- UTILITY FUNCTIONS ---------- */
    
    function saveDraftIfNeeded() {
        const eventForm = document.getElementById('eventForm');
        if (eventForm && eventForm.style.display !== 'none') {
            const formData = new FormData(eventForm);
            const hasContent = Array.from(formData.values()).some(value => value.trim() !== '');
            
            if (hasContent) {
                // Save to sessionStorage (temporary draft)
                const draftData = {};
                formData.forEach((value, key) => {
                    draftData[key] = value;
                });
                sessionStorage.setItem('eventFormDraft', JSON.stringify(draftData));
                console.log('Draft saved automatically');
            }
        }
    }

    // Load draft on form open
    function loadDraftIfExists() {
        const draft = sessionStorage.getItem('eventFormDraft');
        if (draft) {
            try {
                const draftData = JSON.parse(draft);
                Object.keys(draftData).forEach(key => {
                    const field = document.getElementById(key);
                    if (field) {
                        field.value = draftData[key];
                    }
                });
                adminAuth.showMessage('Draft restored', 'success');
            } catch (error) {
                console.error('Error loading draft:', error);
            }
        }
    }

    // Clear draft when form is successfully submitted
    function clearDraft() {
        sessionStorage.removeItem('eventFormDraft');
    }

    // Expose utility functions
    window.loadDraftIfExists = loadDraftIfExists;
    window.clearDraft = clearDraft;

    /* ---------- ERROR HANDLING ---------- */
    
    // Global error handler
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        adminAuth.showMessage('An unexpected error occurred. Please refresh the page.', 'error');
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        adminAuth.showMessage('A network error occurred. Please check your connection.', 'error');
    });

    /* ---------- KEYBOARD SHORTCUTS ---------- */
    
    document.addEventListener('keydown', (event) => {
        // Ctrl+N: New Event
        if (event.ctrlKey && event.key === 'n') {
            event.preventDefault();
            adminEvents.openModal();
        }
        
        // Escape: Close modal
        if (event.key === 'Escape') {
            const modal = document.getElementById('eventModal');
            const editModal = document.getElementById('editProfileModal');
            if (modal && modal.style.display === 'block') {
                adminEvents.closeModal();
            }
            if (editModal && editModal.style.display === 'block') {
                adminAuth.closeEditProfileModal();
            }
        }
        
        // Ctrl+S: Save (when form is open)
        if (event.ctrlKey && event.key === 's') {
            const eventForm = document.getElementById('eventForm');
            const editForm = document.getElementById('editProfileForm');
            if (eventForm && eventForm.style.display !== 'none') {
                event.preventDefault();
                eventForm.dispatchEvent(new Event('submit'));
            }
            if (editForm && editForm.style.display !== 'none') {
                event.preventDefault();
                editForm.dispatchEvent(new Event('submit'));
            }
        }
    });

    /* ---------- RESPONSIVE BEHAVIOR ---------- */
    
    // Handle window resize
    window.addEventListener('resize', () => {
        // Adjust table layouts on mobile
        adjustTableLayouts();
        
        // Update chart sizes if any charts are present
        updateChartSizes();
    });

    function adjustTableLayouts() {
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
            if (window.innerWidth <= 768) {
                table.classList.add('mobile-table');
            } else {
                table.classList.remove('mobile-table');
            }
        });
    }

    function updateChartSizes() {
        // If you have charts (like Chart.js), resize them here
        // Example: Chart.instances.forEach(chart => chart.resize());
    }

    /* ---------- PERFORMANCE MONITORING ---------- */
    
    // Monitor page performance
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        console.log(`Admin page loaded in ${loadTime.toFixed(2)}ms`);
        
        // Track large images or resources
        performance.getEntriesByType('resource').forEach(entry => {
            if (entry.transferSize > 100000) { // > 100KB
                console.warn(`Large resource detected: ${entry.name} (${(entry.transferSize / 1024).toFixed(2)}KB)`);
            }
        });
    });

    /* ---------- CLEANUP ON PAGE UNLOAD ---------- */
    
    window.addEventListener('beforeunload', (event) => {
        // Save any unsaved work
        saveDraftIfNeeded();
        
        // Clear sensitive data
        // Note: Don't clear authentication tokens as user might just be refreshing
        
        // Cancel any pending requests
        // If you have AbortControllers, abort them here
    });

    console.log('🚀 Admin Dashboard Ready!');
});