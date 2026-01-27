import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import {
    CButton,
    CContainer,
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
} from '@coreui/icons'
import '@coreui/coreui/dist/css/coreui.min.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import './MainManager.css'

export default function ManagerLayout() {
    const location = useLocation()
    const [expandedMenu, setExpandedMenu] = useState(null)

    const isActive = (path) => location.pathname === path
    
    const isMenuActive = (menuPrefix) => location.pathname.startsWith(menuPrefix)

    useEffect(() => {
        if (location.pathname.startsWith('/manager/utilisateurs')) {
            setExpandedMenu('utilisateur')
        }
    }, [location.pathname])

    const toggleMenu = (menu) => {
        setExpandedMenu(expandedMenu === menu ? null : menu)
    }

    return (
        <div className="d-flex vh-100">
            {/* Sidebar */}
            <div className="manager-sidebar d-flex flex-column">
                <div className="sidebar-header">
                    <div className="sidebar-brand d-flex align-items-center justify-content-center">
                        <img
                            src="/assets/logo/logo.png"
                            alt="LALANTSIKA"
                            height="60"
                            width="120"
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
                </ul>
                <div className="sidebar-footer">
                    <CButton
                        color="danger"
                        size="sm"
                        className="w-100 d-flex align-items-center justify-content-center btn-logout"
                    >
                        <CIcon icon={cilAccountLogout} className="me-2" />
                        Déconnexion
                    </CButton>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow-1 d-flex flex-column">
                {/* Header */}
                <div className="manager-header" style={{ width: '100%' }}>
                    <div className="d-flex justify-content-between align-items-center w-100">
                        <small className="text-muted"></small>
                        <div className="d-flex align-items-center gap-2">
                            <div className="user-avatar">
                                <CIcon icon={cilUser} />
                            </div>
                            <div className="user-info">
                                <div className="user-name">Utilisateur</div>
                                <small className="text-muted">Connecté</small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <main className="flex-grow-1 overflow-auto" style={{ backgroundColor: '#f5f5f5' }}>
                    <CContainer fluid className="p-4">
                        <div className="bg-white rounded-4 shadow-sm p-4">
                            <Outlet />
                        </div>
                    </CContainer>
                </main>
            </div>
        </div>
    )
}
