// adminPay.js - Complete Payment Management with Database Integration

class PaymentManager {
    constructor() {
        this.baseUrl = 'http://localhost:5000/api';
        this.paymentHistory = [];
        this.attendedUsers = [];
        this.currentEventId = '';
    }

    /* ---------- INITIALIZATION ---------- */
    init() {
        console.log('Initializing payment manager...');
        this.setupEventListeners();

    }

    setupEventListeners() {
        // Event ID change listener
        const eventIdInput = document.getElementById('eventId');
        if (eventIdInput) {
            eventIdInput.addEventListener('blur', () => this.loadAttendedUsers());
        }

        // Username change listener
        const usernameSelect = document.getElementById('username');
        if (usernameSelect) {
            usernameSelect.addEventListener('change', () => this.loadUserDetails());
        }

        // Payment mode change listener (for transaction ID generation)
        const paymentModeSelect = document.getElementById('paymentMode');
        if (paymentModeSelect) {
            paymentModeSelect.addEventListener('change', () => this.generateTransactionId());
        }

        // Form interactive effects
        document.querySelectorAll('.form-input, .form-select').forEach(input => {
            input.addEventListener('focus', function () {
                this.parentElement.style.transform = 'translateY(-2px)';
            });

            input.addEventListener('blur', function () {
                this.parentElement.style.transform = 'translateY(0)';
            });
        });
    }

