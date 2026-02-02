import { useState, useEffect } from 'react'
import {
    CCard,
    CCardBody,
    CCardHeader,
    CForm,
    CFormInput,
    CButton,
    CCol,
    CRow,
    CSpinner,
    CProgress,
    CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSave, cilSettings, cilSync, cilReload } from '@coreui/icons'
import MessageModal from '../../../components/MessageModal'
import api from '../../../services/api'
import './Parametres.css'

export default function Parametres() {
    const [settings, setSettings] = useState({
        maxAttempts: 3,
        lockoutDuration: 30,
    })

    const [saved, setSaved] = useState(false)
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

    const handleChange = (e) => {
        const { name, value } = e.target
        setSettings({
            ...settings,
            [name]: parseInt(value) || 0,
        })
    }

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

    const handleSave = () => {
        console.log('Paramètres sauvegardés:', settings)
        setSaved(true)
        setModal({
            visible: true,
            type: 'success',
            title: 'Paramètres sauvegardés',
            message: 'Les paramètres de sécurité ont été mis à jour avec succès.',
            autoClose: true
        })
        setTimeout(() => setSaved(false), 3000)
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
                        <CIcon icon={cilSettings} size="xl" />
                    </div>
                    <div>
                        <h2 className="mb-0 fw-bold">Paramètres</h2>
                        <p className="text-muted mb-0">Gérer les paramètres de l'application</p>
                    </div>
                </div>
            </div>

            <CCard className="settings-card">
                <CCardHeader className="settings-card-header">
                    <CIcon icon={cilSettings} className="me-2" />
                    Paramètres de sécurité
                </CCardHeader>
                <CCardBody className="p-4">
                    <CForm>
                        <CRow className="g-4 mb-4">
                            <CCol lg="6">
                                <label className="form-label">
                                    Nombre maximum de tentatives de connexion <span className="text-danger">*</span>
                                </label>
                                <p className="text-muted small mb-3">
                                    Nombre de tentatives échouées avant le blocage du compte (par défaut: 3)
                                </p>
                                <CFormInput
                                    type="number"
                                    name="maxAttempts"
                                    value={settings.maxAttempts}
                                    onChange={handleChange}
                                    min="1"
                                    max="10"
                                    className="input-setting"
                                    required
                                />
                            </CCol>
                            <CCol lg="6">
                                <label className="form-label">
                                    Durée de blocage (minutes) <span className="text-danger">*</span>
                                </label>
                                <p className="text-muted small mb-3">
                                    Durée pendant laquelle le compte reste bloqué après dépassement des tentatives
                                </p>
                                <CFormInput
                                    type="number"
                                    name="lockoutDuration"
                                    value={settings.lockoutDuration}
                                    onChange={handleChange}
                                    min="5"
                                    max="240"
                                    className="input-setting"
                                    required
                                />
                            </CCol>
                        </CRow>

                        <div className="d-flex gap-2 pt-3 border-top">
                            <CButton
                                onClick={handleSave}
                                className="btn-save"
                            >
                                <CIcon icon={cilSave} className="me-2" />
                                Sauvegarder
                            </CButton>
                            {saved && (
                                <div className="alert alert-success mb-0 d-flex align-items-center">
                                    ✓ Paramètres sauvegardés avec succès
                                </div>
                            )}
                        </div>
                    </CForm>
                </CCardBody>
            </CCard>

            {/* Synchronisation Card */}
            <CCard className="settings-card mt-4">
                <CCardHeader className="settings-card-header">
                    <CIcon icon={cilSync} className="me-2" />
                    Synchronisation Firebase
                </CCardHeader>
                <CCardBody className="p-4">
                    <div className="mb-3">
                        <h6 className="fw-bold mb-2">Synchroniser avec Firebase</h6>
                        <p className="text-muted small mb-0">
                            Synchronisez les utilisateurs PostgreSQL avec Firebase Firestore.
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
                                        <div className="stat-box stat-success">
                                            <div className="stat-value">{syncStatus.synchronises}</div>
                                            <div className="stat-label">Synchronisés</div>
                                        </div>
                                    </CCol>
                                    <CCol xs={6} md={3}>
                                        <div className="stat-box stat-warning">
                                            <div className="stat-value">{syncStatus.non_synchronises}</div>
                                            <div className="stat-label">En attente</div>
                                        </div>
                                    </CCol>
                                    <CCol xs={6} md={3}>
                                        <div className="stat-box stat-info">
                                            <div className="stat-value">{syncStatus.avec_firebase_uid}</div>
                                            <div className="stat-label">Avec Firebase UID</div>
                                        </div>
                                    </CCol>
                                </CRow>
                                
                                {/* Barre de progression */}
                                <div className="progress-section">
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Progression</span>
                                        <CBadge color={syncStatus.pourcentage_sync === 100 ? 'success' : 'warning'}>
                                            {syncStatus.pourcentage_sync}%
                                        </CBadge>
                                    </div>
                                    <CProgress 
                                        value={syncStatus.pourcentage_sync} 
                                        color={syncStatus.pourcentage_sync === 100 ? 'success' : 'primary'}
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
                            onClick={handleForceSync}
                            color="warning"
                            className="btn-force-sync"
                            disabled={syncing || forceSyncing}
                        >
                            {forceSyncing ? (
                                <>
                                    <CSpinner size="sm" className="me-2" />
                                    Re-synchronisation...
                                </>
                            ) : (
                                <>
                                    <CIcon icon={cilReload} className="me-2" />
                                    Forcer tout
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
