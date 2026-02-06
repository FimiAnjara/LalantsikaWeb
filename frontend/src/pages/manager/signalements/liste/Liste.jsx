import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    CInputGroup,
    CFormInput,
    CCard,
    CCardBody,
    CFormSelect,
    CTableRow,
    CTableDataCell,
    CBadge,
    CPagination,
    CPaginationItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'
import ActionButtons from '../../../../components/ActionButtons'
import GenericTable from '../../../../components/GenericTable'
import { LoadingSpinner, ErrorModal, SuccessModal, ConfirmModal } from '../../../../components/ui'
import { ENDPOINTS, getAuthHeaders } from '../../../../config/api'
import '../../../../styles/ListStyles.css'
import './Liste.css'

export default function SignalementListe() {
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatut, setFilterStatut] = useState('')
    const [filterDate, setFilterDate] = useState('')
    const [filterBudgetMin, setFilterBudgetMin] = useState('')
    const [filterBudgetMax, setFilterBudgetMax] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const [errorModal, setErrorModal] = useState({ visible: false, message: '' })
    const [successModal, setSuccessModal] = useState({ visible: false, message: '' })
    const [deleteModal, setDeleteModal] = useState({ visible: false, id: null })
    const [signalements, setSignalements] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [statuts, setStatuts] = useState([])

    // Récupérer les signalements depuis l'API
    useEffect(() => {
        fetchSignalements()
        fetchStatuts()
    }, [])

    const fetchSignalements = async () => {
        setLoading(true)
        try {
            const response = await fetch(ENDPOINTS.REPORTS, {
                headers: getAuthHeaders()
            })

            const result = await response.json()

            if (result.success && result.data) {
                // Handle both array format and object with items
                const items = Array.isArray(result.data) ? result.data : result.data.items || []
                setSignalements(items)
            } else {
                setErrorModal({
                    visible: true,
                    message: result.message || 'Erreur lors du chargement des signalements'
                })
            }
        } catch (error) {
            console.error('Erreur:', error)
            setErrorModal({
                visible: true,
                message: 'Impossible de charger les signalements'
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchStatuts = async () => {
        try {
            const response = await fetch(ENDPOINTS.STATUSES, {
                headers: getAuthHeaders()
            })

            const result = await response.json()

            if (result.success && result.data) {
                setStatuts(result.data.items)
            }
        } catch (error) {
            console.error('Erreur lors du chargement des statuts:', error)
        }
    }

    const statutsUniques = [...new Set(signalements.filter(sig => sig.statut).map(sig => sig.statut))]

    const filteredSignalements = signalements.filter((sig) => {
        const searchLower = searchTerm.toLowerCase();
        const utilisateurNom = sig.utilisateur?.nom_complet || '';
        const matchSearch =
            (sig.description || '').toLowerCase().includes(searchLower) ||
            utilisateurNom.toLowerCase().includes(searchLower) ||
            sig.id_signalement.toString().includes(searchLower);

        const matchStatut = filterStatut === '' || sig.statut === filterStatut;
        const matchDate = filterDate === '' || (sig.daty && sig.daty.startsWith(filterDate));
        const matchBudgetMin = filterBudgetMin === '' || (sig.budget && sig.budget >= parseFloat(filterBudgetMin));
        const matchBudgetMax = filterBudgetMax === '' || (sig.budget && sig.budget <= parseFloat(filterBudgetMax));

        return matchSearch && matchStatut && matchDate && matchBudgetMin && matchBudgetMax;
    });

    const totalPages = Math.ceil(filteredSignalements.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedSignalements = filteredSignalements.slice(startIndex, endIndex)

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    const handleView = (id) => {
        navigate(`/manager/signalements/fiche/${id}`)
    }

    const handleDelete = (id) => {
        setDeleteModal({ visible: true, id })
    }

    const confirmDelete = async () => {
        if (deleteModal.id) {
            setActionLoading(true)
            try {
                const response = await fetch(ENDPOINTS.REPORT(deleteModal.id), {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                })

                const result = await response.json()

                if (result.success) {
                    setSignalements(signalements.filter((sig) => sig.id_signalement !== deleteModal.id))
                    setDeleteModal({ visible: false, id: null })
                    setSuccessModal({
                        visible: true,
                        message: 'Signalement supprimé avec succès'
                    })
                } else {
                    setErrorModal({
                        visible: true,
                        message: result.message || 'Impossible de supprimer le signalement'
                    })
                }
            } catch (error) {
                setErrorModal({
                    visible: true,
                    message: 'Erreur lors de la suppression'
                })
            } finally {
                setActionLoading(false)
                setDeleteModal({ visible: false, id: null })
            }
        }
    }

    const getStatutBadge = (statut) => {
        const badgeClass = {
            'En attente': 'warning',
            'En cours': 'info',
            'Résolu': 'success',
        }
        return badgeClass[statut] || 'secondary'
    }

    if (loading) {
        return <LoadingSpinner isLoading={true} message="Chargement des signalements..." />
    }

    return (
        <div className="signalement-liste list-page">
            <div className="page-header d-flex align-items-center gap-3 mb-4">
                <div className="header-icon">
                    <CIcon icon={cilSearch} size="lg" />
                </div>
                <div>
                    <h2 className="mb-0">Signalements</h2>
                    <small className="text-muted">Gestion des signalements ({signalements.length} au total)</small>
                </div>
            </div>

            {/* Filters */}
            <CCard className="filters-card mb-4">
                <CCardBody>
                    <div className="row g-3">
                        <div className="col-md-3">
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
                            <label className="form-label fw-600">Date</label>
                            <CInputGroup>
                                <CFormInput
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className="search-input"
                                />
                            </CInputGroup>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label fw-600">Budget min</label>
                            <CInputGroup>
                                <CFormInput
                                    type="number"
                                    value={filterBudgetMin}
                                    onChange={(e) => setFilterBudgetMin(e.target.value)}
                                    className="search-input"
                                />
                            </CInputGroup>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label fw-600">Budget max</label>
                            <CInputGroup>
                                <CFormInput
                                    type="number"
                                    value={filterBudgetMax}
                                    onChange={(e) => setFilterBudgetMax(e.target.value)}
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
                                {statutsUniques.map((statut) => (
                                    <option key={statut} value={statut}>
                                        {statut}
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
                    { key: 'latitude', label: 'Latitude' },
                    { key: 'longitude', label: 'Longitude' },
                    { key: 'statut', label: 'Statut' },
                    { key: 'actions', label: 'Actions' },
                ]}
                data={paginatedSignalements}
                rowKey="id_signalement"
                renderRow={(sig) => (
                    <CTableRow key={sig.id_signalement}>
                        <CTableDataCell>
                            <strong>#{sig.id_signalement}</strong>
                        </CTableDataCell>
                        <CTableDataCell>
                            <small>{sig.daty || '-'}</small>
                        </CTableDataCell>
                        <CTableDataCell>{sig.description || '-'}</CTableDataCell>
                        <CTableDataCell>{sig.utilisateur?.nom_complet || '-'}</CTableDataCell>
                        <CTableDataCell>{sig.surface ? sig.surface.toFixed(2) : '-'}</CTableDataCell>
                        <CTableDataCell>
                            <strong className="budget-ariary">
                                {sig.budget ? `Ar ${sig.budget.toLocaleString('en-US')}` : '-'}
                            </strong>
                        </CTableDataCell>
                        <CTableDataCell>{sig.latitude ?? '-'}</CTableDataCell>
                        <CTableDataCell>{sig.longitude ?? '-'}</CTableDataCell>
                        <CTableDataCell>
                            <CBadge color={getStatutBadge(sig.statut)} className="p-2">
                                {sig.statut || 'Non défini'}
                            </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                            <ActionButtons
                                id={sig.id_signalement}
                                onView={handleView}
                                showDelete={false}
                                showEdit={false}
                            />
                        </CTableDataCell>
                    </CTableRow>
                )}
                emptyMessage="Aucun signalement trouvé"
            />

            {/* Pagination */}
            {filteredSignalements.length > 0 && (
                <div className="d-flex justify-content-center mt-4">
                    <CPagination aria-label="Pagination des signalements">
                        <CPaginationItem 
                            aria-label="Précédent" 
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                        >
                            <span aria-hidden="true">&laquo;</span>
                        </CPaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <CPaginationItem
                                key={page}
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

            {/* Error Modal */}
            <ErrorModal
                visible={errorModal.visible}
                title="Erreur"
                message={errorModal.message}
                onClose={() => setErrorModal({ visible: false, message: '' })}
            />

            {/* Success Modal */}
            <SuccessModal
                visible={successModal.visible}
                title="Succès"
                message={successModal.message}
                onClose={() => setSuccessModal({ visible: false, message: '' })}
            />

            {/* Confirm Delete Modal */}
            <ConfirmModal
                visible={deleteModal.visible}
                type="danger"
                title="Supprimer le signalement"
                message="Cette action est irréversible. Voulez-vous vraiment supprimer ce signalement ?"
                onClose={() => setDeleteModal({ visible: false, id: null })}
                onConfirm={confirmDelete}
                confirmText="Supprimer"
                closeText="Annuler"
                isLoading={actionLoading}
            />
        </div>
    )
}
