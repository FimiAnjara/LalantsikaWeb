import { useState } from 'react'
import {
    CCard,
    CCardBody,
    CCardHeader,
    CTable,
    CTableHead,
    CTableBody,
    CTableRow,
    CTableDataCell,
    CTableHeaderCell,
    CButton,
    CFormInput,
    CRow,
    CCol,
    CContainer,
    CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilList, cilPencil, cilTrash, cilPlus, cilSearch } from '@coreui/icons'

export default function ListeUtilisateur() {
    const [searchTerm, setSearchTerm] = useState('')
    const [utilisateurs, setUtilisateurs] = useState([
        {
            id_utilisateur: 1,
            identifiant: 'john_doe',
            nom: 'Doe',
            prenom: 'John',
            email: 'john@example.com',
            sexe: 'Masculin',
            type_utilisateur: 'Administrateur',
        },
        {
            id_utilisateur: 2,
            identifiant: 'jane_smith',
            nom: 'Smith',
            prenom: 'Jane',
            email: 'jane@example.com',
            sexe: 'Féminin',
            type_utilisateur: 'Manager',
        },
        {
            id_utilisateur: 3,
            identifiant: 'bob_wilson',
            nom: 'Wilson',
            prenom: 'Bob',
            email: 'bob@example.com',
            sexe: 'Masculin',
            type_utilisateur: 'Utilisateur',
        },
    ])

    const getTypeColor = (type) => {
        switch (type) {
            case 'Administrateur':
                return 'danger'
            case 'Manager':
                return 'warning'
            case 'Utilisateur':
                return 'info'
            default:
                return 'secondary'
        }
    }

    const getSexeColor = (sexe) => {
        return sexe === 'Masculin' ? 'primary' : 'success'
    }

    const filteredUtilisateurs = utilisateurs.filter((user) =>
        user.identifiant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleDelete = (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) {
            setUtilisateurs(utilisateurs.filter((user) => user.id_utilisateur !== id))
        }
    }

    return (
        <div className="liste-utilisateur">
            <h2 className="mb-4 text-dark fw-bold">
                <CIcon icon={cilList} className="me-2" />
                Liste des utilisateurs
            </h2>

            {/* Barre de recherche */}
            <CRow className="mb-4 g-2 align-items-end">
                <CCol md="6">
                    <label className="form-label fw-semibold text-dark">Rechercher</label>
                    <div className="input-group rounded-3 overflow-hidden">
                        <span className="input-group-text bg-light border-0">
                            <CIcon icon={cilSearch} />
                        </span>
                        <CFormInput
                            type="text"
                            placeholder="Rechercher par identifiant, nom, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="rounded-3 border-0"
                        />
                    </div>
                </CCol>
                <CCol md="6" className="text-md-end">
                    <CButton
                        color="success"
                        href="/manager/utilisateurs/ajout"
                        className="rounded-3 px-4 fw-bold d-flex align-items-center ms-auto"
                    >
                        <CIcon icon={cilPlus} className="me-2" />
                        Ajouter un utilisateur
                    </CButton>
                </CCol>
            </CRow>

            {/* Tableau des utilisateurs */}
            <CCard className="shadow-sm border-0 rounded-4">
                <CCardHeader className="bg-light border-bottom border-secondary py-3">
                    <h5 className="mb-0 text-dark fw-bold">
                        Total: {filteredUtilisateurs.length} utilisateur(s)
                    </h5>
                </CCardHeader>
                <CCardBody className="p-0">
                    {filteredUtilisateurs.length > 0 ? (
                        <CTable responsive hover className="mb-0">
                            <CTableHead>
                                <CTableRow className="bg-light">
                                    <CTableHeaderCell className="fw-bold text-dark">Identifiant</CTableHeaderCell>
                                    <CTableHeaderCell className="fw-bold text-dark">Nom</CTableHeaderCell>
                                    <CTableHeaderCell className="fw-bold text-dark">Prénom</CTableHeaderCell>
                                    <CTableHeaderCell className="fw-bold text-dark">Email</CTableHeaderCell>
                                    <CTableHeaderCell className="fw-bold text-dark">Sexe</CTableHeaderCell>
                                    <CTableHeaderCell className="fw-bold text-dark">Type</CTableHeaderCell>
                                    <CTableHeaderCell className="fw-bold text-dark text-center">Actions</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                {filteredUtilisateurs.map((user) => (
                                    <CTableRow key={user.id_utilisateur}>
                                        <CTableDataCell className="fw-semibold text-dark">{user.identifiant}</CTableDataCell>
                                        <CTableDataCell>{user.nom}</CTableDataCell>
                                        <CTableDataCell>{user.prenom}</CTableDataCell>
                                        <CTableDataCell className="text-secondary">{user.email}</CTableDataCell>
                                        <CTableDataCell>
                                            <CBadge color={getSexeColor(user.sexe)} className="rounded-pill px-3 py-2">
                                                {user.sexe}
                                            </CBadge>
                                        </CTableDataCell>
                                        <CTableDataCell>
                                            <CBadge color={getTypeColor(user.type_utilisateur)} className="rounded-pill px-3 py-2">
                                                {user.type_utilisateur}
                                            </CBadge>
                                        </CTableDataCell>
                                        <CTableDataCell className="text-center">
                                            <CButton
                                                color="primary"
                                                size="sm"
                                                variant="outline"
                                                className="rounded-2 me-2 d-inline-flex align-items-center"
                                                title="Modifier"
                                            >
                                                <CIcon icon={cilPencil} />
                                            </CButton>
                                            <CButton
                                                color="danger"
                                                size="sm"
                                                variant="outline"
                                                className="rounded-2 d-inline-flex align-items-center"
                                                onClick={() => handleDelete(user.id_utilisateur)}
                                                title="Supprimer"
                                            >
                                                <CIcon icon={cilTrash} />
                                            </CButton>
                                        </CTableDataCell>
                                    </CTableRow>
                                ))}
                            </CTableBody>
                        </CTable>
                    ) : (
                        <div className="p-4 text-center text-secondary">
                            <p className="mb-0">Aucun utilisateur trouvé</p>
                        </div>
                    )}
                </CCardBody>
            </CCard>
        </div>
    )
}
