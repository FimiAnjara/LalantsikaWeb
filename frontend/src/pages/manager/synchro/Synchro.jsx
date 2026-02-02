import { useState, useEffect } from 'react'
import {
    CCard,
    CCardBody,
    CCardHeader,
    CButton,
    CCol,
    CRow,
    CSpinner,
    CProgress,
    CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSync, cilReload, cilCloudDownload } from '@coreui/icons'
import MessageModal from '../../../components/MessageModal'
import api from '../../../services/api'
import './Synchro.css'

export default function Synchro() {
    const [syncing, setSyncing] = useState(false)
    const [forceSyncing, setForceSyncing] = useState(false)
    const [syncStatus, setSyncStatus] = useState(null)
    const [statusLoading, setStatusLoading] = useState(true)
    const [modal, setModal] = useState({
        visible: false,
        type: 'success',
        title: '',
        message: '',
        autoClose: true
    })

    // Charger le statut de synchronisation au montage
    useEffect(() => {
        fetchSyncStatus()
    }, [])

    // Récupérer le statut de synchronisation
    const fetchSyncStatus = async () => {
        try {
            setStatusLoading(true)
            const response = await api.get('/sync/status')
            if (response.data.success) {
                setSyncStatus(response.data.data)
            }
        } catch (err) {
            console.error('Erreur récupération statut:', err)
        } finally {
            setStatusLoading(false)
        }
    }

    // Synchroniser les utilisateurs non synchronisés
    const handleSync = async () => {
        try {
            setSyncing(true)
            const response = await api.post('/sync/utilisateurs')

            if (response.data.success) {
                const data = response.data.data
                setModal({
                    visible: true,
                    type: 'success',
                    title: 'Synchronisation réussie',
                    message: `${data.synced} utilisateur(s) synchronisé(s) sur ${data.total}. ${data.failed > 0 ? `${data.failed} échec(s).` : ''}`,
                    autoClose: true
                })
                await fetchSyncStatus()
            } else {
                setModal({
                    visible: true,
                    type: 'error',
                    title: 'Erreur de synchronisation',
                    message: response.data.message || 'Erreur lors de la synchronisation',
                    autoClose: false
                })
            }
        } catch (err) {
            console.error('Erreur synchronisation:', err)
            setModal({
                visible: true,
                type: 'error',
                title: 'Erreur de synchronisation',
                message: err.response?.data?.message || 'Impossible de synchroniser avec Firebase',
                autoClose: false
            })
        } finally {
            setSyncing(false)
        }
    }

    // Forcer la re-synchronisation complète
    const handleForceSync = async () => {
        if (!window.confirm('Êtes-vous sûr de vouloir forcer la re-synchronisation de TOUS les utilisateurs ?')) {
            return
        }

        try {
            setForceSyncing(true)
            const response = await api.post('/sync/force')

            if (response.data.success) {
                const data = response.data.data
                setModal({
                    visible: true,
                    type: 'success',
                    title: 'Re-synchronisation terminée',
                    message: `${data.synced} utilisateur(s) re-synchronisé(s) sur ${data.total}. ${data.failed > 0 ? `${data.failed} échec(s).` : ''}`,
                    autoClose: true
                })
                await fetchSyncStatus()
            } else {
                setModal({
                    visible: true,
                    type: 'error',
                    title: 'Erreur',
                    message: response.data.message || 'Erreur lors de la re-synchronisation',
                    autoClose: false
                })
            }
        } catch (err) {
            console.error('Erreur force sync:', err)
            setModal({
                visible: true,
                type: 'error',
                title: 'Erreur',
                message: err.response?.data?.message || 'Impossible de forcer la synchronisation',
                autoClose: false
            })
        } finally {
            setForceSyncing(false)
        }
    }

    return (
        <div className="parametres-page">
            <div className="page-header mb-4">
                <div className="d-flex align-items-center gap-3">
                    <div className="header-icon">
                        <CIcon icon={cilSync} size="xl" />
                    </div>
                    <div>
                        <h2 className="mb-0 fw-bold">Synchronisation</h2>
                        <p className="text-muted mb-0">Synchroniser les données avec Firebase</p>
                    </div>
                </div>
            </div>

            {/* Synchronisation Card */}
            <CCard className="settings-card">
                <CCardHeader className="settings-card-header">
                    <CIcon icon={cilCloudDownload} className="me-2" />
                    Synchronisation Firebase
                </CCardHeader>
                <CCardBody className="p-4">
                    <div className="mb-3">
                        <h6 className="fw-bold mb-2">Synchroniser avec Firebase</h6>
                        <p className="text-muted small mb-0">
                            Synchronisez les utilisateurs PostgreSQL avec Firebase Firestore et Firebase Authentication.
                        </p>
                    </div>

                    {/* Statut de synchronisation */}
                    <div className="info-section mb-4">
                        <h5>Statut de synchronisation</h5>
                        {statusLoading ? (
                            <div className="text-center py-3">
                                <CSpinner size="sm" color="primary" />
                                <span className="ms-2">Chargement...</span>
                            </div>
                        ) : syncStatus ? (
                            <>
                                <CRow className="g-3 mb-3">
                                    <CCol xs={6} md={3}>
                                        <div className="stat-box">
                                            <div className="stat-value">{syncStatus.total_utilisateurs}</div>
                                            <div className="stat-label">Total</div>
                                        </div>
                                    </CCol>
                                    <CCol xs={6} md={3}>
                                        <div className="stat-box stat-synced">
                                            <div className="stat-value">{syncStatus.synchronises}</div>
                                            <div className="stat-label">Synchronisés</div>
                                        </div>
                                    </CCol>
                                    <CCol xs={6} md={3}>
                                        <div className="stat-box stat-pending">
                                            <div className="stat-value">{syncStatus.non_synchronises}</div>
                                            <div className="stat-label">En attente</div>
                                        </div>
                                    </CCol>
                                    <CCol xs={6} md={3}>
                                        <div className="stat-box stat-firebase">
                                            <div className="stat-value">{syncStatus.avec_firebase_uid}</div>
                                            <div className="stat-label">Avec Firebase UID</div>
                                        </div>
                                    </CCol>
                                </CRow>

                                {/* Barre de progression */}
                                <div className="progress-section">
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Progression</span>
                                        <CBadge color={syncStatus.pourcentage_sync === 100 ? 'primary' : 'info'}>
                                            {syncStatus.pourcentage_sync}%
                                        </CBadge>
                                    </div>
                                    <CProgress
                                        value={syncStatus.pourcentage_sync}
                                        color="primary"
                                        className="mb-0"
                                    />
                                </div>
                            </>
                        ) : (
                            <p className="text-muted">Impossible de charger le statut</p>
                        )}
                    </div>

                    {/* Boutons d'action */}
                    <div className="d-flex flex-wrap gap-3">
                        <CButton
                            onClick={handleSync}
                            className="btn-sync"
                            disabled={syncing || forceSyncing}
                        >
                            {syncing ? (
                                <>
                                    <CSpinner size="sm" className="me-2" />
                                    Synchronisation...
                                </>
                            ) : (
                                <>
                                    <CIcon icon={cilSync} className="me-2" />
                                    Synchroniser
                                </>
                            )}
                        </CButton>

                        <CButton
                            onClick={fetchSyncStatus}
                            color="light"
                            disabled={statusLoading}
                        >
                            <CIcon icon={cilReload} className="me-2" />
                            Actualiser
                        </CButton>
                    </div>
                </CCardBody>
            </CCard>

            {/* Message Modal */}
            <MessageModal
                visible={modal.visible}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                autoClose={modal.autoClose}
                autoCloseDelay={4000}
                onClose={() => setModal({ ...modal, visible: false })}
            />
        </div>
    )
}
