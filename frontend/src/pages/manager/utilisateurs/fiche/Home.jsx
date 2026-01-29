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
    cilPhone,
    cilHome,
} from '@coreui/icons'
import Modal from '../../../../components/Modal'
import './Fiche.css'

export default function FicheUtilisateur() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [modal, setModal] = useState({ visible: false, type: 'success', title: '', message: '' })
    const [actionModal, setActionModal] = useState({ visible: false, type: 'warning', title: '', message: '', action: null })

    // Mock data for the user
    const [user, setUser] = useState({
        id_utilisateur: id || 1,
        identifiant: 'john_doe',
        nom: 'Doe',
        prenom: 'John',
        email: 'john.doe@example.com',
        telephone: '+261 34 00 000 00',
        adresse: 'Lot IVG 123 Antananarivo',
        sexe: 'Masculin',
        type_utilisateur: 'Utilisateur',
        statut: 'actif',
        daty_inscription: '15/01/2026'
    })

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

    const handleBack = () => navigate('/manager/utilisateurs/liste')

    const handleEdit = () => navigate(`/manager/utilisateurs/modifier/${id}`)

    const handleToggleStatus = () => {
        const isActif = user.statut === 'actif'
        setActionModal({
            visible: true,
            type: isActif ? 'warning' : 'info',
            title: isActif ? 'Bloquer l\'utilisateur' : 'Débloquer l\'utilisateur',
            message: `Êtes-vous sûr de vouloir ${isActif ? 'bloquer' : 'débloquer'} cet utilisateur ?`,
            action: () => {
                setUser({ ...user, statut: isActif ? 'bloque' : 'actif' })
                setModal({
                    visible: true,
                    type: 'success',
                    title: 'Succès',
                    message: `Utilisateur ${isActif ? 'bloqué' : 'débloqué'} avec succès.`
                })
            }
        })
    }

    const handleDelete = () => {
        setActionModal({
            visible: true,
            type: 'danger',
            title: 'Supprimer l\'utilisateur',
            message: 'Cette action est irréversible. Voulez-vous vraiment supprimer cet utilisateur ?',
            action: () => {
                console.log('Suppression de l\'utilisateur:', id)
                navigate('/manager/utilisateurs/liste')
            }
        })
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
                    <CButton color="primary" className="btn-theme" onClick={handleEdit}>
                        <CIcon icon={cilPencil} className="me-2" />
                        Modifier
                    </CButton>
                    <CButton
                        color={user.statut === 'actif' ? 'warning' : 'success'}
                        className="text-white"
                        onClick={handleToggleStatus}
                    >
                        <CIcon icon={user.statut === 'actif' ? cilLockLocked : cilLockUnlocked} className="me-2" />
                        {user.statut === 'actif' ? 'Bloquer' : 'Débloquer'}
                    </CButton>
                    <CButton color="danger" onClick={handleDelete}>
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
                                    {user.prenom.charAt(0)}{user.nom.charAt(0)}
                                </CAvatar>
                                <span className={`status-indicator ${user.statut}`}></span>
                            </div>
                            <h4 className="mb-1">{user.prenom} {user.nom}</h4>
                            <p className="text-muted mb-3">@{user.identifiant}</p>
                            <div className="d-flex justify-content-center gap-2 mb-3">
                                <CBadge color={getTypeColor(user.type_utilisateur)} className="p-2 px-3">
                                    {user.type_utilisateur}
                                </CBadge>
                                <CBadge color={getStatutColor(user.statut)} className="p-2 px-3">
                                    {user.statut === 'actif' ? 'Actif' : 'Bloqué'}
                                </CBadge>
                            </div>
                            <hr />
                            <div className="text-start mt-4">
                                <div className="info-item mb-3">
                                    <CIcon icon={cilEnvelopeOpen} className="me-2 text-primary" />
                                    <span>{user.email}</span>
                                </div>
                                <div className="info-item mb-3">
                                    <CIcon icon={cilPhone} className="me-2 text-primary" />
                                    <span>{user.telephone}</span>
                                </div>
                                <div className="info-item">
                                    <CIcon icon={cilHome} className="me-2 text-primary" />
                                    <span>{user.adresse}</span>
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
                                    <div className="fw-medium fs-5">{user.prenom}</div>
                                </CCol>
                                <CCol md="6" className="mb-3">
                                    <label className="text-muted small text-uppercase fw-bold mb-1">Nom</label>
                                    <div className="fw-medium fs-5">{user.nom}</div>
                                </CCol>
                                <CCol md="6" className="mb-3">
                                    <label className="text-muted small text-uppercase fw-bold mb-1">Sexe</label>
                                    <div className="fw-medium fs-5">{user.sexe}</div>
                                </CCol>
                                <CCol md="6" className="mb-3">
                                    <label className="text-muted small text-uppercase fw-bold mb-1">Date d'inscription</label>
                                    <div className="fw-medium fs-5">{user.daty_inscription}</div>
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
                                    <label className="text-muted small text-uppercase fw-bold mb-1">Statut du compte</label>
                                    <div>
                                        <CBadge color={getStatutColor(user.statut)} className="p-2">
                                            {user.statut === 'actif' ? 'Opérationnel' : 'Accès Restreint'}
                                        </CBadge>
                                    </div>
                                </CCol>
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
