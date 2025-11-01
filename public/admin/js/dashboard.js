const { createApp } = Vue;
const baseUrl = window.location.origin;

createApp({
    data() {
        return {
            users: {
                data: []
            },
            user: {
                isLoggedIn: false
            },
            count: 0,
            page: 1,
            limit: 10
        };
    },
    methods: {
        async isLoggedIn(role) {
            try {
                const res = await fetch(`${baseUrl}/api/v1/auth/verify-logged-in?r=${role}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin'
                });
                const data = await res.json();
                if (data.isLoggedIn) {
                    this.user.isLoggedIn = true;
                }
            } catch (err) {
                console.error("Error:", err);
            }
        },
        async getAllUsers() {
            try {
                const res = await fetch(`${baseUrl}/api/v1/users?page=${this.page}&limit=${this.limit}`, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const data = await res.json();
                if (data.success) {
                    this.users.data = data.data;
                    this.count = data.count;
                }
            } catch (err) {
                console.error('Error:', err);
            }
        },
        async logout() {
            try {
                const res = await fetch(`${baseUrl}/api/v1/auth/logout`, {
                    method: 'POST',
                    credentials: 'same-origin'
                })
                const data = await res.json();
                if (data.success) {
                    localStorage.removeItem('ud');
                    localStorage.removeItem('ee');
                }
                Swal.fire({
                    title: data.message,
                    icon: data.success ? 'success' : 'error',
                    allowOutsideClick: false,
                    didClose: () => {
                        window.location.href = baseUrl + '/admin/login';
                    }
                })
            } catch (err) {
                console.error('Error:', err);
            }
        },
        handleUserEdit(id, elem) {
            const user = document.getElementById('username' + id);
            const userEmail = document.getElementById('userEmail' + id);

            user.removeAttribute('readonly');
            user.setAttribute('title', 'editable');
            user.classList.add('editable')
            userEmail.removeAttribute('readonly');
            userEmail.setAttribute('title', 'editable');
            userEmail.classList.add('editable')
            user.focus();

            elem.classList.add('hide');
            document.getElementById('userSave' + id).classList.remove('hide');
        },
        handleUserSave(id, index, elem) {
            const user = document.getElementById('username' + index);
            const userEmail = document.getElementById('userEmail' + index);
            const editBtn = document.getElementById('userEdit' + index);

            this.updateUser(user, userEmail, id, editBtn, elem);
        },
        handleUserDelete(id) {
            Swal.fire({
                title: `Do you want to Delete this?`,
                showDenyButton: true,
                showCancelButton: false,
                confirmButtonText: "Confirm",
                denyButtonText: `Reject`,
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const data = await this.deleteUser(id);
                    if (data.success) {
                        Swal.fire({
                            title: 'Deleted successfully!',
                            icon: 'success'
                        });
                    } else {
                        Swal.fire('Failed to delete!', "", "error");
                    }

                    await this.getAllUsers();
                    this.count = Math.ceil(this.users.data.length / this.limit);
                }
            });
        },
        async updateUser(username, email, id, editBtn, elem) {
            try {
                const res = await fetch(`${baseUrl}/api/v1/user/${id}`, {
                    method: 'PATCH',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username.value,
                        email: email.value
                    })
                });
                const data = await res.json();
                if (data.success) {
                    elem.classList.add('hide');
                    editBtn.classList.remove('hide');
                    username.setAttribute("readonly", "");
                    username.classList.remove('editable');
                    email.setAttribute("readonly", "");
                    email.classList.remove('editable');


                    await this.getAllUsers();
                    this.count = Math.ceil(this.users.data.length / this.limit);
                }
                const Toast = Swal.mixin({
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.onmouseenter = Swal.stopTimer;
                        toast.onmouseleave = Swal.resumeTimer;
                    }
                })
                Toast.fire({
                    icon: data.success ? 'success' : 'error',
                    title: data.message
                });
            } catch (err) {
                console.error('Error:', err);
            }
        },
        async deleteUser(id) {
            try {
                const res = await fetch(`${baseUrl}/api/v1/user/${id}`, {
                    method: 'DELETE',
                    credentials: 'same-origin'
                });
                const data = await res.json();
                return data;
            } catch (err) {
                console.error('Error:', err);
            }
        },
        changePage(page) {
            window.location.href = baseUrl + '/admin/dashboard?page=' + page;
        }
    },
    async mounted() {
        await this.isLoggedIn("admin");
        if (this.user.isLoggedIn) {
            await this.getAllUsers();
            this.count = Math.ceil(this.users.data.length / this.limit);
        } else {
            window.location.href = '/admin/login'
        }
    }
}).mount("#app");