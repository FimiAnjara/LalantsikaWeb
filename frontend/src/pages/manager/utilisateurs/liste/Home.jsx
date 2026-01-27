import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    CCard,
    CCardBody,
    CFormInput,
    CFormSelect,
    CTableRow,
    CTableDataCell,
    CButton,
    CInputGroup,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilList, cilSearch, cilPeople, cilCheckAlt } from '@coreui/icons'
import ActionButtons from '../../../../components/ActionButtons'
import GenericTable from '../../../../components/GenericTable'
import Modal from '../../../../components/Modal'
import '../../../../styles/ListStyles.css'
import './Liste.css'

export default function ListeUtilisateur() {
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [modal, setModal] = useState({ visible: false, type: 'success', title: '', message: '' })
    const [deleteModal, setDeleteModal] = useState({ visible: false, id: null })
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
        setDeleteModal({ visible: true, id })
    }

    const confirmDelete = () => {
        if (deleteModal.id) {
            setUtilisateurs(utilisateurs.filter((user) => user.id_utilisateur !== deleteModal.id))
            setDeleteModal({ visible: false, id: null })
            setModal({
                visible: true,
                type: 'success',
                title: 'Succès',
                message: 'Utilisateur supprimé avec succès'
            })
        }
    }

    const handleUnblock = (id) => {
        setUtilisateurs(utilisateurs.map((user) =>
            user.id_utilisateur === id ? { ...user, statut: 'actif' } : user
        ))
        setModal({
            visible: true,
            type: 'success',
            title: 'Succès',
            message: 'Utilisateur débloqué avec succès'
        })
    }

    return (
        <div className="liste-utilisateur list-page">
            <div className="page-header d-flex align-items-center gap-3 mb-4">
                <div className="header-icon">
                    <CIcon icon={cilPeople} size="lg" />
                </div>
                <div>
                    <h2 className="mb-0">Liste des utilisateurs</h2>
                    <small className="text-muted">Gérer les comptes utilisateurs</small>
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
                            <label className="form-label fw-600">Type</label>
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
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-600">Statut</label>
                            <CFormSelect
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="filter-select"
                            >
                                <option value="">Tous les statuts</option>
                                <option value="actif">Actif</option>
                                <option value="bloque">Bloqué</option>
                            </CFormSelect>
                        </div>
                    </div>
                </CCardBody>
            </CCard>

            {/* Table */}
            <GenericTable
                title="Liste des utilisateurs"
                columns={[
                    { key: 'identifiant', label: 'Identifiant' },
                    { key: 'fullname', label: 'Nom complet' },
                    { key: 'email', label: 'Email' },
                    { key: 'type', label: 'Type' },
                    { key: 'statut', label: 'Statut' },
                    { key: 'actions', label: 'Actions' },
                ]}
                data={filteredUtilisateurs}
                rowKey="id_utilisateur"
                renderRow={(user) => (
                    <CTableRow key={user.id_utilisateur}>
                        <CTableDataCell>
                            <strong>{user.identifiant}</strong>
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
                        <CTableDataCell>{user.email}</CTableDataCell>
                        <CTableDataCell>
                            <span className={`badge-custom ${getTypeColor(user.type_utilisateur)}`}>
                                {user.type_utilisateur}
                            </span>
                        </CTableDataCell>
                        <CTableDataCell>
                            <span className={`badge-custom ${getStatutColor(user.statut)}`}>
                                {user.statut === 'actif' ? 'Actif' : 'Bloqué'}
                            </span>
                        </CTableDataCell>
                        <CTableDataCell>
                            {user.statut === 'bloque' ? (
                                <CButton
                                    color="success"
                                    size="sm"
                                    className="btn-action btn-unlock"
                                    onClick={() => handleUnblock(user.id_utilisateur)}
                                    title="Débloquer"
                                >
                                    <CIcon icon={cilCheckAlt} className="me-1" />
                                    Débloquer
                                </CButton>
                            ) : (
                                <ActionButtons
                                    id={user.id_utilisateur}
                                    onView={() => console.log('Voir:', user.id_utilisateur)}
                                    onEdit={() => navigate(`/manager/utilisateurs/modifier/${user.id_utilisateur}`)}
                                    onDelete={handleDelete}
                                />
                            )}
                        </CTableDataCell>
                    </CTableRow>
                )}
                emptyMessage="Aucun utilisateur trouvé"
            />

            {/* Modal for success/unblock messages */}
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
                message="Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible."
                onClose={() => setDeleteModal({ visible: false, id: null })}
                onConfirm={confirmDelete}
                confirmText="Supprimer"
                closeText="Annuler"
            />
        </div>
    )

}
