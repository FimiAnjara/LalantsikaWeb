import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import MainLayout from './layouts/MainLayout'
import Home from './pages/home/Home'
import Signalement from './pages/signalement/Signalement'
import Recap from './pages/recap/Recap'

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/signalement" element={<Signalement />} />
          <Route path="/recap" element={<Recap />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
