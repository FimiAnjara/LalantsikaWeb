import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
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
    CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import { ENDPOINTS } from '../../../config/api'
import './Login.css'
import 'bootstrap/dist/css/bootstrap.min.css'

export default function ManagerLogin() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        mdp: '',
        rememberMe: false,
    })

    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const [apiError, setApiError] = useState('')

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
        // Nettoyer l'erreur API quand l'utilisateur tape
        if (apiError) {
            setApiError('')
        }
    }

    const validateForm = () => {
        const newErrors = {}
        if (!formData.email) {
            newErrors.email = 'L\'email est requis'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'L\'email n\'est pas valide'
        }
        if (!formData.mdp) {
            newErrors.mdp = 'Le mot de passe est requis'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!validateForm()) {
            return
        }

        setIsLoading(true)
        setApiError('')

        try {
            const response = await fetch(ENDPOINTS.LOGIN, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ email: formData.email, mdp: formData.mdp })
            })

            const data = await response.json()

            if (data.success) {
               
                if (formData.rememberMe) {
                    localStorage.setItem('auth_token', data.data.access_token)
                    localStorage.setItem('user', JSON.stringify(data.data.user))
                } else {
                    sessionStorage.setItem('auth_token', data.data.access_token)
                    sessionStorage.setItem('user', JSON.stringify(data.data.user))
                }

               
                console.log('User connecté:', data.data.user)
                navigate('/manager/home');
            } else {
               
                if (data.data && data.data.errors) {  
                    const newErrors = {}
                    Object.keys(data.data.errors).forEach(field => {
                        newErrors[field] = data.data.errors[field][0] 
                    })
                    setErrors(newErrors)
                } else {
                    setApiError(data.message || 'Erreur de connexion')
                }
            }
        } catch (error) {
            console.error('Erreur de connexion:', error)
            setApiError('Erreur de connexion au serveur')
        } finally {
            setIsLoading(false)
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
                                {/* Affichage erreur API */}
                                {apiError && (
                                    <div className="mb-3 p-3 bg-danger bg-opacity-10 border border-danger rounded-3">
                                        <div className="text-danger fw-semibold">
                                            {apiError}
                                        </div>
                                    </div>
                                )}

                                {/* Email */}
                                <div className="mb-4">
                                    <label htmlFor="email" className="form-label fw-semibold text-dark">
                                        Email
                                    </label>
                                    <CInputGroup className="rounded-3 overflow-hidden has-validation">
                                        <CInputGroupText className="bg-light border-0">
                                            <CIcon icon={cilUser} />
                                        </CInputGroupText>
                                        <CFormInput
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="Entrez votre email"
                                            className="rounded-3 border-0"
                                            style={{
                                                padding: '0.75rem 1rem',
                                                fontSize: '1rem',
                                                minHeight: '50px',
                                                borderColor: errors.email ? '#dc3545' : '',
                                            }}
                                        />
                                    </CInputGroup>
                                    {errors.email && (
                                        <div className="form-text text-danger mt-2">
                                            {errors.email}
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
                                    disabled={isLoading}
                                    className="w-100 rounded-3 fw-bold d-flex align-items-center justify-content-center"
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        fontSize: '1rem',
                                        minHeight: '50px',
                                    }}
                                >
                                    {isLoading ? (
                                        <>
                                            <CSpinner size="sm" className="me-2" />
                                            Connexion en cours...
                                        </>
                                    ) : (
                                        <>
                                            <CIcon icon={cilLockLocked} className="me-2" />
                                            Se connecter
                                        </>
                                    )}
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
