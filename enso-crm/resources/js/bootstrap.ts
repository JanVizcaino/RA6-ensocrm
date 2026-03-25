import axios from 'axios';
window.axios = axios;

declare global {
    interface Window {
        axios: typeof axios;
    }
}

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
