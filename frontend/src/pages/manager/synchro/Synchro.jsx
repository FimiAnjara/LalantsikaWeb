import { useState, useEffect } from 'react'
import {
    CCard,
    CCardBody,
    CCardHeader,
    CButton,
    CSpinner,
    CProgress,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSync, cilReload, cilCloudUpload, cilCloudDownload, cilCheckCircle } from '@coreui/icons'
import { ErrorModal, SuccessModal } from '../../../components/ui'
import api from '../../../services/api'
import './Synchro.css'

export default function Synchro() {
    const [syncing, setSyncing] = useState(false)
    const [syncStatus, setSyncStatus] = useState(null)
    const [firebaseStatus, setFirebaseStatus] = useState(null)
    const [histoToFirebaseStatus, setHistoToFirebaseStatus] = useState(null)
    const [parametreStatus, setParametreStatus] = useState(null)
    const [statusLoading, setStatusLoading] = useState(true)
    const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' })
    const [successModal, setSuccessModal] = useState({ visible: false, title: '', message: '' })

    // Charger le statut de synchronisation au montage
    useEffect(() => {
        fetchAllStatus()
    }, [])

    // Récupérer tous les statuts
    const fetchAllStatus = async () => {
        setStatusLoading(true)
        await Promise.all([fetchSyncStatus(), fetchFirebaseStatus(), fetchHistoToFirebaseStatus(), fetchParametreStatus()])
        setStatusLoading(false)
    }

    // Récupérer le statut de synchronisation utilisateurs
    const fetchSyncStatus = async () => {
        try {
            const response = await api.get('/sync/status')
            if (response.data.success) {
                setSyncStatus(response.data.data)
            }
        } catch (err) {
            console.error('Erreur récupération statut:', err)
        }
    }

    // Récupérer le statut Firebase -> PostgreSQL
    const fetchFirebaseStatus = async () => {
        try {
            const response = await api.get('/sync/firebase-status')
            if (response.data.success) {
                setFirebaseStatus(response.data.data)
            }
        } catch (err) {
            console.error('Erreur récupération statut Firebase:', err)
        }
    }

    // Récupérer le statut histo_statuts PostgreSQL -> Firebase
    const fetchHistoToFirebaseStatus = async () => {
        try {
            // On utilise les données de firebaseStatus pour calculer
            const response = await api.get('/sync/firebase-status')
            if (response.data.success) {
                const data = response.data.data
                setHistoToFirebaseStatus({
                    total: data.postgresql?.histo_statuts?.total || 0,
                    synced: data.postgresql?.histo_statuts?.synchronises || 0,
                    pending: (data.postgresql?.histo_statuts?.total || 0) - (data.postgresql?.histo_statuts?.synchronises || 0)
                })
            }
        } catch (err) {
            console.error('Erreur récupération statut histo:', err)
        }
    }

    // Récupérer le statut des paramètres PostgreSQL -> Firebase
    const fetchParametreStatus = async () => {
        try {
            const response = await api.get('/sync/parametres/status')
            if (response.data.success) {
                setParametreStatus({
                    total: response.data.data.total || 0,
                    synced: response.data.data.synchronises || 0,
                    pending: response.data.data.non_synchronises || 0
                })
            }
        } catch (err) {
            console.error('Erreur récupération statut paramètres:', err)
        }
    }

    // Synchronisation complète bidirectionnelle
    const handleFullSync = async () => {
        try {
            setSyncing(true)
            let results = { toFirebase: null, fromFirebase: null, histoToFirebase: null, parametres: null, hasAnyError: false }

            // 1. Sync PostgreSQL -> Firebase (utilisateurs)
            try {
                const response = await api.post('/sync/utilisateurs')
                if (response.data.success) {
                    results.toFirebase = response.data.data
                }
            } catch (err) {
                results.hasAnyError = true
            }

            // 2. Sync Firebase -> PostgreSQL (signalements + histo_statuts)
            try {
                const response = await api.post('/sync/from-firebase')
                if (response.data.success) {
                    results.fromFirebase = response.data.data
                }
            } catch (err) {
                results.hasAnyError = true
            }

            // 3. Sync PostgreSQL -> Firebase (histo_statuts + mise à jour statut signalement)
            try {
                const response = await api.post('/sync/histo-statuts/to-firebase')
                if (response.data.success) {
                    results.histoToFirebase = response.data.data
                }
            } catch (err) {
                results.hasAnyError = true
            }

            // 4. Sync PostgreSQL -> Firebase (paramètres)
            try {
                const response = await api.post('/sync/parametres/to-firebase')
                if (response.data.success) {
                    results.parametres = response.data.data
                }
            } catch (err) {
                results.hasAnyError = true
            }

            // Si au moins une sync a réussi, c'est un succès
            const hasAnySuccess = results.toFirebase || results.histoToFirebase || results.parametres || results.fromFirebase

            if (hasAnySuccess) {
                setSuccessModal({
                    visible: true,
                    title: 'Synchronisation',
                    message: 'Synchronisation terminée'
                })
            } else if (results.hasAnyError) {
                setErrorModal({
                    visible: true,
                    title: 'Erreur de synchronisation',
                    message: 'Impossible de synchroniser les données'
                })
            }

            await fetchAllStatus()
        } catch (err) {
            console.error('Erreur synchronisation:', err)
            setErrorModal({
                visible: true,
                title: 'Erreur de synchronisation',
                message: 'Impossible de synchroniser les données'
            })
        } finally {
            setSyncing(false)
        }
    }

    // Calcul des pourcentages
    const getUserSyncPercent = () => {
        if (!syncStatus) return 0
        return syncStatus.pourcentage_sync || 0
    }

    const getFirebaseSyncPercent = () => {
        if (!firebaseStatus) return 100
        const total = (firebaseStatus.firebase?.signalements_total || 0) + (firebaseStatus.firebase?.histo_statuts_total || 0)
        const pending = (firebaseStatus.firebase?.signalements_non_synchronises || 0) + (firebaseStatus.firebase?.histo_statuts_non_synchronises || 0)
        if (total === 0) return 100
        return Math.round(((total - pending) / total) * 100)
    }

    const getHistoToFirebasePercent = () => {
        if (!histoToFirebaseStatus || histoToFirebaseStatus.total === 0) return 100
        return Math.round((histoToFirebaseStatus.synced / histoToFirebaseStatus.total) * 100)
    }

    const getParametrePercent = () => {
        if (!parametreStatus || parametreStatus.total === 0) return 100
        return Math.round((parametreStatus.synced / parametreStatus.total) * 100)
    }

    const isAllSynced = () => {
        return getUserSyncPercent() === 100 && getFirebaseSyncPercent() === 100 && getHistoToFirebasePercent() === 100 && getParametrePercent() === 100
    }

    return (
        <div className="sync-page">
            {/* Header */}
            <div className="sync-header mb-4">
                <div className="d-flex align-items-center gap-3">
                    <div className="sync-icon">
                        <CIcon icon={cilSync} size="xl" />
                    </div>
                    <div>
                        <h2 className="mb-0 fw-bold">Synchronisation</h2>
                        <p className="text-muted mb-0">Firebase ↔ PostgreSQL</p>
                    </div>
                </div>
            </div>

            {/* Contenu principal */}
            <CCard className="sync-card">
                <CCardHeader className="sync-card-header">
                    <CIcon icon={cilSync} className="me-2" />
                    Synchronisation des données
                </CCardHeader>
                <CCardBody className="p-4">
                    {statusLoading ? (
                        <div className="text-center py-5">
                            <CSpinner color="primary" />
                            <p className="mt-3 text-muted">Chargement des statuts...</p>
                        </div>
                    ) : (
                        <>
                            {/* Statut global */}
                            {isAllSynced() && (
                                <div className="sync-success-banner mb-4">
                                    <CIcon icon={cilCheckCircle} size="lg" className="me-2" />
                                    Toutes les données sont synchronisées
                                </div>
                            )}

                            {/* Progression PostgreSQL -> Firebase (Utilisateurs) */}
                            <div className="sync-item mb-4">
                                <div className="sync-item-header">
                                    <div className="d-flex align-items-center">
                                        <CIcon icon={cilCloudUpload} className="me-2 text-primary" />
                                        <span className="fw-semibold">Utilisateurs</span>
                                        <span className="text-muted ms-2">PostgreSQL → Firebase</span>
                                    </div>
                                    <span className="sync-stats">
                                        {syncStatus?.synchronises || 0} / {syncStatus?.total_utilisateurs || 0}
                                    </span>
                                </div>
                                <CProgress 
                                    value={getUserSyncPercent()} 
                                    color={getUserSyncPercent() === 100 ? 'success' : 'primary'}
                                    className="sync-progress"
                                />
                            </div>

                            {/* Progression PostgreSQL -> Firebase (Histo Statuts) */}
                            <div className="sync-item mb-4">
                                <div className="sync-item-header">
                                    <div className="d-flex align-items-center">
                                        <CIcon icon={cilCloudUpload} className="me-2 text-info" />
                                        <span className="fw-semibold">Histo Statuts</span>
                                        <span className="text-muted ms-2">PostgreSQL → Firebase</span>
                                    </div>
                                    <span className="sync-stats">
                                        {histoToFirebaseStatus?.synced || 0} / {histoToFirebaseStatus?.total || 0}
                                    </span>
                                </div>
                                <CProgress 
                                    value={getHistoToFirebasePercent()} 
                                    color={getHistoToFirebasePercent() === 100 ? 'success' : 'info'}
                                    className="sync-progress"
                                />
                            </div>

                            {/* Progression PostgreSQL -> Firebase (Paramètres) */}
                            <div className="sync-item mb-4">
                                <div className="sync-item-header">
                                    <div className="d-flex align-items-center">
                                        <CIcon icon={cilCloudUpload} className="me-2 text-secondary" />
                                        <span className="fw-semibold">Paramètres</span>
                                        <span className="text-muted ms-2">PostgreSQL → Firebase</span>
                                    </div>
                                    <span className="sync-stats">
                                        {parametreStatus?.synced || 0} / {parametreStatus?.total || 0}
                                    </span>
                                </div>
                                <CProgress 
                                    value={getParametrePercent()} 
                                    color={getParametrePercent() === 100 ? 'success' : 'secondary'}
                                    className="sync-progress"
                                />
                            </div>

                            {/* Progression Firebase -> PostgreSQL (Signalements) */}
                            <div className="sync-item mb-4">
                                <div className="sync-item-header">
                                    <div className="d-flex align-items-center">
                                        <CIcon icon={cilCloudDownload} className="me-2 text-warning" />
                                        <span className="fw-semibold">Signalements & Histo</span>
                                        <span className="text-muted ms-2">Firebase → PostgreSQL</span>
                                    </div>
                                    <span className="sync-stats">
                                        {(firebaseStatus?.firebase?.signalements_non_synchronises || 0) + (firebaseStatus?.firebase?.histo_statuts_non_synchronises || 0)} en attente
                                    </span>
                                </div>
                                <CProgress 
                                    value={getFirebaseSyncPercent()} 
                                    color={getFirebaseSyncPercent() === 100 ? 'success' : 'warning'}
                                    className="sync-progress"
                                />
                            </div>

                            {/* Boutons */}
                            <div className="sync-actions mt-4 pt-3 border-top">
                                <CButton
                                    onClick={handleFullSync}
                                    color="primary"
                                    size="lg"
                                    className="sync-btn"
                                    disabled={syncing}
                                >
                                    {syncing ? (
                                        <>
                                            <CSpinner size="sm" className="me-2" />
                                            Synchronisation...
                                        </>
                                    ) : (
                                        <>
                                            <CIcon icon={cilSync} className="me-2" />
                                            Synchroniser tout
                                        </>
                                    )}
                                </CButton>

                                <CButton
                                    onClick={fetchAllStatus}
                                    color="light"
                                    disabled={statusLoading || syncing}
                                >
                                    <CIcon icon={cilReload} className="me-2" />
                                    Actualiser
                                </CButton>
                            </div>
                        </>
                    )}
                </CCardBody>
            </CCard>

            {/* Success Modal */}
            <SuccessModal
                visible={successModal.visible}
                title={successModal.title}
                message={successModal.message}
                onClose={() => setSuccessModal({ ...successModal, visible: false })}
            />

            {/* Error Modal */}
            <ErrorModal
                visible={errorModal.visible}
                title={errorModal.title}
                message={errorModal.message}
                onClose={() => setErrorModal({ ...errorModal, visible: false })}
            />
        </div>
    )
}
