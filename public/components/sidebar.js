export const Sidebar =  {
  template:`
        <div class="sidebar-menu">
            <div class="logo-container">
                <img src="assets/images/logo.png" alt="Logo">
            </div>
            <ul>
                <a href="/dashboard"><li :class="['montserrat-alternates-regular', { active: currentUrl === 'dashboard' }]"><span class="sidebar-icons"><i
                                class="fa-solid fa-tachograph-digital"></i></span>Dashboard</li></a>
                    <a href="/transactions"><li :class="['montserrat-alternates-regular', {
                     active: currentUrl === 'transactions'
                    }]"><span class="sidebar-icons"><i
                                class="fa-solid fa-arrow-right-arrow-left"></i></span>Transactions</li></a>
                <a href="/add-expense"><li :class="['montserrat-alternates-regular', {
                  active: currentUrl === 'add-expense'
                }]"><span class="sidebar-icons"><i
                            class="fas fa-money-bill-wave"></i>
                    </span>Add Expense</li></a>
                <a href="/budget"><li :class="['montserrat-alternates-regular', {
                  active: currentUrl === 'budget'
                }]"><span class="sidebar-icons"><i class="fas fa-wallet"></i>
                    </span>Budget</li></a>
                <a href="/categories"><li :class="['montserrat-alternates-regular', {
                  active: currentUrl === 'categories'
                }]"><span class="sidebar-icons"><i class="fas fa-tags"></i>
                    </span>Categories</li></a>
                <a href="/reports"><li :class="['montserrat-alternates-regular', {
                  active: currentUrl === 'reports'
                }]"><span class="sidebar-icons"><i
                            class="fas fa-file-alt"></i>
                    </span>Reports</li></a>
            </ul>
        </div>
    `,
    data(){
      return{
        currentUrl: location.pathname.slice(1)
      }
    },
    methods:{

    }
}