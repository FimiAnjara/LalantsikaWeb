import { useState } from 'react'
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
    cilBadge,
} from '@coreui/icons'
import './Ajout.css'

export default function AjoutUtilisateur() {
    const [formData, setFormData] = useState({
        identifiant: '',
        mdp: '',
        nom: '',
        prenom: '',
        dtn: '',
        email: '',
        id_sexe: '',
        id_type_utilisateur: '',
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            [name]: value,
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        console.log('Données du formulaire:', formData)
        alert('Utilisateur ajouté avec succès!')
        setFormData({
            identifiant: '',
            mdp: '',
            nom: '',
            prenom: '',
            dtn: '',
            email: '',
            id_sexe: '',
            id_type_utilisateur: '',
        })
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
                    <CIcon icon={cilUser} className="me-2" />
                    Informations utilisateur
                </CCardHeader>
                <CCardBody className="p-4">
                    <CForm onSubmit={handleSubmit}>
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
                                        required
                                    />
                                </CInputGroup>
                            </CCol>
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
                                        required
                                    />
                                </CInputGroup>
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
                                        required
                                    />
                                </CInputGroup>
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
                                        required
                                    />
                                </CInputGroup>
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
                                        required
                                    />
                                </CInputGroup>
                            </CCol>
                            <CCol lg="6">
                                <label className="form-label">Email</label>
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
                                    />
                                </CInputGroup>
                            </CCol>
                        </CRow>

                        <CRow className="g-4 mb-4">
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
                                        required
                                    >
                                        <option value="">Sélectionnez un sexe</option>
                                        <option value="1">Masculin</option>
                                        <option value="2">Féminin</option>
                                    </CFormSelect>
                                </CInputGroup>
                            </CCol>
                            <CCol lg="6">
                                <label className="form-label">Type d'utilisateur <span className="text-danger">*</span></label>
                                <CInputGroup className="input-group-custom">
                                    <CInputGroupText>
                                        <CIcon icon={cilBadge} />
                                    </CInputGroupText>
                                    <CFormSelect
                                        name="id_type_utilisateur"
                                        value={formData.id_type_utilisateur}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Sélectionnez un type</option>
                                        <option value="1">Administrateur</option>
                                        <option value="2">Manager</option>
                                        <option value="3">Utilisateur</option>
                                    </CFormSelect>
                                </CInputGroup>
                            </CCol>
                        </CRow>

                        <div className="d-flex gap-3 pt-3 border-top">
                            <CButton
                                type="submit"
                                className="btn-submit"
                            >
                                <CIcon icon={cilSave} className="me-2" />
                                Enregistrer
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
            </CCard>
        </div>
    )
}
