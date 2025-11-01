const { createApp } = Vue;
const baseUrl = window.location.origin;

createApp({
    data() {
        return {
            user: {
                email: '',
                username: '',
                password: '',
                confirmpw: '',
                otp: ''
            },
            isActive: false
        }
    },
    methods: {
        closeRPModal() {
            var modal = document.getElementById("fpModal");
            modal.style.display = 'none';
        },
        showLogin() {
            this.isActive = false;
        },
        showRegister() {
            this.isActive = true;
        },
        login(e) {
            e.preventDefault();
            console.log(this.user.email);
            fetch(`${baseUrl}/api/v1/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    email: this.user.email,
                    password: this.user.password
                })
            }).then(res => res.json())
                .then(data => {
                    if (data.success) {
                        const encodedUname = this.encrypt(data.user.username);
                        const encodedEmail = this.encrypt(this.user.email);
                        localStorage.setItem('ud', encodedUname);
                        localStorage.setItem('ee', encodedEmail);
                        Swal.fire({
                            title: 'Login successful!',
                            icon: 'success',
                            allowOutsideClick: false,
                            didClose: () => {
                                window.location.href = `${baseUrl}/dashboard`;
                            }
                        })
                    } else {
                        Swal.fire({
                            title: data.message,
                            icon: 'error'
                        })
                    }
                }).catch(error => {
                    console.log('Error:', error);
                })
        },
        encrypt(data) {
            const encoder = new TextEncoder();
            const en = encoder.encode(data);
            const encrypted = Array.from(new Uint8Array(en)).map(b => b.toString(16)).join('%');
            return encrypted;
        },
        signup(e) {
            e.preventDefault();
            if (!this.user.email || !this.user.username || !this.user.password || !this.user.otp) {
                return Swal.fire({
                    text: "There is still an empty field",
                    icon: "warning"
                })
            }

            fetch(`${baseUrl}/api/v1/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: this.user.username,
                    email: this.user.email,
                    password: this.user.password,
                    otp: this.user.otp,
                    role:"user"
                })
            }).then(res => res.json())
                .then((data) => {
                    Swal.fire({
                        text: data.message,
                        icon: data.success ? "success" : "warning"
                    })
                    if (data.success) {
                        setTimeout(() => {
                            window.location.reload();
                        }, 2000);
                    }
                })
        },
        requestOtp() {
            if (!this.user.email) return Swal.fire({
                text: "Email is reequired to request otp!",
                icon: "info"
            });

            fetch(`${baseUrl}/api/v1/auth/generate-send-otp?for=signup`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({ email: this.user.email })
            }).then(res => res.json())
                .then((data) => {
                    console.log(data);
                    Swal.fire({
                        text: data.message,
                        icon: data.success ? 'success' : 'error'
                    })
                }).catch(err => console.log(err));
        },
        async forgotPassword() {
            await Swal.fire({
                title: "Enter your registered email",
                input: "email",
                inputAttributes: {
                    autocapitalize: "off"
                },
                showCancelButton: true,
                confirmButtonText: "Send OTP",
                showLoaderOnConfirm: true,
                preConfirm: async (email) => {
                    if (!email) {
                        Swal.showValidationMessage('Please enter your email');
                        return false;
                    }

                    try {
                        var modal = document.getElementById("fpModal");
                        modal.style.display = "block";
                        await this.fpOTP(email);
                    } catch (error) {
                        Swal.showValidationMessage(`Request failed: ${error}`);
                        return false;
                    }
                },
                allowOutsideClick: () => !Swal.isLoading()
            })
        },
        async fpOTP(email) {
            try {
                const res = await fetch(`${baseUrl}/api/v1/auth/forgot-password`, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email
                    })
                });
                const data = await res.json();
                localStorage.setItem('ee', email);
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
                });
                await Toast.fire({
                    icon: data.success ? 'success' : 'error',
                    title: data.message
                });
            } catch (err) {
                throw new Error(err.message);
            }
        },
        async resetpw() {
            if (this.user.password !== this.user.confirmpw) {
                return Swal.fire({
                    title: "Passwords don't match!",
                    icon: "error"
                })
            }
            if (!this.user.password || !this.user.confirmpw || !this.user.otp) {
                return Swal.fire({
                    title: "Please fillup all the fields!",
                    icon: "warning"
                })
            }
            const res = await fetch(`${baseUrl}/api/v1/reset-password`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    email: localStorage.getItem('ee'),
                    otp: this.user.otp,
                    password: this.user.password,
                    confirmpw: this.user.confirmpw
                })
            })
            const data = await res.json();
            if (data.success) {
                localStorage.removeItem('ee');
                this.closeRPModal();
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
            await Toast.fire({
                icon: data.success ? 'success' : 'error',
                title: data.message
            });
        }
    },
    mounted() {
        fetch(`${baseUrl}/api/v1/auth/verify-logged-in`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        }).then((res) => res.json())
            .then((data) => {
                if (data.isLoggedIn) {
                    window.location.href = `${baseUrl}/dashboard`;
                }
            }).catch(error => console.log('Error:', error));
    }
}).mount('#app')