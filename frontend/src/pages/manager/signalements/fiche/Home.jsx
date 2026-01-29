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

    // Mock data for the signalement
    const [signalement, setSignalement] = useState({
        id_signalement: id || 1,
        daty: '2025-01-20 10:30',
        surface: 1250.50,
        budget: 50000.00,
        description: 'La route principale est gravement endommagée au niveau du carrefour. Des nids-de-poule dangereux se sont formés suite aux dernières pluies.',
        photo: '/assets/img/road_damage.jpg', // Placeholder
        id_entreprise: 1,
        entreprise: 'BTP Construction S.A.',
        id_utilisateur: 1,
        statut: 'En attente',
        utilisateur: {
            id: 1,
            nom: 'Dupont',
            prenom: 'Jean',
            identifiant: 'jean_d',
            photo: null, // Initiales si pas de photo
            type_utilisateur: 'Utilisateur'
        }
    })

    const getStatutColor = (statut) => {
        switch (statut) {
            case 'En attente': return 'warning'
            case 'En cours': return 'info'
            case 'Résolu': return 'success'
            default: return 'secondary'
        }
    }

    const handleBack = () => navigate('/manager/signalements/liste')
    const handleEdit = () => navigate(`/manager/signalements/modifier/${id}`)
    const handleViewUser = () => navigate(`/manager/utilisateurs/fiche/${signalement.utilisateur.id}`)

    const handleDelete = () => {
        setDeleteModal({ visible: true })
    }

    const confirmDelete = () => {
        setDeleteModal({ visible: false })
        setModal({
            visible: true,
            type: 'success',
            title: 'Succès',
            message: 'Signalement supprimé avec succès.'
        })
        setTimeout(() => navigate('/manager/signalements/liste'), 1500)
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
                    <CButton color="primary" className="btn-theme" onClick={handleEdit}>
                        <CIcon icon={cilPencil} className="me-2" />
                        Modifier / Assigner
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
                                {signalement.statut}
                            </CBadge>
                        </CCardHeader>
                        <CCardBody className="p-4">
                            <p className="description-text mb-4">{signalement.description}</p>
                            
                            <div className="signalement-photo-container rounded-4 overflow-hidden mb-4 shadow-sm">
                                <div className="photo-placeholder d-flex align-items-center justify-content-center bg-light text-muted" style={{ height: '300px' }}>
                                    <div className="text-center">
                                        <CIcon icon={cilLocationPin} size="3xl" className="mb-2" />
                                        <p>Photo du signalement</p>
                                    </div>
                                </div>
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
                                        <div className="fw-bold text-success">Ar {signalement.budget.toLocaleString()}</div>
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
                                    <div className="fw-bold fs-5">{signalement.entreprise || 'Non assignée'}</div>
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
                                    {signalement.utilisateur.prenom.charAt(0)}{signalement.utilisateur.nom.charAt(0)}
                                </CAvatar>
                            </div>
                            <h5 className="mb-1">{signalement.utilisateur.prenom} {signalement.utilisateur.nom}</h5>
                            <p className="text-muted small">@{signalement.utilisateur.identifiant}</p>
                            
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
