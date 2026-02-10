import { useState, useEffect } from 'react'
import {
    CCard,
    CCardBody,
    CCardHeader,
    CForm,
    CFormInput,
    CFormCheck,
    CButton,
    CCol,
    CRow,
    CSpinner,
    CAlert,
    CModal,
    CModalHeader,
    CModalBody,
    CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSave, cilSettings, cilReload } from '@coreui/icons'
import Modal from '../../../components/Modal'
import { ENDPOINTS, getAuthHeaders } from '../../../config/api'
import { SuccessModal } from '../../../components/ui'
import './Parametres.css'

export default function Parametres() {
    const [settings, setSettings] = useState({
        maxAttempts: 3,
    })

    const [saved, setSaved] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [resetting, setResetting] = useState(false)
    const [error, setError] = useState(null)
    const [modal, setModal] = useState({ visible: false, type: 'success', title: '', message: '' })
    const [confirmReset, setConfirmReset] = useState(false)
    const [resetResults, setResetResults] = useState(null)

    const defaultCollections = [
        { id: 'utilisateurs', label: 'Utilisateurs' },
        { id: 'statut_utilisateurs', label: 'Statut utilisateurs' },
        { id: 'signalements', label: 'Signalements' },
        { id: 'histo_statuts', label: 'Historique des statuts' },
    ]

    const [selectedCollections, setSelectedCollections] = useState(
        defaultCollections.map(c => c.id)
    )

    const [deleteAuthUsers, setDeleteAuthUsers] = useState(true)

    const toggleCollection = (collectionId) => {
        setSelectedCollections(prev =>
            prev.includes(collectionId)
                ? prev.filter(id => id !== collectionId)
                : [...prev, collectionId]
        )
    }

    const toggleAll = () => {
        if (selectedCollections.length === defaultCollections.length) {
            setSelectedCollections([])
        } else {
            setSelectedCollections(defaultCollections.map(c => c.id))
        }
    }

    // Charger les paramètres au montage
    useEffect(() => {
        loadParametres()
    }, [])

    const loadParametres = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch(ENDPOINTS.PARAMETRES, {
                headers: getAuthHeaders()
            })
            const result = await response.json()
            if (result.success) {
                setSettings({
                    maxAttempts: result.data.tentative_max || 3
                })
            } else {
                setError(result.message || 'Erreur lors du chargement des paramètres')
            }
        } catch (err) {
            setError('Erreur de connexion lors du chargement des paramètres')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setSettings({
            ...settings,
            [name]: parseInt(value) || 0,
        })
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            setError(null)
            
            const response = await fetch(ENDPOINTS.PARAMETRES, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    tentative_max: settings.maxAttempts
                })
            })
            
            const result = await response.json()
            
            if (result.success) {
                setSaved(true)
                setModal({
                    visible: true,
                    type: 'success',
                    title: 'Paramètres sauvegardés',
                    message: result.message || 'Paramètres sauvegardés avec succès'
                })
                setTimeout(() => setSaved(false), 3000)
            } else {
                setError(result.message || 'Erreur lors de la sauvegarde')
                if (result.errors) {
                    const firstError = Object.values(result.errors)[0]
                    setError(Array.isArray(firstError) ? firstError[0] : firstError)
                }
            }
        } catch (err) {
            setError('Erreur de connexion lors de la sauvegarde')
        } finally {
            setSaving(false)
        }
    }

    const handleResetFirebaseData = async () => {
        try {
            setResetting(true)
            setError(null)
            setResetResults(null)
            
            const response = await fetch(ENDPOINTS.PARAMETRES_RESET_FIREBASE, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    collections: selectedCollections,
                    delete_auth_users: deleteAuthUsers
                })
            })
            
            const result = await response.json()
            
            if (result.success) {
                setConfirmReset(false)
                setResetResults(result.data)
                setModal({
                    visible: true,
                    type: 'success',
                    title: 'Réinitialisation réussie',
                    message: result.message || 'Les données Firebase ont été réinitialisées avec succès'
                })
            } else {
                setConfirmReset(false)
                if (result.errors) {
                    const firstError = Object.values(result.errors)[0]
                    setError(Array.isArray(firstError) ? firstError[0] : firstError)
                } else {
                    setError(result.message || 'Erreur lors de la réinitialisation des données')
                }
                if (result.data) {
                    setResetResults(result.data)
                }
            }
        } catch (err) {
            setError('Erreur de connexion lors de la réinitialisation')
        } finally {
            setResetting(false)
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

            {error && (
                <CAlert color="danger" className="mb-4">
                    {error}
                </CAlert>
            )}

            {loading ? (
                <div className="text-center py-5">
                    <CSpinner size="xl" className="mb-3" />
                    <div>Chargement des paramètres...</div>
                </div>
            ) : (
            <>
                <CCard className="settings-card mb-4">
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
                            </CRow>

                            <div className="d-flex gap-2 pt-3 border-top">
                                <CButton
                                    onClick={handleSave}
                                    className="btn-save"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <CSpinner size="sm" className="me-2" />
                                            Sauvegarde...
                                        </>
                                    ) : (
                                        <>
                                            <CIcon icon={cilSave} className="me-2" />
                                            Sauvegarder
                                        </>
                                    )}
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

                <CCard className="settings-card">
                    <CCardHeader className="settings-card-header">
                        <CIcon icon={cilReload} className="me-2" />
                        Réinitialisation des données
                    </CCardHeader>
                    <CCardBody className="p-4">
                        <p className="text-muted mb-3">
                            <strong>Attention :</strong> Cette action supprimera les documents des collections sélectionnées dans Firebase.
                            Les collections elles-mêmes seront conservées. Cette opération est irréversible.
                        </p>

                        <div className="mb-4">
                            <label className="form-label fw-bold mb-3">Collections à réinitialiser</label>
                            <div className="mb-2">
                                <CFormCheck
                                    id="select-all"
                                    label="Tout sélectionner / Tout désélectionner"
                                    checked={selectedCollections.length === defaultCollections.length}
                                    indeterminate={selectedCollections.length > 0 && selectedCollections.length < defaultCollections.length}
                                    onChange={toggleAll}
                                />
                            </div>
                            <div className="ps-4">
                                {defaultCollections.map(col => (
                                    <CFormCheck
                                        key={col.id}
                                        id={`col-${col.id}`}
                                        label={`${col.label} (${col.id})`}
                                        checked={selectedCollections.includes(col.id)}
                                        onChange={() => toggleCollection(col.id)}
                                        className="mb-2"
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="mb-4 pt-3 border-top">
                            <label className="form-label fw-bold mb-3">Firebase Authentication</label>
                            <CFormCheck
                                id="delete-auth-users"
                                label="Supprimer tous les utilisateurs de Firebase Authentication"
                                checked={deleteAuthUsers}
                                onChange={(e) => setDeleteAuthUsers(e.target.checked)}
                            />
                            <p className="text-muted small mt-1 mb-0 ps-4">
                                Les comptes utilisateurs dans l'onglet Authentication de Firebase seront supprimés
                            </p>
                        </div>

                        {resetResults && (
                            <CAlert color={Object.values(resetResults).every(r => r.success) ? 'success' : 'warning'} className="mb-4">
                                <strong>Résultat de la réinitialisation :</strong>
                                <ul className="mb-0 mt-2">
                                    {Object.entries(resetResults).map(([col, result]) => (
                                        <li key={col}>
                                            <strong>{col}</strong> : {result.success
                                                ? `${result.deleted_count} document(s) supprimé(s)`
                                                : `Erreur - ${result.error}`}
                                        </li>
                                    ))}
                                </ul>
                            </CAlert>
                        )}

                        <CButton
                            onClick={() => setConfirmReset(true)}
                            color="danger"
                            disabled={resetting || (selectedCollections.length === 0 && !deleteAuthUsers)}
                        >
                            {resetting ? (
                                <>
                                    <CSpinner size="sm" className="me-2" />
                                    Réinitialisation en cours...
                                </>
                            ) : (
                                <>
                                    <CIcon icon={cilReload} className="me-2" />
                                    Réinitialiser les données Firebase
                                </>
                            )}
                        </CButton>
                    </CCardBody>
                </CCard>

                {/* Modal de confirmation */}
                <CModal visible={confirmReset} onClose={() => setConfirmReset(false)}>
                    <CModalHeader closeButton>
                        <strong>Confirmation de réinitialisation</strong>
                    </CModalHeader>
                    <CModalBody>
                        <p>
                            Êtes-vous certain de vouloir réinitialiser les collections suivantes ?
                            Cette action est <strong>irréversible</strong>.
                        </p>
                        <ul className="mb-0">
                            {selectedCollections.map(col => {
                                const found = defaultCollections.find(c => c.id === col)
                                return <li key={col}>{found ? found.label : col} ({col})</li>
                            })}
                            {deleteAuthUsers && (
                                <li className="text-danger fw-bold">Tous les utilisateurs Firebase Authentication</li>
                            )}
                        </ul>
                    </CModalBody>
                    <CModalFooter>
                        <CButton 
                            color="secondary" 
                            onClick={() => setConfirmReset(false)}
                            disabled={resetting}
                        >
                            Annuler
                        </CButton>
                        <CButton 
                            color="danger" 
                            onClick={handleResetFirebaseData}
                            disabled={resetting}
                        >
                            {resetting ? 'Réinitialisation...' : 'Confirmer la réinitialisation'}
                        </CButton>
                    </CModalFooter>
                </CModal>
            </>
            )}
        </div>
    )
}
