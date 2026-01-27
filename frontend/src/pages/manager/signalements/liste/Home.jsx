import { useState } from 'react'
import {
    CInputGroup,
    CFormInput,
    CCard,
    CCardBody,
    CFormSelect,
    CTableRow,
    CTableDataCell,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'
import ActionButtons from '../../../../components/ActionButtons'
import GenericTable from '../../../../components/GenericTable'
import Modal from '../../../../components/Modal'
import '../../../../styles/ListStyles.css'
import './Liste.css'

export default function SignalementListe() {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatut, setFilterStatut] = useState('')
    const [filterUtilisateur, setFilterUtilisateur] = useState('')
    const [modal, setModal] = useState({ visible: false, type: 'success', title: '', message: '' })
    const [deleteModal, setDeleteModal] = useState({ visible: false, id: null })
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
        setDeleteModal({ visible: true, id })
    }

    const confirmDelete = () => {
        if (deleteModal.id) {
            setSignalements(signalements.filter((sig) => sig.id_signalement !== deleteModal.id))
            setDeleteModal({ visible: false, id: null })
            setModal({
                visible: true,
                type: 'success',
                title: 'Succès',
                message: 'Signalement supprimé avec succès'
            })
        }
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
        <div className="signalement-liste list-page">
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
            <GenericTable
                title="Liste des signalements"
                columns={[
                    { key: 'id', label: 'ID' },
                    { key: 'daty', label: 'Date' },
                    { key: 'description', label: 'Description' },
                    { key: 'utilisateur', label: 'Utilisateur' },
                    { key: 'surface', label: 'Surface (m²)' },
                    { key: 'budget', label: 'Budget' },
                    { key: 'statut', label: 'Statut' },
                    { key: 'actions', label: 'Actions' },
                ]}
                data={filteredSignalements}
                rowKey="id_signalement"
                renderRow={(sig) => (
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
                            <ActionButtons
                                id={sig.id_signalement}
                                onView={handleView}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        </CTableDataCell>
                    </CTableRow>
                )}
                emptyMessage="Aucun signalement trouvé"
            />

            {/* Modal for success messages */}
            <Modal 
                visible={modal.visible}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                onClose={() => setModal({ ...modal, visible: false })}
            />

            {/* Modal for delete confirmation */}
            <Modal
                visible={deleteModal.visible}
                type="warning"
                title="Confirmer la suppression"
                message="Êtes-vous sûr de vouloir supprimer ce signalement ? Cette action est irréversible."
                onClose={() => setDeleteModal({ visible: false, id: null })}
                onConfirm={confirmDelete}
                confirmText="Supprimer"
                closeText="Annuler"
            />
        </div>
    )
}
