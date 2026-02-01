import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomePage from '../views/HomePage.vue';
import LoginPage from '../views/auth/LoginPage.vue';
import ProfilePage from '../views/settings/ProfilePage.vue';
import ModePage from '../views/settings/ModePage.vue';
import MapPage from '../views/maps/MapPage.vue';
import ReportDetailsPage from '../views/maps/ReportDetailsPage.vue';
import ReportFormPage from '../views/maps/ReportFormPage.vue';
import SplashPage from '../views/SplashPage.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/splash'
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfilePage
  },
  {
    path: '/mode',
    name: 'Modes',
    component: ModePage
  },
  {
    path: '/map',
    name: 'Map',
    component: MapPage
  },
  {
    path: '/report/:id',
    name: 'ReportDetails',
    component: ReportDetailsPage
  },
  {
    path: '/report-form',
    name: 'ReportForm',
    component: ReportFormPage
  },
  {
    path: '/splash',
    name: 'SplashPage',
    component: SplashPage
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
