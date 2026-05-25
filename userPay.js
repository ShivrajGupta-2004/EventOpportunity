// User Payment Page JavaScript with Session Integration

class PaymentManager {
    constructor() {
        this.allPayments = [];
        this.filteredPayments = [];
        this.currentUser = null;
        this.isLoading = false;
        this.init();
    }

    async init() {
        this.showLoadingScreen();
        await this.checkAuthAndLoadPayments();
        this.initializeEventListeners();
        this.hideLoadingScreen();
    }

    // Authentication Check
    async checkAuthAndLoadPayments() {
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
                alert('Please login to view payments');
                window.location.href = '/userLogin.html';
                return;
            }

            console.log('User authenticated:', data.username, 'Email:', data.userEmail);
            this.currentUser = data;

            // Load payments after authentication
            await this.fetchPayments();

        } catch (error) {
            console.error('Auth check failed:', error);
            alert('Please login to view payments');
            window.location.href = '/userLogin.html';
        }
    }

    // UI Management
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const mainContent = document.getElementById('main-content');

        if (loadingScreen) loadingScreen.style.display = 'flex';
        if (mainContent) mainContent.style.display = 'none';
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const mainContent = document.getElementById('main-content');

        if (loadingScreen) loadingScreen.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
    }

    // Fetch Payments from Backend
    async fetchPayments() {
        try {
            console.log('Fetching payments from server...');

            const response = await fetch('http://localhost:5000/api/payments/user', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Fetched payments:', result);

                if (result.success && result.payments) {
                    this.allPayments = result.payments;
                    this.filteredPayments = [...this.allPayments];
                    this.updateStatistics();
                    this.renderPayments();
                } else {
                    this.allPayments = [];
                    this.filteredPayments = [];
                    this.updateStatistics();
                    this.showNoPaymentsMessage();
                }

            } else if (response.status === 401) {
                console.log('Session expired, redirecting to login');
                alert('Session expired. Please login again.');
                window.location.href = '/userLogin.html';
            } else {
                console.error('Failed to fetch payments. Status:', response.status);
                this.showError('Failed to load payments. Please try again later.');
            }
        } catch (error) {
            console.error('Network error fetching payments:', error);
            this.showError('Failed to connect to server. Make sure server is running.');
        }
    }

    // Calculate Statistics
    // Fetch statistics from backend
    // Fetch statistics from backend
    async fetchStatistics() {
        try {
            console.log('Fetching statistics from backend...');

            const response = await fetch('http://localhost:5000/api/payments/stats', {
                method: 'GET',
                credentials: 'include'
            });

            console.log('Stats response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('Stats result:', result);

                if (result.success) {
                    return result.stats;
                }
            }

            console.log('Fallback to local stats calculation');
            return this.calculateStatsLocally();
        } catch (error) {
            console.error('Error fetching stats:', error);
            return this.calculateStatsLocally();
        }
    }

    // Update Statistics Display
    // Update Statistics Display
    async updateStatistics() {
        const stats = await this.fetchStatistics();

        const paymentReceivedEl = document.getElementById('paymentReceived');
        const pendingPaymentsEl = document.getElementById('pendingPayments');
        const totalEarningsEl = document.getElementById('totalEarnings');
        const totalEventsEl = document.getElementById('totalEvents');

        if (paymentReceivedEl) {
            paymentReceivedEl.textContent = this.formatCurrency(stats.paymentReceived);
        }
        if (pendingPaymentsEl) {
            pendingPaymentsEl.textContent = this.formatCurrency(stats.pendingPayments);
        }
        if (totalEarningsEl) {
            totalEarningsEl.textContent = this.formatCurrency(stats.totalEarnings);
        }
        if (totalEventsEl) {
            totalEventsEl.textContent = stats.totalEvents;
        }
    }

    // Format Currency
    formatCurrency(amount) {
        return amount.toLocaleString('en-IN');
    }

    // Format Date
    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'short', day: '2-digit' };
        return date.toLocaleDateString('en-IN', options);
    }

    // Get Status Badge Class
    getStatusClass(status) {
        const statusMap = {
            'completed': 'status-completed',
            'pending': 'status-pending',
            'failed': 'status-failed'
        };
        return statusMap[status] || 'status-pending';
    }

    // Create Payment Card HTML
    createPaymentCard(payment) {
        const statusText = payment.paymentStatus.charAt(0).toUpperCase() +
            payment.paymentStatus.slice(1);

        return `
            <div class="payment-card">
                <div class="payment-header">
                    <h3 class="event-name">${payment.eventName}</h3>
                    <span class="transaction-id">${payment.transactionId}</span>
                </div>
                <div class="payment-details">
                    <div class="detail-item">
                        <span class="detail-label">Amount Paid</span>
                        <span class="detail-value amount-value">₹ ${this.formatCurrency(payment.paymentAmount)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Payment Date</span>
                        <span class="detail-value">${this.formatDate(payment.paymentDate)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Payment Mode</span>
                        <span class="detail-value">${payment.paymentMode.toUpperCase()}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Payment Status</span>
                        <span class="status-badge ${this.getStatusClass(payment.paymentStatus)}">${statusText}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">User Name</span>
                        <span class="detail-value">${payment.userName}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">User Email</span>
                        <span class="detail-value">${payment.userEmail}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">User Phone</span>
                        <span class="detail-value">${payment.userPhone}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Event ID</span>
                        <span class="detail-value">${payment.eventId}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Render Payments
    renderPayments() {
        const paymentsList = document.getElementById('paymentsList');
        const noPaymentsMessage = document.getElementById('noPaymentsMessage');
        const paymentCount = document.getElementById('paymentCount');

        if (!paymentsList) return;

        if (this.filteredPayments.length === 0) {
            paymentsList.innerHTML = '';
            if (noPaymentsMessage) noPaymentsMessage.style.display = 'block';
            if (paymentCount) paymentCount.textContent = '0 payments';
            return;
        }

        if (noPaymentsMessage) noPaymentsMessage.style.display = 'none';

        const paymentsHTML = this.filteredPayments
            .map(payment => this.createPaymentCard(payment))
            .join('');

        paymentsList.innerHTML = paymentsHTML;

        if (paymentCount) {
            const count = this.filteredPayments.length;
            paymentCount.textContent = `${count} payment${count !== 1 ? 's' : ''}`;
        }
    }

    // Show No Payments Message
    showNoPaymentsMessage() {
        const paymentsList = document.getElementById('paymentsList');
        const noPaymentsMessage = document.getElementById('noPaymentsMessage');
        const paymentCount = document.getElementById('paymentCount');

        if (paymentsList) paymentsList.innerHTML = '';
        if (noPaymentsMessage) noPaymentsMessage.style.display = 'block';
        if (paymentCount) paymentCount.textContent = '0 payments';
    }

    // Show Error
    showError(message) {
        const paymentsList = document.getElementById('paymentsList');
        if (paymentsList) {
            paymentsList.innerHTML = `
                <div class="no-payments">
                    <i class="fa fa-exclamation-triangle"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    // Search Functionality
    searchPayments() {
        const eventIdSearch = document.getElementById('eventIdSearch');
        const transactionIdSearch = document.getElementById('transactionIdSearch');

        const eventIdTerm = eventIdSearch ? eventIdSearch.value.toLowerCase().trim() : '';
        const transactionIdTerm = transactionIdSearch ? transactionIdSearch.value.toLowerCase().trim() : '';

        if (eventIdTerm === '' && transactionIdTerm === '') {
            this.filteredPayments = [...this.allPayments];
        } else {
            this.filteredPayments = this.allPayments.filter(payment => {
                const matchesEventId = eventIdTerm === '' ||
                    payment.eventId.toLowerCase().includes(eventIdTerm);
                const matchesTransactionId = transactionIdTerm === '' ||
                    payment.transactionId.toLowerCase().includes(transactionIdTerm);

                return matchesEventId && matchesTransactionId;
            });
        }

        this.renderPayments();
    }

    // Clear Search
    clearSearch() {
        const eventIdSearch = document.getElementById('eventIdSearch');
        const transactionIdSearch = document.getElementById('transactionIdSearch');

        if (eventIdSearch) eventIdSearch.value = '';
        if (transactionIdSearch) transactionIdSearch.value = '';

        this.filteredPayments = [...this.allPayments];
        this.renderPayments();
    }

    // Initialize Event Listeners
    initializeEventListeners() {
        // Search button
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.searchPayments();

                searchBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Searching...';
                setTimeout(() => {
                    searchBtn.innerHTML = '<i class="fa fa-search"></i> Search';
                }, 1000);
            });
        }

        // Clear search button
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                this.clearSearch();

                clearSearchBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Clearing...';
                setTimeout(() => {
                    clearSearchBtn.innerHTML = '<i class="fa fa-times"></i> Clear';
                }, 1000);
            });
        }

        // Enter key search
        const eventIdSearch = document.getElementById('eventIdSearch');
        const transactionIdSearch = document.getElementById('transactionIdSearch');

        if (eventIdSearch) {
            eventIdSearch.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.searchPayments();
                }
            });
        }

        if (transactionIdSearch) {
            transactionIdSearch.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.searchPayments();
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to focus event ID search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (eventIdSearch) eventIdSearch.focus();
            }

            // Ctrl/Cmd + T to focus transaction ID search
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                if (transactionIdSearch) transactionIdSearch.focus();
            }
        });

        // Auto-refresh payments every 30 seconds
        setInterval(() => {
            if (!this.isLoading) {
                console.log('Auto-refreshing payments...');
                this.fetchPayments();
            }
        }, 30000);
    }

    // Error Handling
    handleError(error, context = 'Operation') {
        console.error(`${context} failed:`, error);

        let message = `${context} failed. Please try again.`;

        if (error.message && error.message.includes('network')) {
            message = 'Network error. Please check your connection.';
        } else if (error.status === 401) {
            message = 'Session expired. Please login again.';
            setTimeout(() => {
                window.location.href = '/userLogin.html';
            }, 2000);
        }

        alert(message);
    }
}

// Initialize Payment Manager
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.paymentManager = new PaymentManager();
        console.log('Payment Manager initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Payment Manager:', error);
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; font-family: 'Poppins', sans-serif;">
                <h2 style="color: #ff4757; margin-bottom: 16px;">Failed to Load Payments</h2>
                <p style="color: #666; margin-bottom: 24px;">There was an error loading the payments page.</p>
                <button onclick="window.location.reload()" style="padding: 12px 24px; background: #e74c3c; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Reload Page
                </button>
            </div>
        `;
    }
});

// Handle page visibility
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.paymentManager) {
        window.paymentManager.checkAuthAndLoadPayments();
    }
});

// Mobile menu functions
function showMenu() {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) navLinks.style.right = '0';
}

function hideMenu() {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) navLinks.style.right = '-200px';
}