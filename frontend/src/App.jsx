import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute';
import './App.css'
import MainLayout from './layouts/visiteur/MainLayout'
import Home from './pages/visiteur/home/Home'
import Signalement from './pages/visiteur/signalement/Signalement'
import Recap from './pages/visiteur/recap/Recap'
import ManagerLayout from './layouts/manager/MainManager'
import ManagerHome from './pages/manager/home/Home'
import AjoutUtilisateur from './pages/manager/utilisateurs/ajout/Home'
import ListeUtilisateur from './pages/manager/utilisateurs/liste/Home'
import ModifierUtilisateur from './pages/manager/utilisateurs/modifier/Home'
import FicheUtilisateur from './pages/manager/utilisateurs/fiche/Home'
import Parametres from './pages/manager/parametres/Parametres'
import Synchro from './pages/manager/synchro/Synchro'
import SignalementListe from './pages/manager/signalements/liste/Liste'
import SignalementCarte from './pages/manager/signalements/carte/Home'
import SignalementFiche from './pages/manager/signalements/fiche/Home'
import SignalementModifier from './pages/manager/signalements/modifier/Home'
import ManagerLogin from './pages/manager/login/Login'


function App() {
  return (
    <Router>
      <Routes>
        {/* Manager Login - No Layout */}
        <Route path="/manager/login" element={<ManagerLogin />} />

        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/visiteur/home" element={<Home />} />
          <Route path="/visiteur/signalement" element={<Signalement />} />
          <Route path="/visiteur/recap" element={<Recap />} />
        </Route>

        {/* Manager routes */}
          <Route element={<ManagerLayout />}>
            <Route path="/manager/home" element={
              <ProtectedRoute>
                <ManagerHome />
              </ProtectedRoute>
            } />
            <Route path="/manager/utilisateurs/ajout" element={
              <ProtectedRoute>
                <AjoutUtilisateur />
              </ProtectedRoute>
            } />
            <Route path="/manager/utilisateurs/liste" element={
              <ProtectedRoute>
                <ListeUtilisateur />
              </ProtectedRoute>
            } />
            <Route path="/manager/utilisateurs/modifier/:id" element={
              <ProtectedRoute>
                <ModifierUtilisateur />
              </ProtectedRoute>
            } />
            <Route path="/manager/utilisateurs/fiche/:id" element={
              <ProtectedRoute>
                <FicheUtilisateur />
              </ProtectedRoute>
            } />
            <Route path="/manager/parametres" element={
              <ProtectedRoute>
                <Parametres />
              </ProtectedRoute>
            } />
            <Route path="/manager/synchro" element={
              <ProtectedRoute>
                <Synchro />
              </ProtectedRoute>
            } />
            <Route path="/manager/signalements/liste" element={
              <ProtectedRoute>
                <SignalementListe />
              </ProtectedRoute>
            } />
            <Route path="/manager/signalements/carte" element={
              <ProtectedRoute>
                <SignalementCarte />
              </ProtectedRoute>
            } />
            <Route path="/manager/signalements/fiche/:id" element={
              <ProtectedRoute>
                <SignalementFiche />
              </ProtectedRoute>
            } />
            <Route path="/manager/signalements/modifier/:id" element={
              <ProtectedRoute>
                <SignalementModifier />
              </ProtectedRoute>
            } />
          </Route>

      </Routes>
    </Router>
  )
}

export default App
