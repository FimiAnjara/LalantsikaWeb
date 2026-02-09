import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomePage from '../views/HomePage.vue';
import LoginPage from '../views/auth/LoginPage.vue';
import ProfilePage from '../views/settings/ProfilePage.vue';
import ModePage from '../views/settings/ModePage.vue';
import MapPage from '../views/maps/MapPage.vue';
import ReportFormPage from '../views/maps/ReportFormPage.vue';
import SplashPage from '../views/SplashPage.vue';
import { sessionService } from '@/services/auth';
import { auth } from '@/services/firebase/config';
import WelcomePage from '../views/WelcomePage.vue';

// Routes publiques (pas besoin d'authentification)
const publicRoutes = ['Login', 'SplashPage', 'Welcome'];

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/splash'
  },
  {
    path: '/splash',
    name: 'SplashPage',
    component: SplashPage
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: WelcomePage
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfilePage,
    meta: { requiresAuth: true }
  },
  {
    path: '/mode',
    name: 'Modes',
    component: ModePage,
    meta: { requiresAuth: true }
  },
  {
    path: '/map',
    name: 'Map',
    component: MapPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/signalement/:id/edit',
    name: 'EditSignalement',
    component: ReportFormPage,
    props: route => ({ editMode: true, signalementId: route.params.id }),
    meta: { requiresAuth: true }
  },
  {
    path: '/report-form',
    name: 'ReportForm',
    component: ReportFormPage,
    meta: { requiresAuth: true }
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

/**
 * Navigation Guard - Vérifie l'authentification et la validité de la session
 */
router.beforeEach(async (to, from, next) => {
  const routeName = to.name as string;
  const requiresAuth = to.meta.requiresAuth === true;

  // Routes publiques - pas de vérification
  if (!requiresAuth || publicRoutes.includes(routeName)) {
    return next();
  }

  // Vérifier si l'utilisateur est connecté à Firebase
  const firebaseUser = auth.currentUser;
  
  if (!firebaseUser) {
    console.log('🔒 Utilisateur non connecté, redirection vers Login');
    return next({ name: 'Login' });
  }

  // Vérifier si la session est encore valide (durée personnalisée)
  const isSessionValid = await sessionService.isSessionValid();
  
  if (!isSessionValid) {
    console.log('⏰ Session expirée, redirection vers Login');
    return next({ name: 'Login' });
  }

  // Prolonger la session si "Remember Me" est activé
  await sessionService.extendSession();

  next();
});

export default router