    /* ---------- EVENT ID & USER DROPDOWN ---------- */
    async loadAttendedUsers() {
        const eventId = document.getElementById('eventId').value.trim();
        const usernameSelect = document.getElementById('username');

        if (!eventId) {
            usernameSelect.innerHTML = '<option value="">First select Event ID</option>';
            return;
        }

        this.currentEventId = eventId;

        try {
            usernameSelect.innerHTML = '<option value="">Loading users...</option>';

            const response = await fetch(`${this.baseUrl}/payments/events/${eventId}/attended-users`, {
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success && data.users.length > 0) {
                usernameSelect.innerHTML = '<option value="">Select Username</option>';
                data.users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.userName;
                    option.textContent = `${user.userName} (${user.userEmail})`;
                    option.dataset.email = user.userEmail;
                    option.dataset.phone = user.userPhone;
                    usernameSelect.appendChild(option);
                });
                this.attendedUsers = data.users;
            } else {
                usernameSelect.innerHTML = '<option value="">No attended users found for this event</option>';
                this.attendedUsers = [];
            }
        } catch (error) {
            console.error('Error loading attended users:', error);
            usernameSelect.innerHTML = '<option value="">Error loading users</option>';
            this.showMessage('error', 'Failed to load users for this event');
        }
    }

    /* ---------- AUTO-FILL USER DETAILS ---------- */
    async loadUserDetails() {
        const eventId = document.getElementById('eventId').value.trim();
        const username = document.getElementById('username').value;

        if (!eventId || !username) {
            this.clearUserFields();
            return;
        }

        try {
            const response = await fetch(`${this.baseUrl}/payments/user-details/${eventId}/${encodeURIComponent(username)}`, {
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                const details = data.userDetails;

                // Auto-fill form fields
                document.getElementById('userEmail').value = details.userEmail || '';
                document.getElementById('userPhone').value = details.userPhone || '';
                document.getElementById('paymentAmount').value = details.paymentAmount || '';

                // Check if payment already exists
                if (details.paymentExists) {
                    this.showMessage('error', `Payment already recorded for ${username}. Transaction ID: ${details.existingPayment.transactionId}`);
                    this.populateExistingPayment(details.existingPayment);
                } else {
                    this.showMessage('success', `User details loaded for ${username}`);
                }

            } else {
                this.showMessage('error', data.error || 'Failed to load user details');
                this.clearUserFields();
            }
        } catch (error) {
            console.error('Error loading user details:', error);
            this.showMessage('error', 'Network error while loading user details');
            this.clearUserFields();
        }
    }

    populateExistingPayment(payment) {
        document.getElementById('transactionId').value = payment.transactionId || '';
        document.getElementById('paymentMode').value = payment.paymentMode || '';
        document.getElementById('paymentAmount').value = payment.paymentAmount || '';
    }

    clearUserFields() {
        document.getElementById('userEmail').value = '';
        document.getElementById('userPhone').value = '';
        document.getElementById('paymentAmount').value = '';
        document.getElementById('transactionId').value = '';
    }

    /* ---------- TRANSACTION ID GENERATION ---------- */
    async generateTransactionId() {
        const transactionIdField = document.getElementById('transactionId');

        if (transactionIdField.value.trim()) {
            return; // Don't overwrite existing transaction ID
        }

        try {
            const response = await fetch(`${this.baseUrl}/payments/generate-transaction-id`, {
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                transactionIdField.value = data.transactionId;
            }
        } catch (error) {
            console.error('Error generating transaction ID:', error);
            // Fallback generation
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 10000);
            transactionIdField.value = `TXN${timestamp}${random}`;
        }
    }

    /* ---------- PAYMENT SUBMISSION ---------- */
    async submitPayment(event) {
        event.preventDefault();

        const formData = this.getFormData();

        if (!this.validateForm(formData)) {
            return;
        }

        try {
            this.showLoading('Submitting payment...');

            const response = await fetch(`${this.baseUrl}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccessModal(formData);  // ← Ye line change hui
                this.resetForm();
                this.loadPaymentHistory();
            } else {
                this.showMessage('error', data.error || 'Failed to record payment');
            }
        } catch (error) {
            console.error('Error submitting payment:', error);
            this.showMessage('error', 'Network error while submitting payment');
        }
    }

    getFormData() {
        return {
            eventId: document.getElementById('eventId').value.trim(),
            userName: document.getElementById('username').value,
            userEmail: document.getElementById('userEmail').value.trim(),
            userPhone: document.getElementById('userPhone').value.trim(),
            transactionId: document.getElementById('transactionId').value.trim(),
            paymentMode: document.getElementById('paymentMode').value,
            paymentAmount: parseFloat(document.getElementById('paymentAmount').value) || 0
        };
    }

    validateForm(formData) {
        const requiredFields = ['eventId', 'userName', 'userEmail', 'userPhone', 'transactionId', 'paymentMode', 'paymentAmount'];

        for (const field of requiredFields) {
            if (!formData[field] || formData[field] === '') {
                this.showMessage('error', `Please fill in all required fields. Missing: ${field}`);
                return false;
            }
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.userEmail)) {
            this.showMessage('error', 'Please enter a valid email address');
            return false;
        }

        // Phone validation
        const phoneRegex = /^[\+]?[1-9][\d]{9,15}$/;
        if (!phoneRegex.test(formData.userPhone.replace(/\s+/g, ''))) {
            this.showMessage('error', 'Please enter a valid phone number');
            return false;
        }

        // Amount validation
        if (formData.paymentAmount <= 0) {
            this.showMessage('error', 'Payment amount must be greater than 0');
            return false;
        }

        return true;
    }

    resetForm() {
        document.querySelector('.payment-form').reset();
        document.getElementById('username').innerHTML = '<option value="">First select Event ID</option>';
    }

    /* ---------- PAYMENT HISTORY ---------- */
    async loadPaymentHistory() {
        try {
            const response = await fetch(`${this.baseUrl}/payments/history`, {
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                this.paymentHistory = data.payments;
                this.renderPaymentHistory(data.payments);
            } else {
                this.showPaymentError('Failed to load payment history');
            }
        } catch (error) {
            console.error('Error loading payment history:', error);
            this.showPaymentError('Network error loading payment history');
        }
    }

    renderPaymentHistory(payments) {
        const tableBody = document.getElementById('paymentTableBody');

        if (payments.length === 0) {
            tableBody.innerHTML = `
                <div class="table-row empty-row">
                    <div class="table-cell" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                        <i class="fas fa-receipt" style="font-size: 2rem; margin-bottom: 1rem; display: block; opacity: 0.3;"></i>
                        <p>No payment records found</p>
                    </div>
                </div>
            `;
            return;
        }

        let html = '';
        payments.forEach((payment, index) => {
            const date = new Date(payment.paymentDate).toLocaleDateString('en-IN');
            const statusClass = payment.paymentStatus.toLowerCase();

            html += `
    <div class="table-row" data-search="${payment.transactionId.toLowerCase()} ${payment.userName.toLowerCase()} ${payment.userEmail.toLowerCase()} ${payment.eventName.toLowerCase()} ${payment.eventId.toLowerCase()} ${payment.paymentMode.toLowerCase()}">
        <div class="table-cell" data-label="S.NO.">${index + 1}</div>
        <div class="table-cell" data-label="TRANSACTION ID">${payment.transactionId}</div>
        <div class="table-cell" data-label="EVENT ID">${payment.eventId}</div>
        <div class="table-cell" data-label="USER NAME">${payment.userName}</div>
        <div class="table-cell" data-label="USER EMAIL">${payment.userEmail}</div>
        <div class="table-cell" data-label="EVENT NAME">${payment.eventName}</div>
        <div class="table-cell" data-label="AMOUNT">₹${payment.paymentAmount.toLocaleString('en-IN')}</div>
        <div class="table-cell" data-label="DATE">${date}</div>
        <div class="table-cell" data-label="PAYMENT MODE">${this.formatPaymentMode(payment.paymentMode)}</div>
        <div class="table-cell" data-label="STATUS">
            <span class="status-badge status-${statusClass}">${payment.paymentStatus.charAt(0).toUpperCase() + payment.paymentStatus.slice(1)}</span>
        </div>
    </div>
`;
        });

        tableBody.innerHTML = html;
    }

    formatPaymentMode(mode) {
        const modes = {
            'credit-card': 'Credit Card',
            'debit-card': 'Debit Card',
            'net-banking': 'Net Banking',
            'upi': 'UPI',
            'wallet': 'Digital Wallet',
            'bank-transfer': 'Bank Transfer'
        };
        return modes[mode] || mode;
    }

    showPaymentError(message) {
        const tableBody = document.getElementById('paymentTableBody');
        tableBody.innerHTML = `
            <div class="table-row error-row">
                <div class="table-cell" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem; display: block; color: #ff5757;"></i>
                    <p style="color: #ff5757;">${message}</p>
                    <button class="btn btn-primary" onclick="paymentManager.loadPaymentHistory()" style="margin-top: 1rem;">Retry</button>
                </div>
            </div>
        `;
    }

    /* ---------- SEARCH FUNCTIONALITY ---------- */
    searchPayments(searchTerm) {
        const rows = document.querySelectorAll('#paymentTableBody .table-row');
        const searchLower = searchTerm.toLowerCase();

        rows.forEach(row => {
            if (row.classList.contains('empty-row') || row.classList.contains('error-row') || row.classList.contains('loading-row')) {
                return;
            }

            const searchData = row.getAttribute('data-search') || '';
            if (searchData.includes(searchLower)) {
                row.style.display = 'grid';
            } else {
                row.style.display = 'none';
            }
        });
    }

    /* ---------- TAB SWITCHING ---------- */
    /* ---------- TAB SWITCHING ---------- */
    switchTab(tabName) {
        const tabs = document.querySelectorAll('#payment-details .tab');
        tabs.forEach(tab => tab.classList.remove('active'));

        const makePaymentSection = document.getElementById('make-payment-section');
        const paymentHistorySection = document.getElementById('payment-history-section');

        if (tabName === 'make-payment') {
            if (tabs[0]) tabs[0].classList.add('active');
            makePaymentSection.style.display = 'block';
            paymentHistorySection.classList.remove('active');
        } else if (tabName === 'payment-history') {
            if (tabs[1]) tabs[1].classList.add('active');
            makePaymentSection.style.display = 'none';
            paymentHistorySection.classList.add('active');
            this.loadPaymentHistory();
        }
    }
    /* ---------- MESSAGE SYSTEM ---------- */
    showMessage(type, text) {
        this.hideMessages();
        const messageEl = document.getElementById(type === 'success' ? 'successMessage' : 'errorMessage');

        if (!messageEl) {
            console.warn(`Message element not found: ${type}`);
            return;
        }

        messageEl.textContent = text;
        messageEl.style.display = 'block';
        setTimeout(() => this.hideMessages(), 5000);
    }

    hideMessages() {
        const successMsg = document.getElementById('successMessage');
        const errorMsg = document.getElementById('errorMessage');

        if (successMsg) successMsg.style.display = 'none';
        if (errorMsg) errorMsg.style.display = 'none';
    }

    showLoading(message) {
        this.showMessage('success', message);
    }
    showLoading(message) {
    this.showMessage('success', message);
}

/* ---------- SUCCESS MODAL ---------- */
showSuccessModal(paymentData) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'payment-success-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;

    modal.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 3rem;
            border-radius: 20px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
            color: white;
            animation: slideUp 0.4s ease;
        ">
            <div style="
                width: 80px;
                height: 80px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1.5rem;
                animation: checkmarkPop 0.6s ease;
            ">
                <i class="fas fa-check" style="font-size: 2.5rem; color: #4ade80;"></i>
            </div>
            
            <h2 style="
                font-size: 2rem;
                margin-bottom: 0.5rem;
                font-weight: 700;
            ">Payment Recorded Successfully!</h2>
            
            <p style="
                font-size: 1rem;
                margin-bottom: 2rem;
                opacity: 0.9;
            ">Payment has been processed and saved to the database</p>
            
            <div style="
                background: rgba(255, 255, 255, 0.15);
                padding: 1.5rem;
                border-radius: 15px;
                margin-bottom: 2rem;
                backdrop-filter: blur(10px);
                text-align: left;
            ">
                <div style="margin-bottom: 1rem;">
                    <div style="opacity: 0.8; font-size: 0.85rem; margin-bottom: 0.25rem;">Transaction ID</div>
                    <div style="font-size: 1.1rem; font-weight: 600; font-family: monospace;">${paymentData.transactionId}</div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <div style="opacity: 0.8; font-size: 0.85rem; margin-bottom: 0.25rem;">User</div>
                        <div style="font-weight: 600;">${paymentData.userName}</div>
                    </div>
                    <div>
                        <div style="opacity: 0.8; font-size: 0.85rem; margin-bottom: 0.25rem;">Amount</div>
                        <div style="font-weight: 600; font-size: 1.1rem;">₹${paymentData.paymentAmount.toLocaleString('en-IN')}</div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <div style="opacity: 0.8; font-size: 0.85rem; margin-bottom: 0.25rem;">Event ID</div>
                        <div style="font-weight: 600; font-family: monospace;">${paymentData.eventId}</div>
                    </div>
                    <div>
                        <div style="opacity: 0.8; font-size: 0.85rem; margin-bottom: 0.25rem;">Payment Mode</div>
                        <div style="font-weight: 600;">${this.formatPaymentMode(paymentData.paymentMode)}</div>
                    </div>
                </div>
            </div>
            
            <button onclick="this.closest('.payment-success-modal').remove()" style="
                background: white;
                color: #667eea;
                border: none;
                padding: 1rem 3rem;
                border-radius: 10px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0, 0, 0, 0.2)';">
                <i class="fas fa-check-circle"></i> Done
            </button>
        </div>
    `;

    // Add animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from {
                transform: translateY(50px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        @keyframes checkmarkPop {
            0% {
                transform: scale(0);
                opacity: 0;
            }
            50% {
                transform: scale(1.2);
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(modal);

    // Auto close after 8 seconds
    setTimeout(() => {
        if (modal.parentNode) {
            modal.remove();
        }
    }, 8000);

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}
}

/* ---------- GLOBAL INSTANCE ---------- */
let paymentManager;

/* ---------- GLOBAL FUNCTIONS ---------- */
function switchTab(tabName) {
    paymentManager.switchTab(tabName);
}

function searchPayments(searchTerm) {
    paymentManager.searchPayments(searchTerm);
}

function submitPayment(event) {
    paymentManager.submitPayment(event);
}

/* ---------- INITIALIZATION ---------- */
document.addEventListener('DOMContentLoaded', function () {
    paymentManager = new PaymentManager();
    paymentManager.init();

    console.log('Payment management system initialized');
});