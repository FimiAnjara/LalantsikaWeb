import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import CIcon from '@coreui/icons-react'
import { 
    cilSearch,
    cilLocationPin, 
    cilCalendar, 
    cilResizeBoth, 
    cilMoney, 
    cilBuilding,
    cilWifiSignalOff,
    cilLayers
} from '@coreui/icons'

// Correction des icônes par défaut de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom markers avec couleurs
const createColoredIcon = (color) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            background-color: ${color};
            width: 30px;
            height: 30px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
};

const signalements = [
    {
        id: 1,
        position: [-18.8792, 47.5079],
        problem: "Nid-de-poule majeur",
        location: "Analakely, Antananarivo",
        date: "2024-01-15",
        status: "nouveau",
        surface: 12,
        budget: "500,000 Ar",
        entreprise: "Axe Construction"
    },
    {
        id: 2,
        position: [-18.9100, 47.5200],
        problem: "Route affaissée",
        location: "Anosy, Antananarivo",
        date: "2024-01-10",
        status: "en cours",
        surface: 45,
        budget: "2,500,000 Ar",
        entreprise: "Colas M'car"
    },
    {
        id: 3,
        position: [-18.8600, 47.5300],
        problem: "Fissures transversales",
        location: "Ivandry, Antananarivo",
        date: "2023-12-20",
        status: "terminé",
        surface: 8,
        budget: "200,000 Ar",
        entreprise: "HERY TP"
    },
    {
        id: 4,
        position: [-18.8900, 47.4900],
        problem: "Effondrement partiel",
        location: "Andohalo, Antananarivo",
        date: "2024-01-20",
        status: "nouveau",
        surface: 25,
        budget: "1,200,000 Ar",
        entreprise: "En attente"
    },
    {
        id: 5,
        position: [-18.8750, 47.5400],
        problem: "Revêtement dégradé",
        location: "Ankorondrano, Antananarivo",
        date: "2024-01-05",
        status: "en cours",
        surface: 60,
        budget: "3,000,000 Ar",
        entreprise: "Sogea Satom"
    }
];

const getStatusColor = (status) => {
    switch (status) {
        case 'nouveau': return '#dc3545';
        case 'en cours': return '#FAB95B';
        case 'terminé': return '#28a745';
        default: return '#6c757d';
    }
};

const getStatusLabel = (status) => {
    switch (status) {
        case 'nouveau': return 'Nouveau';
        case 'en cours': return 'En cours';
        case 'terminé': return 'Terminé';
        default: return status;
    }
};

