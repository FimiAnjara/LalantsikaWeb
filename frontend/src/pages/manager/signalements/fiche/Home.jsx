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
    cilUser,
    cilCalendar,
    cilClock,
    cilLocationPin,
    cilMoney,
    cilLayers,
    cilBuilding,
    cilArrowRight,
    cilX,
} from '@coreui/icons'
import { LoadingSpinner, ErrorModal, SuccessModal, ConfirmModal } from '../../../../components/ui'
import { API_BASE_URL, ENDPOINTS, getAuthHeaders } from '../../../../config/api'
import './Fiche.css'

// Flux des statuts pour déterminer le prochain statut
const STATUT_FLOW = {
    'Nouveau': ['En cours'],
    'En cours': ['Terminé'],
    'Terminé': null,
    'Rejeté': null,
}

export default function SignalementFiche() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [errorModal, setErrorModal] = useState({ visible: false, message: '' })
    const [successModal, setSuccessModal] = useState({ visible: false, message: '' })
    const [histoStatuts, setHistoStatuts] = useState([])
    const [loadingHisto, setLoadingHisto] = useState(true)
    const [deleteModal, setDeleteModal] = useState({ visible: false })
    const [assignModal, setAssignModal] = useState({ visible: false })
    const [entreprises, setEntreprises] = useState([])
    const [selectedEntreprise, setSelectedEntreprise] = useState('')
    const [assignBudget, setAssignBudget] = useState('')
    const [assignSurface, setAssignSurface] = useState('')
    const [assignLoading, setAssignLoading] = useState(false)
    const [entrepriseSearch, setEntrepriseSearch] = useState('')
    
    // Modal state for generic modal usage
    const [modal, setModal] = useState({ visible: false, type: '', title: '', message: '' })

    // Signalement state
    const [signalement, setSignalement] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const assignModalRef = useRef(null)

    // State pour le zoom de l'image
    const [zoomedImage, setZoomedImage] = useState(null)

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
                const headers = getAuthHeaders()
                const res = await fetch(ENDPOINTS.REPORT(id), { headers })
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
                const headers = getAuthHeaders()
                const res = await fetch(ENDPOINTS.REPORT_HISTO(id), { headers })
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
                const headers = getAuthHeaders()
                const res = await fetch(ENDPOINTS.COMPANIES, { headers })
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
    
    // Navigation vers la page de changement de statut
    const handleChangeStatut = () => navigate(`/manager/signalements/changer-statut/${id}`)
    
    // Vérifier si le changement de statut est possible
    const canChangeStatus = () => {
        if (!signalement) return false
        const nextStatuts = STATUT_FLOW[signalement.statut]
        return nextStatuts && nextStatuts.length > 0
    }
    
    // Obtenir le texte du bouton selon le statut actuel
    const getNextStatusButtonText = () => {
        if (!signalement) return 'Prochain statut'
        const nextStatuts = STATUT_FLOW[signalement.statut]
        if (!nextStatuts || nextStatuts.length === 0) return null
        if (nextStatuts.length === 1) {
            return `${nextStatuts[0]}`
        }
        return 'Changer le statut'
    }
    
    const handleAssign = () => {
        setAssignModal({ visible: true })
        setSelectedEntreprise('')
        setAssignBudget('')
        setAssignSurface('')
        setEntrepriseSearch('')
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
            
            // Mettre à jour le signalement (id_entreprise, budget et synchronized=false)
            const updateData = {
                id_entreprise: selectedEntreprise,
                budget: assignBudget,
                synchronized: false  // Marquer comme non synchronisé pour sync avec Firebase
            }
            
            // Ajouter la surface seulement si elle est renseignée
            if (assignSurface && !isNaN(assignSurface) && Number(assignSurface) > 0) {
                updateData.surface = assignSurface
            }
            
            const res = await fetch(ENDPOINTS.REPORT(id), {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            })
            const result = await res.json()
            
            if (!result.success) {
                throw new Error(result.message || 'Erreur lors de la mise à jour')
            }

            setModal({ visible: true, type: 'success', title: 'Succès', message: 'Signalement assigné avec succès. Synchronisation en attente.' })
            setAssignModal({ visible: false })
            // Recharger le signalement
            setTimeout(() => {
                window.location.reload();
            }, 800);
        } catch (e) {
            setModal({ visible: true, type: 'danger', title: 'Erreur', message: e.message || "Erreur lors de l'assignation." })
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

    const handleDelete = () => {
        setDeleteModal({ visible: true })
    }

    const confirmDelete = async () => {
        setDeleteModal({ visible: false })
        try {
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
            const res = await fetch(ENDPOINTS.REPORT(id),
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


    if (loading) return <LoadingSpinner isLoading={true} message="Chargement du signalement..." />
    if (error) return <div className="fiche-signalement"><div className="alert alert-danger m-4">{error}</div></div>
    if (!signalement) return null

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
                    {/* Bouton unique Prochain Statut */}
                    {canChangeStatus() && (
                        <CButton
                            color="primary"
                            className="btn-theme"
                            onClick={handleChangeStatut}
                        >
                            <CIcon icon={cilArrowRight} className="me-2" />
                            {getNextStatusButtonText()}
                        </CButton>
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

                            {/* Photo principale du signalement (1ère image de la création) */}
                            {(() => {
                                // Le premier histo_statut (création) est le dernier dans l'array (ordonné DESC)
                                const creationHisto = histoStatuts.length > 0 ? histoStatuts[histoStatuts.length - 1] : null
                                const creationImages = creationHisto?.images || []
                                const mainPhoto = creationImages.length > 0 ? creationImages[0] : null
                                
                                return (
                                    <div className="signalement-photo-container rounded-4 overflow-hidden mb-4 shadow-sm">
                                        {mainPhoto ? (
                                            <CImage 
                                                src={mainPhoto.image} 
                                                alt="Photo du signalement" 
                                                style={{ width: '100%', height: '300px', objectFit: 'cover', cursor: 'pointer' }} 
                                                onClick={() => setZoomedImage(mainPhoto.image)}
                                            />
                                        ) : (
                                            <div className="photo-placeholder d-flex align-items-center justify-content-center bg-light text-muted" style={{ height: '300px' }}>
                                                <div className="text-center">
                                                    <CIcon icon={cilLocationPin} size="3xl" className="mb-2" />
                                                    <p>Aucune photo</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })()}

                            {/* Autres photos de la création du signalement */}
                            {(() => {
                                const creationHisto = histoStatuts.length > 0 ? histoStatuts[histoStatuts.length - 1] : null
                                const creationImages = creationHisto?.images || []
                                const otherPhotos = creationImages.slice(1) // Toutes sauf la première
                                
                                if (otherPhotos.length === 0) return null
                                
                                return (
                                    <div className="mb-4">
                                        <h6 className="fw-bold mb-3 text-muted">Autres photos du signalement</h6>
                                        <div className="photos-gallery d-flex flex-wrap gap-2">
                                            {otherPhotos.map((img) => (
                                                <div key={img.id_image_signalement} className="photo-item">
                                                    <CImage
                                                        src={img.image}
                                                        alt="Photo signalement"
                                                        style={{ 
                                                            width: '120px', 
                                                            height: '120px', 
                                                            objectFit: 'cover',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer',
                                                            border: '2px solid #e9ecef',
                                                            transition: 'transform 0.2s'
                                                        }}
                                                        className="hover-zoom"
                                                        onClick={() => setZoomedImage(img.image)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })()}

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
                                <div className="flex-grow-1">
                                    <div className="fw-bold fs-5">{typeof signalement.entreprise === 'object' && signalement.entreprise !== null ? signalement.entreprise.nom : (signalement.entreprise || 'Non assignée')}</div>
                                    <div className="text-muted">Partenaire certifié Lalantsika</div>
                                </div>
                            </div>
                            {/* Bouton Assigner - visible si pas encore assigné */}
                            {!signalement.entreprise && (
                                <CButton color="info" className="w-100 mt-3" onClick={handleAssign}>
                                    <CIcon icon={cilBuilding} className="me-2" />
                                    Assigner à une entreprise
                                </CButton>
                            )}
                        </CCardBody>
                    </CCard>
                </CCol>

                <CCol lg="4">
                    <CCard className="border-0 shadow-sm mb-4">
                        <CCardHeader className="bg-white p-3 border-0">
                            <h5 className="mb-0 fw-bold">Rapporté par</h5>
                        </CCardHeader>
                        <CCardBody className="p-4 text-center">
                            <div className="mb-3 d-flex justify-content-center">
                                {signalement.utilisateur?.photo_url ? (
                                    <div className="profile-photo-wrapper">
                                        <img src={getPhotoUrl(signalement.utilisateur.photo_url)} alt={`${signalement.utilisateur.prenom} ${signalement.utilisateur.nom}`} className="profile-photo" />
                                    </div>
                                ) : (
                                    <CAvatar size="xl" className="profile-avatar mb-2 shadow-sm">
                                        {signalement.utilisateur?.prenom?.charAt(0) || ''}{signalement.utilisateur?.nom?.charAt(0) || ''}
                                    </CAvatar>
                                )}
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
                    {/* Historique des statuts (en bas) */}
                    <CCard className="mb-4 border-0 shadow-sm histo-card">
                        <CCardHeader className="bg-navy text-white p-3 border-0">
                            <h5 className="mb-0 fw-bold">Historique des statuts</h5>
                        </CCardHeader>
                        <CCardBody className="p-4">
                            {loadingHisto ? (
                                <div className="text-center text-muted py-4">
                                    <div className="spinner-border text-primary" role="status"></div>
                                    <p className="mt-2 mb-0">Chargement...</p>
                                </div>
                            ) : histoStatuts.length === 0 ? (
                                <div className="text-center text-muted py-4">
                                    <CIcon icon={cilClock} size="xl" className="mb-2" />
                                    <p className="mb-0">Aucun historique de statut.</p>
                                </div>
                            ) : (
                                <div className="timeline">
                                    {[...histoStatuts].reverse().map((histo, index) => {
                                        const statutLibelle = histo.statut && histo.statut.libelle ? histo.statut.libelle : 'Inconnu'
                                        const getTimelineColor = (statut) => {
                                            switch(statut) {
                                                case 'Nouveau': return 'timeline-gray'
                                                case 'En cours': return 'timeline-blue'
                                                case 'Terminé': return 'timeline-green'
                                                case 'Validé': return 'timeline-teal'
                                                case 'Rejeté': return 'timeline-red'
                                                case 'En attente': return 'timeline-orange'
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
                                            <div key={histo.id_histo_statut} className={`timeline-item ${getTimelineColor(statutLibelle)}`}>
                                                <div className="timeline-marker"></div>
                                                <div className="timeline-content">
                                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                                        <CBadge className={`badge-${statutLibelle.toLowerCase().replace(' ', '-')}`}>
                                                            {statutLibelle}
                                                        </CBadge>
                                                        <span className="badge bg-light text-dark">
                                                            Avancement: {getAvancement(statutLibelle)}
                                                        </span>
                                                    </div>
                                                    <div className="timeline-date">
                                                        <CIcon icon={cilCalendar} size="sm" className="me-1" />
                                                        {histo.daty ? new Date(histo.daty).toLocaleDateString('fr-FR', { 
                                                            weekday: 'long', 
                                                            year: 'numeric', 
                                                            month: 'long', 
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        }) : 'Date non définie'}
                                                    </div>
                                                    {histo.description && (
                                                        <div className="timeline-description">
                                                            {histo.description}
                                                        </div>
                                                    )}
                                                    {/* Images de l'historique */}
                                                    {histo.images && histo.images.length > 0 && (
                                                        <div className="timeline-images mt-2 d-flex flex-wrap gap-2">
                                                            {histo.images.map((img) => (
                                                                <CImage
                                                                    key={img.id_image_signalement}
                                                                    src={img.image}
                                                                    alt="Photo"
                                                                    style={{ 
                                                                        width: '60px', 
                                                                        height: '60px', 
                                                                        objectFit: 'cover',
                                                                        borderRadius: '6px',
                                                                        cursor: 'pointer',
                                                                        border: '1px solid #dee2e6'
                                                                    }}
                                                                    onClick={() => setZoomedImage(img.image)}
                                                                />
                                                            ))}
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

            {/* Generic Modal based on type */}
            {modal.visible && modal.type === 'success' && (
                <SuccessModal
                    visible={modal.visible}
                    title={modal.title}
                    message={modal.message}
                    onClose={() => setModal({ ...modal, visible: false })}
                />
            )}
            
            {modal.visible && modal.type === 'danger' && (
                <ErrorModal
                    visible={modal.visible}
                    title={modal.title}
                    message={modal.message}
                    onClose={() => setModal({ ...modal, visible: false })}
                />
            )}

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
                                        <input
                                            type="text"
                                            className="form-control mb-2"
                                            placeholder="Rechercher une entreprise..."
                                            value={entrepriseSearch}
                                            onChange={e => setEntrepriseSearch(e.target.value)}
                                            disabled={assignLoading}
                                        />
                                        <div className="entreprise-list" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '8px' }}>
                                            {entreprises
                                                .filter(ent => {
                                                    const nom = (ent.nom_entreprise || ent.nom || '').toLowerCase()
                                                    return nom.includes(entrepriseSearch.toLowerCase())
                                                })
                                                .map(ent => (
                                                    <div
                                                        key={ent.id_entreprise || ent.id}
                                                        className={`entreprise-item p-2 px-3 ${selectedEntreprise == (ent.id_entreprise || ent.id) ? 'bg-primary text-white' : 'bg-white'}`}
                                                        style={{ 
                                                            cursor: 'pointer',
                                                            borderBottom: '1px solid #eee',
                                                            transition: 'background-color 0.2s'
                                                        }}
                                                        onClick={() => !assignLoading && setSelectedEntreprise(ent.id_entreprise || ent.id)}
                                                    >
                                                        <div className="fw-medium">{ent.nom_entreprise || ent.nom}</div>
                                                        {ent.contact && <small className={selectedEntreprise == (ent.id_entreprise || ent.id) ? 'text-white-50' : 'text-muted'}>{ent.contact}</small>}
                                                    </div>
                                                ))
                                            }
                                            {entreprises.filter(ent => {
                                                const nom = (ent.nom_entreprise || ent.nom || '').toLowerCase()
                                                return nom.includes(entrepriseSearch.toLowerCase())
                                            }).length === 0 && (
                                                <div className="p-3 text-center text-muted">Aucune entreprise trouvée</div>
                                            )}
                                        </div>
                                        {selectedEntreprise && (
                                            <div className="mt-2 p-2 bg-light rounded d-flex justify-content-between align-items-center">
                                                <span className="text-success fw-medium">
                                                    ✓ {entreprises.find(e => (e.id_entreprise || e.id) == selectedEntreprise)?.nom_entreprise || entreprises.find(e => (e.id_entreprise || e.id) == selectedEntreprise)?.nom}
                                                </span>
                                                <button 
                                                    type="button" 
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => setSelectedEntreprise('')}
                                                >
                                                    Changer
                                                </button>
                                            </div>
                                        )}
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

            {/* Modal de zoom image */}
            {zoomedImage && (
                <div 
                    className="image-zoom-modal"
                    onClick={() => setZoomedImage(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'zoom-out'
                    }}
                >
                    <button
                        onClick={() => setZoomedImage(null)}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white'
                        }}
                    >
                        <CIcon icon={cilX} size="lg" />
                    </button>
                    <img
                        src={zoomedImage}
                        alt="Photo zoomée"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            objectFit: 'contain',
                            borderRadius: '8px',
                            cursor: 'default'
                        }}
                    />
                </div>
            )}


        </div>
    )
}