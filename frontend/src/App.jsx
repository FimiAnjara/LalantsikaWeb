import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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
import Parametres from './pages/manager/parametres/Home'
import SignalementListe from './pages/manager/signalements/liste/Home'
import SignalementCarte from './pages/manager/signalements/carte/Home'
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
          <Route path="/manager/home" element={<ManagerHome />} />
          <Route path="/manager/utilisateurs/ajout" element={<AjoutUtilisateur />} />
          <Route path="/manager/utilisateurs/liste" element={<ListeUtilisateur />} />
          <Route path="/manager/utilisateurs/modifier/:id" element={<ModifierUtilisateur />} />
          <Route path="/manager/parametres" element={<Parametres />} />
          <Route path="/manager/signalements/liste" element={<SignalementListe />} />
          <Route path="/manager/signalements/carte" element={<SignalementCarte />} />
        </Route>

      </Routes>
    </Router>
  )
}

export default App
