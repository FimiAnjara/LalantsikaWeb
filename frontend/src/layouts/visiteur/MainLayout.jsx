import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
    CButton,
    CCollapse,
    CContainer,
    CForm,
    CFormInput,
    CNavbar,
    CNavbarBrand,
    CNavbarNav,
    CNavbarToggler,
    CNavItem,
    CNavLink,
    CFooter,
    CLink,
} from '@coreui/react'
import { useState, useEffect } from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import CIcon from '@coreui/icons-react'
import {
    cilHome,
    cilMap,
    cilNotes,
    cilCloudDownload,
    cilPhone,
    cilEnvelopeOpen,
    cilLocationPin,
    cilArrowRight
} from '@coreui/icons'
import { cibFacebook, cibTwitter, cibLinkedin } from '@coreui/icons'
import '@coreui/coreui/dist/css/coreui.min.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import './MainLayout.css'

export default function MainLayout() {
    const [visible, setVisible] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const location = useLocation()
    const navigate = useNavigate()

    const isActive = (path) => location.pathname === path || (path === '/visiteur/home' && location.pathname === '/')
    const isHomePage = location.pathname === '/visiteur/home' || location.pathname === '/'
    const isMapPage = location.pathname === '/visiteur/signalement'

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen)
    }

    const closeMobileMenu = () => {
        setMobileMenuOpen(false)
    }

    const handleSearch = (e) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            navigate(`/visiteur/signalement?q=${encodeURIComponent(searchQuery.trim())}`)
            setSearchQuery('')
        }
    }

    return (
        <div className="main-layout-modern">
            {/* Modern Navbar */}
            <nav className={`modern-navbar ${scrolled ? 'scrolled' : ''} ${isHomePage && !scrolled ? 'transparent' : ''}`}>
                <div className="navbar-container">
                    <Link to="/visiteur/home" className="navbar-logo">
                        <img
                            src="/assets/logo/login/logo1.png"
                            alt="LALANTSIKA"
                        />
                        <span>LALANTSIKA</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <ul className="navbar-nav-desktop">
                        <li>
                            <Link 
                                to="/visiteur/home" 
                                className={`nav-link-modern ${isActive('/visiteur/home') ? 'active' : ''}`}
                            >
                                <CIcon icon={cilHome} />
                                Accueil
                            </Link>
                        </li>
                        <li>
                            <Link 
                                to="/visiteur/signalement" 
                                className={`nav-link-modern ${isActive('/visiteur/signalement') ? 'active' : ''}`}
                            >
                                <CIcon icon={cilMap} />
                                Carte
                            </Link>
                        </li>
                        <li>
                            <Link 
                                to="/visiteur/recap" 
                                className={`nav-link-modern ${isActive('/visiteur/recap') ? 'active' : ''}`}
                            >
                                <CIcon icon={cilNotes} />
                                Récapitulatif
                            </Link>
                        </li>
                    </ul>

                    {/* Hamburger Button */}
                    <button 
                        className={`hamburger-btn ${mobileMenuOpen ? 'open' : ''}`}
                        onClick={toggleMobileMenu}
                        aria-label="Menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <div 
                className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}
                onClick={closeMobileMenu}
            ></div>

            {/* Mobile Menu */}
            <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
                <button className="mobile-menu-close" onClick={closeMobileMenu}>
                    ✕
                </button>
                <div className="mobile-menu-logo">
                    <img src="/assets/logo/login/logo1.png" alt="LALANTSIKA" />
                    <span>LALANTSIKA</span>
                </div>
                <ul className="mobile-nav-links">
                    <li>
                        <Link 
                            to="/visiteur/home" 
                            className={`mobile-nav-link ${isActive('/visiteur/home') ? 'active' : ''}`}
                            onClick={closeMobileMenu}
                        >
                            <CIcon icon={cilHome} size="lg" />
                            Accueil
                        </Link>
                    </li>
                    <li>
                        <Link 
                            to="/visiteur/signalement" 
                            className={`mobile-nav-link ${isActive('/visiteur/signalement') ? 'active' : ''}`}
                            onClick={closeMobileMenu}
                        >
                            <CIcon icon={cilMap} size="lg" />
                            Carte
                        </Link>
                    </li>
                    <li>
                        <Link 
                            to="/visiteur/recap" 
                            className={`mobile-nav-link ${isActive('/visiteur/recap') ? 'active' : ''}`}
                            onClick={closeMobileMenu}
                        >
                            <CIcon icon={cilNotes} size="lg" />
                            Récapitulatif
                        </Link>
                    </li>
                </ul>
            </div>

            {/* Main Content */}
            <main className={`main-content-wrapper ${!isHomePage && !isMapPage ? 'with-padding' : ''}`}>
                <Outlet />
            </main>

            {/* Modern Footer - Hide on map page */}
            {!isMapPage && (
            <footer className="modern-footer">
                <div className="footer-container">
                    <div className="footer-grid">
                        {/* Brand Section */}
                        <div className="footer-brand">
                            <div className="footer-logo">
                                <img src="/assets/logo/login/logo1.png" alt="LALANTSIKA" />
                                <span>LALANTSIKA</span>
                            </div>
                            <p className="footer-description">
                                Votre plateforme participative pour une route plus sûre à Madagascar. 
                                Ensemble, améliorons nos infrastructures routières grâce à la puissance 
                                de la communauté.
                            </p>
                            <div className="footer-social">
                                <a href="#" className="social-link" title="Facebook">
                                    <CIcon icon={cibFacebook} size="lg" />
                                </a>
                                <a href="#" className="social-link" title="Twitter">
                                    <CIcon icon={cibTwitter} size="lg" />
                                </a>
                                <a href="#" className="social-link" title="LinkedIn">
                                    <CIcon icon={cibLinkedin} size="lg" />
                                </a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="footer-section">
                            <h4>Navigation</h4>
                            <ul className="footer-links">
                                <li>
                                    <Link to="/visiteur/home">
                                        <CIcon icon={cilArrowRight} size="sm" />
                                        Accueil
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/visiteur/signalement">
                                        <CIcon icon={cilArrowRight} size="sm" />
                                        Carte des signalements
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/visiteur/recap">
                                        <CIcon icon={cilArrowRight} size="sm" />
                                        Récapitulatif
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div className="footer-section">
                            <h4>Contact</h4>
                            <ul className="footer-links">
                                <li>
                                    <a href="mailto:contact@lalantsika.mg">
                                        <CIcon icon={cilEnvelopeOpen} size="sm" />
                                        contact@lalantsika.mg
                                    </a>
                                </li>
                                <li>
                                    <a href="tel:+261340000000">
                                        <CIcon icon={cilPhone} size="sm" />
                                        +261 34 00 000 00
                                    </a>
                                </li>
                                <li>
                                    <a href="#">
                                        <CIcon icon={cilLocationPin} size="sm" />
                                        Antananarivo, Madagascar
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* CTA Section */}
                        <div className="footer-section">
                            <div className="footer-cta">
                                <h4>Application Mobile</h4>
                                <p>Téléchargez notre app pour signaler en déplacement !</p>
                                <a href="#" className="cta-button">
                                    <CIcon icon={cilCloudDownload} />
                                    Télécharger
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Footer Bottom */}
                    <div className="footer-bottom">
                        <p className="footer-copyright">
                            © 2026 Lalantsika. Tous droits réservés.
                        </p>
                        <div className="footer-legal-links">
                            <a href="#">Politique de confidentialité</a>
                            <a href="#">Conditions d'utilisation</a>
                            <a href="#">Mentions légales</a>
                        </div>
                    </div>
                </div>
            </footer>
            )}
        </div>
    )
}