import { useState, useEffect } from 'react'
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
    CBadge,
    CPagination,
    CPaginationItem,
    CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilList, cilSearch, cilPeople, cilCheckAlt, cilSync, cilCloudDownload } from '@coreui/icons'
import ActionButtons from '../../../../components/ActionButtons'
import GenericTable from '../../../../components/GenericTable'
import Modal from '../../../../components/Modal'
import { ENDPOINTS, getAuthHeaders, API_BASE_URL } from '../../../../config/api'
import '../../../../styles/ListStyles.css'
import './Liste.css'

export default function ListeUtilisateur() {
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [filterSync, setFilterSync] = useState('')
    const [modal, setModal] = useState({ visible: false, type: 'success', title: '', message: '' })
    const [deleteModal, setDeleteModal] = useState({ visible: false, id: null })
    const [unblockModal, setUnblockModal] = useState({ visible: false, id: null })
    const [currentPage, setCurrentPage] = useState(1)

    // Helper pour construire l'URL de la photo (locale ou externe)
    const getPhotoUrl = (photoUrl) => {
        if (!photoUrl) return null
        // Si l'URL commence par http, c'est une URL externe (imgBB, etc.)
        if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
            return photoUrl
        }
        // Sinon, c'est un chemin local Laravel
        return `${API_BASE_URL}${photoUrl}`
    }
    const [loading, setLoading] = useState(true)
    const itemsPerPage = 10
    const [utilisateurs, setUtilisateurs] = useState([])
    const [typesUtilisateur, setTypesUtilisateur] = useState([])
    const [statutsUtilisateur, setStatutsUtilisateur] = useState([])

    // Récupérer la liste des utilisateurs, types et statuts au chargement
    useEffect(() => {
        fetchUtilisateurs();
        fetchTypesUtilisateur();
    }, []);

    const fetchTypesUtilisateur = async () => {
        try {
            const response = await fetch(ENDPOINTS.USER_TYPES, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                setTypesUtilisateur(data.data || []);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des types:', error);
        }
    };

    const fetchUtilisateurs = async () => {
        setLoading(true)
        try {
            const response = await fetch(ENDPOINTS.USERS, {
                method: 'GET',
                headers: getAuthHeaders()
            })
            const data = await response.json()
            console.log(data)
            if (data.success) {
                setUtilisateurs(data.data.items || [])
                console.log(utilisateurs)
            } else {
                console.error('Erreur:', data.message)
                setModal({
                    visible: true,
                    type: 'danger',
                    title: 'Erreur',
                    message: data.message || 'Erreur lors du chargement des utilisateurs'
                })
            }
        } catch (error) {
            console.error('Erreur:', error)
            setModal({
                visible: true,
                type: 'danger',
                title: 'Erreur',
                message: 'Erreur de connexion au serveur'
            })
        } finally {
            setLoading(false)
        }
    }

    const getTypeColor = (type) => {
        if (!type) return 'secondary';
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
        if (!statut) return 'secondary';
        return statut === 'actif' ? 'success' : 'danger'
    }

    const filteredUtilisateurs = Array.isArray(utilisateurs) ? utilisateurs.filter((user) => {
        const matchSearch =
            (user.identifiant?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (user.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (user.prenom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())

        const matchType = filterType === '' || user.type_utilisateur === filterType
        const matchStatus = filterStatus === '' || user.statut === filterStatus
        const matchSync = filterSync === '' || 
            (filterSync === 'oui' && user.synchronized) || 
            (filterSync === 'non' && !user.synchronized)

        return matchSearch && matchType && matchStatus && matchSync
    }) : []

    const totalPages = Math.ceil(filteredUtilisateurs.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedUtilisateurs = filteredUtilisateurs.slice(startIndex, endIndex)

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    const handleDelete = (id) => {
        setDeleteModal({ visible: true, id })
    }

    const confirmDelete = async () => {
        if (deleteModal.id) {
            try {
                const response = await fetch(ENDPOINTS.USER(deleteModal.id), {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                })

                const data = await response.json()

                if (data.success) {
                    setUtilisateurs(utilisateurs.filter((user) => user.id_utilisateur !== deleteModal.id))
                    setModal({
                        visible: true,
                        type: 'success',
                        title: 'Succès',
                        message: 'Utilisateur supprimé avec succès'
                    })
                } else {
                    setModal({
                        visible: true,
                        type: 'danger',
                        title: 'Erreur',
                        message: data.message || 'Erreur lors de la suppression'
                    })
                }
            } catch (error) {
                setModal({
                    visible: true,
                    type: 'danger',
                    title: 'Erreur',
                    message: 'Erreur de connexion au serveur'
                })
            }
            setDeleteModal({ visible: false, id: null })
        }
    }

    const handleUnblock = (id) => {
        setUnblockModal({ visible: true, id })
    }

    const confirmUnblock = async () => {
        if (unblockModal.id) {
            try {
                const response = await fetch(ENDPOINTS.USER_UNBLOCK(unblockModal.id), {
                    method: 'POST',
                    headers: getAuthHeaders()
                })

                const data = await response.json()

                if (data.success) {
                    setUtilisateurs(utilisateurs.map((user) =>
                        user.id_utilisateur === unblockModal.id ? { ...user, statut: 'actif' } : user
                    ))
                    setModal({
                        visible: true,
                        type: 'success',
                        title: 'Succès',
                        message: 'Utilisateur débloqué avec succès'
                    })
                } else {
                    setModal({
                        visible: true,
                        type: 'danger',
                        title: 'Erreur',
                        message: data.message || 'Erreur lors du déblocage'
                    })
                }
            } catch (error) {
                setModal({
                    visible: true,
                    type: 'danger',
                    title: 'Erreur',
                    message: 'Erreur de connexion au serveur'
                })
            }
            setUnblockModal({ visible: false, id: null })
        }
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
                        <div className="col-md-4">
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
                        <div className="col-md-2">
                            <label className="form-label fw-600">Type</label>
                            <CFormSelect
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="filter-select"
                            >
                                <option value="">Tous les types</option>
                                {typesUtilisateur.map((type) => (
                                    <option key={`type-${type.id_type_utilisateur}`} value={type.libelle}>
                                        {type.libelle}
                                    </option>
                                ))}
                            </CFormSelect>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-600">Statut</label>
                            <CFormSelect
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="filter-select"
                            >
                                <option value="">Tous les statuts</option>
                                <option value="1">Actif</option>
                                <option value="0">Bloqué</option>
                            </CFormSelect>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-600">Synchronisé</label>
                            <CFormSelect
                                value={filterSync}
                                onChange={(e) => setFilterSync(e.target.value)}
                                className="filter-select"
                            >
                                <option key="sync-all" value="">Tous</option>
                                <option key="sync-yes" value="oui">Synchronisé</option>
                                <option key="sync-no" value="non">Non synchronisé</option>
                            </CFormSelect>
                        </div>
                    </div>
                </CCardBody>
            </CCard>

            {/* Table */}
            {loading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                    <CSpinner color="primary" />
                </div>
            ) : (
            <GenericTable
                title="Liste des utilisateurs"
                columns={[
                    { key: 'photo', label: 'Photo' },
                    { key: 'identifiant', label: 'Identifiant' },
                    { key: 'fullname', label: 'Nom complet' },
                    { key: 'email', label: 'Email' },
                    { key: 'type', label: 'Type' },
                    { key: 'statut', label: 'Statut' },
                    { key: 'sync', label: 'Synchronisé' },
                    { key: 'actions', label: 'Actions' },
                ]}
                data={paginatedUtilisateurs}
                rowKey="id_utilisateur"
                renderRow={(user) => (
                    <CTableRow key={user.id_utilisateur}>
                        <CTableDataCell>
                            <div className="avatar-img">
                                {user.photo_url ? (
                                    <img src={getPhotoUrl(user.photo_url)} alt={user.prenom} className="photo-thumbnail" />
                                ) : (
                                    <div className="avatar-circle-small">
                                        {user.prenom?.charAt(0) || ''}{user.nom?.charAt(0) || ''}
                                    </div>
                                )}
                            </div>
                        </CTableDataCell>
                        <CTableDataCell>
                            <strong>{user.identifiant || '-'}</strong>
                        </CTableDataCell>
                        <CTableDataCell>
                            <div className="d-flex align-items-center gap-2">
                                <div>
                                    <div className="fw-medium">
                                        {(user.prenom || '') + ' ' + (user.nom || '')}
                                    </div>
                                </div>
                            </div>
                        </CTableDataCell>
                        <CTableDataCell>{user.email || '-'}</CTableDataCell>
                        <CTableDataCell>
                            <CBadge color={getTypeColor(user.type_utilisateur)} className="p-2">
                                {user.type_utilisateur || '-'}
                            </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                            <CBadge color={getStatutColor(user.statut)} className="p-2">
                                {user.statut === 'actif' ? 'Actif' : user.statut === 'bloque' ? 'Bloqué' : '-'}
                            </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                            <CBadge 
                                color={user.synchronized ? 'success' : 'warning'} 
                                className="p-2 d-flex align-items-center gap-1"
                                style={{ width: 'fit-content' }}
                            >
                                <CIcon icon={user.synchronized ? cilSync : cilCloudDownload} size="sm" />
                                {user.synchronized ? 'Oui' : 'Non'}
                            </CBadge>
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
                                    onView={() => navigate(`/manager/utilisateurs/fiche/${user.id_utilisateur}`)}
                                    onEdit={() => navigate(`/manager/utilisateurs/modifier/${user.id_utilisateur}`)}
                                    onDelete={handleDelete}
                                />
                            )}
                        </CTableDataCell>
                    </CTableRow>
                )}
                emptyMessage="Aucun utilisateur trouvé"
            />
            )}

            {/* Pagination */}
            {!loading && filteredUtilisateurs.length > 0 && (
                <div className="d-flex justify-content-center mt-4">
                    <CPagination aria-label="Pagination des utilisateurs">
                        <CPaginationItem 
                            aria-label="Précédent" 
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                        >
                            <span aria-hidden="true">&laquo;</span>
                        </CPaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <CPaginationItem
                                key={`page-${page}`}
                                active={page === currentPage}
                                onClick={() => handlePageChange(page)}
                            >
                                {page}
                            </CPaginationItem>
                        ))}
                        <CPaginationItem 
                            aria-label="Suivant"
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                        >
                            <span aria-hidden="true">&raquo;</span>
                        </CPaginationItem>
                    </CPagination>
                </div>
            )}

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
                type="danger"
                title="Supprimer l'utilisateur"
                message="Cette action est irréversible. Voulez-vous vraiment supprimer cet utilisateur ?"
                onClose={() => setDeleteModal({ visible: false, id: null })}
                onConfirm={confirmDelete}
                confirmText="Supprimer"
                closeText="Annuler"
            />

            {/* Modal for unblock confirmation */}
            <Modal
                visible={unblockModal.visible}
                type="info"
                title="Confirmer le déblocage"
                message="Voulez-vous vraiment débloquer cet utilisateur ?"
                onClose={() => setUnblockModal({ visible: false, id: null })}
                onConfirm={confirmUnblock}
                confirmText="Débloquer"
                closeText="Annuler"
            />
        </div>
    )
}