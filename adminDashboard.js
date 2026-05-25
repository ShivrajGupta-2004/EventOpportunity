// ==================== ADMIN DASHBOARD MANAGER ====================

class DashboardManager {
    constructor() {
        this.charts = {
            monthlyEvents: null,
            monthlyPayments: null,
            monthlyApplications: null
        };
        this.init();
    }

    async init() {
        console.log('Dashboard Manager Initialized');
        await this.loadDashboardData();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const dashboardNavItem = document.querySelector('[data-section="dashboard"]');
        if (dashboardNavItem) {
            dashboardNavItem.addEventListener('click', () => {
                this.loadDashboardData();
            });
        }
    }

    async loadDashboardData() {
        try {
            await Promise.all([
                this.loadMetrics(),
                this.loadCharts()
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async loadMetrics() {
        try {
            const response = await fetch('http://localhost:5000/api/admin/dashboard-stats', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.updateMetricsUI(data);
            } else {
                this.setDefaultMetrics();
            }
        } catch (error) {
            console.error('Error loading metrics:', error);
            this.setDefaultMetrics();
        }
    }

    updateMetricsUI(data) {
        document.getElementById('totalUsers').textContent = data.totalUsers || 0;
        document.getElementById('totalEvents').textContent = data.totalEvents || 0;
        document.getElementById('totalPayments').textContent = `₹${this.formatNumber(data.totalPayments || 0)}`;
        document.getElementById('totalApplications').textContent = data.totalApplications || 0;
        document.getElementById('pendingApplications').textContent = data.pendingApplications || 0;
        document.getElementById('completedPayments').textContent = data.completedPayments || 0;

        this.animateNumbers();
    }

    setDefaultMetrics() {
        document.getElementById('totalUsers').textContent = '0';
        document.getElementById('totalEvents').textContent = '0';
        document.getElementById('totalPayments').textContent = '₹0';
        document.getElementById('totalApplications').textContent = '0';
        document.getElementById('pendingApplications').textContent = '0';
        document.getElementById('completedPayments').textContent = '0';
    }

    async loadCharts() {
        try {
            await Promise.all([
                this.loadMonthlyEventsChart(),
                this.loadMonthlyPaymentsChart(),
                this.loadMonthlyApplicationsChart()
            ]);
        } catch (error) {
            console.error('Error loading charts:', error);
        }
    }

    async loadMonthlyEventsChart() {
        try {
            const response = await fetch('http://localhost:5000/api/admin/monthly-events', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.createMonthlyEventsChart(data);
            } else {
                this.createMonthlyEventsChart([]);
            }
        } catch (error) {
            console.error('Error loading monthly events:', error);
            this.createMonthlyEventsChart([]);
        }
    }

    createMonthlyEventsChart(data) {
        const ctx = document.getElementById('monthlyEventsChart');
        if (!ctx) return;

        if (this.charts.monthlyEvents) {
            this.charts.monthlyEvents.destroy();
        }

        const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const counts = allMonths.map(month => {
            const found = data.find(d => d.month === month);
            return found ? found.count : 0;
        });

        const maxCount = Math.max(...counts, 10);
        const stepSize = Math.ceil(maxCount / 10) * 10 / 10;

        this.charts.monthlyEvents = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: allMonths,
                datasets: [{
                    label: 'Events Posted',
                    data: counts,
                    backgroundColor: 'rgba(244, 67, 54, 0.6)',
                    borderColor: 'rgba(244, 67, 54, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#ffffff',
                            font: { size: 12 }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#8a9aa9',
                            font: { size: 11 },
                            stepSize: stepSize >= 1 ? Math.ceil(stepSize) : 1,
                            callback: function(value) {
                                return Number.isInteger(value) ? value : '';
                            }
                        },
                        grid: {
                            color: 'rgba(138, 154, 169, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#8a9aa9',
                            font: { size: 11 }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    async loadMonthlyPaymentsChart() {
        try {
            const response = await fetch('http://localhost:5000/api/admin/monthly-payments', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.createMonthlyPaymentsChart(data);
            } else {
                this.createMonthlyPaymentsChart([]);
            }
        } catch (error) {
            console.error('Error loading monthly payments:', error);
            this.createMonthlyPaymentsChart([]);
        }
    }

    createMonthlyPaymentsChart(data) {
        const ctx = document.getElementById('monthlyPaymentsChart');
        if (!ctx) return;

        if (this.charts.monthlyPayments) {
            this.charts.monthlyPayments.destroy();
        }

        const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const amounts = allMonths.map(month => {
            const found = data.find(d => d.month === month);
            return found ? found.amount : 0;
        });

        const maxAmount = Math.max(...amounts, 1000);
        const stepSize = Math.ceil(maxAmount / 1000) * 100;

        this.charts.monthlyPayments = new Chart(ctx, {
            type: 'line',
            data: {
                labels: allMonths,
                datasets: [{
                    label: 'Payments (₹)',
                    data: amounts,
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#4caf50',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#ffffff',
                            font: { size: 12 }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#8a9aa9',
                            font: { size: 11 },
                            stepSize: stepSize,
                            callback: function(value) {
                                return '₹' + value.toLocaleString('en-IN');
                            }
                        },
                        grid: {
                            color: 'rgba(138, 154, 169, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#8a9aa9',
                            font: { size: 11 }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    async loadMonthlyApplicationsChart() {
        try {
            const response = await fetch('http://localhost:5000/api/admin/monthly-applications', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.createMonthlyApplicationsChart(data);
            } else {
                this.createMonthlyApplicationsChart([]);
            }
        } catch (error) {
            console.error('Error loading monthly applications:', error);
            this.createMonthlyApplicationsChart([]);
        }
    }

    createMonthlyApplicationsChart(data) {
        const ctx = document.getElementById('monthlyApplicationsChart');
        if (!ctx) return;

        if (this.charts.monthlyApplications) {
            this.charts.monthlyApplications.destroy();
        }

        const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const counts = allMonths.map(month => {
            const found = data.find(d => d.month === month);
            return found ? found.count : 0;
        });

        // Filter out months with 0 applications for cleaner doughnut chart
        const filteredData = allMonths.reduce((acc, month, index) => {
            if (counts[index] > 0) {
                acc.labels.push(month);
                acc.data.push(counts[index]);
            }
            return acc;
        }, { labels: [], data: [] });

        // If no data, show placeholder
        if (filteredData.data.length === 0) {
            filteredData.labels = ['No Data'];
            filteredData.data = [1];
        }

        const colors = [
            'rgba(244, 67, 54, 0.8)',
            'rgba(76, 175, 80, 0.8)',
            'rgba(33, 150, 243, 0.8)',
            'rgba(255, 152, 0, 0.8)',
            'rgba(156, 39, 176, 0.8)',
            'rgba(0, 188, 212, 0.8)',
            'rgba(255, 193, 7, 0.8)',
            'rgba(121, 85, 72, 0.8)',
            'rgba(158, 158, 158, 0.8)',
            'rgba(255, 87, 34, 0.8)',
            'rgba(103, 58, 183, 0.8)',
            'rgba(205, 220, 57, 0.8)'
        ];

        this.charts.monthlyApplications = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: filteredData.labels,
                datasets: [{
                    label: 'Applications',
                    data: filteredData.data,
                    backgroundColor: colors.slice(0, filteredData.labels.length),
                    borderColor: '#1a202c',
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            font: { size: 11 },
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    formatNumber(num) {
        return new Intl.NumberFormat('en-IN').format(num);
    }

    animateNumbers() {
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(element => {
            element.style.animation = 'none';
            setTimeout(() => {
                element.style.animation = 'fadeIn 0.5s ease-in-out';
            }, 10);
        });
    }
}

// Initialize Dashboard Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});