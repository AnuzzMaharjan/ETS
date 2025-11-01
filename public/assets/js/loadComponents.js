import { renderNavbar } from '../../components/navbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { renderModal } from '../../components/modal.js';

document.getElementById('navbar').innerHTML = renderNavbar();
document.getElementById('sidebar').innerHTML = renderSidebar();
document.getElementById('notice').innerHTML = renderModal();