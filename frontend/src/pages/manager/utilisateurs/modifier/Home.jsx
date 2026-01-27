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
    const [formData, setFormData] = useState({
        identifiant: '',
        nom: '',
        prenom: '',
        email: '',
        sexe: '',
        type_utilisateur: '',
        statut: '',
    })

    // Mock data - remplacer par API call
    useEffect(() => {
        // Simuler un appel API
        const mockUser = {
            id_utilisateur: parseInt(id),
            identifiant: 'john_doe',
            nom: 'Doe',
            prenom: 'John',
            email: 'john@example.com',
            sexe: 'Masculin',
            type_utilisateur: 'Utilisateur',
            statut: 'actif',
        }
        
        setFormData(mockUser)
        setLoading(false)
    }, [id])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })
    }

    const handleSave = (e) => {
        e.preventDefault()
        // Simuler l'appel API
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
    }

    const handleCancel = () => {
        navigate('/manager/utilisateurs/liste')
    }

    if (loading) {
        return <div className="text-center py-5">Chargement...</div>
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
                                    Email
                                </CFormLabel>
                                <CFormInput
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <CFormLabel htmlFor="prenom" className="form-label">
                                    Prénom
                                </CFormLabel>
                                <CFormInput
                                    id="prenom"
                                    name="prenom"
                                    value={formData.prenom}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <CFormLabel htmlFor="nom" className="form-label">
                                    Nom
                                </CFormLabel>
                                <CFormInput
                                    id="nom"
                                    name="nom"
                                    value={formData.nom}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <CFormLabel htmlFor="sexe" className="form-label">
                                    Sexe
                                </CFormLabel>
                                <CFormSelect
                                    id="sexe"
                                    name="sexe"
                                    value={formData.sexe}
                                    onChange={handleInputChange}
                                    className="form-select"
                                    required
                                >
                                    <option value="">Sélectionner</option>
                                    <option value="Masculin">Masculin</option>
                                    <option value="Féminin">Féminin</option>
                                </CFormSelect>
                            </div>
                            <div className="col-md-4 mb-3">
                                <CFormLabel htmlFor="type_utilisateur" className="form-label">
                                    Type d'utilisateur
                                </CFormLabel>
                                <CFormSelect
                                    id="type_utilisateur"
                                    name="type_utilisateur"
                                    value={formData.type_utilisateur}
                                    onChange={handleInputChange}
                                    className="form-select"
                                    required
                                >
                                    <option value="">Sélectionner</option>
                                    <option value="Administrateur">Administrateur</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Utilisateur">Utilisateur</option>
                                </CFormSelect>
                            </div>
                            <div className="col-md-4 mb-3">
                                <CFormLabel htmlFor="statut" className="form-label">
                                    Statut
                                </CFormLabel>
                                <CFormSelect
                                    id="statut"
                                    name="statut"
                                    value={formData.statut}
                                    onChange={handleInputChange}
                                    className="form-select"
                                    required
                                >
                                    <option value="">Sélectionner</option>
                                    <option value="actif">Actif</option>
                                    <option value="bloque">Bloqué</option>
                                </CFormSelect>
                            </div>
                        </div>

                        <div className="form-actions mt-4">
                            <CButton
                                color="primary"
                                type="submit"
                                className="btn-save"
                            >
                                <CIcon icon={cilCheckAlt} className="me-2" />
                                Enregistrer
                            </CButton>
                            <CButton
                                color="secondary"
                                type="button"
                                onClick={handleCancel}
                                className="btn-cancel"
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
