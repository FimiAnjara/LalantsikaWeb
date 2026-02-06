import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    CCard,
    CCardBody,
    CCardHeader,
    CFormInput,
    CFormSelect,
    CButton,
    CForm,
    CFormLabel,
    CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilCheckAlt, cilX, cilUser } from '@coreui/icons'
import { ErrorModal, SuccessModal, LoadingSpinner } from '../../../../components/ui'
import { ENDPOINTS, getAuthHeaders, API_BASE_URL } from '../../../../config/api'
import './Modifier.css'

export default function ModifierUtilisateur() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' })
    const [successModal, setSuccessModal] = useState({ visible: false, title: '', message: '' })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [sexes, setSexes] = useState([])
    const [typesUtilisateurs, setTypesUtilisateurs] = useState([])
    const [formData, setFormData] = useState({
        identifiant: '',
        nom: '',
        prenom: '',
        email: '',
        dtn: '',
        id_sexe: '',
        id_type_utilisateur: '',
        photo: null,
        current_photo_url: '',
    })
    const [photoPreview, setPhotoPreview] = useState(null)
    const [errors, setErrors] = useState({})

    // Helper pour construire l'URL de la photo (locale ou externe)
    const getPhotoUrl = (photoUrl) => {
        if (!photoUrl) return null
        if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
            return photoUrl
        }
        return `${API_BASE_URL}${photoUrl}`
    }

    // Récupérer les données de l'utilisateur
    useEffect(() => {
        fetchUser()
        fetchSexes()
        fetchTypesUtilisateurs()
    }, [id])

    const fetchUser = async () => {
        setLoading(true)
        try {
            const response = await fetch(ENDPOINTS.USER(id), {
                headers: getAuthHeaders()
            })

            const result = await response.json()

            if (result.success && result.data) {
                setFormData({
                    identifiant: result.data.identifiant || '',
                    nom: result.data.nom || '',
                    prenom: result.data.prenom || '',
                    email: result.data.email || '',
                    dtn: result.data.dtn || '',
                    id_sexe: result.data.sexe?.id_sexe || '',
                    id_type_utilisateur: result.data.type_utilisateur?.id_type_utilisateur || '',
                    photo: null,
                    current_photo_url: result.data.photo_url || '',
                })
            } else {
                setErrorModal({
                    visible: true,
                    title: 'Erreur',
                    message: result.message || 'Utilisateur non trouvé'
                })
            }
        } catch (error) {
            console.error('Erreur:', error)
            setErrorModal({
                visible: true,
                title: 'Erreur',
                message: 'Impossible de charger les données de l\'utilisateur'
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchSexes = async () => {
        try {
            const response = await fetch(ENDPOINTS.SEXES, {
                headers: getAuthHeaders()
            })

            const result = await response.json()
            if (result.data) {
                setSexes(result.data)
            }
        } catch (error) {
            console.error('Erreur lors du chargement des sexes:', error)
        }
    }

    const fetchTypesUtilisateurs = async () => {
        try {
            const response = await fetch(ENDPOINTS.USER_TYPES, {
                headers: getAuthHeaders()
            })

            const result = await response.json()
            if (result.data) {
                setTypesUtilisateurs(result.data)
            }
        } catch (error) {
            console.error('Erreur lors du chargement des types:', error)
        }
    }

    const handleInputChange = (e) => {
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
            setFormData({ ...formData, [name]: value })
        }
        
        // Effacer l'erreur du champ
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' })
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        setErrors({})

        try {
            // Créer FormData pour l'upload de fichier
            const formDataToSend = new FormData()
            formDataToSend.append('_method', 'PUT') // Important pour Laravel
            formDataToSend.append('nom', formData.nom)
            formDataToSend.append('prenom', formData.prenom)
            formDataToSend.append('email', formData.email)
            formDataToSend.append('dtn', formData.dtn)
            
            if (formData.id_sexe) {
                formDataToSend.append('id_sexe', parseInt(formData.id_sexe))
            }
            if (formData.id_type_utilisateur) {
                formDataToSend.append('id_type_utilisateur', parseInt(formData.id_type_utilisateur))
            }
            if (formData.photo) {
                formDataToSend.append('photo', formData.photo)
            }

            // Récupérer le token
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')

            const response = await fetch(ENDPOINTS.USER(id), {
                method: 'POST', // Laravel utilise POST avec _method pour PUT avec FormData
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Ne pas définir Content-Type, le navigateur le fera avec le boundary
                },
                body: formDataToSend,
            })

            const result = await response.json()

            if (result.success) {
                setSuccessModal({
                    visible: true,
                    title: 'Succès',
                    message: 'Utilisateur modifié avec succès'
                })
                
                // Rediriger après 2 secondes
                setTimeout(() => {
                    navigate('/manager/utilisateurs/liste')
                }, 2000)
            } else {
                if (result.data?.errors) {
                    setErrors(result.data.errors)
                }
                setErrorModal({
                    visible: true,
                    title: 'Erreur',
                    message: result.message || 'Erreur lors de la modification'
                })
            }
        } catch (error) {
            console.error('Erreur:', error)
            setErrorModal({
                visible: true,
                title: 'Erreur',
                message: 'Erreur lors de la modification'
            })
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        navigate('/manager/utilisateurs/liste')
    }

    if (loading) {
        return <LoadingSpinner message="Chargement de l'utilisateur..." />
    }

    return (
        <div className="modifier-utilisateur">
            <div className="page-header d-flex align-items-center gap-3 mb-4">
                <button 
                    className="btn-back"
                    onClick={handleCancel}
                    title="Retour"
                >
                    <CIcon icon={cilArrowLeft} size="lg" />
                </button>
                <div className="header-icon">
                    <CIcon icon={cilUser} size="lg" />
                </div>
                <div>
                    <h2 className="mb-0">Modifier utilisateur</h2>
                    <small className="text-muted">Mettre à jour les informations utilisateur</small>
                </div>
            </div>

            <CCard className="form-card">
                <CCardHeader className="form-header">
                    <h5 className="mb-0">Informations de l'utilisateur</h5>
                </CCardHeader>
                <CCardBody>
                    <CForm onSubmit={handleSave}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <CFormLabel htmlFor="identifiant" className="form-label">
                                    Identifiant
                                </CFormLabel>
                                <CFormInput
                                    id="identifiant"
                                    name="identifiant"
                                    value={formData.identifiant}
                                    onChange={handleInputChange}
                                    disabled
                                    className="form-input"
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <CFormLabel htmlFor="email" className="form-label">
                                    Email <span className="text-danger">*</span>
                                </CFormLabel>
                                <CFormInput
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                    invalid={!!errors.email}
                                />
                                {errors.email && <small className="text-danger">{errors.email}</small>}
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <CFormLabel htmlFor="prenom" className="form-label">
                                    Prénom <span className="text-danger">*</span>
                                </CFormLabel>
                                <CFormInput
                                    id="prenom"
                                    name="prenom"
                                    value={formData.prenom}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                    invalid={!!errors.prenom}
                                />
                                {errors.prenom && <small className="text-danger">{errors.prenom}</small>}
                            </div>
                            <div className="col-md-6 mb-3">
                                <CFormLabel htmlFor="nom" className="form-label">
                                    Nom <span className="text-danger">*</span>
                                </CFormLabel>
                                <CFormInput
                                    id="nom"
                                    name="nom"
                                    value={formData.nom}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                    invalid={!!errors.nom}
                                />
                                {errors.nom && <small className="text-danger">{errors.nom}</small>}
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <CFormLabel htmlFor="dtn" className="form-label">
                                    Date de naissance
                                </CFormLabel>
                                <CFormInput
                                    id="dtn"
                                    name="dtn"
                                    type="date"
                                    value={formData.dtn}
                                    onChange={handleInputChange}
                                    className="form-input"
                                />
                            </div>
                            <div className="col-md-4 mb-3">
                                <CFormLabel htmlFor="id_sexe" className="form-label">
                                    Sexe
                                </CFormLabel>
                                <CFormSelect
                                    id="id_sexe"
                                    name="id_sexe"
                                    value={formData.id_sexe}
                                    onChange={handleInputChange}
                                    className="form-select"
                                >
                                    <option value="">Sélectionner</option>
                                    {sexes.map(sexe => (
                                        <option key={sexe.id_sexe} value={sexe.id_sexe}>
                                            {sexe.libelle}
                                        </option>
                                    ))}
                                </CFormSelect>
                            </div>
                            <div className="col-md-4 mb-3">
                                <CFormLabel htmlFor="id_type_utilisateur" className="form-label">
                                    Type d'utilisateur
                                </CFormLabel>
                                <CFormSelect
                                    id="id_type_utilisateur"
                                    name="id_type_utilisateur"
                                    value={formData.id_type_utilisateur}
                                    onChange={handleInputChange}
                                    className="form-select"
                                >
                                    <option value="">Sélectionner</option>
                                    {typesUtilisateurs.map(type => (
                                        <option key={type.id_type_utilisateur} value={type.id_type_utilisateur}>
                                            {type.libelle}
                                        </option>
                                    ))}
                                </CFormSelect>
                            </div>
                        </div>

                        {/* Photo Upload */}
                        <div className="row mb-4">
                            <div className="col-12">
                                <CFormLabel htmlFor="photo" className="form-label">
                                    Photo de profil
                                </CFormLabel>
                                <CFormInput
                                    id="photo"
                                    name="photo"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleInputChange}
                                    className="form-input"
                                />
                                <small className="text-muted">Maximum 5MB - Formats acceptés: JPG, PNG, GIF</small>
                                
                                {/* Aperçu de la photo */}
                                <div className="mt-3">
                                    {photoPreview ? (
                                        <div>
                                            <p className="mb-2"><strong>Nouvelle photo :</strong></p>
                                            <img 
                                                src={photoPreview} 
                                                alt="Aperçu" 
                                                style={{ 
                                                    width: '120px', 
                                                    height: '120px', 
                                                    objectFit: 'cover', 
                                                    borderRadius: '50%',
                                                    border: '3px solid #0f3460'
                                                }} 
                                            />
                                        </div>
                                    ) : formData.current_photo_url ? (
                                        <div>
                                            <p className="mb-2"><strong>Photo actuelle :</strong></p>
                                            <img 
                                                src={getPhotoUrl(formData.current_photo_url)} 
                                                alt="Photo actuelle" 
                                                style={{ 
                                                    width: '120px', 
                                                    height: '120px', 
                                                    objectFit: 'cover', 
                                                    borderRadius: '50%',
                                                    border: '3px solid #e0e0e0'
                                                }} 
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-muted">
                                            <p>Aucune photo</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="form-actions mt-4">
                            <CButton
                                color="primary"
                                type="submit"
                                className="btn-save"
                                disabled={saving}
                            >
                                {saving ? (
                                    <CSpinner size="sm" className="me-2" />
                                ) : (
                                    <CIcon icon={cilCheckAlt} className="me-2" />
                                )}
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </CButton>
                            <CButton
                                color="secondary"
                                type="button"
                                onClick={handleCancel}
                                className="btn-cancel"
                                disabled={saving}
                            >
                                <CIcon icon={cilX} className="me-2" />
                                Annuler
                            </CButton>
                        </div>
                    </CForm>
                </CCardBody>
            </CCard>

            {/* Success Modal */}
            <SuccessModal
                visible={successModal.visible}
                title={successModal.title}
                message={successModal.message}
                onClose={() => setSuccessModal({ ...successModal, visible: false })}
            />

            {/* Error Modal */}
            <ErrorModal
                visible={errorModal.visible}
                title={errorModal.title}
                message={errorModal.message}
                onClose={() => setErrorModal({ ...errorModal, visible: false })}
            />
        </div>
    )
}
