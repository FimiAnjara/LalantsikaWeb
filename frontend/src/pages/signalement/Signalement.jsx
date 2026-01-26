import React from 'react'
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { CBadge, CCard, CCardBody, CCardHeader } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { 
    cilMap, 
    cilCalendar, 
    cilLocationPin, 
    cilResizeBoth, 
    cilMoney, 
    cilBuilding 
} from '@coreui/icons'

// Correction des icônes par défaut de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const signalements = [
    {
        id: 1,
        position: [-18.8792, 47.5079], // Analakely
        problem: "Nid-de-poule majeur",
        date: "2024-01-15",
        status: "nouveau",
        surface: 12,
        budget: "500,000 Ar",
        entreprise: "Axe Construction"
    },
    {
        id: 2,
        position: [-18.9100, 47.5200], // Anosy
        problem: "Route affaissée",
        date: "2024-01-10",
        status: "en cours",
        surface: 45,
        budget: "2,500,000 Ar",
        entreprise: "Colas M'car"
    },
    {
        id: 3,
        position: [-18.8600, 47.5300], // Ivandry
        problem: "Fissures transversales",
        date: "2023-12-20",
        status: "terminé",
        surface: 8,
        budget: "200,000 Ar",
        entreprise: "HERY TP"
    }
];

const getStatusColor = (status) => {
    switch (status) {
        case 'nouveau': return 'danger';
        case 'en cours': return 'warning';
        case 'terminé': return 'success';
        default: return 'secondary';
    }
};

export default function Signalement() {
    return (
        <CCard className="shadow-sm border-0">
            <CCardHeader className="bg-navy text-white d-flex justify-content-between align-items-center py-3">
                <h5 className="mb-0 fs-4 fw-bold d-flex align-items-center">
                    <CIcon icon={cilMap} className="me-2" size="xl" />
                    Carte des Signalements - Antananarivo
                </h5>
                <CBadge color="light" className="text-dark">3 points détectés</CBadge>
            </CCardHeader>
            <CCardBody className="p-0 overflow-hidden" style={{ borderRadius: '0 0 1rem 1rem' }}>
                <MapContainer 
                    center={[-18.8792, 47.5079]} 
                    zoom={13} 
                    style={{ height: '600px', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {signalements.map((s) => (
                        <Marker key={s.id} position={s.position}>
                            <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false}>
                                <div style={{ minWidth: '200px', padding: '5px' }}>
                                    <h6 className="fw-bold mb-2 border-bottom pb-1">{s.problem}</h6>
                                    <div className="d-flex flex-column gap-1 small text-dark">
                                        <div className="d-flex align-items-center">
                                            <CIcon icon={cilCalendar} className="me-2 text-secondary" />
                                            <strong>Date:</strong> <span className="ms-1">{s.date}</span>
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <CIcon icon={cilLocationPin} className="me-2 text-secondary" />
                                            <strong>Statut:</strong> <CBadge color={getStatusColor(s.status)} className="ms-1">{s.status}</CBadge>
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <CIcon icon={cilResizeBoth} className="me-2 text-secondary" />
                                            <strong>Surface:</strong> <span className="ms-1">{s.surface} m²</span>
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <CIcon icon={cilMoney} className="me-2 text-secondary" />
                                            <strong>Budget:</strong> <span className="ms-1">{s.budget}</span>
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <CIcon icon={cilBuilding} className="me-2 text-secondary" />
                                            <strong>Entreprise:</strong> <span className="ms-1">{s.entreprise}</span>
                                        </div>
                                    </div>
                                </div>
                            </Tooltip>
                            <Popup>
                                <strong>{s.problem}</strong><br />
                                Cliquez pour plus de détails sur ce signalement.
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </CCardBody>
        </CCard>
    )
}
