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
                compareDate: null,
                data: [],
                count: 0,
                monthlyBudget: 0,
                monthlyExpense: 0,
                perDayExpenses:[],
                percentageTotalExpense:0
            },
            startDate: "",
            endDate: "",
            page: 1,
            limit: 10,
            chartInstance: null
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
                            location.href = baseUrl;
                        }
                    })
                }
            } catch (err) {
                console.error("Error:", err);
            }
        },
        monthlyExpenseGraph() {
            const ctx = document.getElementById('expenseMonth')?.getContext('2d');

            const getMonthLong = () => Array.from({length: new Date(new Date().getUTCFullYear(),new Date().getUTCMonth()+1,0).getDate()},(_,i) => new Date(new Date().getUTCFullYear(),new Date().getUTCMonth(),i+1).toLocaleDateString('sv-SE',{year:'numeric',month:'numeric',day:'numeric'}));

            const expenseMap = new Map(this.transactions.perDayExpenses.map(item => [item._id, item.total]));

            const graphData = getMonthLong().map((month) => ({date: month.split('-')[2], expenseToday: expenseMap.get(month) || 0}));

            const maxValue = Math.max(...graphData.map(item => item.expenseToday));
            const yMax = Math.ceil(maxValue * 1.2);

            if (!ctx) {
                console.error('canvas not found');
                return;
            }
            if (this.chartInstance) {
                this.chartInstance.destroy();
            }
            this.chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: graphData.map(item => item.date),
                    datasets: [{
                        label: '2025 Expenditure for ' + new Date().toLocaleDateString('en-US', { month: 'long' }),
                        data: graphData.map(item => item.expenseToday),
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
        async getAllTransactions() {
            try {
                const url = new URL(window.location);

                if(this.startDate || this.endDate){
                    this.startDate && url.searchParams.set('startDate', this.startDate);
                    this.endDate && url.searchParams.set('endDate', this.endDate);

                    await this.getPaginationCount();
                }else{
                    url.searchParams.delete('startDate');
                    url.searchParams.delete('endDate');

                    await this.getPaginationCount();
                }
                url.searchParams.set('page', this.page);
                window.history.pushState({}, '', url);

                const res = await fetch(`${baseUrl}/api/v1/expenses?page=${this.page}&limit=${this.limit}&startDate=${this.startDate}&endDate=${this.endDate}`, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const data = await res.json();
                this.transactions.data = data.data;
            } catch (err) {
                console.error('Error getting categories:', err);
            }
        },
        async getMonthlyTransactions(){
            try{
                const res = await fetch(`${baseUrl}/api/v1/expense/monthly`, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const data = await res.json();
                if(data.success && data.data){
                    this.transactions.perDayExpenses = data.data.perDayExpenses || [];
                    this.transactions.monthlyBudget = data.data.primaryBudget || 0;
                    this.transactions.monthlyExpense = data.data.monthlyExpense[0].total || 0;
                    this.transactions.percentageTotalExpense = data.data.percentageExpense.toFixed(2) || 0;
                }
            }catch(err){
                console.error('Error getting monthly expense:', err);
            }
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
                const res = await fetch(`${baseUrl}/api/v1/expenses/count?startDate=${this.startDate}&endDate=${this.endDate}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin'
                })
                const data = await res.json();
                this.transactions.count = Math.ceil(data.count / this.limit);
            } catch (err) {
                console.error(err);
            }
        },
        changePage(page) {
            this.page = page;
            this.getAllTransactions();
        }
    },
    async mounted() {
        await this.isLoggedIn();
        if (this.user.isLoggedIn) {
            await this.getAllTransactions();
            await this.getPaginationCount();
            await this.getMonthlyTransactions();
            this.monthlyExpenseGraph();
        } else {
            window.location.href = '/'
        }
    }
}).mount('#app')