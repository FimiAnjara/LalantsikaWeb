import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    CCard,
    CCardBody,
    CRow,
    CCol,
    CForm,
    CFormLabel,
    CFormTextarea,
    CButton,
    CImage,
    CFormCheck,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilSave, cilCheckCircle } from '@coreui/icons'
import Modal from '../../../../components/Modal'
import './Modifier.css'


export default function SignalementModifier() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [modal, setModal] = useState({ visible: false, type: 'success', title: '', message: '' })
    const [signalement, setSignalement] = useState(null)
    const [statuts, setStatuts] = useState([])
    const [selectedStatut, setSelectedStatut] = useState('')
    const [description, setDescription] = useState('')
    const [selectedImage, setSelectedImage] = useState(null)
    const [previewImage, setPreviewImage] = useState(null)
    const [statutDate, setStatutDate] = useState(() => {
        // Format YYYY-MM-DDTHH:mm (pour input type datetime-local)
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    });
        // Prévisualisation de l'image sélectionnée
        useEffect(() => {
            if (selectedImage) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewImage(reader.result);
                };
                reader.readAsDataURL(selectedImage);
            } else {
                setPreviewImage(null);
            }
        }, [selectedImage]);
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            setError(null)
            try {
                const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
                // Signalement
                const res = await fetch(`http://localhost:8000/api/reports/${id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                        }
                    }
                )
                const result = await res.json()
                if (result.success && result.data) {
                    setSignalement(result.data)
                    // On suppose que result.data.statut contient le libellé du dernier statut (string) ou l'objet complet du statut
                    // On va chercher l'id_statut correspondant dans la liste des statuts après le chargement de ceux-ci
                    // Donc on ne set pas ici, mais dans le useEffect suivant
                } else {
                    throw new Error(result.message || 'Erreur lors du chargement du signalement')
                }
                // Statuts
                const resStatut = await fetch('http://localhost:8000/api/statuses', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    }
                })
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

    // Quand signalement et statuts sont chargés, positionner le statut sélectionné sur le dernier statut historique
    useEffect(() => {
        if (signalement && statuts.length > 0) {
            // signalement.statut est le libellé du dernier statut (string)
            // On cherche l'id_statut correspondant dans la liste des statuts
            const found = statuts.find(s => s.libelle === signalement.statut)
            setSelectedStatut(found ? found.id_statut : '')
        }
    }, [signalement, statuts])

    const handleBack = () => navigate(`/manager/signalements/fiche/${id}`)

    const handleStatutChange = (e) => {
        setSelectedStatut(e.target.value)
    }

    const handleImageChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            setSelectedImage(file);
        }
    };

    const handleDescriptionChange = (e) => {
        setDescription(e.target.value);
    };

    const handleStatutDateChange = (e) => {
        setStatutDate(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedStatut) {
            setModal({
                visible: true,
                type: 'danger',
                title: 'Erreur',
                message: 'Veuillez sélectionner un statut.'
            });
            return;
        }
        if (!description.trim()) {
            setModal({
                visible: true,
                type: 'danger',
                title: 'Erreur',
                message: 'Veuillez saisir une description.'
            });
            return;
        }
        setSaving(true);
        try {
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
            const formData = new FormData();
            formData.append('id_statut', selectedStatut);
            formData.append('description', description);
            formData.append('daty', statutDate);
            if (selectedImage) {
                formData.append('photo', selectedImage);
            }
            // Ajout dans l'historique uniquement
            const res = await fetch(`http://localhost:8000/api/reports/${id}/histostatut`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: formData
            });
            const result = await res.json();
            if (!result.success) {
                throw new Error(result.message || "Erreur lors de l'ajout du statut");
            }
            setModal({
                visible: true,
                type: 'success',
                title: 'Statut ajouté',
                message: 'Le nouveau statut a été ajouté à l\'historique.'
            });
            setTimeout(() => {
                navigate(`/manager/signalements/fiche/${id}`);
            }, 1200);
        } catch (e) {
            setModal({
                visible: true,
                type: 'danger',
                title: 'Erreur',
                message: e.message || "Erreur lors de l'ajout du statut."
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="modifier-signalement"><div className="text-center p-5">Chargement...</div></div>
    if (error) return <div className="modifier-signalement"><div className="alert alert-danger m-4">{error}</div></div>
    if (!signalement) return null

    return (
        <div className="modifier-signalement">
            <div className="page-header d-flex align-items-center gap-3 mb-4">
                <button className="btn-back" onClick={handleBack} title="Retour">
                    <CIcon icon={cilArrowLeft} size="xl" />
                </button>
                <div>
                    <h2 className="mb-0">Modifier le Signalement</h2>
                    <small className="text-muted">Mise à jour de la référence #{id}</small>
                </div>
            </div>

            <CRow>
                <CCol lg="8">
                    <CCard className="border-0 shadow-sm p-4">
                        <CForm onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <h5 className="fw-bold mb-3">Statut du signalement</h5>
                                <div className="d-flex flex-wrap gap-3">
                                    {statuts.map(statut => (
                                        <CFormCheck
                                            key={statut.id_statut}
                                            type="radio"
                                            name="statut"
                                            id={`statut-${statut.id_statut}`}
                                            value={statut.id_statut}
                                            label={statut.libelle}
                                            checked={String(selectedStatut) === String(statut.id_statut)}
                                            onChange={handleStatutChange}
                                        />
                                    ))}
                                </div>
                            </div>

                            <hr className="my-4" />

                            <div className="mb-4">
                                <h5 className="fw-bold mb-3">Changement de statut</h5>
                                <div className="mb-3">
                                    <CFormLabel className="fw-600">Date du changement de statut</CFormLabel>
                                    <input
                                        type="datetime-local"
                                        className="form-control"
                                        value={statutDate}
                                        onChange={handleStatutDateChange}
                                    />
                                </div>
                                <div className="mb-3">
                                    <CFormLabel className="fw-600">Image</CFormLabel>
                                    <div className="mb-2">
                                        <input type="file" accept="image/*" onChange={handleImageChange} />
                                    </div>
                                    {previewImage ? (
                                        <CImage src={previewImage} alt="Prévisualisation" style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 8 }} />
                                    ) : signalement.photo ? (
                                        <CImage src={signalement.photo} alt="Photo du signalement" style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 8 }} />
                                    ) : (
                                        <div className="bg-light border rounded-2 p-4 text-muted text-center">Aucune image</div>
                                    )}
                                </div>
                                <div className="mb-3">
                                    <CFormLabel className="fw-600">Description du changement de statut</CFormLabel>
                                    <CFormTextarea
                                        rows={3}
                                        value={description}
                                        onChange={handleDescriptionChange}
                                        placeholder="Décrivez la raison ou le contexte du changement de statut..."
                                        className="border"
                                    />
                                </div>
                            </div>

                            <div className="d-flex justify-content-end gap-3 mt-4">
                                <CButton
                                    color="secondary"
                                    variant="outline"
                                    onClick={handleBack}
                                    className="px-4"
                                >
                                    Annuler
                                </CButton>
                                <CButton
                                    type="submit"
                                    color="primary"
                                    className="btn-theme px-4"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    ) : (
                                        <CIcon icon={cilSave} className="me-2" />
                                    )}
                                    {saving ? 'Enregistrement...' : 'Enregistrer le statut'}
                                </CButton>
                            </div>
                        </CForm>
                    </CCard>
                </CCol>
                <CCol lg="4">
                    <CCard className="border-0 shadow-sm bg-light">
                        <CCardBody className="p-4">
                            <h6 className="fw-bold mb-3">Détails du signalement</h6>
                            <div className="mb-3">
                                <span className="fw-600">Date du signalement :</span><br />
                                <span>{signalement.daty}</span>
                            </div>
                            <div className="mb-3">
                                <span className="fw-600">Description :</span>
                                <div className="bg-light border rounded-2 p-2 mt-1 small">{signalement.description}</div>
                            </div>
                            <hr />
                            <h6 className="fw-bold mb-3"><CIcon icon={cilCheckCircle} className="me-2 text-success" />Aide à la gestion</h6>
                            <ul className="small text-muted ps-3 mb-0">
                                <li className="mb-2">Le statut <strong>"En cours"</strong> informe l'utilisateur que l'entreprise a reçu l'ordre de mission.</li>
                                <li className="mb-2">Le passage au statut <strong>"Résolu"</strong> clôturera le ticket et enverra une notification de satisfaction à l'utilisateur.</li>
                            </ul>
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
        </div>
    )
}
