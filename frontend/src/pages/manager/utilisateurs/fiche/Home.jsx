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
    CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
    cilArrowLeft,
    cilPencil,
    cilLockLocked,
    cilLockUnlocked,
    cilTrash,
    cilUser,
    cilEnvelopeOpen,
    cilCalendar,
    cilSync,
} from '@coreui/icons'
import Modal from '../../../../components/Modal'
import './Fiche.css'

export default function FicheUtilisateur() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [modal, setModal] = useState({ visible: false, type: 'success', title: '', message: '' })
    const [actionModal, setActionModal] = useState({ visible: false, type: 'warning', title: '', message: '', action: null })
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)

    const [user, setUser] = useState(null)

    // Récupérer les détails de l'utilisateur depuis l'API
    useEffect(() => {
        fetchUser()
    }, [id])

    const fetchUser = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
            const response = await fetch(`http://localhost:8000/api/users/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            })

            const result = await response.json()

            if (result.success && result.data) {
                setUser({
                    id_utilisateur: result.data.id_utilisateur,
                    identifiant: result.data.identifiant,
                    nom: result.data.nom,
                    prenom: result.data.prenom,
                    email: result.data.email,
                    dtn: result.data.dtn,
                    sexe: result.data.sexe?.libelle || 'Non renseigné',
                    type_utilisateur: result.data.type_utilisateur?.libelle || 'Utilisateur',
                    statut: result.data.statut || 'actif',
                    synchronized: result.data.synchronized || false,
                    firebase_uid: result.data.firebase_uid,
                })
            } else {
                setModal({
                    visible: true,
                    type: 'danger',
                    title: 'Erreur',
                    message: result.message || 'Utilisateur non trouvé'
                })
            }
        } catch (error) {
            console.error('Erreur:', error)
            setModal({
                visible: true,
                type: 'danger',
                title: 'Erreur',
                message: 'Impossible de charger les données de l\'utilisateur'
            })
        } finally {
            setLoading(false)
        }
    }

    const getTypeColor = (type) => {
        switch (type) {
            case 'Administrateur': return 'danger'
            case 'Manager': return 'warning'
            case 'Utilisateur': return 'info'
            default: return 'secondary'
        }
    }

    const getStatutColor = (statut) => {
        return statut === 'actif' ? 'success' : 'danger'
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'Non renseigné'
        const date = new Date(dateString)
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    const handleBack = () => navigate('/manager/utilisateurs/liste')

    const handleEdit = () => navigate(`/manager/utilisateurs/modifier/${id}`)

    const handleToggleStatus = () => {
        const isActif = user.statut === 'actif'
        setActionModal({
            visible: true,
            type: isActif ? 'warning' : 'info',
            title: isActif ? 'Bloquer l\'utilisateur' : 'Débloquer l\'utilisateur',
            message: `Êtes-vous sûr de vouloir ${isActif ? 'bloquer' : 'débloquer'} cet utilisateur ?`,
            action: async () => {
                setActionLoading(true)
                try {
                    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
                    const endpoint = isActif ? 'block' : 'unblock'
                    const response = await fetch(`http://localhost:8000/api/users/${id}/${endpoint}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                        }
                    })

                    const result = await response.json()

                    if (result.success) {
                        setUser({ ...user, statut: isActif ? 'bloque' : 'actif' })
                        setModal({
                            visible: true,
                            type: 'success',
                            title: 'Succès',
                            message: result.message || `Utilisateur ${isActif ? 'bloqué' : 'débloqué'} avec succès.`
                        })
                    } else {
                        setModal({
                            visible: true,
                            type: 'danger',
                            title: 'Erreur',
                            message: result.message || 'Une erreur est survenue'
                        })
                    }
                } catch (error) {
                    setModal({
                        visible: true,
                        type: 'danger',
                        title: 'Erreur',
                        message: 'Impossible de modifier le statut'
                    })
                } finally {
                    setActionLoading(false)
                }
            }
        })
    }

    const handleDelete = () => {
        setActionModal({
            visible: true,
            type: 'danger',
            title: 'Supprimer l\'utilisateur',
            message: 'Cette action est irréversible. Voulez-vous vraiment supprimer cet utilisateur ?',
            action: async () => {
                setActionLoading(true)
                try {
                    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
                    const response = await fetch(`http://localhost:8000/api/users/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                        }
                    })

                    const result = await response.json()

                    if (result.success) {
                        navigate('/manager/utilisateurs/liste')
                    } else {
                        setModal({
                            visible: true,
                            type: 'danger',
                            title: 'Erreur',
                            message: result.message || 'Impossible de supprimer l\'utilisateur'
                        })
                    }
                } catch (error) {
                    setModal({
                        visible: true,
                        type: 'danger',
                        title: 'Erreur',
                        message: 'Erreur lors de la suppression'
                    })
                } finally {
                    setActionLoading(false)
                }
            }
        })
    }

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <CSpinner color="primary" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="text-center py-5">
                <h4>Utilisateur non trouvé</h4>
                <CButton color="primary" onClick={handleBack}>
                    Retour à la liste
                </CButton>
            </div>
        )
    }

    return (
        <div className="fiche-utilisateur">
            <div className="page-header d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                    <button className="btn-back" onClick={handleBack} title="Retour">
                        <CIcon icon={cilArrowLeft} size="xl" />
                    </button>
                    <div>
                        <h2 className="mb-0">Fiche Utilisateur</h2>
                        <small className="text-muted">Détails du compte #{user.id_utilisateur}</small>
                    </div>
                </div>
                <div className="header-actions d-flex gap-2">
                    <CButton color="primary" className="btn-theme" onClick={handleEdit} disabled={actionLoading}>
                        <CIcon icon={cilPencil} className="me-2" />
                        Modifier
                    </CButton>
                    <CButton
                        color={user.statut === 'actif' ? 'warning' : 'success'}
                        className="text-white"
                        onClick={handleToggleStatus}
                        disabled={actionLoading}
                    >
                        {actionLoading ? (
                            <CSpinner size="sm" className="me-2" />
                        ) : (
                            <CIcon icon={user.statut === 'actif' ? cilLockLocked : cilLockUnlocked} className="me-2" />
                        )}
                        {user.statut !== 'actif' ? 'Bloquer' : 'Débloquer'}
                    </CButton>
                    <CButton color="danger" onClick={handleDelete} disabled={actionLoading}>
                        <CIcon icon={cilTrash} className="me-2" />
                        Supprimer
                    </CButton>
                </div>
            </div>

            <CRow>
                <CCol lg="4">
                    <CCard className="profile-card mb-4 border-0 shadow-sm">
                        <CCardBody className="text-center p-4">
                            <div className="position-relative d-inline-block mb-3">
                                <CAvatar size="xl" className="profile-avatar">
                                    {user.prenom?.charAt(0) || ''}{user.nom?.charAt(0) || ''}
                                </CAvatar>
                                <span className={`status-indicator ${user.statut}`}></span>
                            </div>
                            <h4 className="mb-1">{user.prenom} {user.nom}</h4>
                            <p className="text-muted mb-3">@{user.identifiant}</p>
                            <div className="d-flex justify-content-center gap-2 flex-wrap mb-3">
                                <CBadge color={getTypeColor(user.type_utilisateur)} className="p-2 px-3">
                                    {user.type_utilisateur}
                                </CBadge>
                                <CBadge color={getStatutColor(user.statut)} className="p-2 px-3">
                                    {user.statut === 'actif' ? 'Actif' : 'Bloqué'}
                                </CBadge>
                                <CBadge color={user.synchronized ? 'success' : 'secondary'} className="p-2 px-3">
                                    <CIcon icon={cilSync} className="me-1" size="sm" />
                                    {user.synchronized ? 'Synchronisé' : 'Local'}
                                </CBadge>
                            </div>
                            <hr />
                            <div className="text-start mt-4">
                                <div className="info-item mb-3">
                                    <CIcon icon={cilEnvelopeOpen} className="me-2 text-primary" />
                                    <span>{user.email || 'Non renseigné'}</span>
                                </div>
                                <div className="info-item mb-3">
                                    <CIcon icon={cilCalendar} className="me-2 text-primary" />
                                    <span>Né(e) le {formatDate(user.dtn)}</span>
                                </div>
                                <div className="info-item">
                                    <CIcon icon={cilUser} className="me-2 text-primary" />
                                    <span>{user.sexe}</span>
                                </div>
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>

                <CCol lg="8">
                    <CCard className="border-0 shadow-sm mb-4">
                        <CCardHeader className="bg-white p-3 border-0">
                            <h5 className="mb-0 fw-bold">Informations Personnelles</h5>
                        </CCardHeader>
                        <CCardBody className="p-4">
                            <CRow className="mb-4">
                                <CCol md="6" className="mb-3">
                                    <label className="text-muted small text-uppercase fw-bold mb-1">Prénom</label>
                                    <div className="fw-medium fs-5">{user.prenom || 'Non renseigné'}</div>
                                </CCol>
                                <CCol md="6" className="mb-3">
                                    <label className="text-muted small text-uppercase fw-bold mb-1">Nom</label>
                                    <div className="fw-medium fs-5">{user.nom || 'Non renseigné'}</div>
                                </CCol>
                                <CCol md="6" className="mb-3">
                                    <label className="text-muted small text-uppercase fw-bold mb-1">Sexe</label>
                                    <div className="fw-medium fs-5">{user.sexe}</div>
                                </CCol>
                                <CCol md="6" className="mb-3">
                                    <label className="text-muted small text-uppercase fw-bold mb-1">Date de naissance</label>
                                    <div className="fw-medium fs-5">{formatDate(user.dtn)}</div>
                                </CCol>
                                <CCol md="12" className="mb-3">
                                    <label className="text-muted small text-uppercase fw-bold mb-1">Email</label>
                                    <div className="fw-medium fs-5">{user.email || 'Non renseigné'}</div>
                                </CCol>
                            </CRow>
                            <hr />
                            <h5 className="mb-4 mt-4 fw-bold">Sécurité et Accès</h5>
                            <CRow>
                                <CCol md="6" className="mb-3">
                                    <label className="text-muted small text-uppercase fw-bold mb-1">Type de compte</label>
                                    <div>
                                        <CBadge color={getTypeColor(user.type_utilisateur)} className="p-2">
                                            {user.type_utilisateur}
                                        </CBadge>
                                    </div>
                                </CCol>
                                <CCol md="6" className="mb-3">
                                    <label className="text-muted small text-uppercase fw-bold mb-1">Synchronisation Firebase</label>
                                    <div>
                                        <CBadge color={user.synchronized ? 'success' : 'secondary'} className="p-2">
                                            <CIcon icon={cilSync} className="me-1" size="sm" />
                                            {user.synchronized ? 'Synchronisé' : 'Non synchronisé'}
                                        </CBadge>
                                    </div>
                                </CCol>
                                {user.firebase_uid && (
                                    <CCol md="6" className="mb-3">
                                        <label className="text-muted small text-uppercase fw-bold mb-1">Firebase UID</label>
                                        <div className="fw-medium text-truncate" style={{ fontSize: '0.85rem' }}>
                                            {user.firebase_uid}
                                        </div>
                                    </CCol>
                                )}
                            </CRow>
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

            <Modal
                visible={actionModal.visible}
                type={actionModal.type}
                title={actionModal.title}
                message={actionModal.message}
                onClose={() => setActionModal({ ...actionModal, visible: false })}
                onConfirm={() => {
                    actionModal.action()
                    setActionModal({ ...actionModal, visible: false })
                }}
                confirmText="Continuer"
                closeText="Annuler"
            />
        </div>
    )
}
