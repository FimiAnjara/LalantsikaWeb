import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import MainLayout from './layouts/visiteur/MainLayout'
import Home from './pages/visiteur/home/Home'
import Signalement from './pages/visiteur/signalement/Signalement'
import Recap from './pages/visiteur/recap/Recap'
import ManagerLayout from './layouts/manager/MainManager'
import ManagerHome from './pages/manager/home/Home'
import AjoutUtilisateur from './pages/manager/utilisateurs/ajout/Home'

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/visiteur/home" element={<Home />} />
          <Route path="/visiteur/signalement" element={<Signalement />} />
          <Route path="/visiteur/recap" element={<Recap />} />
        </Route>

        {/* Manager routes */}
        <Route element={<ManagerLayout />}>
          <Route path="/manager/home" element={<ManagerHome />} />
          <Route path="/manager/utilisateurs/ajout" element={<AjoutUtilisateur />} />
        </Route>

      </Routes>
    </Router>
  )
}

export default App
