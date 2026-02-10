import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
    CCard,
    CCardBody,
    CCardHeader,
    CRow,
    CCol,
    CForm,
    CFormLabel,
    CFormTextarea,
    CButton,
    CImage,
    CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilSave, cilCloudUpload, cilX } from '@coreui/icons'
import { ErrorModal, SuccessModal, LoadingSpinner } from '../../../../components/ui'
import { ENDPOINTS, getAuthHeaders } from '../../../../config/api'
import './ChangerStatut.css'

// Définition du flux des statuts
const STATUT_FLOW = {
    'Nouveau': ['En cours'],
    'En cours': ['Terminé'],
    'Terminé': null, // Fin du flux
    'Rejeté': null // Fin du flux
}

const STATUT_COLORS = {
    'En cours': 'primary',
    'Terminé': 'success',
    'Nouveau': 'secondary'
}

export default function ChangerStatut() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    
    const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' })
    const [successModal, setSuccessModal] = useState({ visible: false, title: '', message: '' })
    const [signalement, setSignalement] = useState(null)
    const [statuts, setStatuts] = useState([])
    const [nextStatuts, setNextStatuts] = useState([])
    const [selectedStatut, setSelectedStatut] = useState('')
    const [description, setDescription] = useState('')
    const [selectedImages, setSelectedImages] = useState([])
    const [previewImages, setPreviewImages] = useState([])
    const [niveau, setNiveau] = useState('')
    const [statutDate, setStatutDate] = useState(() => {
        const now = new Date()
        const pad = n => n.toString().padStart(2, '0')
        return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
    })
    
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [saving, setSaving] = useState(false)

    // Charger le signalement et les statuts
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            setError(null)
            try {
                const headers = getAuthHeaders()
                
                // Charger le signalement
                const res = await fetch(ENDPOINTS.REPORT(id), { headers })
                const result = await res.json()
                if (result.success && result.data) {
                    setSignalement(result.data)
                } else {
                    throw new Error(result.message || 'Erreur lors du chargement du signalement')
                }
                
                // Charger la liste des statuts
                const resStatut = await fetch(ENDPOINTS.STATUSES, { headers })
                const statutsResult = await resStatut.json()
                if (statutsResult.success && statutsResult.data) {
                    setStatuts(statutsResult.data)
                }
            } catch (e) {
                setError(e.message)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id])

    // Déterminer les prochains statuts possibles
    useEffect(() => {
        if (signalement && statuts.length > 0) {
            const currentStatut = signalement.statut
            const possibleNext = STATUT_FLOW[currentStatut] || []
            
            // Filtrer les statuts disponibles
            const available = statuts.filter(s => possibleNext.includes(s.libelle))
            setNextStatuts(available)
            
            // Pré-sélectionner si un seul statut possible
            if (available.length === 1) {
                setSelectedStatut(available[0].id_statut)
                setDescription(getDefaultDescription(available[0].libelle))
            }
            
            // Si statut passé en paramètre URL
            const statutParam = searchParams.get('statut')
            if (statutParam) {
                const found = available.find(s => s.libelle === statutParam)
                if (found) {
                    setSelectedStatut(found.id_statut)
                    setDescription(getDefaultDescription(found.libelle))
                }
            }
        }
    }, [signalement, statuts, searchParams])

    // Prévisualisation des images
    useEffect(() => {
        if (selectedImages.length > 0) {
            const previews = []
            selectedImages.forEach(file => {
                const reader = new FileReader()
                reader.onloadend = () => {
                    previews.push(reader.result)
                    if (previews.length === selectedImages.length) {
                        setPreviewImages([...previews])
                    }
                }
                reader.readAsDataURL(file)
            })
        } else {
            setPreviewImages([])
        }
    }, [selectedImages])

    const getDefaultDescription = (statutLibelle) => {
        switch(statutLibelle) {
            case 'Validé': return 'Signalement validé par le gestionnaire'
            case 'Rejeté': return 'Signalement rejeté'
            case 'En cours': return 'Travaux en cours'
            case 'Terminé': return 'Travaux terminés'
            case 'En attente': return 'Signalement en attente de validation'
            default: return ''
        }
    }

    const handleBack = () => navigate(`/manager/signalements/fiche/${id}`)

    const handleStatutChange = (statutId) => {
        setSelectedStatut(statutId)
        const statut = nextStatuts.find(s => s.id_statut === parseInt(statutId))
        if (statut) {
            setDescription(getDefaultDescription(statut.libelle))
        }
    }

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files || [])
        if (files.length > 0) {
            setSelectedImages(prev => [...prev, ...files])
        }
    }

    const removeImage = (index) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index))
        setPreviewImages(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!selectedStatut) {
            setErrorModal({
                visible: true,
                title: 'Erreur',
                message: 'Veuillez sélectionner un statut.'
            })
            return
        }
        
        setSaving(true)
        try {
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
            
            const formData = new FormData()
            formData.append('id_statut', selectedStatut)
            formData.append('description', description || getDefaultDescription(nextStatuts.find(s => s.id_statut === parseInt(selectedStatut))?.libelle))
            formData.append('daty', statutDate)
            
            // Ajouter le niveau si le statut est "En cours"
            const selectedStatutObj = nextStatuts.find(s => s.id_statut === parseInt(selectedStatut))
            if (selectedStatutObj?.libelle === 'En cours' && niveau) {
                formData.append('niveau', niveau)
            }
            
            // Ajouter les images si présentes
            selectedImages.forEach((image, index) => {
                formData.append(`images[${index}]`, image)
            })
            
            const res = await fetch(ENDPOINTS.REPORT_HISTO(id), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: formData
            })
            
            const result = await res.json()
            
            if (!result.success) {
                throw new Error(result.message || "Erreur lors du changement de statut")
            }
            
            setSuccessModal({
                visible: true,
                title: 'Statut mis à jour',
                message: `Le signalement est maintenant "${selectedStatutObj?.libelle}".`
            })
            
            setTimeout(() => {
                navigate(`/manager/signalements/fiche/${id}`)
            }, 1500)
            
        } catch (e) {
            setErrorModal({
                visible: true,
                title: 'Erreur',
                message: e.message || "Erreur lors du changement de statut."
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <LoadingSpinner message="Chargement du signalement..." />
    }
    
    if (error) {
        return (
            <div className="changer-statut">
                <div className="alert alert-danger m-4">{error}</div>
            </div>
        )
    }
    
    if (!signalement) return null

    const currentStatut = signalement.statut
    const canChangeStatus = nextStatuts.length > 0

    return (
        <div className="changer-statut">
            <div className="page-header d-flex align-items-center gap-3 mb-4">
                <button className="btn-back" onClick={handleBack} title="Retour">
                    <CIcon icon={cilArrowLeft} size="xl" />
                </button>
                <div>
                    <h2 className="mb-0">Changer le Statut</h2>
                    <small className="text-muted">Signalement #{id}</small>
                </div>
            </div>

            <CRow>
                <CCol lg="8">
                    <CCard className="border-0 shadow-sm">
                        <CCardHeader className="bg-white border-0 p-4">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h5 className="mb-1">Statut actuel</h5>
                                    <CBadge color={STATUT_COLORS[currentStatut] || 'secondary'} className="px-3 py-2">
                                        {currentStatut}
                                    </CBadge>
                                </div>
                                {canChangeStatus && (
                                    <div className="text-end">
                                        <CIcon icon={cilArrowLeft} className="text-muted me-2" style={{ transform: 'rotate(180deg)' }} />
                                        <span className="text-muted">Prochain statut</span>
                                    </div>
                                )}
                            </div>
                        </CCardHeader>
                        
                        <CCardBody className="p-4">
                            {!canChangeStatus ? (
                                <div className="text-center py-5">
                                    <div className="mb-3">
                                        <CBadge color={STATUT_COLORS[currentStatut] || 'secondary'} className="px-4 py-3 fs-5">
                                            {currentStatut}
                                        </CBadge>
                                    </div>
                                    <p className="text-muted mb-0">
                                        Ce signalement est en statut final. Aucun changement de statut n'est possible.
                                    </p>
                                </div>
                            ) : (
                                <CForm onSubmit={handleSubmit}>
                                    {/* Sélection du prochain statut */}
                                    <div className="mb-4">
                                        <CFormLabel className="fw-bold mb-3">Sélectionner le nouveau statut</CFormLabel>
                                        <div className="d-flex flex-wrap gap-3">
                                            {nextStatuts.map(statut => (
                                                <div
                                                    key={statut.id_statut}
                                                    className={`statut-option p-3 rounded-3 cursor-pointer ${
                                                        String(selectedStatut) === String(statut.id_statut) ? 'selected' : ''
                                                    }`}
                                                    onClick={() => handleStatutChange(statut.id_statut)}
                                                >
                                                    <CBadge color={STATUT_COLORS[statut.libelle] || 'secondary'} className="px-3 py-2">
                                                        {statut.libelle}
                                                    </CBadge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <hr className="my-4" />

                                    {/* Niveau du signalement (si En cours) */}
                                    {String(selectedStatut) && nextStatuts.find(s => s.id_statut === parseInt(selectedStatut))?.libelle === 'En cours' && (
                                        <div className="mb-4">
                                            <CFormLabel className="fw-bold">Niveau du signalement (1-10)</CFormLabel>
                                            <div className="d-flex flex-wrap gap-2">
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                                    <label key={num} className={`checkbox-level p-2 rounded-2 cursor-pointer text-center ${niveau === String(num) ? 'selected bg-primary text-white' : 'border'}`} style={{ minWidth: '45px', border: niveau !== String(num) ? '1px solid #dee2e6' : 'none' }}>
                                                        <input
                                                            type="radio"
                                                            name="niveau"
                                                            value={num}
                                                            checked={niveau === String(num)}
                                                            onChange={(e) => setNiveau(String(num))}
                                                            className="d-none"
                                                        />
                                                        <span className="fw-bold">{num}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Date du changement */}
                                    <div className="mb-4">
                                        <CFormLabel className="fw-bold">Date du changement</CFormLabel>
                                        <input
                                            type="datetime-local"
                                            className="form-control"
                                            value={statutDate}
                                            onChange={(e) => setStatutDate(e.target.value)}
                                        />
                                    </div>

                                    {/* Upload d'images (optionnel) */}
                                    <div className="mb-4">
                                        <CFormLabel className="fw-bold">
                                            Photos <span className="text-muted fw-normal">(optionnel)</span>
                                        </CFormLabel>
                                        <div className="upload-zone p-4 rounded-3 text-center mb-3">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleImageChange}
                                                className="d-none"
                                                id="image-upload"
                                            />
                                            <label htmlFor="image-upload" className="cursor-pointer">
                                                <CIcon icon={cilCloudUpload} size="xl" className="text-muted mb-2" />
                                                <p className="mb-0 text-muted">
                                                    Cliquez pour ajouter des photos
                                                </p>
                                                <small className="text-muted">
                                                    Formats acceptés: JPG, PNG, GIF
                                                </small>
                                            </label>
                                        </div>
                                        
                                        {previewImages.length > 0 && (
                                            <div className="preview-images d-flex flex-wrap gap-3">
                                                {previewImages.map((preview, index) => (
                                                    <div key={index} className="preview-item position-relative">
                                                        <CImage 
                                                            src={preview} 
                                                            alt={`Preview ${index + 1}`}
                                                            className="rounded-3"
                                                            style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn-remove-image"
                                                            onClick={() => removeImage(index)}
                                                        >
                                                            <CIcon icon={cilX} size="sm" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div className="mb-4">
                                        <CFormLabel className="fw-bold">
                                            Description <span className="text-muted fw-normal">(optionnel)</span>
                                        </CFormLabel>
                                        <CFormTextarea
                                            rows={3}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Ajoutez une note ou description..."
                                            className="border"
                                        />
                                    </div>

                                    {/* Boutons d'action */}
                                    <div className="d-flex justify-content-end gap-3 mt-4">
                                        <CButton
                                            color="secondary"
                                            variant="outline"
                                            onClick={handleBack}
                                            className="px-4"
                                            disabled={saving}
                                        >
                                            Annuler
                                        </CButton>
                                        <CButton
                                            type="submit"
                                            color="primary"
                                            className="btn-theme px-4"
                                            disabled={saving || !selectedStatut || (selectedStatut && nextStatuts.find(s => s.id_statut === parseInt(selectedStatut))?.libelle === 'En cours' && !niveau)}
                                        >
                                            {saving ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                    Enregistrement...
                                                </>
                                            ) : (
                                                <>
                                                    <CIcon icon={cilSave} className="me-2" />
                                                    Confirmer le changement
                                                </>
                                            )}
                                        </CButton>
                                    </div>
                                </CForm>
                            )}
                        </CCardBody>
                    </CCard>
                </CCol>

                <CCol lg="4">
                    <CCard className="border-0 shadow-sm">
                        <CCardBody className="p-4">
                            <h6 className="fw-bold mb-3">Flux des statuts</h6>
                            <div className="status-flow">
                                {Object.entries(STATUT_FLOW).map(([statut, nextList]) => {
                                    if (!nextList) return null
                                    return (
                                        <div key={statut} className={`flow-item mb-3 ${statut === currentStatut ? 'current' : ''}`}>
                                            <div className="d-flex align-items-center">
                                                <CBadge 
                                                    color={statut === currentStatut ? STATUT_COLORS[statut] : 'light'} 
                                                    className={`px-2 py-1 ${statut !== currentStatut ? 'text-muted' : ''}`}
                                                >
                                                    {statut}
                                                </CBadge>
                                                <span className="mx-2 text-muted">→</span>
                                                <div className="d-flex gap-1">
                                                    {nextList.map(next => (
                                                        <CBadge 
                                                            key={next} 
                                                            color="light" 
                                                            className="text-muted px-2 py-1"
                                                        >
                                                            {next}
                                                        </CBadge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            
                            <hr className="my-4" />
                            
                            <h6 className="fw-bold mb-3">Signalement</h6>
                            <div className="small">
                                <div className="mb-2">
                                    <span className="text-muted">Date:</span>
                                    <span className="ms-2">{signalement.daty}</span>
                                </div>
                                <div className="mb-2">
                                    <span className="text-muted">Surface:</span>
                                    <span className="ms-2">{signalement.surface} m²</span>
                                </div>
                                {signalement.entreprise && (
                                    <div className="mb-2">
                                        <span className="text-muted">Entreprise:</span>
                                        <span className="ms-2">
                                            {typeof signalement.entreprise === 'object' 
                                                ? signalement.entreprise.nom 
                                                : signalement.entreprise}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>

            <SuccessModal
                visible={successModal.visible}
                title={successModal.title}
                message={successModal.message}
                onClose={() => setSuccessModal({ ...successModal, visible: false })}
            />

            <ErrorModal
                visible={errorModal.visible}
                title={errorModal.title}
                message={errorModal.message}
                onClose={() => setErrorModal({ ...errorModal, visible: false })}
            />
        </div>
    )
}
