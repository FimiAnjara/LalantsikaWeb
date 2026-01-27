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
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilSave } from '@coreui/icons'

export default function AjoutUtilisateur() {
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        role: 'user',
        statut: 'actif',
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
            nom: '',
            prenom: '',
            email: '',
            telephone: '',
            role: 'user',
            statut: 'actif',
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
                                <label className="form-label fw-semibold text-dark">Nom</label>
                                <CFormInput
                                    type="text"
                                    name="nom"
                                    value={formData.nom}
                                    onChange={handleChange}
                                    placeholder="Entrez le nom"
                                    className="rounded-3"
                                    required
                                />
                            </CCol>
                            <CCol md="6">
                                <label className="form-label fw-semibold text-dark">Prénom</label>
                                <CFormInput
                                    type="text"
                                    name="prenom"
                                    value={formData.prenom}
                                    onChange={handleChange}
                                    placeholder="Entrez le prénom"
                                    className="rounded-3"
                                    required
                                />
                            </CCol>
                        </CRow>

                        <CRow className="g-3 mb-3">
                            <CCol md="6">
                                <label className="form-label fw-semibold text-dark">Email</label>
                                <CFormInput
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="exemple@email.com"
                                    className="rounded-3"
                                    required
                                />
                            </CCol>
                            <CCol md="6">
                                <label className="form-label fw-semibold text-dark">Téléphone</label>
                                <CFormInput
                                    type="tel"
                                    name="telephone"
                                    value={formData.telephone}
                                    onChange={handleChange}
                                    placeholder="+261 XX XXX XX XX"
                                    className="rounded-3"
                                />
                            </CCol>
                        </CRow>

                        <CRow className="g-3 mb-4">
                            <CCol md="6">
                                <label className="form-label fw-semibold text-dark">Rôle</label>
                                <CFormSelect
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="rounded-3"
                                >
                                    <option value="user">Utilisateur standard</option>
                                    <option value="superviseur">Superviseur</option>
                                    <option value="admin">Administrateur</option>
                                </CFormSelect>
                            </CCol>
                            <CCol md="6">
                                <label className="form-label fw-semibold text-dark">Statut</label>
                                <CFormSelect
                                    name="statut"
                                    value={formData.statut}
                                    onChange={handleChange}
                                    className="rounded-3"
                                >
                                    <option value="actif">Actif</option>
                                    <option value="inactif">Inactif</option>
                                    <option value="suspendu">Suspendu</option>
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
