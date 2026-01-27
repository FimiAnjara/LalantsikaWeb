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
    CBadge,
    CInputGroup,
    CInputGroupText,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilList, cilPencil, cilTrash, cilPlus, cilSearch, cilPeople } from '@coreui/icons'
import './Liste.css'

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
            <div className="page-header mb-4">
                <div className="d-flex align-items-center gap-3">
                    <div className="header-icon">
                        <CIcon icon={cilPeople} size="xl" />
                    </div>
                    <div>
                        <h2 className="mb-0 fw-bold">Liste des utilisateurs</h2>
                        <p className="text-muted mb-0">Gérer les comptes utilisateurs</p>
                    </div>
                </div>
            </div>

            {/* Barre de recherche et bouton */}
            <CRow className="mb-4 g-3 align-items-end">
                <CCol lg="6" md="8">
                    <CInputGroup className="search-input-group">
                        <CInputGroupText>
                            <CIcon icon={cilSearch} />
                        </CInputGroupText>
                        <CFormInput
                            type="text"
                            placeholder="Rechercher par identifiant, nom, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </CInputGroup>
                </CCol>
                <CCol lg="6" md="4" className="text-md-end">
                    <CButton
                        href="/manager/utilisateurs/ajout"
                        className="btn-add"
                    >
                        <CIcon icon={cilPlus} className="me-2" />
                        Ajouter
                    </CButton>
                </CCol>
            </CRow>

            {/* Tableau des utilisateurs */}
            <CCard className="table-card">
                <CCardHeader className="table-card-header">
                    <div className="d-flex justify-content-between align-items-center">
                        <span>
                            <CIcon icon={cilList} className="me-2" />
                            Utilisateurs
                        </span>
                        <CBadge color="primary" className="count-badge">
                            {filteredUtilisateurs.length} résultat(s)
                        </CBadge>
                    </div>
                </CCardHeader>
                <CCardBody className="p-0">
                    {filteredUtilisateurs.length > 0 ? (
                        <div className="table-responsive">
                            <CTable hover className="mb-0 custom-table">
                                <CTableHead>
                                    <CTableRow>
                                        <CTableHeaderCell>Identifiant</CTableHeaderCell>
                                        <CTableHeaderCell>Nom complet</CTableHeaderCell>
                                        <CTableHeaderCell>Email</CTableHeaderCell>
                                        <CTableHeaderCell className="text-center">Sexe</CTableHeaderCell>
                                        <CTableHeaderCell className="text-center">Type</CTableHeaderCell>
                                        <CTableHeaderCell className="text-center">Actions</CTableHeaderCell>
                                    </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                    {filteredUtilisateurs.map((user) => (
                                        <CTableRow key={user.id_utilisateur}>
                                            <CTableDataCell>
                                                <span className="fw-semibold text-dark">{user.identifiant}</span>
                                            </CTableDataCell>
                                            <CTableDataCell>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="avatar-circle">
                                                        {user.prenom.charAt(0)}{user.nom.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="fw-medium">{user.prenom} {user.nom}</div>
                                                    </div>
                                                </div>
                                            </CTableDataCell>
                                            <CTableDataCell>
                                                <span className="text-muted">{user.email}</span>
                                            </CTableDataCell>
                                            <CTableDataCell className="text-center">
                                                <CBadge color={getSexeColor(user.sexe)} className="badge-pill">
                                                    {user.sexe}
                                                </CBadge>
                                            </CTableDataCell>
                                            <CTableDataCell className="text-center">
                                                <CBadge color={getTypeColor(user.type_utilisateur)} className="badge-pill">
                                                    {user.type_utilisateur}
                                                </CBadge>
                                            </CTableDataCell>
                                            <CTableDataCell className="text-center">
                                                <div className="action-buttons">
                                                    <CButton
                                                        className="btn-action btn-edit"
                                                        title="Modifier"
                                                    >
                                                        <CIcon icon={cilPencil} />
                                                    </CButton>
                                                    <CButton
                                                        className="btn-action btn-delete"
                                                        onClick={() => handleDelete(user.id_utilisateur)}
                                                        title="Supprimer"
                                                    >
                                                        <CIcon icon={cilTrash} />
                                                    </CButton>
                                                </div>
                                            </CTableDataCell>
                                        </CTableRow>
                                    ))}
                                </CTableBody>
                            </CTable>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <CIcon icon={cilPeople} size="3xl" className="text-muted mb-3" />
                            <p className="mb-0">Aucun utilisateur trouvé</p>
                        </div>
                    )}
                </CCardBody>
            </CCard>
        </div>
    )
}
