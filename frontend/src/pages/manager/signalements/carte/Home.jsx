import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CCard, CCardHeader, CCardBody, CBadge, CButton, CFormSelect, CFormInput, CRow, CCol } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilMap, cilUser, cilFilter } from '@coreui/icons'
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

// Custom icons for different statuses
const createStatusIcon = (status) => {
    const colors = {
        'En attente': '#ff9800',
        'En cours': '#2196f3',
        'Résolu': '#4caf50'
    }
    const color = colors[status] || '#6c757d'

    return L.divIcon({
        className: 'custom-marker',
        html: `
            <div class="marker-container" style="--marker-color: ${color}">
                <div class="marker-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18" height="18">
                        <path d="M13.783 15.172l2.121-2.121 5.996 5.996-2.121 2.121zM17.5 10c1.93 0 3.5-1.57 3.5-3.5 0-.58-.16-1.12-.41-1.6l-2.7 2.7-1.49-1.49 2.7-2.7c-.48-.25-1.02-.41-1.6-.41C15.57 3 14 4.57 14 6.5c0 .41.08.8.21 1.16l-1.85 1.85-1.78-1.78.71-.71-1.41-1.41L12 3.49a3 3 0 00-4.24 0L4.22 7.03l1.41 1.41H2.81L2.1 9.15l3.54 3.54.71-.71V9.15l1.41 1.42.71-.71 1.78 1.78-6.89 6.88 2.12 2.12 6.88-6.88 1.78 1.78-.71.71 1.42 1.41.71-.71v2.83l.71.71 3.54-3.54-.72-.71v-2.83l1.42-1.41-.71-.71-1.78-1.78 1.85-1.85c.36.13.75.21 1.16.21z"/>
                    </svg>
                </div>
                <div class="marker-badge"></div>
            </div>
        `,
        iconSize: [40, 50],
        iconAnchor: [20, 50],
        popupAnchor: [0, -50]
    })
}

