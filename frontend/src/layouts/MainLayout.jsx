import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
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
import CIcon from '@coreui/icons-react'
import { 
    cilHome, 
    cilWarning, 
    cilNotes, 
    cilSearch, 
    cilCloudDownload, 
    cilBullhorn, 
    cilHeadphones, 
    cilEnvelopeOpen 
} from '@coreui/icons'
import { cibFacebook } from '@coreui/icons'
import '@coreui/coreui/dist/css/coreui.min.css'
import 'bootstrap/dist/css/bootstrap.min.css'

export default function MainLayout() {
    const [visible, setVisible] = useState(false)
    const location = useLocation()

    const isActive = (path) => location.pathname === path

    return (
        <div className="main-layout bg-light">
            <CNavbar expand="lg" className="bg-navy navbar-dark sticky-top shadow-sm border-bottom border-navy">
                <CContainer fluid className="px-4 py-2">
                    <CNavbarBrand href="/" className="d-flex align-items-center">
                        <img
                            src="/assets/logo/logo.png"
                            alt="LALANTSIKA"
                            height="40"
                            className="me-2 rounded shadow-sm"
                        />
                    </CNavbarBrand>
                    <CNavbarToggler
                        aria-label="Toggle navigation"
                        aria-expanded={visible}
                        onClick={() => setVisible(!visible)}
                    />
                    <CCollapse className="navbar-collapse" visible={visible}>
                        <CNavbarNav className="ms-3">
                            <CNavItem>
                                <CNavLink
                                    href="/"
                                    className={`px-3 fw-semibold d-flex align-items-center ${isActive('/') ? 'active text-warning border-bottom border-warning border-2' : 'text-light'}`}
                                >
                                    <CIcon icon={cilHome} className="me-2" />
                                    ACCUEIL
                                </CNavLink>
                            </CNavItem>
                            <CNavItem>
                                <CNavLink
                                    href="/signalement"
                                    className={`px-3 fw-semibold d-flex align-items-center ${isActive('/signalement') ? 'active text-warning border-bottom border-warning border-2' : 'text-light'}`}
                                >
                                    <CIcon icon={cilWarning} className="me-2" />
                                    SIGNALEMENT
                                </CNavLink>
                            </CNavItem>
                            <CNavItem>
                                <CNavLink
                                    href="/recap"
                                    className={`px-3 fw-semibold d-flex align-items-center ${isActive('/recap') ? 'active text-warning border-bottom border-warning border-2' : 'text-light'}`}
                                >
                                    <CIcon icon={cilNotes} className="me-2" />
                                    RÉCAPITULATIF
                                </CNavLink>
                            </CNavItem>
                        </CNavbarNav>
                        <CForm className="d-flex ms-auto align-items-center">
                            <CFormInput 
                                type="search" 
                                className="me-2 rounded-pill bg-dark border-secondary text-white px-3" 
                                placeholder="Rechercher..." 
                                size="sm" 
                            />
                            <CButton 
                                type="submit" 
                                className="btn btn-warning rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center"
                                size="sm"
                            >
                                <CIcon icon={cilSearch} className="me-2" />
                                GO
                            </CButton>
                        </CForm>
                    </CCollapse>
                </CContainer>
            </CNavbar>

            <main className="flex-grow-1">
                <CContainer fluid className="my-5 px-3 px-md-5">
                    <div className="content-wrapper shadow-sm rounded-4 bg-white p-3 p-md-5">
                        <Outlet />
                    </div>
                </CContainer>
            </main>

            <CFooter className="bg-navy text-white border-top border-navy py-5">
                <CContainer>
                    <div className="row g-4 align-items-center">
                        <div className="col-12 col-md-4 text-center text-md-start">
                            <img
                                src="/assets/logo/logo.png"
                                alt="LALANTSIKA"
                                height="50"
                                className="mb-3 rounded opacity-75"
                            />
                            <p className="text-secondary small mb-0">
                                <CIcon icon={cilBullhorn} className="me-2" />
                                Lalantsika : Votre plateforme participative pour une route plus sûre à Madagascar.
                            </p>
                        </div>
                        <div className="col-12 col-md-4 text-center">
                            <div className="d-flex justify-content-center gap-4 mb-3">
                                <CLink href="#" className="text-secondary text-decoration-none hover-white" title="Facebook">
                                    <CIcon icon={cibFacebook} size="xl" />
                                </CLink>
                                <CLink href="#" className="text-secondary text-decoration-none hover-white" title="Support">
                                    <CIcon icon={cilHeadphones} size="xl" />
                                </CLink>
                                <CLink href="#" className="text-secondary text-decoration-none hover-white" title="Contact">
                                    <CIcon icon={cilEnvelopeOpen} size="xl" />
                                </CLink>
                            </div>
                            <span className="text-secondary fw-light">&copy; 2026 Lalantsika. Tous droits réservés.</span>
                        </div>
                        <div className="col-12 col-md-4 text-center text-md-end">
                            <CButton color="outline-warning" size="sm" className="rounded-pill px-4 fw-bold d-flex align-items-center ms-auto">
                                <CIcon icon={cilCloudDownload} className="me-2" />
                                APP MOBILE
                            </CButton>
                        </div>
                    </div>
                </CContainer>
            </CFooter>
        </div>
    )
}