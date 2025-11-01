const { createApp } = Vue;

import { Modal } from "../../components/modal.js";
import { Navbar } from "../../components/navbar.js";
import { Sidebar } from "../../components/sidebar.js";

const baseUrl = window.location.origin;

createApp({
    components: { Navbar, Sidebar, Modal },
    data() {
        return {
            user: {
                isLoggedIn: false
            },
            transactions: {
                expensesToday: [],
                expensesYesterday: [],
                perDayExpenses: new Map(),
                monthlyBudget: 0,
                monthlyExpense: 0
            },
            budgetCategoriesExpense: {
                data: [],
                totalAllocatedBudget: 0
            },
            chartInstanceToday: null,
            chartInstanceMonthly: null,
            chartInstanceBudget: null,
            chartInstanceSaving: null,
            minDate: new Date(new Date().getUTCFullYear(), new Date().getUTCMonth(), 2).toISOString().split('T')[0],
            maxDate: new Date(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1).toISOString().split('T')[0],
            startDate: '',
            endDate: '',
            page: 1,
            limit: 10,
            count: 0
        }
    },
    methods: {
        async isLoggedIn() {
            try {
                const res = await fetch(`${baseUrl}/api/v1/auth/verify-logged-in`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin'
                });
                const data = await res.json();
                if (data.isLoggedIn) {
                    this.user.isLoggedIn = true;
                } else {
                    Swal.fire({
                        title: 'Session Expired! Please login again!',
                        icon: 'info',
                        allowOutsideClick: false,
                        didClose: () => {
                            window.location.href = baseUrl;
                        }
                    })
                }
            } catch (err) {
                console.error("Error:", err);
            }
        },
        async getUserData() {
            try {
                const res = await fetch(`${baseUrl}/api/v1/user`, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const data = await res.json();
            } catch (err) {
                console.error('Error getting user data:', err);
            }
        },
        expenseGraphToday() {
            const ctx = document.getElementById('today-expense-canvas')?.getContext('2d');

            const maxValue = Math.max(...this.transactions.expensesToday.map(item => item.expense));
            const yMax = Math.ceil(maxValue * 1.2);

            if (!ctx) {
                console.error('canvas not found');
                return;
            }
            if (this.chartInstanceToday) {
                this.chartInstanceToday.destroy();
            }
            this.chartInstanceToday = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: this.transactions.expensesToday.map(item => item.category),
                    datasets: [{
                        label: '2025 Expenditure for ' + (this.startDate && this.endDate ? `from ${new Date(this.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} to ${new Date(this.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}` : !this.startDate && this.endDate ? `from ${new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), 1)).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} to ${new Date(this.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}` : this.startDate && !this.endDate ? `from ${new Date(this.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} to ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}` : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })),
                        data: this.transactions.expensesToday.map(item => item.expense),
                        borderColor: '#5858ff',
                        borderWidth: 1,
                        tension: 0.3,
                        fill: false,
                        pointRadius: 2,
                        pointBackgroundColor: '#5858ff',
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: yMax
                        }
                    },
                    maintainAspectRatio: false,
                    responsive: true
                }
            })
        },
        expenseGraphMonthly() {
            const ctx = document.getElementById('monthly-expense-canvas')?.getContext('2d');

            const maxValue = Math.max(...this.budgetCategoriesExpense.data.map(item => item.expense));
            const yMax = Math.ceil(maxValue * 1.2);

            if (!ctx) {
                console.error('canvas not found');
                return;
            }
            if (this.chartInstanceMonthly) {
                this.chartInstanceMonthly.destroy();
            }
            this.chartInstanceMonthly = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: this.budgetCategoriesExpense.data.map(item => item.category),
                    datasets: [{
                        label: '2025 Expenditure for ' + new Date().toLocaleDateString('en-US', { month: 'long' }),
                        data: this.budgetCategoriesExpense.data.map(item => item.expense),
                        borderColor: '#5858ff',
                        borderWidth: 1,
                        tension: 0.3,
                        fill: false,
                        pointRadius: 2,
                        pointBackgroundColor: '#5858ff',
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: yMax
                        }
                    },
                    maintainAspectRatio: false,
                    responsive: true
                }
            })
        },
        budgetAllocationGraph() {
            const ctx = document.getElementById('budget-allocation-canvas')?.getContext('2d');

            if (!ctx) {
                console.error('canvas not found');
                return;
            }
            if (this.chartInstanceBudget) {
                this.chartInstanceBudget.destroy();
            }
            this.chartInstanceBudget = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: this.budgetCategoriesExpense.data.map(item => item.category),
                    datasets: [{
                        label: '2025 Budget Allocation for ' + new Date().toLocaleDateString('en-US', { month: 'long' }),
                        data: this.budgetCategoriesExpense.data.map(item => item.budget),
                        borderColor: '#5858ff',
                        borderWidth: 1,
                        tension: 0,
                        pointRadius: 2,
                        pointBackgroundColor: '#5858ff',
                        backgroundColor: 'rgba(88, 88, 255, 0.5)'
                    }]
                },
                options: {
                    elements: {
                        line: {
                            borderWidth: 2
                        }
                    },
                    maintainAspectRatio: false,
                    responsive: true
                }
            })
        },
        possibleSaveGraph() {
            const ctx = document.getElementById('possible-savings-canvas')?.getContext('2d');

            if (!ctx) {
                console.error('canvas not found');
                return;
            }
            if (this.chartInstanceSaving) {
                this.chartInstanceSaving.destroy();
            }
            this.chartInstanceSaving = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: this.budgetCategoriesExpense.data.map(item => item.category),
                    datasets: [{
                        label: '2025 Possible Savings for ' + new Date().toLocaleDateString('en-US', { month: 'long' }),
                        data: this.budgetCategoriesExpense.data.map(item => item.budget - item.expense),
                        backgroundColor: this.budgetCategoriesExpense.data.map(() => this.getRandomHexCode()),
                    }]
                },
                options: {
                    elements: {
                        line: {
                            borderWidth: 2
                        }
                    },
                    maintainAspectRatio: false,
                    responsive: true
                }
            })
        },
        async getAllBudgetCategories() {
            try {
                const res = await fetch(`${baseUrl}/api/v1/budget-categories?for=reports`, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const data = await res.json();

                if (data.success) {
                    this.budgetCategoriesExpense.data = data.data || [];
                    this.budgetCategoriesExpense.totalAllocatedBudget = data.totalAllocatedBudget || 0;
                }
            } catch (err) {
                console.error('Error getting categories:', err);
            }
        },
        async getMonthlyTransactions() {
            try {
                const res = await fetch(`${baseUrl}/api/v1/expense/monthly`, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const data = await res.json();
                if (data.success && data.data) {
                    data.data.perDayExpenses?.forEach(item => this.transactions.perDayExpenses.set(item._id, item.total));
                    this.transactions.monthlyBudget = data.data?.primaryBudget || 0;
                    this.transactions.monthlyExpense = data.data.monthlyExpense[0]?.total || 0;
                }
            } catch (err) {
                console.error('Error getting monthly expense:', err);
            }
        },
        async getExpensesToday() {
            try {
                const res = await fetch(`${baseUrl}/api/v1/expense/today?from=${this.startDate}&to=${this.endDate}`, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const data = await res.json();
                if (data.success && data.data) {
                    this.transactions.expensesToday = data.data.expensesToday || [];
                    this.transactions.expensesYesterday = data.data.expensesYesterday || [];
                    if (this.startDate || this.endDate) {
                        this.expenseGraphToday();
                    }
                }
            } catch (err) {
                console.error("Error:", err);
            }
        },
        sheetName(){
            const month = new Date(this.startDate || this.endDate || new Date())
                .toLocaleDateString('en-US', { month: 'short' });

            const year = new Date(this.startDate || this.endDate || new Date())
                .toLocaleDateString('en-US', { year: '2-digit' });

            let startDay, endDay;

            if (this.startDate && this.endDate) {
                startDay = String(new Date(this.startDate).getDate()).padStart(2, '0');
                endDay = String(new Date(this.endDate).getDate()).padStart(2, '0');
            } else if (!this.startDate && this.endDate) {
                startDay = "01";
                endDay = String(new Date(this.endDate).getDate()).padStart(2, '0');
            } else if (this.startDate && !this.endDate) {
                startDay = String(new Date(this.startDate).getDate()).padStart(2, '0');
                endDay = String(new Date().getDate()).padStart(2, '0');
            } else {
                startDay = String(new Date().getDate()).padStart(2, '0');
                endDay = startDay;
            }

            return `${year} ${month} ${startDay}-${endDay}`;
        },
        exportExcel() {
            const wb = XLSX.utils.book_new();

            let row = 1;
            const combinedSheet = {};

            const overAllData = [
                { Metric: 'Total Budget', Value: this.transactions.monthlyBudget },
                { Metric: 'Total Budget Allocated', Value: this.budgetCategoriesExpense.totalAllocatedBudget },
                { Metric: 'Total Expenditure', Value: this.transactions.monthlyExpense },
                { Metric: 'Expenditure Today', Value: this.transactions.perDayExpenses.get(new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'numeric', day: 'numeric' })) || 0 }
            ];
            combinedSheet['!merges'] = combinedSheet['!merges'] || [];
            combinedSheet['!merges'].push({
                s: { r: row - 1, c: 0 },
                e: { r: row - 1, c: 1 }
            });
            row++;

            const overAllDataSheet = XLSX.utils.json_to_sheet(overAllData, { origin: `A${row}` });
            Object.assign(combinedSheet, overAllDataSheet);
            const overallRows = Object.keys(overAllDataSheet).filter(k => k.match(/^[A-Z]+[0-9]+$/)).map(k => +k.match(/[0-9]+/)[0]);
            row = Math.max(...overallRows) + 4;

            combinedSheet[`A${row}`] = { t: 's', v: `${this.sheetName()} Expense Report` };
            combinedSheet['!merges'] = combinedSheet['!merges'] || [];
            combinedSheet['!merges'].push({
                s: { r: row - 1, c: 0 },
                e: { r: row - 1, c: 1 }
            });
            row++;

            const todaySheet = XLSX.utils.json_to_sheet(this.transactions.expensesToday, { origin: `A${row}` });
            Object.assign(combinedSheet, todaySheet);
            const todayRows = Object.keys(todaySheet).filter(k => k.match(/^[A-Z]+[0-9]+$/)).map(k => +k.match(/[0-9]+/)[0]);
            row = Math.max(...todayRows) + 4;

            combinedSheet[`A${row}`] = { t: 's', v: 'Monthly Budget & Expense Report' };
            combinedSheet['!merges'] = combinedSheet['!merges'] || [];
            combinedSheet['!merges'].push({
                s: { r: row - 1, c: 0 },
                e: { r: row - 1, c: 4 }
            });

            const monthlyExpenseData = this.budgetCategoriesExpense.data.map(item => ({
                category: item.category,
                budget: item.budget,
                expense: item.expense,
                createdAt: ((item.budget !== 0) && (item.expense !== 0)) ? new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }) : 'N/A',
                updatedAt: ((item.budget !== 0) && (item.expense !== 0)) ? new Date(item.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }) : 'N/A'
            }));
            row++;

            const budgetSheet = XLSX.utils.json_to_sheet(monthlyExpenseData, { origin: `A${row}` });
            Object.assign(combinedSheet, budgetSheet);
            const budgetRows = Object.keys(budgetSheet).filter(k => k.match(/^[A-Z]+[0-9]+$/)).map(k => +k.match(/[0-9]+/)[0]);
            row = Math.max(...budgetRows) + 4;


            XLSX.utils.book_append_sheet(wb, combinedSheet, `${this.sheetName()} expenses&budget`);


            XLSX.writeFile(wb, `${this.sheetName()}-report.xlsx`);
        },
        getRandomHexCode() {
            return (
                "#" +
                Math.floor(Math.random() * 0xffffff)
                    .toString(16)
                    .padStart(6, "0")
            );
        },

        async getPaginationCount() {
            try {
                const query = new URLSearchParams(window.location.search);
                this.page = query.get('page') || 1;
                this.limit = query.get('limit') || 10;

                const res = await fetch(`${baseUrl}/api/v1/category/count`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin'
                })
                const data = await res.json();

                this.count = Math.ceil(data.count / this.limit);
            } catch (err) {
                console.error(err);
            }
        },
        changePage(page) {
            window.location.href = baseUrl + '/categories?page=' + page;
        }
    },
    async mounted() {
        await this.isLoggedIn();
        if (this.user.isLoggedIn) {
            await this.getUserData();
            await this.getExpensesToday();
            await this.getPaginationCount();
            await this.getAllBudgetCategories();
            await this.getMonthlyTransactions();
            this.expenseGraphToday();
            this.expenseGraphMonthly();
            this.budgetAllocationGraph();
            this.possibleSaveGraph();
        } else {
            window.location.href = '/'
        }
    }
}).mount('#app')