const { createApp } = Vue;

import { Modal } from "../../components/modal.js";
import { Navbar } from "../../components/navbar.js";
import { Sidebar } from "../../components/sidebar.js";

const baseUrl = window.location.origin;
let editButton;
let saveButton;
let budgetInput;

createApp({
  components: { Navbar, Sidebar, Modal },
  data() {
    return {
      user: {
        isLoggedIn: false
      },
      primaryBudget: 0,
      allocatedBudget: 0,
      category: {
        data: [],
        count: 0
      },
      chartInstance: null,
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
    handleEditButton() {
      console.log("edit");
      editButton.classList.add('hide');
      saveButton.classList.remove('hide');
      budgetInput.classList.add('editable');
      budgetInput.removeAttribute("readonly");
      budgetInput.focus();
    },
    handleSaveButton() {
      Swal.fire({
        title: `Do you want to save this?`,
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "Confirm",
        denyButtonText: `Reject`,
      }).then(async (result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          this.updatePrimeBudget();
        }
      });
    },
    async updatePrimeBudget() {
      try {
        const res = await fetch(`${baseUrl}/api/v1/budget`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'same-origin',
          body: JSON.stringify({ budget: parseInt(this.primaryBudget, 10) }),
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire(data.message, "", "success");
          editButton.classList.remove('hide');
          saveButton.classList.add('hide');
          budgetInput.classList.remove('editable');
          budgetInput.setAttribute("readonly", "");
        } else {
          Swal.fire(data.message, "", "error");
        }
      } catch (err) {
        console.error('Error:', err);
      }
    },
    totalBudgetExpenseGraph() {
      const ctx = document.getElementById("budgetExpense")?.getContext("2d");

      const data = this.category.data.map((item) => item.expense);
      const totalData = this.category.data.map((item) => item.budget);
      const allLabels = this.category.data.map((item) => item.category);
      const maxValue = Math.max(...data);
      const maxTotal = Math.max(...totalData);
      const yMax = Math.ceil((maxValue > maxTotal ? maxValue : maxTotal) * 1.1);

      if (!ctx) {
        console.error("canvas not found");
        return;
      }
      if (this.chartInstance) {
        this.chartInstance.destroy();
      }
      this.chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels: allLabels,
          datasets: [
            {
              label: "Expenditure",
              data: data,
              borderWidth: 1,
              backgroundColor: "#5858ff",
            },
            {
              label: "Budget",
              data: totalData,
              borderWidth: 1,
              backgroundColor: "#babaff",
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              max: yMax,
              stacked: false,
            },
          },
          responsive: true,
          maintainAspectRatio: false
        },
      });
    },
    handleCategoryEdit(id, elem) {
      const budget = document.getElementById('budget' + id);

      budget.removeAttribute('readonly');
      budget.setAttribute('title', 'editable');
      budget.classList.add('editable')
      budget.focus();

      console.log(elem);
      elem.classList.add('hide');
      document.getElementById('categorySave' + id).classList.remove('hide');
    },
    handleCategorySave(category, id, elem) {
      const budget = document.getElementById('budget' + id);

      this.handleCategoryBudgetSave(category, budget, elem, id);
    },
    handleCategoryDelete(category) {
      Swal.fire({
        title: `Do you want to Delete this?`,
        showDenyButton: true,
        showCancelButton: false,
        confirmButtonText: "Confirm",
        denyButtonText: `Reject`,
      }).then(async (result) => {
        if (result.isConfirmed) {
          const data = await this.updateCategoryBudget(category, 0);
          if (data.success) {
            Swal.fire({
              title: 'Deleted successfully!',
              icon: 'success'
            });
          } else {
            Swal.fire('Failed to delete!', "", "error");
          }

          this.getAllBudgetCategories();
        }
      });
    },
    handleCategoryBudgetSave(category, budget, elem, id) {
      Swal.fire({
        title: `Do you want to Save this?`,
        showDenyButton: true,
        showCancelButton: false,
        confirmButtonText: "Confirm",
        denyButtonText: `Reject`,
      }).then(async (result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {

          const data = await this.updateCategoryBudget(category, budget.value);

          if (data.success) this.allocatedBudget = data.totalAllocatedBudget || 0;

          data.success ? Swal.fire({ title: `Saved successfully!`, icon: "success" }) : Swal.fire("Failed to save!", "", "error");

          await this.getAllBudgetCategories();
          this.totalBudgetExpenseGraph();
        }
        budget.setAttribute("readonly", "");
        budget.removeAttribute("title");
        budget.classList.remove('editable')

        elem.classList.add('hide');
        document.getElementById("categoryEdit" + id).classList.remove('hide');
      });
    },
    async updateCategoryBudget(category, budget) {
      try {
        const res = await fetch(`${baseUrl}/api/v1/budget/${category}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'same-origin',
          body: JSON.stringify({ budget: parseInt(budget, 10) }),
        });
        const data = await res.json();
        return data;
      } catch (err) {
        console.error('Error:', err);
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
    async getPrimaryBudget() {
      try {
        const res = await fetch(`${baseUrl}/api/v1/prime-budget`, {
          credentials: 'same-origin',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (res.status === 200) {
          const data = await res.json();
          if (data.success) {
            this.primaryBudget = data.data.budget;
          }
        } else {
          this.primaryBudget = 0;
        }
      } catch (err) {
        console.error('Error getting:', err);
      }
    },
    async getAllBudgetCategories() {
      try {
        const query = new URLSearchParams(window.location.search);
        const page = query.get('page') || 1;
        const limit = query.get('limit') || 10;
        const res = await fetch(`${baseUrl}/api/v1/budget-categories?page=${page}&limit=${limit}`, {
          method: 'GET',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json();

        if (data.success) {
          this.category.data = data.data;
          this.allocatedBudget = data.totalAllocatedBudget || 0;
        }
      } catch (err) {
        console.error('Error getting categories:', err);
      }
    },
    async getPaginationCount() {
      try {
        const query = new URLSearchParams(window.location.search);
        this.page = query.get('page') || 1;
        this.limit = query.get('limit') || 10;

        const res = await fetch(`${baseUrl}/api/v1/category/count?for=budget`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'same-origin'
        })
        const data = await res.json();

        this.category.count = Math.ceil(data.count / this.limit);
      } catch (err) {
        console.error(err);
      }
    },
    changePage(page) {
      window.location.href = baseUrl + '/budget?page=' + page;
    }
  },
  async mounted() {
    await this.isLoggedIn();
    if (this.user.isLoggedIn) {
      await this.getPaginationCount();
      await this.getPrimaryBudget();
      await this.getAllBudgetCategories();

      editButton = document.getElementById("editBtn");
      saveButton = document.getElementById("saveBtn");
      budgetInput = document.getElementById("budgetAmt");

      this.totalBudgetExpenseGraph();
      document.querySelectorAll('.drop').forEach(x => x.style.backgroundColor = this.getRandomHexCode());
    } else {
      window.location.href = '/'
    }
  }
}).mount('#app')