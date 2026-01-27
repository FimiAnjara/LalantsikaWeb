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
    CFormSelect,
    CRow,
    CCol,
    CBadge,
    CInputGroup,
    CInputGroupText,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilList, cilPencil, cilTrash, cilPlus, cilSearch, cilPeople, cilCheckAlt } from '@coreui/icons'
import './Liste.css'

export default function ListeUtilisateur() {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [utilisateurs, setUtilisateurs] = useState([
        {
            id_utilisateur: 1,
            identifiant: 'john_doe',
            nom: 'Doe',
            prenom: 'John',
            email: 'john@example.com',
            sexe: 'Masculin',
            type_utilisateur: 'Utilisateur',
            statut: 'actif',
        },
        {
            id_utilisateur: 2,
            identifiant: 'jane_smith',
            nom: 'Smith',
            prenom: 'Jane',
            email: 'jane@example.com',
            sexe: 'Féminin',
            type_utilisateur: 'Manager',
            statut: 'actif',
        },
        {
            id_utilisateur: 3,
            identifiant: 'bob_wilson',
            nom: 'Wilson',
            prenom: 'Bob',
            email: 'bob@example.com',
            sexe: 'Masculin',
            type_utilisateur: 'Utilisateur',
            statut: 'bloque',
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

    const getStatutColor = (statut) => {
        return statut === 'actif' ? 'success' : 'danger'
    }

    const filteredUtilisateurs = utilisateurs.filter((user) => {
        const matchSearch =
            user.identifiant.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())

        const matchType = filterType === '' || user.type_utilisateur === filterType
        const matchStatus = filterStatus === '' || user.statut === filterStatus

        return matchSearch && matchType && matchStatus
    })

    const handleDelete = (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) {
            setUtilisateurs(utilisateurs.filter((user) => user.id_utilisateur !== id))
        }
    }

    const handleUnblock = (id) => {
        setUtilisateurs(utilisateurs.map((user) =>
            user.id_utilisateur === id ? { ...user, statut: 'actif' } : user
        ))
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

            {/* Filtres */}
            <CRow className="mb-4 g-3 align-items-end">
                <CCol lg="4" md="6">
                    <CInputGroup className="search-input-group">
                        <CInputGroupText>
                            <CIcon icon={cilSearch} />
                        </CInputGroupText>
                        <CFormInput
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </CInputGroup>
                </CCol>
                <CCol lg="3" md="6">
                    <CFormSelect
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Tous les types</option>
                        <option value="Administrateur">Administrateur</option>
                        <option value="Manager">Manager</option>
                        <option value="Utilisateur">Utilisateur</option>
                    </CFormSelect>
                </CCol>
                <CCol lg="3" md="6">
                    <CFormSelect
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="actif">Actif</option>
                        <option value="bloque">Bloqué</option>
                    </CFormSelect>
                </CCol>
                <CCol lg="2" md="6" className="text-md-end">
                    <CButton
                        href="/manager/utilisateurs/ajout"
                        className="btn-add w-100"
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
                                        <CTableHeaderCell className="text-center">Type</CTableHeaderCell>
                                        <CTableHeaderCell className="text-center">Statut</CTableHeaderCell>
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
                                                <CBadge color={getTypeColor(user.type_utilisateur)} className="badge-pill">
                                                    {user.type_utilisateur}
                                                </CBadge>
                                            </CTableDataCell>
                                            <CTableDataCell className="text-center">
                                                <CBadge color={getStatutColor(user.statut)} className="badge-pill">
                                                    {user.statut === 'actif' ? 'Actif' : 'Bloqué'}
                                                </CBadge>
                                            </CTableDataCell>
                                            <CTableDataCell className="text-center">
                                                <div className="action-buttons">
                                                    {user.statut === 'bloque' && (
                                                        <CButton
                                                            className="btn-action btn-unlock"
                                                            onClick={() => handleUnblock(user.id_utilisateur)}
                                                            title="Débloquer"
                                                        >
                                                            <CIcon icon={cilCheckAlt} />
                                                        </CButton>
                                                    )}
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
