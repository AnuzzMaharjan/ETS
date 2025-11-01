export const Navbar = {
    template: `
                <nav>
                    <form action="">
                        <div class="search-container">

                        </div>
                    </form>
                    <div class="nav-right">
                        <div class="notice" type="button" id="notifications" @click="isNotificationShown = true">
                            <span class="notice-num">{{notificationCount}}</span>
                            <span>
                                <i class="fa-solid fa-bell"></i>
                            </span>
                        </div>
                        <div class="user-info-container">
                            <div class="profile-img">
                                <div id="profileHolder">
                                    <p class="roboto-medium">{{frontTwo}}</p>
                                </div>
                            </div>
                            <div>
                                <h4 class="roboto-medium">{{user.username || 'Guest'}}</h4>
                                <span class="roboto-regular user-role">User</span>
                            </div>
                        </div>
                        <div class="dropdown" @click="isMenuShown = !isMenuShown" style="cursor:pointer;padding:0 5px;">
                            <span>
                                <i class="fa-solid fa-ellipsis-vertical"></i>
                            </span>
                            <div class="dropdown-content" :style="{display: isMenuShown ? 'block' : 'none'}">
                                <button class="settings-btn" @click="isSettingsShown = true" style="margin-bottom: 10px;"><i class="fa-solid fa-gears"></i>
                                    &nbsp;Settings</button>
                                <button class="logout-btn" @click="logout"><i class="fa-solid fa-right-from-bracket"></i>
                                    &nbsp;Logout</button>
                            </div>
                        </div>
                    </div>
                </nav>

                <!-- The Modal -->
                <div id="notificationModal" class="modal" :style="{display:isNotificationShown ? 'block':'none'}">
                    <!-- Modal content -->
                    <div class="modal-content">
                        <div class="close-container">
                            <div>
                                <p class="roboto-regular" @click="markAllAsRead" style="cursor:pointer">Mark all as read &nbsp;<span><i
                                            class="fa-solid fa-check"></i></span></p>
                            </div>
                            <span class="close" @click="isNotificationShown = false">&times;</span>
                        </div>
                        <div class="modal-container">
                            <div v-for="notification in notifications" class="notice-list">
                                <span v-if="notification.type === 'error'" class="color-danger"><i
                                        class="fa-solid fa-circle-exclamation"></i></span>
                                <span v-else-if="notification.type === 'warning'" class="color-warning"><i
                                        class="fa-solid fa-triangle-exclamation"></i></span>
                                <span v-else-if="notification.type === 'info'" class="color-info"><i
                                        class="fa-solid fa-circle-info"></i></span>
                                <p class="roboto-regular">{{notification.message}}<br><span class="roboto-regular notice-date">{{new
                                        Date(notification.createdAt).toLocaleString('en-Uk',{year: 'numeric', month: 'long', day:
                                        'numeric', hour: 'numeric', minute: 'numeric', hour12: true})}}</span></p>
                            </div>
                            <div class="notification-load-more">
                                <button class="primary-button" @click="getNotifications(parseInt(limit)+10)">Load more <i
                                        class="fa-solid fa-rotate-right"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="settingsModal" class="settings-modal" :style="{display: isSettingsShown ? 'block':'none'}">
                    <!-- Modal content -->
                    <div class="settings-modal-content">
                        <div class="settings-close-container">
                            <div>
                                <h3 class="montserrat-alternates-semibold">Settings &nbsp;<span><i class="fa-solid fa-gears"></i></span></h3>
                            </div>
                            <span class="close" @click="isSettingsShown = false">&times;</span>
                        </div>
                        <div class="settings-modal-container">
                            <form @submit.prevent="changePw">
                                <div class="settings-form-input">
                                    <label for="">
                                        <input type="text" v-model="user.username" placeholder="Username" readonly>
                                        <span><i class="fa-solid fa-user"></i></span>
                                    </label>
                                </div>
                                <div class="settings-form-input">
                                    <label for="">
                                        <input type="text" v-model="user.email" placeholder="Email" readonly>
                                        <span><i class="fa-solid fa-envelope"></i></span>
                                    </label>
                                </div>
                                <div class="settings-form-input">
                                    <label for="">
                                        <input type="password" v-model="user.password" placeholder="New Password">
                                        <span><i class="fa-solid fa-key"></i></span>
                                    </label>
                                </div>
                                <div class="settings-form-input">
                                    <label for="">
                                        <input type="password" v-model="user.confirmPassword" placeholder="Confirm Password">
                                        <span><i class="fa-solid fa-key"></i></span>
                                    </label>
                                </div>
                                <div class="settings-form-input">
                                    <label for=""></label>
                                    <input type="number" v-model="user.otp" placeholder="OTP">
                                </div>
                                <div class="settings-button-group">
                                    <button class="req-otp-btn" :disabled="isReqOtpDisabled" @click="requestOtp">{{otpBtnText}} {{timer.time !== 60 || timer.time !== 0 ? ' in ' + timer.time + ' s' : ''}}</button><br>
                                    <button type="submit" class="primary-button">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `,
    data() {
        return {
            isMenuShown: false,
            isSettingsShown: false,
            isReqOtpDisabled: false,
            timer: {
                time: 60,
                interval: null,
                timeout: null
            },
            user:{
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
                otp: ''
            },
            baseUrl: window.location.origin,
            frontTwo: '',
            notifications: [],
            notificationCount: 0,
            isNotificationShown: false,
            otpBtnText: 'Request OTP',
            page: 1,
            limit: 10
        }
    },
    methods: {
        async logout() {
            try {
                const res = await fetch(`${this.baseUrl}/api/v1/auth/logout`, {
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
                        window.location.href = this.baseUrl;
                    }
                })
            } catch (err) {
                console.error('Error:', err);
            }
        },
        decrypt(data) {
            const enData = data.split('%').map(d => parseInt(d, 16));
            const buff = new Uint8Array(enData);
            const decoder = new TextDecoder();
            const decrypted = decoder.decode(buff);
            return decrypted;
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
        createProfilePic() {
            if (this.user.username) {
                const splittedUname = this.user.username.split(" ") || this.user.username.split("_");
                this.frontTwo = ((splittedUname?.[0]?.[0] || '') + (splittedUname?.[1]?.[0] || '')).toUpperCase();
                document.querySelector('.user-info-container .profile-img').style.outlineColor = this.getRandomHexCode("light");
                document.querySelector('.user-info-container .profile-img').style.backgroundColor = this.getRandomHexCode("dark");
                document.getElementById('profileHolder').style.color = this.getRandomHexCode("light");
            }
        },
        async getNotificationCount() {
            try {
                const res = await fetch(`${this.baseUrl}/api/v1/notifications/count`, {
                    method: 'GET',
                    credentials: 'same-origin'
                });
                const data = await res.json();
                this.notificationCount = data.data.count;
            } catch (err) {
                console.log("Error:", err);
            }
        },
        async getNotifications(limit = 10) {
            try {
                const res = await fetch(`${this.baseUrl}/api/v1/notifications?page=${this.page}&limit=${limit}`, {
                    method: 'GET',
                    credentials: 'same-origin'
                });
                const data = await res.json();
                this.notifications = data.data;
            } catch (err) {
                console.log("Error:", err);
            }
        },
        async markAllAsRead() {
            try {
                const res = await fetch(`${this.baseUrl}/api/v1/notifications/markAsRead`, {
                    method: 'GET',
                    credentials: 'same-origin'
                });
                this.getNotificationCount();
            } catch (err) {
                console.log("Error:", err);
            }
        },
        requestOtp() {  
            this.isReqOtpDisabled = true;
            this.otpBtnText = 'Resend OTP';
            this.timer.interval = setInterval(() => {
                this.timer.time -= 1;
            }, 1000);
            this.timer.timeout = setTimeout(() => {
                this.isReqOtpDisabled = false;
                this.timer.time = 0;
                clearInterval(this.timer.interval);
                clearTimeout(this.timer.timeout);
            }, 60000);

            fetch(`${this.baseUrl}/api/v1/auth/generate-send-otp`, {
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
        async changePw(){
            if (this.user.password !== this.user.confirmPassword) {
                return Swal.fire({
                    title: "Passwords don't match!",
                    icon: "error"
                })
            }
            if (!this.user.password || !this.user.confirmPassword || !this.user.otp) {
                return Swal.fire({
                    title: "Please fillup all the fields!",
                    icon: "warning"
                })
            }
            const res = await fetch(`${this.baseUrl}/api/v1/reset-password`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    email: this.user.email,
                    otp: this.user.otp,
                    password: this.user.password,
                    confirmpw: this.user.confirmPassword
                })
            })
            const data = await res.json();

            if(data.success){
                this.password = '';
                this.confirmPassword = '';
                this.otp = '';
                this.isSettingsShown = false;
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
        this.user.username = this.decrypt(localStorage.getItem('ud'));
        this.user.email = this.decrypt(localStorage.getItem('ee'));
        this.createProfilePic();
        this.getNotificationCount();
        this.getNotifications();
    }
}