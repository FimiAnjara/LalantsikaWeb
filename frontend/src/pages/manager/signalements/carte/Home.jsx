import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CCard, CCardHeader, CCardBody, CBadge, CButton, CFormSelect, CFormInput, CRow, CCol } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilMap, cilUser, cilFilter, cilCheckCircle, cilWarning, cilXCircle, cilSync, cilList } from '@coreui/icons'
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './Carte.css'


// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom icon with logo.png and colored background by status
const createStatusIcon = (status) => {
    // Utilise la même logique de couleur que getStatutBadgeColor
    let color = '#6c757d'
    if (!status) color = '#6c757d'
    else {
        const label = status.trim().toLowerCase()
        if (label === 'en attente') color = '#ff9800'
        else if (label === 'en cours') color = '#2196f3'
        else if (label === 'validé' || label === 'valide') color = '#ff9800'
        else if (label === 'rejeté' || label === 'rejete') color = '#e55353'
        else if (label === 'terminé' || label === 'termine') color = '#4caf50'
    }
    return L.divIcon({
        className: 'custom-marker',
        html: `
            <div class="marker-logo-container" style="background:${color};border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px #0002;">
                <img src="/assets/logo/login/logo.png" alt="logo" style="width:28px;height:28px;object-fit:contain;filter:drop-shadow(0 0 2px #fff8);" />
            </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 44],
        popupAnchor: [0, -44]
    })
}

export default function SignalementCarte() {
    const navigate = useNavigate()
    const [filterStatut, setFilterStatut] = useState('')
    const [filterDateDebut, setFilterDateDebut] = useState('')
    const [filterDateFin, setFilterDateFin] = useState('')

    // Signalements depuis l'API
    const [signalements, setSignalements] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    // Statuts depuis l'API
    const [statuts, setStatuts] = useState([])

    useEffect(() => {
        const fetchSignalements = async () => {
            setLoading(true)
            setError(null)
            try {
                const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
                const response = await fetch('http://localhost:8000/api/reports', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    }
                })
                const result = await response.json()
                console.log('API result', result)
                if (result.success && result.data) {
                    console.log('Signalements reçus de l\'API:', result.data.items)
                    if (result.data.items.length > 0) {
                        console.log('Exemple signalement:', result.data.items[0])
                    }
                    setSignalements(result.data.items)
                } else {
                    setError(result.message || 'Erreur lors du chargement des signalements')
                }
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        const fetchStatuts = async () => {
            try {
                const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
                const response = await fetch('http://localhost:8000/api/statuses', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                         'Accept': 'application/json',
                    }
                })
                const result = await response.json()
                if (result.success && result.data) {
                    setStatuts(result.data)
                }
            } catch (err) {
                console.error('Erreur chargement statuts', err)
            }
        }
        fetchSignalements()
        fetchStatuts()
    }, [])

    // Récupère le libellé du statut (adapte selon la structure)
    const getStatutLabel = (sig) => {
        if (sig.statut && typeof sig.statut === 'string') return sig.statut
        if (sig.statut && typeof sig.statut === 'object' && sig.statut.libelle) return sig.statut.libelle
        if (sig.status) return sig.status
        return 'Non défini'
    }

    // Trouve la couleur du badge à partir du libellé ou de l'id du statut
    const getStatutBadgeColor = (statutLabel) => {
        if (!statutLabel) return 'secondary'
        const label = statutLabel.trim().toLowerCase()
        if (label === 'en attente') return 'warning'
        if (label === 'en cours') return 'info'
        if (label === 'validé' || label === 'valide') return 'warning'
        if (label === 'rejeté' || label === 'rejete') return 'danger'
        if (label === 'terminé' || label === 'termine') return 'success'
        return 'secondary'
    }

    const handleViewFiche = (id) => {
        navigate(`/manager/signalements/fiche/${id}`)
    }

    const handleViewUser = (userId) => {
        navigate(`/manager/utilisateurs/fiche/${userId}`)
    }

    // Filter signalements (statut, date, et coordonnées valides)
    // Utilise lat/lng OU latitude/longitude (conversion en number)
    const filteredSignalements = signalements.filter((sig) => {
        const matchStatut = filterStatut === '' || sig.statut === filterStatut
        let matchDate = true
        if (filterDateDebut) {
            matchDate = matchDate && sig.daty >= filterDateDebut
        }
        if (filterDateFin) {
            matchDate = matchDate && sig.daty <= filterDateFin
        }
        // Conversion en number
        const lat = sig.lat !== undefined ? Number(sig.lat) : (sig.latitude !== undefined ? Number(sig.latitude) : undefined)
        const lng = sig.lng !== undefined ? Number(sig.lng) : (sig.longitude !== undefined ? Number(sig.longitude) : undefined)
        const hasCoords = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)
        return matchStatut && matchDate && hasCoords
    })
    console.log('Signalements filtrés pour carte', filteredSignalements)

    // Center on Antananarivo
    const mapCenter = [-18.8792, 47.5079]

    return (
        <div className="signalement-carte">
            {loading && <div className="text-center my-4">Chargement des signalements...</div>}
            {error && <div className="alert alert-danger my-4">{error}</div>}
            <div className="page-header d-flex align-items-center gap-3 mb-4">
                <div className="header-icon">
                    <CIcon icon={cilMap} size="lg" />
                </div>
                <div>
                    <h2 className="mb-0">Carte des signalements</h2>
                    <small className="text-muted">Visualisation des signalements par localisation</small>
                </div>
            </div>

            {/* Filtres */}
            <CCard className="filters-card mb-4 border-0 shadow-sm">
                <CCardBody>
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <CIcon icon={cilFilter} className="text-primary" />
                        <span className="fw-bold">Filtres</span>
                    </div>
                    <CRow className="g-3">
                        <CCol md="4">
                            <label className="form-label fw-600">Statut</label>
                            <CFormSelect
                                value={filterStatut}
                                onChange={(e) => setFilterStatut(e.target.value)}
                                className="filter-select"
                            >
                                <option value="">Tous les statuts</option>
                                {statuts.map((statut) => (
                                    <option key={statut.id_statut || statut.id} value={statut.libelle || statut.nom || statut.label || ''}>
                                        {statut.libelle || statut.nom || statut.label || statut}
                                    </option>
                                ))}
                            </CFormSelect>
                        </CCol>
                        <CCol md="4">
                            <label className="form-label fw-600">Date début</label>
                            <CFormInput
                                type="date"
                                value={filterDateDebut}
                                onChange={(e) => setFilterDateDebut(e.target.value)}
                            />
                        </CCol>
                        <CCol md="4">
                            <label className="form-label fw-600">Date fin</label>
                            <CFormInput
                                type="date"
                                value={filterDateFin}
                                onChange={(e) => setFilterDateFin(e.target.value)}
                            />
                        </CCol>
                    </CRow>
                </CCardBody>
            </CCard>

            {/* Carte et stats */}
            {!loading && !error && (
                <>
                    <CCard className="border-0 shadow-sm">
                        <CCardHeader className="carte-header">
                            <h5 className="mb-0">Affichage cartographique</h5>
                        </CCardHeader>
                        <CCardBody className="p-0">
                            <div className="map-wrapper position-relative">
                                {/* Légende en bas à droite */}
                                <div className="map-legend-overlay">
                                    <div className="legend-title">Légende</div>
                                    {statuts.length > 0 ? (
                                        statuts.map((statut) => (
                                            <div className="legend-item" key={statut.id_statut || statut.id}>
                                                <span className={`legend-dot`} style={{
                                                    background:
                                                        getStatutBadgeColor(statut.libelle || statut.nom || statut.label) === 'warning' ? '#ff9800'
                                                        : getStatutBadgeColor(statut.libelle || statut.nom || statut.label) === 'info' ? '#2196f3'
                                                        : getStatutBadgeColor(statut.libelle || statut.nom || statut.label) === 'success' ? '#4caf50'
                                                        : getStatutBadgeColor(statut.libelle || statut.nom || statut.label) === 'danger' ? '#e55353'
                                                        : '#6c757d'
                                                }}></span>
                                                {statut.libelle || statut.nom || statut.label || statut}
                                            </div>
                                        ))
                                    ) : (
                                        <>
                                            <div className="legend-item">
                                                <span className="legend-dot en-attente"></span> En attente
                                            </div>
                                            <div className="legend-item">
                                                <span className="legend-dot en-cours"></span> En cours
                                            </div>
                                            <div className="legend-item">
                                                <span className="legend-dot resolu"></span> Résolu
                                            </div>
                                        </>
                                    )}
                                </div>
                                <MapContainer 
                                    center={mapCenter} 
                                    zoom={13} 
                                    style={{ height: '750px', width: '100%' }}
                                    scrollWheelZoom={true}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    {filteredSignalements.map((sig) => (
                                        <Marker
                                            key={sig.id_signalement}
                                            position={[
                                                sig.lat !== undefined ? Number(sig.lat) : (sig.latitude !== undefined ? Number(sig.latitude) : 0),
                                                sig.lng !== undefined ? Number(sig.lng) : (sig.longitude !== undefined ? Number(sig.longitude) : 0)
                                            ]}
                                            icon={createStatusIcon(sig.statut)}
                                        >
                                            <Tooltip direction="top" offset={[0, -50]} opacity={0.95}>
                                                <div className="marker-tooltip">
                                                    <div className="tooltip-header">
                                                        <strong>Signalement #{sig.id_signalement}</strong>
                                                        <CBadge color={getStatutBadgeColor(getStatutLabel(sig))} size="sm">
                                                            {getStatutLabel(sig)}
                                                        </CBadge>
                                                    </div>
                                                    <p className="tooltip-desc">{sig.description}</p>
                                                    {sig.utilisateur && (
                                                        <div className="tooltip-user">
                                                            <CIcon icon={cilUser} size="sm" />
                                                            <span>{sig.utilisateur.prenom} {sig.utilisateur.nom}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </Tooltip>
                                            <Popup>
                                                <div className="popup-content">
                                                    <div className="popup-header">
                                                        <h6>Signalement #{sig.id_signalement}</h6>
                                                        <CBadge color={getStatutBadgeColor(getStatutLabel(sig))}>
                                                            {getStatutLabel(sig)}
                                                        </CBadge>
                                                    </div>
                                                    <p className="popup-description">{sig.description}</p>
                                                    <small className="popup-date text-muted">Date: {sig.daty}</small>
                                                    <hr />
                                                    {sig.utilisateur && (
                                                        <div className="popup-user" onClick={() => handleViewUser(sig.utilisateur.id)}>
                                                            <div className="user-avatar-mini">
                                                                {sig.utilisateur.prenom?.charAt(0)}{sig.utilisateur.nom?.charAt(0)}
                                                            </div>
                                                            <div className="user-info">
                                                                <span className="user-name">{sig.utilisateur.prenom} {sig.utilisateur.nom}</span>
                                                                <span className="user-id">@{sig.utilisateur.identifiant}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <CButton
                                                        color="primary"
                                                        size="sm"
                                                        className="w-100 mt-3 btn-voir-fiche"
                                                        onClick={() => handleViewFiche(sig.id_signalement)}
                                                    >
                                                        Voir la fiche
                                                    </CButton>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            </div>
                        </CCardBody>
                    </CCard>
                    <div className="map-stats mt-4 d-flex flex-wrap gap-3 align-items-stretch">
                        {/* Total général */}
                        <div className="stat-card total bg-dark text-white d-flex flex-column align-items-center justify-content-center" style={{ minWidth: 120 }}>
                            <CIcon icon={cilList} size="xl" className="mb-2" />
                            <div className="stat-number" style={{ fontSize: 28 }}>{filteredSignalements.length}</div>
                            <div className="stat-label">Total</div>
                        </div>
                        {/* Par statut */}
                        {statuts.length > 0 ? (
                            statuts.map((statut) => {
                                const label = (statut.libelle || statut.nom || statut.label || statut).trim()
                                const color = getStatutBadgeColor(label)
                                const statId = String(statut.id_statut || statut.id)
                                // On compare l'id_statut du signalement à celui du statut courant, ou le libellé si c'est une string
                                const count = filteredSignalements.filter(s => {
                                    if (s.statut && typeof s.statut === 'object' && (s.statut.id_statut || s.statut.id)) {
                                        return String(s.statut.id_statut || s.statut.id) === statId
                                    }
                                    // fallback: compare le libellé (pour compatibilité)
                                    let sigLabel = getStatutLabel(s)
                                    if (typeof sigLabel === 'string') sigLabel = sigLabel.trim()
                                    return sigLabel === label
                                }).length
                                // Choix de l'icône selon le statut
                                let icon = cilWarning
                                if (color === 'success') icon = cilCheckCircle
                                else if (color === 'danger') icon = cilXCircle
                                else if (color === 'info') icon = cilSync
                                else if (color === 'warning') icon = cilWarning
                                return (
                                    <div className={`stat-card text-${color}   d-flex flex-column align-items-center justify-content-center`} key={statId} style={{ minWidth: 120 }}>
                                        <CIcon icon={icon} size="xl" className="mb-2" />
                                        <div className="stat-number" style={{ fontSize: 28 }}>{count}</div>
                                        <div className="stat-label">{label}</div>
                                    </div>
                                )
                            })
                        ) : (
                            <>
                                {/* <div className="stat-card en-attente">
                                    <div className="stat-number">{filteredSignalements.filter(s => getStatutLabel(s) === 'En attente').length}</div>
                                    <div className="stat-label">En attente</div>
                                </div>
                                <div className="stat-card en-cours">
                                    <div className="stat-number">{filteredSignalements.filter(s => getStatutLabel(s) === 'En cours').length}</div>
                                    <div className="stat-label">En cours</div>
                                </div>
                                <div className="stat-card resolu">
                                    <div className="stat-number">{filteredSignalements.filter(s => getStatutLabel(s) === 'Résolu').length}</div>
                                    <div className="stat-label">Résolu</div>
                                </div> */}
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
