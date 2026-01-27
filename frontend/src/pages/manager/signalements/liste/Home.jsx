import { useState } from 'react'
import {
    CTable,
    CTableHead,
    CTableBody,
    CTableHeaderCell,
    CTableDataCell,
    CTableRow,
    CButton,
    CInputGroup,
    CFormInput,
    CCard,
    CCardHeader,
    CCardBody,
    CFormSelect,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilInfo, cilCloudDownload, cilTrash } from '@coreui/icons'
import './Liste.css'

export default function SignalementListe() {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatut, setFilterStatut] = useState('')
    const [filterUtilisateur, setFilterUtilisateur] = useState('')
    const [signalements, setSignalements] = useState([
        {
            id_signalement: 1,
            daty: '2025-01-20 10:30',
            surface: 1250.50,
            budget: 50000.00,
            description: 'Route endommagée',
            photo: 'photo1.jpg',
            id_entreprise: 1,
            id_utilisateur: 1,
            id_statut: 1,
            id_point: 1,
            statut: 'En attente',
            utilisateur: 'Jean Dupont'
        },
        {
            id_signalement: 2,
            daty: '2025-01-21 14:15',
            surface: 2000.75,
            budget: 75000.00,
            description: 'Pont dégradé',
            photo: 'photo2.jpg',
            id_entreprise: 2,
            id_utilisateur: 2,
            id_statut: 2,
            id_point: 2,
            statut: 'En cours',
            utilisateur: 'Marie Martin'
        },
        {
            id_signalement: 3,
            daty: '2025-01-22 09:45',
            surface: 500.25,
            budget: 25000.00,
            description: 'Trottoir cassé',
            photo: 'photo3.jpg',
            id_entreprise: 1,
            id_utilisateur: 3,
            id_statut: 3,
            id_point: 3,
            statut: 'Résolu',
            utilisateur: 'Pierre Bernard'
        },
    ])

    const utilisateurs = [...new Set(signalements.map(sig => sig.utilisateur))]
    const statuts = [...new Set(signalements.map(sig => sig.statut))]

    const filteredSignalements = signalements.filter((sig) => {
        const searchLower = searchTerm.toLowerCase()
        const matchSearch = 
            sig.description.toLowerCase().includes(searchLower) ||
            sig.utilisateur.toLowerCase().includes(searchLower) ||
            sig.id_signalement.toString().includes(searchLower)
        
        const matchStatut = filterStatut === '' || sig.statut === filterStatut
        const matchUtilisateur = filterUtilisateur === '' || sig.utilisateur === filterUtilisateur
        
        return matchSearch && matchStatut && matchUtilisateur
    })

    const handleView = (id) => {
        console.log('Voir signalement:', id)
    }

    const handleEdit = (id) => {
        console.log('Modifier signalement:', id)
    }

    const handleDelete = (id) => {
        setSignalements(signalements.filter((sig) => sig.id_signalement !== id))
    }

    const getStatutBadge = (statut) => {
        const badgeClass = {
            'En attente': 'badge-warning',
            'En cours': 'badge-info',
            'Résolu': 'badge-success',
        }
        return badgeClass[statut] || 'badge-secondary'
    }

    return (
        <div className="signalement-liste">
            <div className="page-header d-flex align-items-center gap-3 mb-4">
                <div className="header-icon">
                    <CIcon icon={cilSearch} size="lg" />
                </div>
                <div>
                    <h2 className="mb-0">Signalements</h2>
                    <small className="text-muted">Gestion des signalements</small>
                </div>
            </div>

            {/* Filters */}
            <CCard className="filters-card mb-4">
                <CCardBody>
                    <div className="row g-3">
                        <div className="col-md-5">
                            <label className="form-label fw-600">Recherche</label>
                            <CInputGroup>
                                <CFormInput
                                    placeholder="Rechercher..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                                <CButton color="info" variant="outline">
                                    <CIcon icon={cilSearch} />
                                </CButton>
                            </CInputGroup>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-600">Statut</label>
                            <CFormSelect
                                value={filterStatut}
                                onChange={(e) => setFilterStatut(e.target.value)}
                                className="filter-select"
                            >
                                <option value="">Tous les statuts</option>
                                {statuts.map((statut) => (
                                    <option key={statut} value={statut}>
                                        {statut}
                                    </option>
                                ))}
                            </CFormSelect>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-600">Utilisateur</label>
                            <CFormSelect
                                value={filterUtilisateur}
                                onChange={(e) => setFilterUtilisateur(e.target.value)}
                                className="filter-select"
                            >
                                <option value="">Tous les utilisateurs</option>
                                {utilisateurs.map((util) => (
                                    <option key={util} value={util}>
                                        {util}
                                    </option>
                                ))}
                            </CFormSelect>
                        </div>
                    </div>
                </CCardBody>
            </CCard>

            {/* Table */}
            <CCard>
                <CCardHeader className="table-header">
                    <div>
                        <h5 className="mb-0">Liste des signalements</h5>
                        <small className="text-muted">{filteredSignalements.length} signalement(s)</small>
                    </div>
                </CCardHeader>
                <CCardBody className="p-0">
                    <CTable responsive hover className="signalement-table">
                        <CTableHead>
                            <CTableRow>
                                <CTableHeaderCell scope="col">ID</CTableHeaderCell>
                                <CTableHeaderCell scope="col">Date</CTableHeaderCell>
                                <CTableHeaderCell scope="col">Description</CTableHeaderCell>
                                <CTableHeaderCell scope="col">Utilisateur</CTableHeaderCell>
                                <CTableHeaderCell scope="col">Surface (m²)</CTableHeaderCell>
                                <CTableHeaderCell scope="col">Budget</CTableHeaderCell>
                                <CTableHeaderCell scope="col">Statut</CTableHeaderCell>
                                <CTableHeaderCell scope="col">Actions</CTableHeaderCell>
                            </CTableRow>
                        </CTableHead>
                        <CTableBody>
                            {filteredSignalements.map((sig) => (
                                <CTableRow key={sig.id_signalement}>
                                    <CTableDataCell>
                                        <strong>#{sig.id_signalement}</strong>
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        <small>{sig.daty}</small>
                                    </CTableDataCell>
                                    <CTableDataCell>{sig.description}</CTableDataCell>
                                    <CTableDataCell>{sig.utilisateur}</CTableDataCell>
                                    <CTableDataCell>{sig.surface.toFixed(2)}</CTableDataCell>
                                    <CTableDataCell>
                                        <strong className="budget-ariary">Ar {sig.budget.toLocaleString('en-US')}</strong>
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        <span className={`badge-custom ${getStatutBadge(sig.statut)}`}>
                                            {sig.statut}
                                        </span>
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        <div className="action-buttons">
                                            <CButton
                                                color="info"
                                                size="sm"
                                                className="btn-action btn-view"
                                                onClick={() => handleView(sig.id_signalement)}
                                                title="Voir"
                                            >
                                                <CIcon icon={cilInfo} className="me-1" />
                                                Voir
                                            </CButton>
                                            <CButton
                                                color="warning"
                                                size="sm"
                                                className="btn-action btn-edit"
                                                onClick={() => handleEdit(sig.id_signalement)}
                                                title="Modifier"
                                            >
                                                <CIcon icon={cilCloudDownload} className="me-1" />
                                                Éditer
                                            </CButton>
                                            <CButton
                                                color="danger"
                                                size="sm"
                                                className="btn-action btn-delete"
                                                onClick={() => handleDelete(sig.id_signalement)}
                                                title="Supprimer"
                                            >
                                                <CIcon icon={cilTrash} className="me-1" />
                                                Supprimer
                                            </CButton>
                                        </div>
                                    </CTableDataCell>
                                </CTableRow>
                            ))}
                        </CTableBody>
                    </CTable>
                    {filteredSignalements.length === 0 && (
                        <div className="text-center py-5">
                            <p className="text-muted">Aucun signalement trouvé</p>
                        </div>
                    )}
                </CCardBody>
            </CCard>
        </div>
    )
}
