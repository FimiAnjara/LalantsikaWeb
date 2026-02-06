import { useState, useEffect } from 'react'
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import {
    CButton,
    CContainer,
    CBreadcrumb,
    CBreadcrumbItem,
    CSpinner
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
    cilChartPie,
    cilAccountLogout,
    cilCloudDownload,
    cilPeople,
    cilPlus,
    cilList,
    cilArrowRight,
    cilUser,
    cilSettings,
    cilTask,
} from '@coreui/icons'
import { API_BASE_URL } from '../../config/api'
import '@coreui/coreui/dist/css/coreui.min.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import './MainManager.css'

export default function ManagerLayout() {
    const location = useLocation()
    const navigate = useNavigate()
    const [expandedMenu, setExpandedMenu] = useState(null)
    const [loggingOut, setLoggingOut] = useState(false)
    const [user, setUser] = useState(null)

    // Helper pour construire l'URL de la photo (locale ou externe)
    const getPhotoUrl = (photoUrl) => {
        if (!photoUrl) return null
        if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
            return photoUrl
        }
        return `${API_BASE_URL}${photoUrl}`
    }

    // Charger les données utilisateur au montage
    useEffect(() => {
        const userData = localStorage.getItem('user') || sessionStorage.getItem('user')
        if (userData) {
            try {
                setUser(JSON.parse(userData))
            } catch (e) {
                console.error('Erreur parsing user data:', e)
            }
        }
    }, [])

    const isActive = (path) => location.pathname === path

    const isMenuActive = (menuPrefix) => location.pathname.startsWith(menuPrefix)

    useEffect(() => {
        if (location.pathname.startsWith('/manager/utilisateurs')) {
            setExpandedMenu('utilisateur')
        } else if (location.pathname.startsWith('/manager/signalements')) {
            setExpandedMenu('signalement')
        }
    }, [location.pathname])

    const toggleMenu = (menu) => {
        setExpandedMenu(expandedMenu === menu ? null : menu)
    }

    const getBreadcrumbs = () => {
        const pathnames = location.pathname.split('/').filter((x) => x)
        const breadcrumbs = [
            { name: 'Accueil', path: '/manager/home' }
        ]

        let currentPath = '/manager'

        // Skip 'manager' from pathnames but use it as base
        const managerSubPath = pathnames.slice(1)

        managerSubPath.forEach((value, index) => {
            currentPath += `/${value}`
            let name = value.charAt(0).toUpperCase() + value.slice(1)

            // Map specific names for better display
            if (value === 'home') return // Skip home as it's our base 'Home'
            if (value === 'utilisateurs') name = 'Utilisateurs'
            if (value === 'signalements') name = 'Signalements'
            if (value === 'ajout') name = 'Ajouter'
            if (value === 'liste') name = 'Liste'
            if (value === 'modifier') name = 'Modifier'
            if (value === 'fiche') name = 'Fiche'
            if (value === 'parametres') name = 'Paramètres'

            // Check if it's an ID (simple check if it contains numbers)
            if (/\d/.test(value)) {
                name = `Détails #${value}`
            }

            breadcrumbs.push({ name, path: currentPath })
        })

        return breadcrumbs
    }

    const handleLogout = async () => {
        setLoggingOut(true)
        try {
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')

            // Appeler l'API de déconnexion
            await fetch('http://localhost:8000/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            })
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error)
        } finally {
            // Supprimer le token et rediriger vers le login (localStorage et sessionStorage)
            localStorage.removeItem('auth_token')
            localStorage.removeItem('user')
            sessionStorage.removeItem('auth_token')
            sessionStorage.removeItem('user')
            navigate('/manager/login')
        }
    }

    const breadcrumbs = getBreadcrumbs()

    return (
        <div className="d-flex vh-100">
            {/* Sidebar */}
            <div className="manager-sidebar d-flex flex-column">
                <div className="sidebar-header">
                    <div className="sidebar-brand d-flex align-items-center justify-content-center">
                        <img
                            src="/assets/logo/login/logo1.png"
                            alt="LALANTSIKA"
                            height="60"
                            width="60"
                        />
                    </div>
                </div>
                <ul className="sidebar-nav flex-grow-1">
                    <li className="nav-title">General</li>
                    <li className="nav-item">
                        <a
                            href="/manager/home"
                            className={`nav-link ${isActive('/manager/home') ? 'active' : ''}`}
                        >
                            <CIcon icon={cilChartPie} className="nav-icon" />
                            Tableau de bord
                        </a>
                    </li>
                    <li className="nav-item nav-group-parent">
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault()
                                toggleMenu('utilisateur')
                            }}
                            className={`nav-link ${isMenuActive('/manager/utilisateurs') ? 'parent-active' : ''}`}
                        >
                            <CIcon icon={cilPeople} className="nav-icon" />
                            Utilisateur
                            <CIcon
                                icon={cilArrowRight}
                                className={`ms-auto arrow-icon ${expandedMenu === 'utilisateur' ? 'expanded' : ''}`}
                            />
                        </a>
                        <ul
                            className="nav-group-items"
                            style={{
                                display: expandedMenu === 'utilisateur' ? 'block' : 'none'
                            }}
                        >
                            <li className="nav-item">
                                <a
                                    href="/manager/utilisateurs/ajout"
                                    className={`nav-link ${isActive('/manager/utilisateurs/ajout') ? 'active' : ''}`}
                                >
                                    Ajouter
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    href="/manager/utilisateurs/liste"
                                    className={`nav-link ${isActive('/manager/utilisateurs/liste') ? 'active' : ''}`}
                                >
                                    Liste
                                </a>
                            </li>
                        </ul>
                    </li>
                    <li className="nav-item nav-group-parent">
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault()
                                toggleMenu('signalement')
                            }}
                            className={`nav-link ${isMenuActive('/manager/signalements') ? 'parent-active' : ''}`}
                        >
                            <CIcon icon={cilTask} className="nav-icon" />
                            Signalement
                            <CIcon
                                icon={cilArrowRight}
                                className={`ms-auto arrow-icon ${expandedMenu === 'signalement' ? 'expanded' : ''}`}
                            />
                        </a>
                        <ul
                            className="nav-group-items"
                            style={{
                                display: expandedMenu === 'signalement' ? 'block' : 'none'
                            }}
                        >
                            <li className="nav-item">
                                <a
                                    href="/manager/signalements/liste"
                                    className={`nav-link ${isActive('/manager/signalements/liste') ? 'active' : ''}`}
                                >
                                    Liste
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    href="/manager/signalements/carte"
                                    className={`nav-link ${isActive('/manager/signalements/carte') ? 'active' : ''}`}
                                >
                                    Carte
                                </a>
                            </li>
                        </ul>
                    </li>

                    <li className="nav-title">Parametres</li>
                    <li className="nav-item">
                        <a
                            href="/manager/parametres"
                            className={`nav-link ${isActive('/manager/parametres') ? 'active' : ''}`}
                        >
                            <CIcon icon={cilSettings} className="nav-icon" />
                            Parametres
                        </a>
                    </li>
                    <li className="nav-item">
                        <a
                            href="/manager/synchro"
                            className={`nav-link ${isActive('/manager/synchro') ? 'active' : ''}`}
                        >
                            <CIcon icon={cilCloudDownload} className="nav-icon" />
                            Synchronisation
                        </a>
                    </li>

                </ul>
                <div className="sidebar-footer">
                    <CButton
                        color="danger"
                        size="sm"
                        className="w-100 d-flex align-items-center justify-content-center btn-logout"
                        onClick={handleLogout}
                        disabled={loggingOut}
                    >
                        {loggingOut ? (
                            <>
                                <CSpinner size="sm" className="me-2" />
                                Déconnexion...
                            </>
                        ) : (
                            <>
                                <CIcon icon={cilAccountLogout} className="me-2" />
                                Déconnexion
                            </>
                        )}
                    </CButton>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow-1 d-flex flex-column">
                {/* Header */}
                <div className="manager-header" style={{ width: '100%' }}>
                    <div className="d-flex justify-content-end align-items-center w-100">
                        <div className="d-flex align-items-center gap-2">
                            <div className="user-avatar">
                                {user?.photo_url ? (
                                    <img 
                                        src={getPhotoUrl(user.photo_url)} 
                                        alt={user.prenom}
                                        style={{ 
                                            width: '40px', 
                                            height: '40px', 
                                            objectFit: 'cover', 
                                            borderRadius: '50%' 
                                        }} 
                                    />
                                ) : (
                                    <CIcon icon={cilUser} />
                                )}
                            </div>
                            <div className="user-info">
                                <div className="user-name">
                                    {user ? `${user.prenom} ${user.nom}` : 'Manager'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <main className="flex-grow-1 overflow-auto" style={{ backgroundColor: '#f5f5f5' }}>
                    <CContainer fluid className="p-4">
                        <CBreadcrumb style={{ '--cui-breadcrumb-divider': '">"' }} className="ms-2 mb-3">
                            {breadcrumbs.map((breadcrumb, index) => (
                                <CBreadcrumbItem
                                    key={index}
                                    component={Link}
                                    to={breadcrumb.path}
                                    {...(index === breadcrumbs.length - 1 ? { active: true } : {})}
                                >
                                    {breadcrumb.name}
                                </CBreadcrumbItem>
                            ))}
                        </CBreadcrumb>
                        <div className="bg-white rounded-4 shadow-sm p-4">
                            <Outlet />
                        </div>
                    </CContainer>
                </main>
            </div>
        </div>
    )
}
