// adminUI.js - UI Management and Navigation with Real Applications

class AdminUI {
    constructor(adminAuth, adminEvents) {
        this.adminAuth = adminAuth;
        this.adminEvents = adminEvents;
        // Remove dummy data - will fetch real applications
        this.applicantsApplied = [];
        this.applicantsSelected = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
    }

    /* ---------- NAVIGATION ---------- */

    initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');

    // ✅ SET DASHBOARD AS DEFAULT ACTIVE SECTION
    navItems.forEach(n => n.classList.remove('active'));
    contentSections.forEach(s => s.classList.remove('active'));
    
    const dashboardNav = document.querySelector('[data-section="dashboard"]');
    const dashboardSection = document.getElementById('dashboard');
    
    if (dashboardNav && dashboardSection) {
        dashboardNav.classList.add('active');
        dashboardSection.classList.add('active');
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            contentSections.forEach(s => s.classList.remove('active'));

            const sectionId = item.dataset.section;
            document.getElementById(sectionId).classList.add('active');

            // Load different data based on section
            if (sectionId === 'applicants-applied') {
                this.loadPendingApplications();
            } else if (sectionId === 'applicants-selected') {
                this.loadApprovedApplications();
            } else if (sectionId === 'attended-applicants') {
                this.loadAttendedApplications();
            } else if (sectionId === 'payment-details') {
                console.log('Payment section loaded');
            } else if (sectionId === 'dashboard') {
                // ✅ LOAD DASHBOARD DATA
                if (window.dashboardManager) {
                    window.dashboardManager.loadDashboardData();
                }
            } else if (sectionId === 'your-details') {
                const currentAdmin = this.adminAuth.getCurrentAdmin();
                if (currentAdmin) {
                    this.adminAuth.renderAdminProfile(currentAdmin);
                } else {
                    this.adminAuth.showProfileLoading();
                    this.adminAuth.fetchAdminDetails();
                }
            }
        });
    });
}

    /* ---------- APPLICATION API CALLS ---------- */

    // Fetch pending applications from server
    async loadPendingApplications() {
        try {
            console.log('Fetching pending applications...');
            this.showLoadingState('applicantsAppliedTableBody', 'Loading applications...');

            const response = await fetch('http://localhost:5000/api/applications?status=pending', {
                credentials: 'include'
            });

            if (response.ok) {
                const applications = await response.json();
                console.log('Pending applications loaded:', applications.length);
                this.applicantsApplied = applications;
                this.renderApplicantsAppliedTable();
            } else {
                console.error('Failed to fetch applications:', response.status);
                this.showError('applicantsAppliedTableBody', 'Failed to load applications');
            }
        } catch (error) {
            console.error('Network error fetching applications:', error);
            this.showError('applicantsAppliedTableBody', 'Network error loading applications');
        }
    }

    // Fetch approved applications from server
    async loadApprovedApplications() {
        try {
            console.log('Fetching approved applications...');
            this.showLoadingState('applicantsSelectedTableBody', 'Loading selected applicants...');

            const response = await fetch('http://localhost:5000/api/applications?status=approved', {
                credentials: 'include'
            });

            if (response.ok) {
                const applications = await response.json();
                console.log('Approved applications loaded:', applications.length);
                this.applicantsSelected = applications;
                this.renderApplicantsSelectedTable();
            } else {
                console.error('Failed to fetch approved applications:', response.status);
                this.showError('applicantsSelectedTableBody', 'Failed to load selected applicants');
            }
        } catch (error) {
            console.error('Network error fetching approved applications:', error);
            this.showError('applicantsSelectedTableBody', 'Network error loading selected applicants');
        }
    }

    // Update application status (approve/reject)
    async updateApplicationStatus(applicationId, status, adminNotes = '') {
        try {
            console.log(`Updating application ${applicationId} to ${status}`);

            const response = await fetch(`http://localhost:5000/api/applications/${applicationId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    status: status,
                    adminNotes: adminNotes
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`Application ${status} successfully:`, result);
                this.adminAuth.showMessage(`Application ${status} successfully!`, 'success');

                // Reload the current view
                const activeSection = document.querySelector('.content-section.active');
                if (activeSection.id === 'applicants-applied') {
                    this.loadPendingApplications();
                } else if (activeSection.id === 'applicants-selected') {
                    this.loadApprovedApplications();
                }

                return true;
            } else {
                const error = await response.json();
                console.error('Failed to update application:', error);
                this.adminAuth.showMessage('Failed to update application: ' + (error.error || 'Unknown error'), 'error');
                return false;
            }
        } catch (error) {
            console.error('Network error updating application:', error);
            this.adminAuth.showMessage('Network error updating application', 'error');
            return false;
        }
    }

    /* ---------- TABLE RENDERING ---------- */

    renderApplicantsAppliedTable() {
        const tbody = document.getElementById('applicantsAppliedTableBody');
        if (!tbody) return;

        this.hideLoadingState('applicantsAppliedTableBody');
        tbody.innerHTML = '';

        if (this.applicantsApplied.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem; color: #666;">
                        <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        No pending applications found
                    </td>
                </tr>
            `;
            return;
        }

        this.applicantsApplied.forEach((app, i) => {
            const tr = document.createElement('tr');
            const applicationDate = new Date(app.applicationDate || app.createdAt);

            tr.innerHTML = `
                <td>${i + 1}</td>
                <td>${app.userName || 'N/A'}</td>
                <td><a href="mailto:${app.userEmail}" style="color: #007bff;">${app.userEmail || 'N/A'}</a></td>
                <td><a href="tel:${app.userPhone}" style="color: #007bff;">${app.userPhone || 'N/A'}</a></td>
                <td><strong>${app.eventName || 'N/A'}</strong><br><small style="color: #666;">ID: ${app.eventId || 'N/A'}</small></td>
                <td>${applicationDate.toLocaleDateString('en-IN')}</td>
                <td><span class="status-badge status-${app.status.toLowerCase()}">${app.status.charAt(0).toUpperCase() + app.status.slice(1)}</span></td>
                <td class="table-actions">
                    <button class="btn btn-small btn-success" onclick="adminUI.approveApplication('${app.applicationId}', '${app.userName}', '${app.eventName}')" title="Approve Application">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-small btn-danger" onclick="adminUI.rejectApplication('${app.applicationId}', '${app.userName}', '${app.eventName}')" title="Reject Application">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    <button class="btn btn-small btn-info" onclick="adminUI.viewApplicationDetails('${app.applicationId}')" title="View Details">
                        <i class="fas fa-eye"></i> Details
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Update table header to include action column
        const tableHeader = document.querySelector('#applicants-applied thead tr');
        if (tableHeader && !tableHeader.querySelector('th:last-child').textContent.includes('Actions')) {
            tableHeader.innerHTML = `
                <th>S.No.</th>
                <th>Applicant Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Event Details</th>
                <th>Application Date</th>
                <th>Status</th>
                <th>Actions</th>
            `;
        }
    }

    renderApplicantsSelectedTable() {
        const tbody = document.getElementById('applicantsSelectedTableBody');
        if (!tbody) return;

        this.hideLoadingState('applicantsSelectedTableBody');
        tbody.innerHTML = '';

        // Filter only non-attended approved applications
        const nonAttendedSelected = this.applicantsSelected.filter(app => !app.hasAttended);

        if (nonAttendedSelected.length === 0) {
            tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: #666;">
                    <i class="fas fa-user-check" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    No approved applications found
                </td>
            </tr>
        `;
            return;
        }

        nonAttendedSelected.forEach((app, i) => {
            const tr = document.createElement('tr');
            const selectionDate = new Date(app.actionDate || app.updatedAt);

            tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${app.userName || 'N/A'}</td>
            <td><a href="mailto:${app.userEmail}" style="color: #007bff;">${app.userEmail || 'N/A'}</a></td>
            <td><strong>${app.eventName || 'N/A'}</strong><br><small style="color: #666;">ID: ${app.eventId || 'N/A'}</small></td>
            <td>${selectionDate.toLocaleDateString('en-IN')}</td>
            <td>${app.adminNotes || 'No notes'}</td>
            <td>
                <button class="btn btn-small btn-success" onclick="adminUI.markAsAttended('${app.applicationId}', '${app.userName}', '${app.eventName}')" title="Mark as Attended">
                    <i class="fas fa-check-circle"></i> Attended
                </button>
            </td>
            <td class="table-actions">
                <button class="btn btn-small btn-info" onclick="adminUI.viewApplicationDetails('${app.applicationId}')" title="View Details">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-small btn-warning" onclick="adminUI.moveBackToPending('${app.applicationId}', '${app.userName}', '${app.eventName}')" title="Move to Pending">
                    <i class="fas fa-undo"></i> Pending
                </button>
            </td>
        `;
            tbody.appendChild(tr);
        });
        // Update table header
        const tableHeader = document.querySelector('#applicants-selected thead tr');
        if (tableHeader) {
            tableHeader.innerHTML = `
            <th>S.No.</th>
            <th>Applicant Name</th>
            <th>Email</th>
            <th>Event Name</th>
            <th>Selection Date</th>
            <th>Notes</th>
            <th>Mark Attendance</th>
            <th>Actions</th>
        `;
        }
    }

    /* ---------- APPLICATION ACTIONS ---------- */

    // Approve application with confirmation
    async approveApplication(applicationId, userName, eventName) {
        const confirmed = confirm(`Approve application from ${userName} for ${eventName}?`);
        if (!confirmed) return;

        const notes = prompt('Add any notes for this approval (optional):') || '';
        const success = await this.updateApplicationStatus(applicationId, 'approved', notes);

        if (success) {
            console.log(`Application approved: ${applicationId}`);
        }
    }

    // Reject application with confirmation
    async rejectApplication(applicationId, userName, eventName) {
        const confirmed = confirm(`Reject application from ${userName} for ${eventName}?\n\nThis application will be automatically deleted after 1 week.`);
        if (!confirmed) return;

        const reason = prompt('Please provide a reason for rejection:');
        if (!reason || reason.trim() === '') {
            this.adminAuth.showMessage('Rejection reason is required', 'error');
            return;
        }

        const success = await this.updateApplicationStatus(applicationId, 'rejected', reason);

        if (success) {
            console.log(`Application rejected: ${applicationId}`);
        }
    }

    // Move approved application back to pending
    async moveBackToPending(applicationId, userName, eventName) {
        const confirmed = confirm(`Move ${userName}'s application for ${eventName} back to pending status?`);
        if (!confirmed) return;

        const success = await this.updateApplicationStatus(applicationId, 'pending', 'Moved back to pending by admin');

        if (success) {
            console.log(`Application moved to pending: ${applicationId}`);
        }
    }

    // View detailed application information
    async viewApplicationDetails(applicationId) {
        try {
            const response = await fetch(`http://localhost:5000/api/applications/${applicationId}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const app = await response.json();
                this.showApplicationModal(app);
            } else {
                this.adminAuth.showMessage('Failed to load application details', 'error');
            }
        } catch (error) {
            console.error('Error loading application details:', error);
            this.adminAuth.showMessage('Network error loading application details', 'error');
        }
    }

    // Show application details in modal
    showApplicationModal(app) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>Application Details</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body" style="padding: 1.5rem;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <strong>Application ID:</strong><br>
                            <span style="font-family: monospace; background: #1a1919ff; padding: 2px 4px; border-radius: 3px;">${app.applicationId}</span>
                        </div>
                        <div>
                            <strong>Status:</strong><br>
                            <span class="status-badge status-${app.status}">${app.status.charAt(0).toUpperCase() + app.status.slice(1)}</span>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <strong>Applicant Name:</strong><br>
                            ${app.userName || 'N/A'}
                        </div>
                        <div>
                            <strong>Email:</strong><br>
                            <a href="mailto:${app.userEmail}" style="color: #007bff;">${app.userEmail || 'N/A'}</a>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <strong>Phone:</strong><br>
                            <a href="tel:${app.userPhone}" style="color: #007bff;">${app.userPhone || 'N/A'}</a>
                        </div>
                        <div>
                            <strong>Application Date:</strong><br>
                            ${new Date(app.applicationDate || app.createdAt).toLocaleString('en-IN')}
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <strong>Event Details:</strong><br>
                        <div style="background: #0c0b0bff; padding: 1rem; border-radius: 5px; margin-top: 0.5rem;">
                            <div style="margin-bottom: 0.5rem;"><strong>Name:</strong> ${app.eventName || 'N/A'}</div>
                            <div><strong>Event ID:</strong> <span style="font-family: monospace;">${app.eventId || 'N/A'}</span></div>
                        </div>
                    </div>
                    
                    ${app.adminNotes ? `
                        <div style="margin-bottom: 1rem;">
                            <strong>Admin Notes:</strong><br>
                            <div style="background: #0f0f0fff; border: 1px solid #ffeaa7; padding: 1rem; border-radius: 5px; margin-top: 0.5rem;">
                                ${app.adminNotes}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${app.actionDate ? `
                        <div>
                            <strong>Action Date:</strong><br>
                            ${new Date(app.actionDate).toLocaleString('en-IN')}
                        </div>
                    ` : ''}
                </div>
                
                <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid #dee2e6; display: flex; gap: 0.5rem; justify-content: flex-end;">
                    ${app.status === 'pending' ? `
                        <button class="btn btn-success" onclick="adminUI.approveApplication('${app.applicationId}', '${app.userName}', '${app.eventName}'); this.closest('.modal').remove();">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-danger" onclick="adminUI.rejectApplication('${app.applicationId}', '${app.userName}', '${app.eventName}'); this.closest('.modal').remove();">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /* ---------- DASHBOARD STATS ---------- */

    async updateDashboardStats() {
        try {
            // Get all applications for stats
            const response = await fetch('http://localhost:5000/api/applications', {
                credentials: 'include'
            });

            if (response.ok) {
                const allApplications = await response.json();

                // Update total applications
                const totalApplicationsElement = document.getElementById('totalApplications');
                if (totalApplicationsElement) {
                    totalApplicationsElement.textContent = allApplications.length;
                }

                // Update pending applications
                const pendingCount = allApplications.filter(app => app.status === 'pending').length;
                const pendingApplicationsElement = document.getElementById('pendingApplications');
                if (pendingApplicationsElement) {
                    pendingApplicationsElement.textContent = pendingCount;
                }

                // Update selected applicants
                const approvedCount = allApplications.filter(app => app.status === 'approved').length;
                const selectedApplicantsElement = document.getElementById('selectedApplicants');
                if (selectedApplicantsElement) {
                    selectedApplicantsElement.textContent = approvedCount;
                }
            }
        } catch (error) {
            console.error('Error updating dashboard stats:', error);
        }

        // Update total events
        const totalEventsElement = document.getElementById('totalEvents');
        if (totalEventsElement) {
            totalEventsElement.textContent = this.adminEvents.getEvents().length;
        }
    }

    /* ---------- ATTENDED APPLICANTS ---------- */

    // Load attended applicants
    async loadAttendedApplications() {
        try {
            this.showLoadingState('attendedApplicantsTableBody', 'Loading attended applicants...');

            const response = await fetch('http://localhost:5000/api/applications?status=approved&hasAttended=true', {
                credentials: 'include'
            });

            if (response.ok) {
                const applications = await response.json();
                this.attendedApplicants = applications;
                this.renderAttendedApplicantsTable();
            } else {
                this.showError('attendedApplicantsTableBody', 'Failed to load attended applicants');
            }
        } catch (error) {
            this.showError('attendedApplicantsTableBody', 'Network error loading attended applicants');
        }
    }

    // Render attended applicants table
    renderAttendedApplicantsTable() {
        const tbody = document.getElementById('attendedApplicantsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.attendedApplicants.length === 0) {
            tbody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; padding: 2rem; color: #666;">
                <i class="fas fa-user-graduate" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                No attended applicants found
            </td>
        </tr>
        `;
            return;
        }

        this.attendedApplicants.forEach((app, i) => {
            const tr = document.createElement('tr');
            const attendanceDate = new Date(app.attendanceDate);
            const isPaid = app.paymentStatus === 'paid';

            tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${app.userName || 'N/A'}</td>
        <td><a href="mailto:${app.userEmail}" style="color: #007bff;">${app.userEmail || 'N/A'}</a></td>
        <td><strong>${app.eventName || 'N/A'}</strong><br><small style="color: #666;">ID: ${app.eventId || 'N/A'}</small></td>
        <td>${attendanceDate.toLocaleDateString('en-IN')}</td>
        <td><span class="status-badge status-approved">Attended</span></td>
        <td class="table-actions">
    ${isPaid ? 
        `<span style="color: #28a745; font-weight: 500;">
            <i class="fas fa-lock"></i> Payment Completed
        </span>` 
        : 
        `<button class="btn btn-small btn-warning" onclick="adminUI.markAsNotAttended('${app.applicationId}', '${app.userName}', '${app.eventName}')" title="Mark as Not Attended">
            <i class="fas fa-times"></i> Not Attended
        </button>`
    }
</td>
        <td>
            <span class="status-badge ${isPaid ? 'status-approved' : 'status-pending'}">
                ${isPaid ? 'Paid' : 'Pending'}
            </span>
        </td>
        `;
            tbody.appendChild(tr);
        });

        // Update table header
        const tableHeader = document.querySelector('#attended-applicants thead tr');
        if (tableHeader) {
            tableHeader.innerHTML = `
            <th>S.No.</th>
            <th>Applicant Name</th>
            <th>Email</th>
            <th>Event Name</th>
            <th>Attendance Date</th>
            <th>Status</th>
            <th>Actions</th>
            <th>Payment Status</th>
        `;
        }
    }

    // Mark as attended - NO NOTES REQUIRED
    async markAsAttended(applicationId, userName, eventName) {
        try {
            const response = await fetch(`http://localhost:5000/api/applications/${applicationId}/attendance`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    hasAttended: true
                })
            });

            if (response.ok) {
                this.adminAuth.showMessage(`${userName} marked as attended!`, 'success');
                // Reload both sections
                this.loadApprovedApplications();
                this.loadAttendedApplications();
            } else {
                this.adminAuth.showMessage('Failed to mark attendance', 'error');
            }
        } catch (error) {
            this.adminAuth.showMessage('Network error', 'error');
        }
    }

    // Mark as NOT attended
    async markAsNotAttended(applicationId, userName, eventName) {
        try {
            const response = await fetch(`http://localhost:5000/api/applications/${applicationId}/attendance`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    hasAttended: false
                })
            });

            if (response.ok) {
                this.adminAuth.showMessage(`${userName} moved back to selected list!`, 'success');
                // Reload both sections
                this.loadApprovedApplications();
                this.loadAttendedApplications();
            } else {
                this.adminAuth.showMessage('Failed to update attendance', 'error');
            }
        } catch (error) {
            this.adminAuth.showMessage('Network error', 'error');
        }
    }

    /* ---------- SEARCH FUNCTIONALITY ---------- */

    initializeSearch() {
        // Applicants search
        const searchInputs = document.querySelectorAll('.search-input');
        searchInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.filterCurrentTable(e.target.value);
            });
        });
    }

    filterCurrentTable(searchTerm) {
        const activeSection = document.querySelector('.content-section.active');
        if (!activeSection) return;

        const tbody = activeSection.querySelector('tbody');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');

        rows.forEach(row => {
            // Skip empty state rows
            if (row.cells.length === 1) return;

            const text = row.textContent.toLowerCase();
            const isVisible = text.includes(searchTerm.toLowerCase());
            row.style.display = isVisible ? '' : 'none';
        });
    }

    /* ---------- LOADING STATES ---------- */

    showLoadingState(elementId, message = 'Loading...') {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; color: #007bff; margin-bottom: 1rem; display: block;"></i>
                        <p style="margin: 0; color: #666;">${message}</p>
                    </td>
                </tr>
            `;
        }
    }

    showError(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 1.5rem; color: #dc3545; margin-bottom: 1rem; display: block;"></i>
                        <p style="margin: 0; color: #666;">${message}</p>
                        <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 1rem;">Retry</button>
                    </td>
                </tr>
            `;
        }
    }

    hideLoadingState(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            const loadingRows = element.querySelectorAll('tr td[colspan]');
            loadingRows.forEach(row => {
                if (row.parentNode) {
                    row.parentNode.remove();
                }
            });
        }
    }

    /* ---------- PAYMENT TAB SWITCHING ---------- */
    
    initializePaymentSection() {
        // This will be handled by global switchPaymentTab function
        console.log('Payment section initialized');
    }

    /* ---------- INITIALIZATION ---------- */

    initialize() {
        console.log('Initializing AdminUI with real application management...');

        // Initialize all UI components
        this.initializeNavigation();
        this.initializeSearch();
        this.initializePaymentSection();

        // Load initial data based on current active section
        const activeSection = document.querySelector('.content-section.active');
        if (activeSection && activeSection.id === 'applicants-applied') {
            this.loadPendingApplications();
        }

        // Update dashboard stats
        this.updateDashboardStats();

        console.log('AdminUI initialized successfully with real applications');
    }

    // Update stats when data changes
    refreshStats() {
        this.updateDashboardStats();
    }

    // Get current applications data
    getApplicantsApplied() {
        return this.applicantsApplied;
    }

    getApplicantsSelected() {
        return this.applicantsSelected;
    }
}