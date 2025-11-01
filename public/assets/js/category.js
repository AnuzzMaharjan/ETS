const { createApp } = Vue;

import { Modal } from "../../components/modal.js";
import {Navbar} from "../../components/navbar.js";
import { Sidebar } from "../../components/sidebar.js";

const baseUrl = window.location.origin;

createApp({
    components:{Navbar,Sidebar,Modal},
    data() {
        return {
            user: {
                isLoggedIn: false
            },
            category: {
                name: '',
                isActive: true,
                data: [],
                count: 0
            },
            page:1,
            limit:10
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
                        didClose : ()=>{
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
        async createCategory() {
            try {
                const res = await fetch(`${baseUrl}/api/v1/category`, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        category: this.category.name,
                        active: this.category.isActive
                    })
                });
                const data = await res.json();
                if (data.success) {
                    this.category.name = '';
                }
                Swal.fire({
                    title: data.message,
                    icon: data.success ? 'success' : 'error',
                    didClose: () => {
                        location.reload();
                    }
                })
            } catch (err) {
                console.error('Error creating category:', err);
            }
        },
        async getAllCategories() {
            try {
                const query = new URLSearchParams(window.location.search);
                const page = query.get('page') || 1;
                const limit = query.get('limit') || 10;
                const res = await fetch(`${baseUrl}/api/v1/categories?page=${page}&limit=${limit}`, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const data = await res.json();
                
                this.category.data = data.data.result;
            } catch (err) {
                console.error('Error getting categories:', err);
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
        handleEditButton(index) {
            const category = document.getElementById('category' + index);
            const editButton = document.getElementById('categoryEdit' + index);
            const saveButton = document.getElementById('categorySave' + index);
            category.classList.add('editable');
            editButton.classList.add('hide');
            saveButton.classList.remove('hide');
            category.removeAttribute("readonly");
            category.focus();
        },
        async handleSaveButton(index, catId) {
            await Swal.fire({
                title: `Do you want to Save this?`,
                showDenyButton: true,
                showCancelButton: false,
                confirmButtonText: "Confirm",
                denyButtonText: `Reject`,
            }).then(async (result) => {
                /* Read more about isConfirmed, isDenied below */
                if (result.isConfirmed) {
                    const category = document.getElementById('category' + index);
                    const editButton = document.getElementById('categoryEdit' + index);
                    const saveButton = document.getElementById('categorySave' + index);
                    const activeStatus = document.getElementById('aStatus' + index);

                    const editRes = await this.editCategory(category.value, activeStatus.checked, catId);

                    Swal.fire({
                        title: editRes.message,
                        icon: editRes.success ? "success" : "error",
                        didClose: () => {
                            location.reload();
                        }
                    });

                    category.classList.remove('editable');
                    editButton.classList.remove('hide');
                    saveButton.classList.add('hide');
                    category.setAttribute("readonly", "");
                } else if (result.isDenied) {
                    const category = document.getElementById('category' + index);
                    const editButton = document.getElementById('categoryEdit' + index);
                    const saveButton = document.getElementById('categorySave' + index);
                    category.classList.remove('editable');
                    editButton.classList.remove('hide');
                    saveButton.classList.add('hide');
                    category.setAttribute("readonly", "");
                }
            });
        },
        async editCategory(cat, status, catId) {
            try {
                const res = await fetch(`${baseUrl}/api/v1/category/${catId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        category: cat,
                        active: status
                    })
                });
                const data = await res.json();
                return data;
            } catch (err) {
                console.log(err);
            }
        },
        async toggleActive(elem,catId) {
            try{
                const res = await fetch(`${baseUrl}/api/v1/category/${catId}/toggle-status`,{
                    method:'PATCH',
                    headers:{
                        'Content-Type':'application/json',
                    },
                    credentials:'same-origin',
                    body:JSON.stringify({
                        active:elem.checked
                    })
                })
                const data= await res.json();
                if(!data.success){
                    Swal.fire({
                        title: data.message,
                        icon: "error"
                    })
                }
            }catch(err){
                console.error(err);
            }
        },
        async handleCategoryDelete(catId){
            try{
                const res = await fetch(`${baseUrl}/api/v1/category/${catId}`,{
                    method:'DELETE',
                    credentials:'same-origin',
                    headers:{
                        'Content-type':'application/json'
                    }
                });
                const data = await res.json();
                Swal.fire({
                    title:data.message,
                    icon:data.success?'success':'error',
                    didClose:()=>{
                        location.reload();
                    }
                });
            }catch(err){
                console.error(err);
            }
        },
        async getPaginationCount(){
            try{
                const query = new URLSearchParams(window.location.search);
                this.page = query.get('page') || 1;
                this.limit = query.get('limit') || 10;

                const res = await fetch(`${baseUrl}/api/v1/category/count`,{
                    method:'GET',
                    headers:{
                        'Content-Type':'application/json'
                    },
                    credentials:'same-origin'
                })
                const data = await res.json();

                this.category.count=Math.ceil(data.count/this.limit);
            }catch(err){
                console.error(err);
            }
        },
        changePage(page){
            window.location.href = baseUrl+'/categories?page='+page;
        }
    },
    async mounted() {
        await this.isLoggedIn();
        if (this.user.isLoggedIn) {
            await this.getUserData();
            await this.getAllCategories();

            if (this.category.data) {
                this.category.data = this.category.data.map(item => ({ ...item, color: this.getRandomHexCode() }));
            }
            await this.getPaginationCount();
        }else{
            window.location.href = '/'
        }
    }
}).mount('#app')