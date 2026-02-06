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
    CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSave, cilSettings } from '@coreui/icons'
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
    const [error, setError] = useState(null)
    const [modal, setModal] = useState({ visible: false, type: 'success', title: '', message: '' })

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
            )}
        </div>
    )
}
