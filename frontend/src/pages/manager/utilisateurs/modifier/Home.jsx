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
import Modal from '../../../../components/Modal'
import './Modifier.css'

export default function ModifierUtilisateur() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [modal, setModal] = useState({ visible: false, type: 'success', title: '', message: '' })
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
    })
    const [errors, setErrors] = useState({})

    // Récupérer les données de l'utilisateur
    useEffect(() => {
        fetchUser()
        fetchSexes()
        fetchTypesUtilisateurs()
    }, [id])

    const fetchUser = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
            const response = await fetch(`http://localhost:8000/api/utilisateurs/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
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
                })
            } else {
                setModal({
                    visible: true,
                    type: 'danger',
                    title: 'Erreur',
                    message: result.message || 'Utilisateur non trouvé'
                })
            }
        } catch (error) {
            console.error('Erreur:', error)
            setModal({
                visible: true,
                type: 'danger',
                title: 'Erreur',
                message: 'Impossible de charger les données de l\'utilisateur'
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchSexes = async () => {
        try {
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
            const response = await fetch('http://localhost:8000/api/sexes', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
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
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
            const response = await fetch('http://localhost:8000/api/types-utilisateurs', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
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
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })
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
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
            const response = await fetch(`http://localhost:8000/api/utilisateurs/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nom: formData.nom,
                    prenom: formData.prenom,
                    email: formData.email,
                    dtn: formData.dtn,
                    id_sexe: formData.id_sexe ? parseInt(formData.id_sexe) : null,
                    id_type_utilisateur: formData.id_type_utilisateur ? parseInt(formData.id_type_utilisateur) : null,
                })
            })

            const result = await response.json()

            if (result.success) {
                setModal({
                    visible: true,
                    type: 'success',
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
                setModal({
                    visible: true,
                    type: 'danger',
                    title: 'Erreur',
                    message: result.message || 'Erreur lors de la modification'
                })
            }
        } catch (error) {
            console.error('Erreur:', error)
            setModal({
                visible: true,
                type: 'danger',
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
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <CSpinner color="primary" />
            </div>
        )
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
            <Modal
                visible={modal.visible}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                onClose={() => setModal({ ...modal, visible: false })}
            />
        </div>
    )
}
