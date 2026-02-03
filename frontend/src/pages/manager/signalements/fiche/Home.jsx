import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    CCard,
    CCardBody,
    CCardHeader,
    CRow,
    CCol,
    CAvatar,
    CButton,
    CBadge,
    CImage,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
    cilArrowLeft,
    cilPencil,
    cilTrash,
    cilUser,
    cilCalendar,
    cilLocationPin,
    cilMoney,
    cilLayers,
    cilBuilding,
} from '@coreui/icons'
import Modal from '../../../../components/Modal'
import './Fiche.css'

export default function SignalementFiche() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [modal, setModal] = useState({ visible: false, type: 'success', title: '', message: '' })
    const [histoStatuts, setHistoStatuts] = useState([])
    const [loadingHisto, setLoadingHisto] = useState(true)
    const [deleteModal, setDeleteModal] = useState({ visible: false })
    const [assignModal, setAssignModal] = useState({ visible: false })
    const [entreprises, setEntreprises] = useState([])
    const [selectedEntreprise, setSelectedEntreprise] = useState('')
    const [assignBudget, setAssignBudget] = useState('')
    const [assignLoading, setAssignLoading] = useState(false)

    // Signalement state
    const [signalement, setSignalement] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const assignModalRef = useRef(null)

    // Gestion du clic en dehors de la modal d'assignation
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (assignModalRef.current &&
                !assignModalRef.current.contains(event.target) &&
                assignModal.visible) {
                setAssignModal({ visible: false })
            }
        }

        const handleEscapeKey = (event) => {
            if (event.key === 'Escape' && assignModal.visible) {
                setAssignModal({ visible: false })
            }
        }

        if (assignModal.visible) {
            document.addEventListener('mousedown', handleClickOutside)
            document.addEventListener('keydown', handleEscapeKey)
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscapeKey)
            document.body.style.overflow = 'auto'
        }
    }, [assignModal.visible])

    useEffect(() => {
        const fetchSignalement = async () => {
            setLoading(true)
            setError(null)
            try {
                const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
                const res = await fetch(`http://localhost:8000/api/reports/${id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                        }
                    }
                )
                const result = await res.json()
                if (result.success && result.data) {
                    setSignalement(result.data)
                } else {
                    throw new Error(result.message || 'Erreur lors du chargement du signalement')
                }
            } catch (e) {
                setError(e.message)
            } finally {
                setLoading(false)
            }
        }
        fetchSignalement()
    }, [id])

    // Charger l'historique des statuts
    useEffect(() => {
        const fetchHisto = async () => {
            setLoadingHisto(true)
            try {
                const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
                const res = await fetch(`http://localhost:8000/api/reports/${id}/histostatut`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    }
                })
                const result = await res.json()
                if (result.success && result.data) {
                    setHistoStatuts(result.data)
                } else {
                    setHistoStatuts([])
                }
            } catch (e) {
                setHistoStatuts([])
            } finally {
                setLoadingHisto(false)
            }
        }
        fetchHisto()
    }, [id])

    // Charger la liste des entreprises pour l'assignation
    useEffect(() => {
        const fetchEntreprises = async () => {
            try {
                const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
                const res = await fetch('http://localhost:8000/api/companies', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    }
                })
                const result = await res.json()
                if (result.success && result.data) {
                    setEntreprises(result.data)
                }
            } catch (e) {
                setEntreprises([])
            }
        }
        fetchEntreprises()
    }, [])

    const getStatutColor = (statut) => {
        const value = typeof statut === 'object' && statut !== null ? statut.libelle : statut
        switch (value) {
            case 'En attente': return 'warning'
            case 'En cours': return 'info'
            case 'Résolu': return 'success'
            default: return 'secondary'
        }
    }

    const handleBack = () => navigate('/manager/signalements/liste')
    const handleEdit = () => navigate(`/manager/signalements/modifier/${id}`)
    const handleAssign = () => {
        setAssignModal({ visible: true })
        setSelectedEntreprise('')
        setAssignBudget('')
    }

    const confirmAssign = async () => {
        if (!selectedEntreprise) {
            setModal({ visible: true, type: 'danger', title: 'Erreur', message: "Veuillez sélectionner une entreprise." })
            return
        }
        if (!assignBudget || isNaN(assignBudget) || Number(assignBudget) <= 0) {
            setModal({ visible: true, type: 'danger', title: 'Erreur', message: "Veuillez saisir un budget valide." })
            return
        }
        setAssignLoading(true)
        try {
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
            const res = await fetch(`http://localhost:8000/api/reports/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_entreprise: selectedEntreprise,
                    budget: assignBudget
                })
            })
            const result = await res.json()
            if (result.success) {
                setModal({ visible: true, type: 'success', title: 'Succès', message: 'Signalement mis à jour avec succès.' })
                setAssignModal({ visible: false })
                // Optionnel : recharger le signalement
                setTimeout(() => {
                    window.location.reload();
                }, 800);
            } else {
                throw new Error(result.message || 'Erreur lors de la mise à jour')
            }
        } catch (e) {
            setModal({ visible: true, type: 'danger', title: 'Erreur', message: e.message || "Erreur lors de la mise à jour." })
        } finally {
            setAssignLoading(false)
        }
    }

    const handleViewUser = () => {
        if (signalement && signalement.utilisateur) {
            // Prend en compte id, id_utilisateur ou autre champ unique
            const userId = signalement.utilisateur.id || signalement.utilisateur.id_utilisateur || signalement.utilisateur.id_user
            if (userId) {
                navigate(`/manager/utilisateurs/fiche/${userId}`)
            }
        }
    }

    const handleDelete = () => {
        setDeleteModal({ visible: true })
    }

    const confirmDelete = async () => {
        setDeleteModal({ visible: false })
        try {
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
            const res = await fetch(`http://localhost:8000/api/reports/${id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    }
                }
            )
            const result = await res.json()
            if (result.success) {
                setModal({
                    visible: true,
                    type: 'success',
                    title: 'Succès',
                    message: 'Signalement supprimé avec succès.'
                })
                setTimeout(() => navigate('/manager/signalements/liste'), 1500)
            } else {
                throw new Error(result.message || 'Erreur lors de la suppression')
            }
        } catch (e) {
            setModal({
                visible: true,
                type: 'danger',
                title: 'Erreur',
                message: e.message || 'Erreur lors de la suppression.'
            })
        }
    }

    // Fonction pour fermer la modal d'assignation
    const closeAssignModal = () => {
        setAssignModal({ visible: false })
    }


    if (loading) return <div className="fiche-signalement"><div className="text-center p-5">Chargement...</div></div>
    if (error) return <div className="fiche-signalement"><div className="alert alert-danger m-4">{error}</div></div>
    if (!signalement) return null

    // Action Valider/Rejeter
    const handleValidationRejet = async (action) => {
        setModal({ visible: false })
        try {
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
            const resStatut = await fetch('http://localhost:8000/api/statuses', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            })
            const statutsResult = await resStatut.json();
            if (!statutsResult.success || !statutsResult.data) throw new Error('Impossible de récupérer les statuts');
            const statutObj = statutsResult.data.find(s => s.libelle === action);
            if (!statutObj) throw new Error('Statut non trouvé');
            const formData = new FormData();
            formData.append('id_statut', statutObj.id_statut);
            formData.append('description', action === 'Validé' ? 'Signalement validé' : 'Signalement rejeté');
            formData.append('daty', new Date().toISOString().slice(0, 16));
            const res = await fetch(`http://localhost:8000/api/reports/${id}/histostatut`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: formData
            });
            const result = await res.json();
            if (!result.success) throw new Error(result.message || 'Erreur lors de la mise à jour du statut');
            setModal({
                visible: true,
                type: 'success',
                title: action === 'Validé' ? 'Signalement validé' : 'Signalement rejeté',
                message: action === 'Validé' ? 'Le signalement a été validé.' : 'Le signalement a été rejeté.'
            });
            setTimeout(() => window.location.reload(), 1200);
        } catch (e) {
            setModal({
                visible: true,
                type: 'danger',
                title: 'Erreur',
                message: e.message || 'Erreur lors de la validation/rejet.'
            });
        }
    }

    return (
        <div className="fiche-signalement">

            <div className="page-header d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                    <button className="btn-back" onClick={handleBack} title="Retour">
                        <CIcon icon={cilArrowLeft} size="xl" />
                    </button>
                    <div>
                        <h2 className="mb-0">Détails du Signalement</h2>
                        <small className="text-muted">Référence #{signalement.id_signalement}</small>
                    </div>
                </div>
                <div className="header-actions d-flex gap-2">
                    <CButton
                        color="primary"
                        className="btn-theme"
                        onClick={handleEdit}
                        disabled={signalement.statut !== 'Validé' && signalement.statut !== 'En cours' && signalement.statut !== 'Résolu'}
                        title={signalement.statut !== 'Validé' && signalement.statut !== 'En cours' && signalement.statut !== 'Résolu' ? 'Impossible de modifier le statut tant que le signalement n\'est pas validé' : ''}
                    >
                        <CIcon icon={cilPencil} className="me-2" />
                        Modifier Status
                    </CButton>
                    <CButton color="info" onClick={handleAssign}>
                        <CIcon icon={cilBuilding} className="me-2" />
                        Assigner
                    </CButton>
                    {/* Boutons Valider/Rejeter si statut = En attente */}
                    {signalement.statut === 'En attente' && (
                        <>
                            <CButton color="success" onClick={() => handleValidationRejet('Validé')}>
                                Valider
                            </CButton>
                            <CButton color="danger" onClick={() => handleValidationRejet('Rejeté')}>
                                Rejeter
                            </CButton>
                        </>
                    )}
                </div>
            </div>

            <CRow>

                <CCol lg="8">
                    <CCard className="mb-4 border-0 shadow-sm">
                        <CCardHeader className="bg-white p-3 border-0 d-flex justify-content-between align-items-center">
                            <h5 className="mb-0 fw-bold">Description du problème</h5>
                            <CBadge color={getStatutColor(signalement.statut)} className="p-2 px-3">
                                {typeof signalement.statut === 'object' && signalement.statut !== null ? signalement.statut.libelle : signalement.statut}
                            </CBadge>
                        </CCardHeader>
                        <CCardBody className="p-4">
                            <p className="description-text mb-4">{signalement.description}</p>

                            <div className="signalement-photo-container rounded-4 overflow-hidden mb-4 shadow-sm">
                                {signalement.photo ? (
                                    <CImage src={signalement.photo} alt="Photo du signalement" style={{ width: '100%', height: '300px', objectFit: 'cover' }} />
                                ) : (
                                    <div className="photo-placeholder d-flex align-items-center justify-content-center bg-light text-muted" style={{ height: '300px' }}>
                                        <div className="text-center">
                                            <CIcon icon={cilLocationPin} size="3xl" className="mb-2" />
                                            <p>Photo du signalement</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <CRow className="g-4">
                                <CCol md="4">
                                    <div className="info-box p-3 rounded-3 bg-light h-100">
                                        <div className="text-muted small mb-1"><CIcon icon={cilCalendar} className="me-1" />Date</div>
                                        <div className="fw-bold">{signalement.daty}</div>
                                    </div>
                                </CCol>
                                <CCol md="4">
                                    <div className="info-box p-3 rounded-3 bg-light h-100">
                                        <div className="text-muted small mb-1"><CIcon icon={cilLayers} className="me-1" />Surface</div>
                                        <div className="fw-bold">{signalement.surface} m²</div>
                                    </div>
                                </CCol>
                                <CCol md="4">
                                    <div className="info-box p-3 rounded-3 bg-light h-100">
                                        <div className="text-muted small mb-1"><CIcon icon={cilMoney} className="me-1" />Budget Est.</div>
                                        <div className="fw-bold text-success">Ar {signalement.budget && signalement.budget.toLocaleString()}</div>
                                    </div>
                                </CCol>
                            </CRow>
                        </CCardBody>
                    </CCard>

                    <CCard className="border-0 shadow-sm">
                        <CCardHeader className="bg-white p-3 border-0">
                            <h5 className="mb-0 fw-bold">Entreprise Responsable</h5>
                        </CCardHeader>
                        <CCardBody className="p-4">
                            <div className="d-flex align-items-center gap-3">
                                <div className="enterprise-icon p-3 rounded-circle bg-info bg-opacity-10 text-info">
                                    <CIcon icon={cilBuilding} size="xl" />
                                </div>
                                <div>
                                    <div className="fw-bold fs-5">{typeof signalement.entreprise === 'object' && signalement.entreprise !== null ? signalement.entreprise.nom : (signalement.entreprise || 'Non assignée')}</div>
                                    <div className="text-muted">Partenaire certifié Lalantsika</div>
                                </div>
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>

                <CCol lg="4">
                    <CCard className="border-0 shadow-sm mb-4">
                        <CCardHeader className="bg-white p-3 border-0">
                            <h5 className="mb-0 fw-bold">Rapporté par</h5>
                        </CCardHeader>
                        <CCardBody className="p-4 text-center">
                            <div className="mb-3">
                                <CAvatar size="xl" className="profile-avatar mb-2 shadow-sm">
                                    {signalement.utilisateur && signalement.utilisateur.prenom && signalement.utilisateur.nom ? (
                                        <>
                                            {signalement.utilisateur.prenom.charAt(0)}{signalement.utilisateur.nom.charAt(0)}
                                        </>
                                    ) : null}
                                </CAvatar>
                            </div>
                            <h5 className="mb-1">{signalement.utilisateur && signalement.utilisateur.prenom} {signalement.utilisateur && signalement.utilisateur.nom}</h5>
                            <p className="text-muted small">@{signalement.utilisateur && signalement.utilisateur.identifiant}</p>
                            <hr className="my-4" />
                            <CButton color="primary" variant="outline" className="w-100" onClick={handleViewUser}>
                                <CIcon icon={cilUser} className="me-2" />
                                Voir fiche utilisateur
                            </CButton>
                        </CCardBody>
                    </CCard>
                    {/* Historique des statuts (Timeline) */}
                    <CCard className="mb-4 border-0 shadow-sm card-gradient-purple">
                        <CCardHeader className="bg-transparent p-3 border-0">
                            <h5 className="mb-0 fw-bold text-white">📋 Historique des statuts</h5>
                        </CCardHeader>
                        <CCardBody className="p-4 bg-white" style={{ borderRadius: '0 0 16px 16px' }}>
                            {loadingHisto ? (
                                <div className="text-center text-muted py-4">
                                    <div className="spinner-border text-primary" role="status"></div>
                                    <p className="mt-2 mb-0">Chargement...</p>
                                </div>
                            ) : histoStatuts.length === 0 ? (
                                <div className="text-center text-muted py-4">
                                    <div className="empty-history-icon mb-2">📭</div>
                                    <p className="mb-0">Aucun historique de statut</p>
                                </div>
                            ) : (
                                <div className="timeline-container">
                                    {histoStatuts.map((histo, index) => {
                                        const statutLibelle = histo.statut && histo.statut.libelle ? histo.statut.libelle : 'Inconnu'
                                        const getTimelineColor = (statut) => {
                                            switch(statut) {
                                                case 'Nouveau': return 'timeline-gray'
                                                case 'En cours': return 'timeline-blue'
                                                case 'Terminé': return 'timeline-green'
                                                case 'Validé': return 'timeline-purple'
                                                case 'Rejeté': return 'timeline-red'
                                                default: return 'timeline-gray'
                                            }
                                        }
                                        const getAvancement = (statut) => {
                                            switch(statut) {
                                                case 'Nouveau': return '0%'
                                                case 'En cours': return '50%'
                                                case 'Terminé': return '100%'
                                                default: return '-'
                                            }
                                        }
                                        return (
                                            <div key={histo.id_histo_statut} className={`timeline-item ${getTimelineColor(statutLibelle)} ${index === 0 ? 'timeline-first' : ''}`}>
                                                <div className="timeline-dot"></div>
                                                <div className="timeline-content">
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <span className={`badge-statut badge-${statutLibelle.toLowerCase().replace(' ', '-')}`}>
                                                            {statutLibelle}
                                                        </span>
                                                        <span className="badge-avancement">{getAvancement(statutLibelle)}</span>
                                                    </div>
                                                    <div className="timeline-date">
                                                        📅 {histo.daty ? new Date(histo.daty).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                                    </div>
                                                    {histo.description && (
                                                        <div className="timeline-description mt-2">
                                                            {histo.description}
                                                        </div>
                                                    )}
                                                    {histo.image && (
                                                        <div className="timeline-image mt-2">
                                                            <CImage
                                                                src={histo.image.startsWith('http') ? histo.image : `http://localhost:8000/storage/${histo.image}`}
                                                                alt="Preuve"
                                                                className="rounded shadow-sm"
                                                                style={{ maxWidth: '100%', maxHeight: 100, objectFit: 'cover' }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>

            <Modal
                visible={modal.visible}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                onClose={() => setModal({ ...modal, visible: false })}
            />

            {/* Modal d'assignation - VERSION CORRIGÉE */}
            {assignModal.visible && (
                <>
                    <div
                        className="modal-backdrop fade show"
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 1040
                        }}
                    ></div>
                    <div
                        className="modal d-block"
                        tabIndex="-1"
                        style={{ zIndex: 1050 }}
                    >
                        <div
                            ref={assignModalRef}
                            className="modal-dialog modal-dialog-centered"
                        >
                            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                                <div className="modal-header bg-light border-bottom-0">
                                    <h5 className="modal-title fw-bold">Assigner à une entreprise</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={closeAssignModal}
                                        aria-label="Close"
                                        disabled={assignLoading}
                                    ></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label fw-medium">Entreprise</label>
                                        <select
                                            className="form-select"
                                            value={selectedEntreprise}
                                            onChange={e => setSelectedEntreprise(e.target.value)}
                                            disabled={assignLoading}
                                        >
                                            <option value="">Sélectionner une entreprise...</option>
                                            {entreprises.map(ent => (
                                                <option key={ent.id_entreprise || ent.id} value={ent.id_entreprise || ent.id}>
                                                    {ent.nom}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-medium">Budget (Ar)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={assignBudget}
                                            onChange={e => setAssignBudget(e.target.value)}
                                            min="0"
                                            step="1000"
                                            placeholder="Ex: 500000"
                                            disabled={assignLoading}
                                        />
                                        <div className="form-text">Montant en Ariary</div>
                                    </div>
                                </div>
                                <div className="modal-footer border-top-0 bg-light">
                                    <button
                                        type="button"
                                        className="btn btn-secondary px-4"
                                        onClick={closeAssignModal}
                                        disabled={assignLoading}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary px-4"
                                        onClick={confirmAssign}
                                        disabled={assignLoading || !selectedEntreprise || !assignBudget}
                                    >
                                        {assignLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Assignation...
                                            </>
                                        ) : 'Assigner'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}


        </div>
    )
}