import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

// Import transition CSS
import '@lemoncloud/page-transition-core/styles.css';

import App from './App.vue';
import HomePage from './views/HomePage.vue';
import DetailPage from './views/DetailPage.vue';
import './styles.css';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: HomePage },
        { path: '/detail/:id', component: DetailPage },
    ],
});

createApp(App).use(router).mount('#app');
