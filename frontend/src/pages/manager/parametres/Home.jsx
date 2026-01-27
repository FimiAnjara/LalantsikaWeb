import { useState } from 'react'
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
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSave, cilSettings, cilSync } from '@coreui/icons'
import Modal from '../../../components/Modal'
import './Parametres.css'

export default function Parametres() {
    const [settings, setSettings] = useState({
        maxAttempts: 3,
        lockoutDuration: 30,
    })

    const [saved, setSaved] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [modal, setModal] = useState({ visible: false, type: 'success', title: '', message: '' })

    const handleChange = (e) => {
        const { name, value } = e.target
        setSettings({
            ...settings,
            [name]: parseInt(value) || 0,
        })
    }

    const handleSave = () => {
        console.log('Paramètres sauvegardés:', settings)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
    }

    const handleSync = () => {
        setSyncing(true)
        setTimeout(() => {
            setSyncing(false)
            setModal({
                visible: true,
                type: 'success',
                title: 'Synchronisation réussie',
                message: 'Les données ont été synchronisées avec succès avec le serveur distant.'
            })
        }, 2000)
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
                    Synchronisation des données
                </CCardHeader>
                <CCardBody className="p-4">
                    <div className="mb-3">
                        <h6 className="fw-bold mb-2">Synchroniser avec le serveur</h6>
                        <p className="text-muted small mb-0">
                            Synchronisez les données locales avec le serveur distant. Cette opération peut prendre quelques instants.
                        </p>
                    </div>
                    
                    <div className="info-section mb-4">
                        <h5>Informations</h5>
                        <ul className="mb-0">
                            <li>Dernière synchronisation : <strong>27/01/2026 à 10:30</strong></li>
                            <li>Statut du serveur : <strong className="text-success">En ligne</strong></li>
                            <li>Données en attente : <strong>0 éléments</strong></li>
                        </ul>
                    </div>

                    <CButton
                        onClick={handleSync}
                        className="btn-sync"
                        disabled={syncing}
                    >
                        {syncing ? (
                            <>
                                <CSpinner size="sm" className="me-2" />
                                Synchronisation en cours...
                            </>
                        ) : (
                            <>
                                <CIcon icon={cilSync} className="me-2" />
                                Synchroniser maintenant
                            </>
                        )}
                    </CButton>
                </CCardBody>
            </CCard>

            <Modal
                visible={modal.visible}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                onClose={() => setModal({ ...modal, visible: false })}
            />
        </div>
    )
}
