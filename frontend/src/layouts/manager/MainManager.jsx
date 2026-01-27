import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import {
    CButton,
    CContainer,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
    cilHome,
    cilChartPie,
    cilAccountLogout,
    cilCloudDownload,
    cilPeople,
    cilPlus,
    cilList,
    cilArrowRight,
} from '@coreui/icons'
import '@coreui/coreui/dist/css/coreui.min.css'
import 'bootstrap/dist/css/bootstrap.min.css'

export default function ManagerLayout() {
    const location = useLocation()
    const [expandedMenu, setExpandedMenu] = useState(null)

    const isActive = (path) => location.pathname === path

    const toggleMenu = (menu) => {
        setExpandedMenu(expandedMenu === menu ? null : menu)
    }

    return (
        <div className="d-flex vh-100">
            {/* Sidebar */}
            <div className="sidebar sidebar-dark border-end" style={{ width: '250px', overflowY: 'auto' }}>
                <div className="sidebar-header border-bottom">
                    <div className="sidebar-brand d-flex align-items-center">
                        <img
                            src="/assets/logo/logo.png"
                            alt="LALANTSIKA"
                            height="30"
                        />
                    </div>
                </div>
                <ul className="sidebar-nav">
                    <li className="nav-title">General</li>
                    <li className="nav-item">
                        <a
                            href="/manager/home"
                            className={`nav-link ${isActive('/manager/home') ? 'active' : ''}`}
                        >
                            <CIcon icon={cilChartPie} className="nav-icon me-2" />
                            Tableau de bord
                        </a>
                    </li>
                    <li className="nav-item">
                        <a
                            href="/manager/home"
                            className="nav-link"
                        >
                            <CIcon icon={cilCloudDownload} className="nav-icon me-2" />
                            Exporter Données
                        </a>
                    </li>
                    <li className="nav-item nav-group">
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault()
                                toggleMenu('utilisateur')
                            }}
                            className={`nav-link ${expandedMenu === 'utilisateur' ? 'show' : ''}`}
                        >
                            <CIcon icon={cilPeople} className="nav-icon me-2" />
                            Utilisateur
                            <CIcon
                                icon={cilArrowRight}
                                className="ms-auto"
                                style={{
                                    transform: expandedMenu === 'utilisateur' ? 'rotate(90deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s'
                                }}
                            />
                        </a>
                        {expandedMenu === 'utilisateur' ? (
                            <ul className="nav-group-items" style={{ display: 'block' }}>
                                <li className="nav-item">
                                    <a href="/manager/utilisateurs/ajout" className={`nav-link ${isActive('/manager/utilisateurs/ajout') ? 'active' : ''}`}>
                                        <span className="nav-icon"><span className="nav-icon-bullet"></span></span>
                                        <CIcon icon={cilPlus} className="me-2" />
                                        Ajouter
                                    </a>
                                </li>
                                <li className="nav-item">
                                    <a href="/manager/utilisateurs/liste" className={`nav-link ${isActive('/manager/utilisateurs/liste') ? 'active' : ''}`}>
                                        <span className="nav-icon"><span className="nav-icon-bullet"></span></span>
                                        <CIcon icon={cilList} className="me-2" />
                                        Liste
                                    </a>
                                </li>
                            </ul>
                        ) : (
                            <ul className="nav-group-items" style={{ display: 'none' }}>
                                <li className="nav-item">
                                    <a href="/manager/utilisateurs/ajout" className={`nav-link ${isActive('/manager/utilisateurs/ajout') ? 'active' : ''}`}>
                                        <span className="nav-icon"><span className="nav-icon-bullet"></span></span>
                                        <CIcon icon={cilPlus} className="me-2" />
                                        Ajouter
                                    </a>
                                </li>
                                <li className="nav-item">
                                    <a href="/manager/utilisateurs/liste" className={`nav-link ${isActive('/manager/utilisateurs/liste') ? 'active' : ''}`}>
                                        <span className="nav-icon"><span className="nav-icon-bullet"></span></span>
                                        <CIcon icon={cilList} className="me-2" />
                                        Liste
                                    </a>
                                </li>
                            </ul>
                        )}
                    </li>
                </ul>
                <div className="sidebar-footer border-top d-flex gap-2 p-2">
                    <CButton
                        color="danger"
                        size="sm"
                        className="w-100 d-flex align-items-center justify-content-center"
                        title="Déconnexion"
                    >
                        <CIcon icon={cilAccountLogout} className="me-2" />
                        Logout
                    </CButton>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow-1 d-flex flex-column">
                {/* Header */}
                <div className="bg-dark text-white p-3 border-bottom shadow-sm">
                    <div className="d-flex justify-content-between align-items-center">
                        <h3 className="mb-0"></h3>
                        <small className="text-white-50">Gestion des signalements</small>
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
