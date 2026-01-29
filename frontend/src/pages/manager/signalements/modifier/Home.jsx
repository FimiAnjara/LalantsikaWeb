import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    CCard,
    CCardBody,
    CCardHeader,
    CRow,
    CCol,
    CForm,
    CFormLabel,
    CFormSelect,
    CFormTextarea,
    CButton,
    CFormInput,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilSave, cilCheckCircle } from '@coreui/icons'
import Modal from '../../../../components/Modal'
import './Modifier.css'

export default function SignalementModifier() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [modal, setModal] = useState({ visible: false, type: 'success', title: '', message: '' })

    const [formData, setFormData] = useState({
        id_signalement: id || 1,
        statut: 'En attente',
        id_entreprise: '1',
        description: 'La route principale est gravement endommagée au niveau du carrefour. Des nids-de-poule dangereux se sont formés suite aux dernières pluies.',
    })

    const entreprises = [
        { id: '1', nom: 'BTP Construction S.A.' },
        { id: '2', nom: 'Routes de Madagascar' },
        { id: '3', nom: 'Infrastructure Plus' },
    ]

    const handleBack = () => navigate(`/manager/signalements/fiche/${id}`)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        console.log('Mise à jour du signalement:', formData)
        
        setModal({
            visible: true,
            type: 'success',
            title: 'Mise à jour réussie',
            message: 'Le statut et l\'attribution du signalement ont été mis à jour avec succès.'
        })

        setTimeout(() => {
            navigate(`/manager/signalements/fiche/${id}`)
        }, 1500)
    }

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
                                <h5 className="fw-bold mb-3">Attribution et Statut</h5>
                                <CRow>
                                    <CCol md="6" className="mb-3">
                                        <CFormLabel className="fw-600">Statut actuel</CFormLabel>
                                        <CFormSelect 
                                            name="statut" 
                                            value={formData.statut} 
                                            onChange={handleChange}
                                            className="p-2 border-2"
                                        >
                                            <option value="En attente">En attente</option>
                                            <option value="En cours">En cours</option>
                                            <option value="Résolu">Résolu</option>
                                        </CFormSelect>
                                    </CCol>
                                    <CCol md="6" className="mb-3">
                                        <CFormLabel className="fw-600">Assigner à l'entreprise</CFormLabel>
                                        <CFormSelect 
                                            name="id_entreprise" 
                                            value={formData.id_entreprise} 
                                            onChange={handleChange}
                                            className="p-2 border-2"
                                        >
                                            <option value="">Sélectionner une entreprise</option>
                                            {entreprises.map(ent => (
                                                <option key={ent.id} value={ent.id}>{ent.nom}</option>
                                            ))}
                                        </CFormSelect>
                                    </CCol>
                                </CRow>
                            </div>

                            <hr className="my-4" />

                            <div className="mb-4">
                                <h5 className="fw-bold mb-3">Informations complémentaires</h5>
                                <div className="mb-3">
                                    <CFormLabel className="fw-600">Description du problème (Lecture seule)</CFormLabel>
                                    <CFormTextarea 
                                        rows={4} 
                                        value={formData.description} 
                                        readOnly 
                                        className="bg-light border-0"
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
                                >
                                    <CIcon icon={cilSave} className="me-2" />
                                    Enregistrer les modifications
                                </CButton>
                            </div>
                        </CForm>
                    </CCard>
                </CCol>
                
                <CCol lg="4">
                    <CCard className="border-0 shadow-sm bg-light">
                        <CCardBody className="p-4">
                            <h6 className="fw-bold mb-3"><CIcon icon={cilCheckCircle} className="me-2 text-success" />Aide à la gestion</h6>
                            <ul className="small text-muted ps-3 mb-0">
                                <li className="mb-2">Le statut <strong>"En cours"</strong> informe l'utilisateur que l'entreprise a reçu l'ordre de mission.</li>
                                <li className="mb-2">Le passage au statut <strong>"Résolu"</strong> clôturera le ticket et enverra une notification de satisfaction à l'utilisateur.</li>
                                <li>L'entreprise assignée recevra automatiquement les coordonnées GPS du point.</li>
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
