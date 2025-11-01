export const Modal = {
    template: `
        <!-- The Modal -->
        <div id="settingsModal" class="settings-modal">
            <!-- Modal content -->
            <div class="settings-modal-content">
                <div class="settings-close-container">
                    <div>
                        <p class="roboto-regular">Mark all as read &nbsp;<span><i class="fa-solid fa-check"></i></span></p>
                    </div>
                    <span class="close">&times;</span>
                </div>
                <div class="settingsmodal-container">
                    <div class="notice-list">
                        <span class="color-danger"><i class="fa-solid fa-circle-exclamation"></i></span><p class="roboto-regular"> Food Budget Rs.10,000 exceeded !! <br><span class="roboto-regular notice-date">2025/01/01 12:12 PM</span></p>
                    </div>
                    <div class="notice-list">
                        <span class="color-danger"><i class="fa-solid fa-circle-exclamation"></i></span><p class="roboto-regular"> Food Budget Rs.10,000 reached !! <br><span class="roboto-regular notice-date">2025/01/01 12:12 PM</span></p>
                    </div>
                    <div class="notice-list">
                        <span class="color-warning"><i class="fa-solid fa-triangle-exclamation"></i></span><p class="roboto-regular"> Food Budget Rs.10,000 almost reached. Current expense, Rs.8,000 !! <br><span class="roboto-regular notice-date">2025/01/01 12:12 PM</span></p>
                    </div>
                    <div class="notice-list">
                        <span class="color-info"><i class="fa-solid fa-circle-info"></i></span><p class="roboto-regular"> Food expense report generated !! <br><span class="roboto-regular notice-date">2025/01/01 12:12 PM</span></p>
                    </div>
                    <div class="notice-list">
                        <span class="color-info"><i class="fa-solid fa-circle-info"></i></span><p class="roboto-regular">Expense transaction inserted !! <br><span class="roboto-regular notice-date">2025/01/01 12:12 PM</span></p>
                    </div>
                    <div class="notice-list">
                        <span class="color-info"><i class="fa-solid fa-circle-info"></i></span><p class="roboto-regular">Total Budget updated !! <br><span class="roboto-regular notice-date">2025/01/01 12:12 PM</span></p>
                    </div>
                    <div class="notice-list">
                        <span class="color-danger"><i class="fa-solid fa-circle-exclamation"></i></span><p class="roboto-regular"> Entertainment Budget Rs.2,000 depleted !! <br><span class="roboto-regular notice-date">2025/01/01 12:12 PM</span></p>
                    </div>
                    <div class="notice-list">
                        <span class="color-warning"><i class="fa-solid fa-triangle-exclamation"></i></span><p class="roboto-regular"> Clothes Budget Rs.5,000 almost reached. Current expense, Rs.4,000 !! <br><span class="roboto-regular notice-date">2025/01/01 12:12 PM</span></p>
                    </div>
                    <div class="notice-list">
                        <span class="color-info"><i class="fa-solid fa-circle-info"></i></span><p class="roboto-regular">New Category created !! <br><span class="roboto-regular notice-date">2025/01/01 12:12 PM</span></p>
                    </div>
                </div>
            </div>
        </div>
    `,
    data(){
        return{

        }
    },
    methods(){

    }
}