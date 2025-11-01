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
                username: '',
                isLoggedIn: false
            },
            transactions: {
                data: [],
                expensePerDay: [],
                expensesToday: [],
                expensesYesterday: []
            },
            category: {
                data: [],
                managedData: [],
            },
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
                            window.location.href = baseUrl;
                        }
                    })
                }
            } catch (err) {
                console.error("Error:", err);
            }
        },
        async getUser() {
            try {
                const res = await fetch(`${baseUrl}/api/v1/user`, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const result = await res.json();
                if (result.success) {
                    const encodedUname = this.encrypt(result.data.username);
                    sessionStorage.setItem('ud', encodedUname);
                }
            } catch (err) {
                console.error('Get user Error:', err);
            }
        },
        encrypt(data) {
            const encoder = new TextEncoder();
            const en = encoder.encode(data);
            const encrypted = Array.from(new Uint8Array(en)).map(b => b.toString(16)).join('%');
            return encrypted;
        },
        decrypt(data) {
            const enData = data.split('%').map(d => parseInt(d, 16));
            const buff = new Uint8Array(enData);
            const decoder = new TextDecoder();
            const decrypted = decoder.decode(buff);
            return decrypted;
        },
        totalExpenseGraph() {
            const ctx = document.getElementById('totalExpense')?.getContext('2d');

            const getLastSeven = Array.from(
                {
                    length: 7
                },
                (_, i) =>
                    new Date(
                        new Date().getUTCFullYear(),
                        new Date().getUTCMonth(),
                        new Date().getUTCDate() - i
                    ).toLocaleDateString("sv-SE", {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                    })
            );

            const expenseMap = new Map(this.transactions.expensePerDay.map(item => [item._id, item.total]));

            const graphData = getLastSeven.map((day) => ({
                date: day,
                expenseToday: expenseMap.get(day) || 0,
            })).reverse();

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
                type: 'bar',
                data: {
                    labels: graphData.map(item => item.date),
                    datasets: [{
                        label: '2082 Expenditure per week',
                        data: graphData.map(item => item.expenseToday),
                        borderWidth: 1,
                        backgroundColor: '#5858ff',
                        borderRadius: {
                            topLeft: 8,
                            topRight: 8,
                            bottomLeft: 0,
                            bottomRight: 0
                        },
                        barThickness: 20
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: yMax
                        }
                    }
                }
            })
        },
        recentTransactions() {
            const gridOptions = {
                columnDefs: [
                    {
                        field: "Expense",
                        headerName: "Expense",
                        headerClass: "montserrat-alternates-medium",
                    },
                    {
                        field: "Amount",
                        headerName: "Amount",
                        headerClass: "montserrat-alternates-medium",
                    },
                    {
                        field: "Category",
                        headerName: "Category",
                        headerClass: "montserrat-alternates-medium",
                    },
                    {
                        field: "DateTime",
                        headerName: "Date & Time",
                        headerClass: "montserrat-alternates-medium",
                    },
                ],
                rowData: this.transactions.data.map((item) => ({
                    Expense: item.description,
                    Amount: item.expense,
                    Category: item.category,
                    DateTime:
                        new Date(item.createdAt).toLocaleDateString("sv-SE", {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                        }) +
                        "  " +
                        new Date(item.createdAt).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "numeric",
                            hour12: true,
                        }),
                })),
                onGridSizeChanged: this.onGridSizeChanged,
                onFirstDataRendered: this.onFirstDataRendered,
            };

            const myGridElement = document.getElementById('recentTransactions');
            agGrid.createGrid(myGridElement, gridOptions);
        },
        onGridSizeChanged(params) {
            // get the current grids width
            const gridWidth = document.querySelector(".ag-body-viewport").clientWidth;

            // keep track of which columns to hide/show
            const columnsToShow = [];
            const columnsToHide = [];

            // iterate over all columns (visible or not) and work out
            // now many columns can fit (based on their minWidth)
            let totalColsWidth = 0;
            const allColumns = params.api.getColumns();
            if (allColumns && allColumns.length > 0) {
                for (let i = 0; i < allColumns.length; i++) {
                    const column = allColumns[i];
                    totalColsWidth += column.getMinWidth();
                    if (totalColsWidth > gridWidth) {
                        columnsToHide.push(column.getColId());
                    } else {
                        columnsToShow.push(column.getColId());
                    }
                }
            }
            // show/hide columns based on current grid width
            params.api.setColumnsVisible(columnsToShow, true);
            params.api.setColumnsVisible(columnsToHide, false);

            // wait until columns stopped moving and fill out
            // any available space to ensure there are no gaps
            window.setTimeout(() => {
                params.api.sizeColumnsToFit();
            }, 10);
        },
        onFirstDataRendered(params) {
            params.api.sizeColumnsToFit();
        },
        getRandomHexCode(mode = "any") {
            let r, g, b;

            if (mode === "light") {
                // High RGB values for light colors
                r = 200 + Math.floor(Math.random() * 56); // 200–255
                g = 200 + Math.floor(Math.random() * 56);
                b = 200 + Math.floor(Math.random() * 56);
            } else if (mode === "dark") {
                // Low RGB values for dark colors
                r = Math.floor(Math.random() * 156); // 0–55
                g = Math.floor(Math.random() * 156);
                b = Math.floor(Math.random() * 156);
            } else if (mode === "medium") {
                r = Math.floor(Math.random() * 210); // 78-177
                g = Math.floor(Math.random() * 210);
                b = Math.floor(Math.random() * 210);
            } else {
                // Any color
                r = Math.floor(Math.random() * 256);
                g = Math.floor(Math.random() * 256);
                b = Math.floor(Math.random() * 256);
            }

            return (
                "#" +
                [r, g, b]
                    .map((x) => x.toString(16).padStart(2, "0"))
                    .join("")
            );
        },
        expensesToday() {
            const ctx = document.getElementById('expensesToday')?.getContext('2d');
            const label = this.transactions.expensesToday.map((item) => item.category);
            const data = this.transactions.expensesToday.map((item) => item.expense);
            const maxValue = Math.max(...data);
            const yMax = Math.ceil(maxValue * 1.2);

            if (!ctx) {
                console.error('canvas not found');
                return;
            }
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: label,
                    datasets: [{
                        label: 'Expenses today',
                        data: data,
                        borderWidth: 1,
                        backgroundColor: label.map(() => this.getRandomHexCode("medium")),

                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: yMax
                        }
                    }
                }
            })
        },
        decrypt(data) {
            const enData = data.split('%').map(d => parseInt(d, 16));
            const buff = new Uint8Array(enData);
            const decoder = new TextDecoder();
            const decrypted = decoder.decode(buff);
            return decrypted;
        },
        async getRecentTransactions() {
            try {
                const res = await fetch(`${baseUrl}/api/v1/expenses?limit=15`, {
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
        async getMonthlyTransaction() {
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
                    this.transactions.expensePerDay = data.data.perDayExpenses || [];
                }
            } catch (err) {
                console.error('Error getting monthly expense:', err);
            }
        },
        async getExpensesToday() {
            try {
                const res = await fetch(`${baseUrl}/api/v1/expense/today`, {
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
                }
            } catch (err) {
                console.error("Error:", err);
            }
        },
        exportExcel() {
            const overAllDataSheet = XLSX.utils.json_to_sheet(this.transactions.expensesToday, { origin: 'B2' });
            const wb = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(wb, overAllDataSheet, 'Expenses Today - ' + new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'numeric', day: 'numeric' }));

            XLSX.writeFile(wb, `${new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-US', { month: 'long' })}-report.xlsx`);
        },
        async getAllBudgetCategories() {
            try {
                const res = await fetch(`${baseUrl}/api/v1/budget-categories?for=home`, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const data = await res.json();

                if (data.success) {
                    this.category.data = data.data || [];
                }
            } catch (err) {
                console.error('Error getting categories:', err);
            }
        },
        manageCategoryExpenseData(){
            const todayExpMap = new Map(this.transactions.expensesToday.map(item => [item.category, item.expense]));
            const yesterdayExpMap = new Map(this.transactions.expensesYesterday.map(item => [item.category, item.expense]));
            this.category.managedData = this.category.data.map(cat=>{
                return {
                    category: cat.category,
                    totalExpense: cat.expense,
                    todayExpense: todayExpMap.get(cat.category) || 0,
                    yesterdayExpense: yesterdayExpMap.get(cat.category) || 0,
                    diff: Math.abs(yesterdayExpMap.get(cat.category) - todayExpMap.get(cat.category)),
                    isTodayGreater: (yesterdayExpMap.get(cat.category) - todayExpMap.get(cat.category)) < 0,
                    isExpenseDiffZero: (yesterdayExpMap.get(cat.category) - todayExpMap.get(cat.category)) === 0,
                    percentageChange: cat.expense !== 0 ? ((todayExpMap.get(cat.category) / cat.expense) * 100).toFixed(2) : 0
                }
            })
        }
    },
    async mounted() {
        await this.isLoggedIn();
        if (this.user.isLoggedIn) {
            this.getUser();
            this.user.username = this.decrypt(localStorage.getItem('ud'));
            await this.getRecentTransactions();
            await this.getMonthlyTransaction();
            await this.getExpensesToday();
            await this.getAllBudgetCategories();
            this.totalExpenseGraph();
            this.recentTransactions();
            this.expensesToday();
            this.manageCategoryExpenseData();
        } else {
            window.location.href = '/'
        }

    }
}).mount('#app')