export default function SignalementCarte() {
    const navigate = useNavigate()
    const [filterStatut, setFilterStatut] = useState('')
    const [filterDateDebut, setFilterDateDebut] = useState('')
    const [filterDateFin, setFilterDateFin] = useState('')
    
    // Mock data - Antananarivo area
    const [signalements] = useState([
        {
            id_signalement: 1,
            lat: -18.8792,
            lng: 47.5079,
            description: 'Route endommagée au carrefour principal',
            statut: 'En attente',
            daty: '2025-01-20',
            utilisateur: { id: 1, nom: 'Dupont', prenom: 'Jean', identifiant: 'jean_d' }
        },
        {
            id_signalement: 2,
            lat: -18.9100,
            lng: 47.5250,
            description: 'Pont dégradé nécessitant réparation urgente',
            statut: 'En cours',
            daty: '2025-01-21',
            utilisateur: { id: 2, nom: 'Martin', prenom: 'Marie', identifiant: 'marie_m' }
        },
        {
            id_signalement: 3,
            lat: -18.8650,
            lng: 47.4900,
            description: 'Trottoir cassé zone piétonne',
            statut: 'Résolu',
            daty: '2025-01-22',
            utilisateur: { id: 3, nom: 'Bernard', prenom: 'Pierre', identifiant: 'pierre_b' }
        },
        {
            id_signalement: 4,
            lat: -18.8950,
            lng: 47.5150,
            description: 'Nids de poule dangereux',
            statut: 'En attente',
            daty: '2025-01-23',
            utilisateur: { id: 4, nom: 'Rakoto', prenom: 'Hery', identifiant: 'hery_r' }
        },
    ])

    const getStatutBadgeColor = (statut) => {
        switch (statut) {
            case 'En attente': return 'warning'
            case 'En cours': return 'info'
            case 'Résolu': return 'success'
            default: return 'secondary'
        }
    }

    const handleViewFiche = (id) => {
        navigate(`/manager/signalements/fiche/${id}`)
    }

    const handleViewUser = (userId) => {
        navigate(`/manager/utilisateurs/fiche/${userId}`)
    }

    // Filter signalements
    const filteredSignalements = signalements.filter((sig) => {
        const matchStatut = filterStatut === '' || sig.statut === filterStatut
        
        let matchDate = true
        if (filterDateDebut) {
            matchDate = matchDate && sig.daty >= filterDateDebut
        }
        if (filterDateFin) {
            matchDate = matchDate && sig.daty <= filterDateFin
        }
        
        return matchStatut && matchDate
    })

    // Center on Antananarivo
    const mapCenter = [-18.8792, 47.5079]

    return (
        <div className="signalement-carte">
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
                                <option value="En attente">En attente</option>
                                <option value="En cours">En cours</option>
                                <option value="Résolu">Résolu</option>
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

            <CCard className="border-0 shadow-sm">
                <CCardHeader className="carte-header">
                    <h5 className="mb-0">Affichage cartographique</h5>
                </CCardHeader>
                <CCardBody className="p-0">
                    <div className="map-wrapper position-relative">
                        {/* Légende en bas à droite */}
                        <div className="map-legend-overlay">
                            <div className="legend-title">Légende</div>
                            <div className="legend-item">
                                <span className="legend-dot en-attente"></span> En attente
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot en-cours"></span> En cours
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot resolu"></span> Résolu
                            </div>
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
                                    position={[sig.lat, sig.lng]}
                                    icon={createStatusIcon(sig.statut)}
                                >
                                    <Tooltip direction="top" offset={[0, -50]} opacity={0.95}>
                                        <div className="marker-tooltip">
                                            <div className="tooltip-header">
                                                <strong>Signalement #{sig.id_signalement}</strong>
                                                <CBadge color={getStatutBadgeColor(sig.statut)} size="sm">
                                                    {sig.statut}
                                                </CBadge>
                                            </div>
                                            <p className="tooltip-desc">{sig.description}</p>
                                            <div className="tooltip-user">
                                                <CIcon icon={cilUser} size="sm" />
                                                <span>{sig.utilisateur.prenom} {sig.utilisateur.nom}</span>
                                            </div>
                                        </div>
                                    </Tooltip>
                                    
                                    <Popup>
                                        <div className="popup-content">
                                            <div className="popup-header">
                                                <h6>Signalement #{sig.id_signalement}</h6>
                                                <CBadge color={getStatutBadgeColor(sig.statut)}>
                                                    {sig.statut}
                                                </CBadge>
                                            </div>
                                            
                                            <p className="popup-description">{sig.description}</p>
                                            <small className="popup-date text-muted">Date: {sig.daty}</small>
                                            
                                            <hr />
                                            
                                            <div className="popup-user" onClick={() => handleViewUser(sig.utilisateur.id)}>
                                                <div className="user-avatar-mini">
                                                    {sig.utilisateur.prenom.charAt(0)}{sig.utilisateur.nom.charAt(0)}
                                                </div>
                                                <div className="user-info">
                                                    <span className="user-name">{sig.utilisateur.prenom} {sig.utilisateur.nom}</span>
                                                    <span className="user-id">@{sig.utilisateur.identifiant}</span>
                                                </div>
                                            </div>
                                            
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

            {/* Stats en bas */}
            <div className="map-stats mt-4">
                <div className="stat-card en-attente">
                    <div className="stat-number">{filteredSignalements.filter(s => s.statut === 'En attente').length}</div>
                    <div className="stat-label">En attente</div>
                </div>
                <div className="stat-card en-cours">
                    <div className="stat-number">{filteredSignalements.filter(s => s.statut === 'En cours').length}</div>
                    <div className="stat-label">En cours</div>
                </div>
                <div className="stat-card resolu">
                    <div className="stat-number">{filteredSignalements.filter(s => s.statut === 'Résolu').length}</div>
                    <div className="stat-label">Résolu</div>
                </div>
            </div>
        </div>
    )
}
