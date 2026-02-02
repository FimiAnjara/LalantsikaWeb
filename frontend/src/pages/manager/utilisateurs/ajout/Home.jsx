import { useState, useEffect } from 'react'
import {
    CCard,
    CCardBody,
    CCardHeader,
    CForm,
    CFormInput,
    CFormSelect,
    CButton,
    CCol,
    CRow,
    CInputGroup,
    CInputGroupText,
    CAlert,
    CProgress,
    CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { 
    cilPlus, 
    cilSave,
    cilUser,
    cilLockLocked,
    cilCalendar,
    cilEnvelopeOpen,
    cilPeople,
    cilChevronRight,
    cilChevronLeft,
    cilCheckAlt,
} from '@coreui/icons'
import MessageModal from '../../../../components/MessageModal'
import './Ajout.css'

export default function AjoutUtilisateur() {
    const [step, setStep] = useState(1)
    const [sexes, setSexes] = useState([])
    const [sexesLoading, setSexesLoading] = useState(true)
    const [formData, setFormData] = useState({
        identifiant: '',
        mdp: '',
        mdp_confirmation: '',
        nom: '',
        prenom: '',
        dtn: '',
        email: '',
        id_sexe: '',
    })
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [errors, setErrors] = useState({})
    const [modalVisible, setModalVisible] = useState(false)
    const [modalConfig, setModalConfig] = useState({
        type: 'success',
        title: '',
        message: ''
    })
    // Debug: Afficher l'état du token au chargement
    useEffect(() => {
        const localToken = localStorage.getItem('auth_token')
        const sessionToken = sessionStorage.getItem('auth_token')
        console.log('=== DEBUG AUTH ===')
        console.log('localStorage auth_token:', localToken ? `${localToken.substring(0, 30)}...` : 'NULL')
        console.log('sessionStorage auth_token:', sessionToken ? `${sessionToken.substring(0, 30)}...` : 'NULL')
        console.log('==================')
    }, [])

    // Récupérer la liste des sexes au chargement
    useEffect(() => {
        const fetchSexes = async () => {
            try {
                // Récupérer le token du localStorage ou sessionStorage
                const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
                
                const response = await fetch('http://localhost:8000/api/sexes', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                })

                if (response.ok) {
                    const data = await response.json()
                    setSexes(data.data || [])
                } else {
                    console.error('Erreur lors du chargement des sexes')
                }
            } catch (error) {
                console.error('Erreur:', error)
            } finally {
                setSexesLoading(false)
            }
        }

        fetchSexes()
    }, [])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            [name]: value,
        })
        // Nettoyer l'erreur du champ si l'utilisateur commence à corriger
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ''
            })
        }
    }

    const validateStep1 = () => {
        const newErrors = {}
        
        if (!formData.identifiant.trim()) newErrors.identifiant = 'L\'identifiant est requis'
        if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis'
        if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est requis'
        if (!formData.dtn) newErrors.dtn = 'La date de naissance est requise'
        if (!formData.id_sexe) newErrors.id_sexe = 'Le sexe est requis'

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const validateStep2 = () => {
        const newErrors = {}
        
        if (!formData.email.trim()) newErrors.email = 'L\'email est requis'
        if (!formData.mdp) newErrors.mdp = 'Le mot de passe est requis'
        if (!formData.mdp_confirmation) newErrors.mdp_confirmation = 'La confirmation est requise'
        if (formData.mdp !== formData.mdp_confirmation) {
            newErrors.mdp_confirmation = 'Les mots de passe ne correspondent pas'
        }
        if (formData.mdp && formData.mdp.length < 6) {
            newErrors.mdp = 'Le mot de passe doit contenir au moins 6 caractères'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNextStep = () => {
        if (validateStep1()) {
            setStep(2)
            setMessage({ type: '', text: '' })
        }
    }

    const handlePreviousStep = () => {
        setStep(1)
        setMessage({ type: '', text: '' })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!validateStep2()) {
            return
        }

        setLoading(true)
        setMessage({ type: '', text: '' })

        try {
            // Récupérer le token du localStorage ou sessionStorage
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
            
            console.log('Token trouvé:', token ? 'Oui' : 'Non')
            console.log('Token (premiers 50 chars):', token?.substring(0, 50))
            
            if (!token) {
                setMessage({ 
                    type: 'danger', 
                    text: 'Session expirée. Veuillez vous reconnecter.'
                })
                setLoading(false)
                return
            }
            
            const response = await fetch('http://localhost:8000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    identifiant: formData.identifiant,
                    mdp: formData.mdp,
                    mdp_confirmation: formData.mdp_confirmation,
                    nom: formData.nom,
                    prenom: formData.prenom,
                    dtn: formData.dtn,
                    email: formData.email,
                    id_sexe: parseInt(formData.id_sexe),
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                const error = new Error(data.message || 'Erreur lors de l\'enregistrement')
                // Ajouter les erreurs de validation du serveur
                if (data.data?.errors) {
                    error.validationErrors = data.data.errors
                }
                throw error
            }

            setModalConfig({
                type: 'success',
                title: 'Utilisateur créé!',
                message: 'L\'utilisateur a été créé avec succès. ' + (data.data?.sync_message || '')
            })
            setModalVisible(true)
            
            // Réinitialiser le formulaire et revenir à l'étape 1
            setFormData({
                identifiant: '',
                mdp: '',
                mdp_confirmation: '',
                nom: '',
                prenom: '',
                dtn: '',
                email: '',
                id_sexe: '',
            })
            setStep(1)
            setErrors({})
        } catch (error) {
            // Si l'erreur contient des erreurs de validation du serveur
            if (error.validationErrors) {
                const serverErrors = {}
                Object.keys(error.validationErrors).forEach(field => {
                    serverErrors[field] = error.validationErrors[field][0]
                })
                setErrors(serverErrors)
                
                // Si les erreurs concernent l'étape 1, revenir à cette étape
                if (serverErrors.identifiant || serverErrors.nom || serverErrors.prenom || serverErrors.dtn || serverErrors.id_sexe) {
                    setStep(1)
                }
            }
            setModalConfig({
                type: 'error',
                title: 'Erreur!',
                message: error.message || 'Une erreur est survenue lors de la création de l\'utilisateur.'
            })
            setModalVisible(true)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="ajout-utilisateur">
            {/* Modal de message */}
            <MessageModal
                visible={modalVisible}
                type={modalConfig.type}
                title={modalConfig.title}
                message={modalConfig.message}
                onClose={() => setModalVisible(false)}
                autoClose={modalConfig.type === 'success'}
                autoCloseDelay={4000}
            />

            <div className="page-header mb-4">
                <div className="d-flex align-items-center gap-3">
                    <div className="header-icon">
                        <CIcon icon={cilPlus} size="xl" />
                    </div>
                    <div>
                        <h2 className="mb-0 fw-bold">Ajouter un utilisateur</h2>
                        <p className="text-muted mb-0">Créer un nouveau compte utilisateur</p>
                    </div>
                </div>
            </div>

            {/* Timeline d'étapes */}
            <div className="steps-timeline mb-4">
                <div className="timeline-container">
                    <div className={`timeline-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                        <div className="timeline-marker">
                            {step > 1 ? <CIcon icon={cilCheckAlt} /> : '1'}
                        </div>
                        <div className="timeline-content">
                            <span className="timeline-label">Étape 1</span>
                            <span className="timeline-title">Informations personnelles</span>
                        </div>
                    </div>
                    
                    <div className={`timeline-connector ${step > 1 ? 'active' : ''}`}></div>
                    
                    <div className={`timeline-step ${step >= 2 ? 'active' : ''}`}>
                        <div className="timeline-marker">2</div>
                        <div className="timeline-content">
                            <span className="timeline-label">Étape 2</span>
                            <span className="timeline-title">Sécurité et email</span>
                        </div>
                    </div>
                </div>
            </div>

            <CCard className="form-card shadow-lg">
                {step === 1 ? (
                    <>
                        <CCardBody className="p-5">
                            <div className="form-section-title mb-4">
                                <div className="section-icon">
                                    <CIcon icon={cilUser} />
                                </div>
                                <div>
                                    <h6 className="mb-0 fw-bold">Identité de l'utilisateur</h6>
                                    <small className="text-muted">Ces informations seront utilisées pour identifier l'utilisateur</small>
                                </div>
                            </div>
                            <CForm onSubmit={handleSubmit}>
                                <CRow className="g-4 mb-4">
                                    <CCol lg="6">
                                        <label className="form-label fw-semibold">Identifiant <span className="text-danger">*</span></label>
                                        <CInputGroup className="input-group-custom">
                                            <CInputGroupText className="bg-light">
                                                <CIcon icon={cilUser} />
                                            </CInputGroupText>
                                            <CFormInput
                                                type="text"
                                                name="identifiant"
                                                value={formData.identifiant}
                                                onChange={handleChange}
                                                placeholder="Entrez l'identifiant"
                                                isInvalid={!!errors.identifiant}
                                                className="form-control-lg"
                                            />
                                        </CInputGroup>
                                        {errors.identifiant && (
                                            <small className="text-danger d-block mt-2"><strong>{errors.identifiant}</strong></small>
                                        )}
                                    </CCol>
                                </CRow>

                                <CRow className="g-4 mb-4">
                                    <CCol lg="6">
                                        <label className="form-label fw-semibold">Nom <span className="text-danger">*</span></label>
                                        <CInputGroup className="input-group-custom">
                                            <CInputGroupText className="bg-light">
                                                <CIcon icon={cilUser} />
                                            </CInputGroupText>
                                            <CFormInput
                                                type="text"
                                                name="nom"
                                                value={formData.nom}
                                                onChange={handleChange}
                                                placeholder="Entrez le nom"
                                                isInvalid={!!errors.nom}
                                                className="form-control-lg"
                                            />
                                        </CInputGroup>
                                        {errors.nom && (
                                            <small className="text-danger d-block mt-2"><strong>{errors.nom}</strong></small>
                                        )}
                                    </CCol>
                                    <CCol lg="6">
                                        <label className="form-label fw-semibold">Prénom <span className="text-danger">*</span></label>
                                        <CInputGroup className="input-group-custom">
                                            <CInputGroupText className="bg-light">
                                                <CIcon icon={cilUser} />
                                            </CInputGroupText>
                                            <CFormInput
                                                type="text"
                                                name="prenom"
                                                value={formData.prenom}
                                                onChange={handleChange}
                                                placeholder="Entrez le prénom"
                                                isInvalid={!!errors.prenom}
                                                className="form-control-lg"
                                            />
                                        </CInputGroup>
                                        {errors.prenom && (
                                            <small className="text-danger d-block mt-2"><strong>{errors.prenom}</strong></small>
                                        )}
                                    </CCol>
                                </CRow>

                                <CRow className="g-4 mb-4">
                                    <CCol lg="6">
                                        <label className="form-label fw-semibold">Date de naissance <span className="text-danger">*</span></label>
                                        <CInputGroup className="input-group-custom">
                                            <CInputGroupText className="bg-light">
                                                <CIcon icon={cilCalendar} />
                                            </CInputGroupText>
                                            <CFormInput
                                                type="date"
                                                name="dtn"
                                                value={formData.dtn}
                                                onChange={handleChange}
                                                isInvalid={!!errors.dtn}
                                                className="form-control-lg"
                                            />
                                        </CInputGroup>
                                        {errors.dtn && (
                                            <small className="text-danger d-block mt-2"><strong>{errors.dtn}</strong></small>
                                        )}
                                    </CCol>
                                    <CCol lg="6">
                                        <label className="form-label fw-semibold">Sexe <span className="text-danger">*</span></label>
                                        <CInputGroup className="input-group-custom">
                                            <CInputGroupText className="bg-light">
                                                <CIcon icon={cilPeople} />
                                            </CInputGroupText>
                                            <CFormSelect
                                                name="id_sexe"
                                                value={formData.id_sexe}
                                                onChange={handleChange}
                                                isInvalid={!!errors.id_sexe}
                                                disabled={sexesLoading}
                                                className="form-control-lg"
                                            >
                                                <option value="">
                                                    {sexesLoading ? 'Chargement...' : 'Sélectionnez votre sexe'}
                                                </option>
                                                {sexes.map(sexe => (
                                                    <option key={sexe.id_sexe} value={sexe.id_sexe}>
                                                        {sexe.libelle}
                                                    </option>
                                                ))}
                                            </CFormSelect>
                                        </CInputGroup>
                                        {errors.id_sexe && (
                                            <small className="text-danger d-block mt-2"><strong>{errors.id_sexe}</strong></small>
                                        )}
                                    </CCol>
                                </CRow>

                                <div className="d-flex gap-3 pt-4 border-top">
                                    <CButton
                                        type="button"
                                        className="btn-submit flex-grow-1"
                                        onClick={handleNextStep}
                                    >
                                        Suivant
                                        <CIcon icon={cilChevronRight} className="ms-2" />
                                    </CButton>
                                    <CButton
                                        type="reset"
                                        className="btn-reset"
                                    >
                                        Réinitialiser
                                    </CButton>
                                </div>
                            </CForm>
                        </CCardBody>
                    </>
                ) : (
                    <>
                        <CCardBody className="p-5">
                            <div className="form-section-title mb-4">
                                <div className="section-icon">
                                    <CIcon icon={cilLockLocked} />
                                </div>
                                <div>
                                    <h6 className="mb-0 fw-bold">Configuration sécurité</h6>
                                    <small className="text-muted">Définissez votre email et mot de passe</small>
                                </div>
                            </div>
                            <CForm onSubmit={handleSubmit}>
                                <div className="alert alert-info mb-4 rounded-3">
                                    <div className="d-flex gap-3 align-items-center">
                                        <div className="profile-summary">
                                            <strong>Récapitulatif :</strong> {formData.prenom} {formData.nom}
                                        </div>
                                    </div>
                                </div>

                                <CRow className="g-4 mb-4">
                                    <CCol lg="6">
                                        <label className="form-label fw-semibold">Email <span className="text-danger">*</span></label>
                                        <CInputGroup className="input-group-custom">
                                            <CInputGroupText className="bg-light">
                                                <CIcon icon={cilEnvelopeOpen} />
                                            </CInputGroupText>
                                            <CFormInput
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="exemple@email.com"
                                                isInvalid={!!errors.email}
                                                className="form-control-lg"
                                            />
                                        </CInputGroup>
                                        {errors.email && (
                                            <small className="text-danger d-block mt-2"><strong>{errors.email}</strong></small>
                                        )}
                                    </CCol>
                                </CRow>

                                <div className="security-section">
                                    <h6 className="fw-bold mb-4 text-muted">
                                        <CIcon icon={cilLockLocked} className="me-2" />
                                        Mot de passe
                                    </h6>

                                    <CRow className="g-4 mb-4">
                                        <CCol lg="6">
                                            <label className="form-label fw-semibold">Mot de passe <span className="text-danger">*</span></label>
                                            <CInputGroup className="input-group-custom">
                                                <CInputGroupText className="bg-light">
                                                    <CIcon icon={cilLockLocked} />
                                                </CInputGroupText>
                                                <CFormInput
                                                    type="password"
                                                    name="mdp"
                                                    value={formData.mdp}
                                                    onChange={handleChange}
                                                    placeholder="Entrez le mot de passe"
                                                    isInvalid={!!errors.mdp}
                                                    className="form-control-lg"
                                                />
                                            </CInputGroup>
                                            {errors.mdp && (
                                                <small className="text-danger d-block mt-2"><strong>{errors.mdp}</strong></small>
                                            )}
                                            <small className="text-muted d-block mt-2">Minimum 6 caractères</small>
                                        </CCol>
                                    </CRow>

                                    <CRow className="g-4 mb-4">
                                        <CCol lg="6">
                                            <label className="form-label fw-semibold">Confirmer le mot de passe <span className="text-danger">*</span></label>
                                            <CInputGroup className="input-group-custom">
                                                <CInputGroupText className="bg-light">
                                                    <CIcon icon={cilLockLocked} />
                                                </CInputGroupText>
                                                <CFormInput
                                                    type="password"
                                                    name="mdp_confirmation"
                                                    value={formData.mdp_confirmation}
                                                    onChange={handleChange}
                                                    placeholder="Confirmez le mot de passe"
                                                    isInvalid={!!errors.mdp_confirmation}
                                                    className="form-control-lg"
                                                />
                                            </CInputGroup>
                                            {errors.mdp_confirmation && (
                                                <small className="text-danger d-block mt-2"><strong>{errors.mdp_confirmation}</strong></small>
                                            )}
                                        </CCol>
                                    </CRow>
                                </div>

                                <div className="d-flex gap-3 pt-4 border-top">
                                    <CButton
                                        type="button"
                                        className="btn-reset"
                                        onClick={handlePreviousStep}
                                        disabled={loading}
                                    >
                                        <CIcon icon={cilChevronLeft} className="me-2" />
                                        Précédent
                                    </CButton>
                                    <CButton
                                        type="submit"
                                        className="btn-submit flex-grow-1"
                                        disabled={loading}
                                    >
                                        <CIcon icon={cilSave} className="me-2" />
                                        {loading ? 'Enregistrement en cours...' : 'Créer l\'utilisateur'}
                                    </CButton>
                                </div>
                            </CForm>
                        </CCardBody>
                    </>
                )}
            </CCard>
        </div>
    )
}