export default function Signalement() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [filteredSignalements, setFilteredSignalements] = useState(signalements);

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

    useEffect(() => {
        let filtered = signalements;
        
        if (activeFilter !== 'all') {
            filtered = filtered.filter(s => s.status === activeFilter);
        }
        
        if (searchQuery) {
            filtered = filtered.filter(s => 
                s.problem.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.location.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        setFilteredSignalements(filtered);
    }, [activeFilter, searchQuery]);

    const handleSearch = (e) => {
        e.preventDefault();
    };

    return (
        <div className="map-page-container">
            {!isOnline ? (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5" 
                    style={{ 
                        background: 'linear-gradient(135deg, #E8E2DB 0%, #d4cfc7 100%)',
                        minHeight: '100vh'
                    }}>
                    <CIcon icon={cilWifiSignalOff} size="7xl" className="mb-4" style={{ color: '#547792', opacity: 0.5 }} />
                    <h2 style={{ color: '#1A3263', fontWeight: 700 }}>Connexion requise</h2>
                    <p className="text-center px-4" style={{ maxWidth: '500px', color: '#666' }}>
                        La carte interactive nécessite une connexion internet pour charger les fonds de carte. 
                        Veuillez vérifier votre accès réseau.
                    </p>
                </div>
            ) : (
                <>
                    {/* Controls Bar - Search Left, Filters Right */}
                    <div className="map-controls-bar">
                        {/* Search Bar */}
                        <form className="map-search-bar" onSubmit={handleSearch}>
                            <input 
                                type="text"
                                className="map-search-input"
                                placeholder="Rechercher..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button type="submit" className="map-search-btn">
                                <CIcon icon={cilSearch} />
                            </button>
                        </form>

                        {/* Filter Bubbles */}
                        <div className="map-filter-bubbles">
                            <button 
                                className={`filter-bubble ${activeFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('all')}
                            >
                                Tous ({signalements.length})
                            </button>
                            <button 
                                className={`filter-bubble danger ${activeFilter === 'nouveau' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('nouveau')}
                            >
                                🔴 Nouveaux
                            </button>
                            <button 
                                className={`filter-bubble warning ${activeFilter === 'en cours' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('en cours')}
                            >
                                🟡 En cours
                            </button>
                            <button 
                                className={`filter-bubble success ${activeFilter === 'terminé' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('terminé')}
                            >
                                🟢 Terminés
                            </button>
                        </div>
                    </div>

                    {/* Map */}
                    <MapContainer 
                        center={[-18.8792, 47.5079]} 
                        zoom={13} 
                        className="map-fullscreen"
                        zoomControl={false}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        
                        {filteredSignalements.map((s) => (
                            <Marker 
                                key={s.id} 
                                position={s.position}
                                icon={createColoredIcon(getStatusColor(s.status))}
                            >
                                <Popup>
                                    <div style={{ minWidth: '280px', padding: '10px' }}>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '10px',
                                            marginBottom: '15px',
                                            paddingBottom: '10px',
                                            borderBottom: '2px solid #E8E2DB'
                                        }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '10px',
                                                background: getStatusColor(s.status),
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white'
                                            }}>
                                                <CIcon icon={cilLocationPin} />
                                            </div>
                                            <div>
                                                <h4 style={{ 
                                                    margin: 0, 
                                                    fontSize: '1rem', 
                                                    fontWeight: 700,
                                                    color: '#1A3263'
                                                }}>
                                                    {s.problem}
                                                </h4>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                                                    {s.location}
                                                </p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <div style={{ 
                                                padding: '10px', 
                                                background: '#f8f9fa', 
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <CIcon icon={cilCalendar} style={{ color: '#547792' }} />
                                                <div>
                                                    <small style={{ color: '#999', fontSize: '0.7rem' }}>DATE</small>
                                                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.date}</div>
                                                </div>
                                            </div>
                                            <div style={{ 
                                                padding: '10px', 
                                                background: '#f8f9fa', 
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <CIcon icon={cilResizeBoth} style={{ color: '#547792' }} />
                                                <div>
                                                    <small style={{ color: '#999', fontSize: '0.7rem' }}>SURFACE</small>
                                                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.surface} m²</div>
                                                </div>
                                            </div>
                                            <div style={{ 
                                                padding: '10px', 
                                                background: '#f8f9fa', 
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <CIcon icon={cilMoney} style={{ color: '#28a745' }} />
                                                <div>
                                                    <small style={{ color: '#999', fontSize: '0.7rem' }}>BUDGET</small>
                                                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#28a745' }}>{s.budget}</div>
                                                </div>
                                            </div>
                                            <div style={{ 
                                                padding: '10px', 
                                                background: '#f8f9fa', 
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <CIcon icon={cilBuilding} style={{ color: '#547792' }} />
                                                <div>
                                                    <small style={{ color: '#999', fontSize: '0.7rem' }}>ENTREPRISE</small>
                                                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.entreprise}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{
                                            marginTop: '15px',
                                            padding: '10px 15px',
                                            background: getStatusColor(s.status),
                                            color: s.status === 'en cours' ? '#1A3263' : 'white',
                                            borderRadius: '50px',
                                            textAlign: 'center',
                                            fontWeight: 600,
                                            fontSize: '0.9rem'
                                        }}>
                                            Statut: {getStatusLabel(s.status)}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>

                    {/* Info Panel */}
                    <div className="map-info-panel">
                        <h4>
                            <CIcon icon={cilLayers} />
                            Légende
                        </h4>
                        <div className="map-legend">
                            <div className="legend-item">
                                <span className="legend-dot danger"></span>
                                Nouveau signalement
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot warning"></span>
                                Travaux en cours
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot success"></span>
                                Problème résolu
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
