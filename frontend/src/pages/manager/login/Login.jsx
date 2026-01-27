import { useState } from 'react'
import {
    CCard,
    CCardBody,
    CForm,
    CFormInput,
    CFormCheck,
    CButton,
    CContainer,
    CRow,
    CCol,
    CInputGroup,
    CInputGroupText,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser, cilCheckAlt } from '@coreui/icons'
import './Login.css'
import 'bootstrap/dist/css/bootstrap.min.css'

export default function ManagerLogin() {
    const [formData, setFormData] = useState({
        identifiant: '',
        mdp: '',
        rememberMe: false,
    })

    const [errors, setErrors] = useState({})

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        })
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: '',
            })
        }
    }

    const validateForm = () => {
        const newErrors = {}
        if (!formData.identifiant) {
            newErrors.identifiant = 'L\'identifiant est requis'
        }
        if (!formData.mdp) {
            newErrors.mdp = 'Le mot de passe est requis'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (validateForm()) {
            console.log('Connexion avec:', formData)
            alert('Connexion réussie!')
            // Ajouter la logique de connexion ici
        }
    }

    return (
        <div className="login-container">
            <CRow className="login-wrapper">
                <CCol lg="5" md="12" className="login-form-col p-0">
                    <div className="login-form-section">
                        <div className="login-content">
                            <div className="mb-4 text-center">
                                <img
                                    src="/assets/logo/logo.png"
                                    alt="LALANTSIKA"
                                    height="50"
                                    className="mb-3 rounded"
                                />
                                <h2 className="mb-2 text-dark fw-bold">Connexion Manager</h2>
                            </div>

                            <CForm onSubmit={handleSubmit}>
                                {/* Identifiant */}
                                <div className="mb-4">
                                    <label htmlFor="identifiant" className="form-label fw-semibold text-dark">
                                        Identifiant
                                    </label>
                                    <CInputGroup className="rounded-3 overflow-hidden has-validation">
                                        <CInputGroupText className="bg-light border-0">
                                            <CIcon icon={cilUser} />
                                        </CInputGroupText>
                                        <CFormInput
                                            type="text"
                                            id="identifiant"
                                            name="identifiant"
                                            value={formData.identifiant}
                                            onChange={handleChange}
                                            placeholder="Entrez votre identifiant"
                                            className="rounded-3 border-0"
                                            style={{
                                                padding: '0.75rem 1rem',
                                                fontSize: '1rem',
                                                minHeight: '50px',
                                                borderColor: errors.identifiant ? '#dc3545' : '',
                                            }}
                                        />
                                    </CInputGroup>
                                    {errors.identifiant && (
                                        <div className="form-text text-danger mt-2">
                                            {errors.identifiant}
                                        </div>
                                    )}
                                </div>

                                {/* Mot de passe */}
                                <div className="mb-4">
                                    <label htmlFor="mdp" className="form-label fw-semibold text-dark">
                                        Mot de passe
                                    </label>
                                    <CInputGroup className="rounded-3 overflow-hidden has-validation">
                                        <CInputGroupText className="bg-light border-0">
                                            <CIcon icon={cilLockLocked} />
                                        </CInputGroupText>
                                        <CFormInput
                                            type="password"
                                            id="mdp"
                                            name="mdp"
                                            value={formData.mdp}
                                            onChange={handleChange}
                                            placeholder="Entrez votre mot de passe"
                                            className="rounded-3 border-0"
                                            style={{
                                                padding: '0.75rem 1rem',
                                                fontSize: '1rem',
                                                minHeight: '50px',
                                                borderColor: errors.mdp ? '#dc3545' : '',
                                            }}
                                        />
                                    </CInputGroup>
                                    {errors.mdp && (
                                        <div className="form-text text-danger mt-2">
                                            {errors.mdp}
                                        </div>
                                    )}
                                </div>

                                {/* Remember Me */}
                                <div className="mb-4">
                                    <CFormCheck
                                        type="checkbox"
                                        id="rememberMe"
                                        name="rememberMe"
                                        checked={formData.rememberMe}
                                        onChange={handleChange}
                                        label="Se souvenir de moi"
                                        className="fw-semibold text-dark"
                                    />
                                </div>

                                {/* Submit Button */}
                                <CButton
                                    type="submit"
                                    color="primary"
                                    className="w-100 rounded-3 fw-bold d-flex align-items-center justify-content-center"
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        fontSize: '1rem',
                                        minHeight: '50px',
                                    }}
                                    data-coreui-timeout="2000"
                                    data-coreui-toggle="loading-button"
                                >
                                    <CIcon icon={cilLockLocked} className="me-2" />
                                    Se connecter
                                </CButton>
                            </CForm>

                            {/* Footer */}
                            <div className="text-center mt-4">
                                <small className="text-secondary">
                                    Besoin d'aide? <a href="#" className="text-primary fw-bold text-decoration-none">Contactez le support</a>
                                </small>
                            </div>
                        </div>
                    </div>
                </CCol>

                <CCol lg="7" md="0" className="login-image-col p-0">
                    <div className="login-image-section">
                        <div className="login-image-content" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '20px'
                        }}>
                            <img
                                src="/assets/logo/login/logo.png"
                                alt="LALANTSIKA"
                                style={{ width: '100%', height: 'auto', maxWidth: '400px' }}
                            />
                            <img
                                src="/assets/logo/login/Lalana.png"
                                alt="LALANTSIKA"
                                style={{ width: '100%', height: 'auto', maxWidth: '400px' }}
                            />
                        </div>
                    </div>
                </CCol>
            </CRow>
        </div>
    )
}
