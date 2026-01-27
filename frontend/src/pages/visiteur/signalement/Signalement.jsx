import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { CBadge, CCard, CCardBody, CCardHeader, CAlert, CRow, CCol } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { 
    cilMap, 
    cilCalendar, 
    cilLocationPin, 
    cilResizeBoth, 
    cilMoney, 
    cilBuilding,
    cilWifiSignalOff
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
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <CCard className="shadow-sm border-0">
            <CCardHeader className="bg-navy text-white d-flex justify-content-between align-items-center py-3">
                <h5 className="mb-0 fs-4 fw-bold d-flex align-items-center">
                    <CIcon icon={cilMap} className="me-2" size="xl" />
                    Carte des Signalements - Antananarivo
                </h5>
                <CBadge color="light" className="text-dark">3 points détectés</CBadge>
            </CCardHeader>
            <CCardBody className="p-0 overflow-hidden" style={{ borderRadius: '0 0 1rem 1rem', minHeight: '400px' }}>
                {!isOnline ? (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5 bg-light" style={{ minHeight: '600px' }}>
                        <CIcon icon={cilWifiSignalOff} size="7xl" className="text-secondary mb-4 opacity-50" />
                        <h2 className="text-secondary fw-bold">Hors-ligne</h2>
                        <p className="text-muted text-center px-4" style={{ maxWidth: '500px' }}>
                            La carte interactive nécessite une connexion internet pour charger les fonds de carte (OpenStreetMap). 
                            Veuillez vérifier votre accès réseau pour visualiser les points de signalement géolocalisés.
                        </p>
                        <CAlert color="warning" className="mt-3 border-0 shadow-sm px-4">
                            Tentative de reconnexion automatique...
                        </CAlert>
                    </div>
                ) : (
                    <MapContainer 
                        center={[-18.8792, 47.5079]} 
                        zoom={13} 
                        style={{ height: '700px', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        
                        {signalements.map((s) => (
                            <Marker key={s.id} position={s.position}>
                                <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                                    <div style={{ minWidth: '600px', padding: '20px' }}>
                                        <h3 className="fw-bold mb-4 border-bottom pb-3 text-primary d-flex align-items-center">
                                            <CIcon icon={cilLocationPin} className="me-2" size="xxl" />
                                            {s.problem}
                                        </h3>
                                        
                                        <CRow className="g-3">
                                            {/* Première ligne d'infos */}
                                            <CCol xs={6}>
                                                <div className="d-flex align-items-center bg-white p-3 border rounded shadow-sm h-100">
                                                    <CIcon icon={cilCalendar} className="me-3 text-secondary" size="xl" />
                                                    <div>
                                                        <div className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.75rem' }}>Signalé le</div>
                                                        <div className="fw-bold fs-5">{s.date}</div>
                                                    </div>
                                                </div>
                                            </CCol>
                                            <CCol xs={6}>
                                                <div className="d-flex align-items-center bg-white p-3 border rounded shadow-sm h-100">
                                                    <CIcon icon={cilResizeBoth} className="me-3 text-secondary" size="xl" />
                                                    <div>
                                                        <div className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.75rem' }}>Surface</div>
                                                        <div className="fw-bold fs-5">{s.surface} m²</div>
                                                    </div>
                                                </div>
                                            </CCol>

                                            {/* Deuxième ligne d'infos */}
                                            <CCol xs={6}>
                                                <div className="d-flex align-items-center bg-white p-3 border rounded shadow-sm h-100">
                                                    <CIcon icon={cilMoney} className="me-3 text-secondary" size="xl" />
                                                    <div>
                                                        <div className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.75rem' }}>Budget</div>
                                                        <div className="fw-bold fs-5 text-success">{s.budget}</div>
                                                    </div>
                                                </div>
                                            </CCol>
                                            <CCol xs={6}>
                                                <div className="d-flex align-items-center bg-white p-3 border rounded shadow-sm h-100">
                                                    <CIcon icon={cilBuilding} className="me-3 text-secondary" size="xl" />
                                                    <div>
                                                        <div className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.75rem' }}>Entreprise</div>
                                                        <div className="fw-bold fs-5 text-truncate" style={{ maxWidth: '150px' }}>{s.entreprise}</div>
                                                    </div>
                                                </div>
                                            </CCol>

                                            {/* Statut en bas (pleine largeur pour garder de la clarté) */}
                                            <CCol xs={12}>
                                                <CBadge color={getStatusColor(s.status)} className="w-100 py-3 text-uppercase shadow-sm fs-5">
                                                    Statut actuel : {s.status}
                                                </CBadge>
                                            </CCol>
                                        </CRow>
                                    </div>
                                </Tooltip>
                            </Marker>
                        ))}
                    </MapContainer>
                )}
            </CCardBody>
        </CCard>
    )
}
