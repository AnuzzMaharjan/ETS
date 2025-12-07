const { createApp } = Vue;
const baseUrl = window.location.origin;

createApp({
    data() {
        return {
            email: '',
            password: ''
        };
    },
    methods: {
        login() {
            fetch(`${baseUrl}/api/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ email: this.email, password: this.password })
            }).then(res => res.json())
                .then((data) => {
                    const Toast = Swal.mixin({
                        toast: true,
                        position: "top-end",
                        showConfirmButton: false,
                        timer: 2000,
                        timerProgressBar: true,
                        didOpen: (toast) => {
                            toast.onmouseenter = Swal.stopTimer;
                            toast.onmouseleave = Swal.resumeTimer;
                        },
                        didClose: () => {
                            if(data.success){
                                window.location.href = `${baseUrl}/admin/dashboard`;
                            }
                        }
                    })
                    Toast.fire({
                        icon: data.success ? 'success' : 'error',
                        title: data.message
                    });

                })
        }
    },
    mounted() {
        fetch(`${baseUrl}/api/v1/auth/verify-logged-in?r=admin`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        }).then((res) => res.json())
            .then((data) => {
                if (data.isLoggedIn) {
                    console.log(`${baseUrl}/admin/dashboard`)
                    window.location.href = `${baseUrl}/admin/dashboard`;
                }
            }).catch(error => console.log('Error:', error));
    }
}).mount("#app");