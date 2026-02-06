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
    CProgress,
    CSpinner,
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
} from '@coreui/icons'
import { ErrorModal, SuccessModal } from '../../../../components/ui'
import { ENDPOINTS, getAuthHeaders } from '../../../../config/api'
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
        photo: null,
    })
    const [photoPreview, setPhotoPreview] = useState(null)
    const [loading, setLoading] = useState(false)
    const [successModal, setSuccessModal] = useState({ visible: false, message: '' })
    const [errorModal, setErrorModal] = useState({ visible: false, message: '' })
    const [errors, setErrors] = useState({})

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
                const response = await fetch(ENDPOINTS.SEXES, {
                    method: 'GET',
                    headers: getAuthHeaders()
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
        const { name, value, type, files } = e.target
        
        if (type === 'file') {
            const file = files[0]
            if (file) {
                setFormData({
                    ...formData,
                    photo: file,
                })
                // Créer un aperçu de l'image
                const reader = new FileReader()
                reader.onloadend = () => {
                    setPhotoPreview(reader.result)
                }
                reader.readAsDataURL(file)
            }
        } else {
            setFormData({
                ...formData,
                [name]: value,
            })
        }
        
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
        }
    }

    const handlePreviousStep = () => {
        setStep(1)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!validateStep2()) {
            return
        }

        setLoading(true)

        try {
            // Récupérer le token du localStorage ou sessionStorage
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
            
            console.log('Token trouvé:', token ? 'Oui' : 'Non')
            console.log('Token (premiers 50 chars):', token?.substring(0, 50))
            
            if (!token) {
                setErrorModal({ 
                    visible: true, 
                    message: 'Session expirée. Veuillez vous reconnecter.'
                })
                setLoading(false)
                return
            }
            
            // Créer FormData pour l'upload de fichier
            const formDataToSend = new FormData()
            formDataToSend.append('identifiant', formData.identifiant)
            formDataToSend.append('mdp', formData.mdp)
            formDataToSend.append('mdp_confirmation', formData.mdp_confirmation)
            formDataToSend.append('nom', formData.nom)
            formDataToSend.append('prenom', formData.prenom)
            formDataToSend.append('dtn', formData.dtn)
            formDataToSend.append('email', formData.email)
            formDataToSend.append('id_sexe', parseInt(formData.id_sexe))
            
            if (formData.photo) {
                formDataToSend.append('photo', formData.photo)
            }
            
            const response = await fetch(ENDPOINTS.REGISTER, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Ne pas définir Content-Type, le navigateur le fera automatiquement avec le boundary
                },
                body: formDataToSend,
            })

            const data = await response.json()

            if (!response.ok) {
                const error = new Error(data.message || 'Erreur lors de l\'enregistrement')
                // Ajouter les erreurs de validation du serveur
                if (!data.success) {
                    error.validationErrors = data.data.errors
                }
                throw error
            }
            if (!data.success) {
                const error = new Error(data.message || 'Erreur lors de l\'enregistrement')
                error.validationErrors = data.data.errors
                throw error
            }

            setSuccessModal({ 
                visible: true, 
                message: 'Utilisateur créé avec succès! ' + (data.data?.sync_message || '') 
            })
            
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
                photo: null,
            })
            setPhotoPreview(null)
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
            setErrorModal({ 
                visible: true, 
                message: error.message || 'Une erreur est survenue'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="ajout-utilisateur">
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

            <CCard className="form-card">
                <CCardHeader className="form-card-header">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <CIcon icon={cilUser} className="me-2" />
                            {step === 1 ? 'Informations utilisateur' : 'Configuration du mot de passe'}
                        </div>
                        <small className="text-muted">Étape {step}/2</small>
                    </div>
                    <CProgress value={step * 50} className="mt-2" />
                </CCardHeader>
                <CCardBody className="p-3 p-md-4">
                    <CForm onSubmit={handleSubmit}>
                        {step === 1 ? (
                            <>
                                <CRow className="g-4 mb-4">
                                    <CCol lg="6">
                                        <label className="form-label">Identifiant <span className="text-danger">*</span></label>
                                        <CInputGroup className="input-group-custom">
                                            <CInputGroupText>
                                                <CIcon icon={cilUser} />
                                            </CInputGroupText>
                                            <CFormInput
                                                type="text"
                                                name="identifiant"
                                                value={formData.identifiant}
                                                onChange={handleChange}
                                                placeholder="Entrez l'identifiant"
                                                isInvalid={!!errors.identifiant}
                                            />
                                        </CInputGroup>
                                        {errors.identifiant && (
                                            <small className="text-danger">{errors.identifiant}</small>
                                        )}
                                    </CCol>
                                    <CCol lg="6">
                                    </CCol>
                                </CRow>

                                <CRow className="g-4 mb-4">
                                    <CCol lg="6">
                                        <label className="form-label">Nom <span className="text-danger">*</span></label>
                                        <CInputGroup className="input-group-custom">
                                            <CInputGroupText>
                                                <CIcon icon={cilUser} />
                                            </CInputGroupText>
                                            <CFormInput
                                                type="text"
                                                name="nom"
                                                value={formData.nom}
                                                onChange={handleChange}
                                                placeholder="Entrez le nom"
                                                isInvalid={!!errors.nom}
                                            />
                                        </CInputGroup>
                                        {errors.nom && (
                                            <small className="text-danger">{errors.nom}</small>
                                        )}
                                    </CCol>
                                    <CCol lg="6">
                                        <label className="form-label">Prénom <span className="text-danger">*</span></label>
                                        <CInputGroup className="input-group-custom">
                                            <CInputGroupText>
                                                <CIcon icon={cilUser} />
                                            </CInputGroupText>
                                            <CFormInput
                                                type="text"
                                                name="prenom"
                                                value={formData.prenom}
                                                onChange={handleChange}
                                                placeholder="Entrez le prénom"
                                                isInvalid={!!errors.prenom}
                                            />
                                        </CInputGroup>
                                        {errors.prenom && (
                                            <small className="text-danger">{errors.prenom}</small>
                                        )}
                                    </CCol>
                                </CRow>

                                <CRow className="g-4 mb-4">
                                    <CCol lg="6">
                                        <label className="form-label">Date de naissance <span className="text-danger">*</span></label>
                                        <CInputGroup className="input-group-custom">
                                            <CInputGroupText>
                                                <CIcon icon={cilCalendar} />
                                            </CInputGroupText>
                                            <CFormInput
                                                type="date"
                                                name="dtn"
                                                value={formData.dtn}
                                                onChange={handleChange}
                                                isInvalid={!!errors.dtn}
                                            />
                                        </CInputGroup>
                                        {errors.dtn && (
                                            <small className="text-danger">{errors.dtn}</small>
                                        )}
                                    </CCol>
                                    <CCol lg="6">
                                        <label className="form-label">Sexe <span className="text-danger">*</span></label>
                                        <CInputGroup className="input-group-custom">
                                            <CInputGroupText>
                                                <CIcon icon={cilPeople} />
                                            </CInputGroupText>
                                            <CFormSelect
                                                name="id_sexe"
                                                value={formData.id_sexe}
                                                onChange={handleChange}
                                                isInvalid={!!errors.id_sexe}
                                                disabled={sexesLoading}
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
                                            <small className="text-danger">{errors.id_sexe}</small>
                                        )}
                                    </CCol>
                                </CRow>

                                <div className="d-flex gap-3 pt-3 border-top">
                                    <CButton
                                        type="button"
                                        className="btn-submit"
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
                            </>
                        ) : (
                            <>
                                <div className="alert alert-info mb-4">
                                    <strong>{formData.prenom} {formData.nom}</strong>
                                </div>

                                <CRow className="g-4 mb-4">
                                    <CCol lg="6">
                                        <label className="form-label">Email <span className="text-danger">*</span></label>
                                        <CInputGroup className="input-group-custom">
                                            <CInputGroupText>
                                                <CIcon icon={cilEnvelopeOpen} />
                                            </CInputGroupText>
                                            <CFormInput
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="exemple@email.com"
                                                isInvalid={!!errors.email}
                                            />
                                        </CInputGroup>
                                        {errors.email && (
                                            <small className="text-danger">{errors.email}</small>
                                        )}
                                    </CCol>
                                    <CCol lg="6">
                                        <label className="form-label">Photo de profil (optionnel)</label>
                                        <CFormInput
                                            type="file"
                                            name="photo"
                                            accept="image/*"
                                            onChange={handleChange}
                                        />
                                        {photoPreview && (
                                            <div className="mt-3">
                                                <img 
                                                    src={photoPreview} 
                                                    alt="Aperçu" 
                                                    style={{ 
                                                        maxWidth: '150px', 
                                                        maxHeight: '150px', 
                                                        borderRadius: '8px',
                                                        objectFit: 'cover'
                                                    }} 
                                                />
                                            </div>
                                        )}
                                    </CCol>
                                </CRow>

                                <CRow className="g-4 mb-4">
                                    <CCol lg="6">
                                        <label className="form-label">Mot de passe <span className="text-danger">*</span></label>
                                        <CInputGroup className="input-group-custom">
                                            <CInputGroupText>
                                                <CIcon icon={cilLockLocked} />
                                            </CInputGroupText>
                                            <CFormInput
                                                type="password"
                                                name="mdp"
                                                value={formData.mdp}
                                                onChange={handleChange}
                                                placeholder="Entrez le mot de passe"
                                                isInvalid={!!errors.mdp}
                                            />
                                        </CInputGroup>
                                        {errors.mdp && (
                                            <small className="text-danger">{errors.mdp}</small>
                                        )}
                                    </CCol>
                                </CRow>

                                <CRow className="g-4 mb-4">
                                    <CCol lg="6">
                                        <label className="form-label">Confirmer le mot de passe <span className="text-danger">*</span></label>
                                        <CInputGroup className="input-group-custom">
                                            <CInputGroupText>
                                                <CIcon icon={cilLockLocked} />
                                            </CInputGroupText>
                                            <CFormInput
                                                type="password"
                                                name="mdp_confirmation"
                                                value={formData.mdp_confirmation}
                                                onChange={handleChange}
                                                placeholder="Confirmez le mot de passe"
                                                isInvalid={!!errors.mdp_confirmation}
                                            />
                                        </CInputGroup>
                                        {errors.mdp_confirmation && (
                                            <small className="text-danger">{errors.mdp_confirmation}</small>
                                        )}
                                    </CCol>
                                </CRow>

                                <div className="d-flex gap-3 pt-3 border-top">
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
                                        className="btn-submit"
                                        disabled={loading}
                                    >
                                        <CIcon icon={cilSave} className="me-2" />
                                        {loading ? 'Enregistrement en cours...' : 'Créer l\'utilisateur'}
                                    </CButton>
                                </div>
                            </>
                        )}
                    </CForm>
                </CCardBody>
            </CCard>

            {/* Success Modal */}
            <SuccessModal
                visible={successModal.visible}
                title="Succès"
                message={successModal.message}
                onClose={() => setSuccessModal({ visible: false, message: '' })}
            />

            {/* Error Modal */}
            <ErrorModal
                visible={errorModal.visible}
                title="Erreur"
                message={errorModal.message}
                onClose={() => setErrorModal({ visible: false, message: '' })}
            />
        </div>
    )
}
