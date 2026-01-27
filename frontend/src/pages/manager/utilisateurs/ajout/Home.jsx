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
} from '@coreui/icons'

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
        // Ajouter la logique d'envoi au serveur ici
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
            <h2 className="mb-4 text-dark fw-bold">
                <CIcon icon={cilPlus} className="me-2" />
                Ajouter un nouvel utilisateur
            </h2>

            <CCard className="shadow-sm border-0 rounded-4">
                <CCardHeader className="bg-light border-bottom border-secondary py-3">
                    <h5 className="mb-0 text-dark fw-bold">Informations utilisateur</h5>
                </CCardHeader>
                <CCardBody>
                    <CForm onSubmit={handleSubmit}>
                        <CRow className="g-3 mb-3">
                            <CCol md="6">
                                <label className="form-label fw-semibold text-dark">Identifiant *</label>
                                <CInputGroup className="rounded-3 overflow-hidden">
                                    <CInputGroupText className="bg-light border-0">
                                        <CIcon icon={cilUser} />
                                    </CInputGroupText>
                                    <CFormInput
                                        type="text"
                                        name="identifiant"
                                        value={formData.identifiant}
                                        onChange={handleChange}
                                        placeholder="Entrez l'identifiant"
                                        className="rounded-3 border-0"
                                        required
                                    />
                                </CInputGroup>
                            </CCol>
                            <CCol md="6">
                                <label className="form-label fw-semibold text-dark">Mot de passe *</label>
                                <CInputGroup className="rounded-3 overflow-hidden">
                                    <CInputGroupText className="bg-light border-0">
                                        <CIcon icon={cilLockLocked} />
                                    </CInputGroupText>
                                    <CFormInput
                                        type="password"
                                        name="mdp"
                                        value={formData.mdp}
                                        onChange={handleChange}
                                        placeholder="Entrez le mot de passe"
                                        className="rounded-3 border-0"
                                        required
                                    />
                                </CInputGroup>
                            </CCol>
                        </CRow>

                        <CRow className="g-3 mb-3">
                            <CCol md="6">
                                <label className="form-label fw-semibold text-dark">Nom *</label>
                                <CInputGroup className="rounded-3 overflow-hidden">
                                    <CInputGroupText className="bg-light border-0">
                                        <CIcon icon={cilUser} />
                                    </CInputGroupText>
                                    <CFormInput
                                        type="text"
                                        name="nom"
                                        value={formData.nom}
                                        onChange={handleChange}
                                        placeholder="Entrez le nom"
                                        className="rounded-3 border-0"
                                        required
                                    />
                                </CInputGroup>
                            </CCol>
                            <CCol md="6">
                                <label className="form-label fw-semibold text-dark">Prénom *</label>
                                <CInputGroup className="rounded-3 overflow-hidden">
                                    <CInputGroupText className="bg-light border-0">
                                        <CIcon icon={cilUser} />
                                    </CInputGroupText>
                                    <CFormInput
                                        type="text"
                                        name="prenom"
                                        value={formData.prenom}
                                        onChange={handleChange}
                                        placeholder="Entrez le prénom"
                                        className="rounded-3 border-0"
                                        required
                                    />
                                </CInputGroup>
                            </CCol>
                        </CRow>

                        <CRow className="g-3 mb-3">
                            <CCol md="6">
                                <label className="form-label fw-semibold text-dark">Date de naissance *</label>
                                <CInputGroup className="rounded-3 overflow-hidden">
                                    <CInputGroupText className="bg-light border-0">
                                        <CIcon icon={cilCalendar} />
                                    </CInputGroupText>
                                    <CFormInput
                                        type="date"
                                        name="dtn"
                                        value={formData.dtn}
                                        onChange={handleChange}
                                        className="rounded-3 border-0"
                                        required
                                    />
                                </CInputGroup>
                            </CCol>
                            <CCol md="6">
                                <label className="form-label fw-semibold text-dark">Email</label>
                                <CInputGroup className="rounded-3 overflow-hidden">
                                    <CInputGroupText className="bg-light border-0">
                                        <CIcon icon={cilEnvelopeOpen} />
                                    </CInputGroupText>
                                    <CFormInput
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="exemple@email.com"
                                        className="rounded-3 border-0"
                                    />
                                </CInputGroup>
                            </CCol>
                        </CRow>

                        <CRow className="g-3 mb-4">
                            <CCol md="6">
                                <label className="form-label fw-semibold text-dark">Sexe *</label>
                                <CFormSelect
                                    name="id_sexe"
                                    value={formData.id_sexe}
                                    onChange={handleChange}
                                    className="rounded-3"
                                    required
                                >
                                    <option value="">Sélectionnez un sexe</option>
                                    <option value="1">Masculin</option>
                                    <option value="2">Féminin</option>
                                </CFormSelect>
                            </CCol>
                            <CCol md="6">
                                <label className="form-label fw-semibold text-dark">Type d'utilisateur *</label>
                                <CFormSelect
                                    name="id_type_utilisateur"
                                    value={formData.id_type_utilisateur}
                                    onChange={handleChange}
                                    className="rounded-3"
                                    required
                                >
                                    <option value="">Sélectionnez un type</option>
                                    <option value="1">Administrateur</option>
                                    <option value="2">Manager</option>
                                    <option value="3">Utilisateur</option>
                                </CFormSelect>
                            </CCol>
                        </CRow>

                        <CRow className="g-2">
                            <CCol xs="auto">
                                <CButton
                                    type="submit"
                                    color="success"
                                    className="rounded-3 px-4 fw-bold d-flex align-items-center"
                                >
                                    <CIcon icon={cilSave} className="me-2" />
                                    Ajouter l'utilisateur
                                </CButton>
                            </CCol>
                            <CCol xs="auto">
                                <CButton
                                    type="reset"
                                    color="secondary"
                                    className="rounded-3 px-4 fw-bold"
                                >
                                    Réinitialiser
                                </CButton>
                            </CCol>
                        </CRow>
                    </CForm>
                </CCardBody>
            </CCard>
        </div>
    )
}
