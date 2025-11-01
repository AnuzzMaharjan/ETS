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
            expenses: {
                amount: 0,
                description: '',
                categories: [],
                data: [],
                count: 0
            },
            showDropdown:false,
            expenseCreate:{
                selectedOption:'',
                description:'',
                expense:0
            },
            page: 1,
            limit: 10
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
        getRandomHexCode() {
            return (
                "#" +
                Math.floor(Math.random() * 0xffffff)
                    .toString(16)
                    .padStart(6, "0")
            );
        },
        selectOption(option) {
            this.expenseCreate.selectedOption = option;
            this.showDropdown = false;
        },
        async getExpenses() {
            try {
                const query = new URLSearchParams(window.location.search);
                const page = query.get('page') || 1;
                const limit = query.get('limit') || 10;
                const res = await fetch(`${baseUrl}/api/v1/expenses?page=${page}&limit=${limit}`, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const data = await res.json();
                this.expenses.data = data.data;
            } catch (err) {
                console.error('Error getting categories:', err);
            }
        },
        handleExpenseEdit(index, elem) {
            const description = document.getElementById('expenseDescription' + index);
            const amount = document.getElementById('expenseAmount' + index);

            description.removeAttribute('readonly');
            description.classList.add('editable');
            amount.removeAttribute('readonly');
            amount.classList.add('editable');

            elem.classList.add('hide');
            document.getElementById('expenseSave' + index).classList.remove('hide');
        },
        async handleExpenseSave(index, elem, id, category) {
            const description = document.getElementById('expenseDescription' + index);
            const amount = document.getElementById('expenseAmount' + index);

            Swal.fire({
                title: 'Do you want to Save this?',
                showDenyButton: true,
                showCancelButton: false,
                confirmButtonText: 'Confirm',
                denyButtonText: `Reject`,
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const res = await fetch(`${baseUrl}/api/v1/expense/${id}/update`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            credentials: 'same-origin',
                            body: JSON.stringify({
                                description: description.value,
                                expense: parseInt(amount.value, 10),
                                category: category
                            })
                        });
                        const data = await res.json();
                        if (data.success) {
                            Swal.fire({
                                title: 'Saved successfully!',
                                icon: 'success',
                                didClose: () => {
                                    location.reload();
                                }
                            })
                        } else {
                            Swal.fire({
                                title: 'Failed to save!',
                                icon: 'error'
                            })
                        }
                    } catch (err) {
                        console.error(err);
                    }
                }
                description.setAttribute('readonly', '');
                description.classList.remove('editable');
                amount.setAttribute('readonly', '');
                amount.classList.remove('editable');
                elem.classList.add('hide');
                document.getElementById('expenseEdit' + index).classList.remove('hide');
            })
        },
        async handleExpenseDelete(id) {
            Swal.fire({
                title: 'Do you want to delete this?',
                showDenyButton: true,
                showCancelButton: false,
                confirmButtonText: 'Confirm',
                denyButtonText: `Reject`,
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const res = await fetch(`${baseUrl}/api/v1/expense/${id}`, {
                            method: 'DELETE',
                            credentials: 'same-origin',
                        });
                        const data = await res.json();
                        if (data.success) {
                            await this.getExpenses();
                            Swal.fire({
                                title: 'Deleted successfully!',
                                icon: 'success'
                            })
                        } else {
                            Swal.fire({
                                title: 'Failed to delete!',
                                icon: 'error'
                            })
                        }
                        this.getPaginationCount();
                        location.reload();
                    } catch (err) {
                        console.error('Error:', err);
                    }
                }
            })
        },
        async createExpense() {
            try {
                const res = await fetch(`${baseUrl}/api/v1/expense`, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({expense: this.expenseCreate.expense, description: this.expenseCreate.description, category: this.expenseCreate.selectedOption})
                });
                const data = await res.json();
                console.log(data);
                if (data.success) {
                    await this.getExpenses();
                    this.expenseCreate = {};
                    this.showDropdown = false;
                    location.reload();
                }
                this.getPaginationCount();
            } catch (err) {
                console.error('Error:', err);
            }
        },
        async getAllCategories() {
            try {
                const res = await fetch(`${baseUrl}/api/v1/categories?for=expense`, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const data = await res.json();

                this.expenses.categories = data.data.result;
            } catch (err) {
                console.error('Error getting categories:', err);
            }
        },
        async getPaginationCount() {
            try {
                const query = new URLSearchParams(window.location.search);
                this.page = query.get('page') || 1;
                this.limit = query.get('limit') || 10;

                const res = await fetch(`${baseUrl}/api/v1/expenses/count`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin'
                })
                const data = await res.json();
                this.expenses.count = Math.ceil(data.count / this.limit);
            } catch (err) {
                console.error(err);
            }
        },
        changePage(page) {
            window.location.href = baseUrl + '/add-expense?page=' + page;
        }
    },
    async mounted() {
        await this.isLoggedIn();
        if (this.user.isLoggedIn) {
            await this.getPaginationCount();
            await this.getAllCategories();
            await this.getExpenses();
        } else {
            window.location.href = '/'
        }
    }
}).mount('#app')