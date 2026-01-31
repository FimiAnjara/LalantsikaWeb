import { useState, useEffect } from 'react'
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

    // Charger la liste des entreprises pour l'assignation
    useEffect(() => {
        const fetchEntreprises = async () => {
            try {
                const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
                const res = await fetch('http://localhost:8000/api/company', {
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
            const res = await fetch(`http://localhost:8000/api/reports/${id}/assign`, {
                method: 'POST',
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
                setModal({ visible: true, type: 'success', title: 'Succès', message: 'Signalement assigné avec succès.' })
                setAssignModal({ visible: false })
                // Optionnel : recharger le signalement
                setLoading(true)
                const reload = await fetch(`http://localhost:8000/api/reports/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    }
                })
                const reloadResult = await reload.json()
                if (reloadResult.success && reloadResult.data) {
                    setSignalement(reloadResult.data)
                }
            } else {
                throw new Error(result.message || 'Erreur lors de l\'assignation')
            }
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

    if (loading) return <div className="fiche-signalement"><div className="text-center p-5">Chargement...</div></div>
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
                    <CButton color="primary" className="btn-theme" onClick={handleEdit}>
                        <CIcon icon={cilPencil} className="me-2" />
                        Modifier
                    </CButton>
                    <CButton color="info" onClick={handleAssign}>
                        <CIcon icon={cilBuilding} className="me-2" />
                        Assigner
                    </CButton>
                    <CButton color="danger" onClick={handleDelete}>
                        <CIcon icon={cilTrash} className="me-2" />
                        Supprimer
                    </CButton>
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

                    <CCard className="border-0 shadow-sm bg-navy text-white">
                        <CCardBody className="p-4">
                            <h6 className="text-uppercase small mb-3 opacity-75">Statistiques Point</h6>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Total Signalements</span>
                                <span className="fw-bold">12</span>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span>Degré de priorité</span>
                                <span className="badge bg-danger">Haut</span>
                            </div>
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

            {/* Modal d'assignation */}
            {assignModal.visible && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(0,0,0,0.2)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    onClick={() => setAssignModal({ visible: false })}
                >
                    <div
                        className="modal-dialog modal-sm bg-white p-4 rounded-4 shadow-lg"
                        style={{ maxWidth: 400, width: '100%', boxSizing: 'border-box' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h5 className="mb-3">Assigner à une entreprise</h5>
                        <div className="mb-3">
                            <label className="form-label">Entreprise</label>
                            <select className="form-select" value={selectedEntreprise} onChange={e => setSelectedEntreprise(e.target.value)}>
                                <option value="">Sélectionner...</option>
                                {entreprises.map(ent => (
                                    <option key={ent.id_entreprise || ent.id} value={ent.id_entreprise || ent.id}>{ent.nom}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Budget</label>
                            <input type="number" className="form-control" value={assignBudget} onChange={e => setAssignBudget(e.target.value)} min="0" placeholder="Montant en Ariary" />
                        </div>
                        <div className="d-flex gap-2 justify-content-end mt-4">
                            <button className="btn btn-secondary" onClick={() => setAssignModal({ visible: false })} disabled={assignLoading}>Annuler</button>
                            <button className="btn btn-primary" onClick={confirmAssign} disabled={assignLoading}>
                                {assignLoading ? 'Assignation...' : 'Assigner'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Modal
                visible={deleteModal.visible}
                type="danger"
                title="Supprimer le signalement"
                message="Cette action est irréversible. Voulez-vous vraiment supprimer ce signalement ?"
                onClose={() => setDeleteModal({ visible: false })}
                onConfirm={confirmDelete}
                confirmText="Supprimer"
                closeText="Annuler"
            />
        </div>
    )
}
