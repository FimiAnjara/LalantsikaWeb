import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { CBadge, CAlert, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { ENDPOINTS } from '../../../config/api'
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

const getStatusColor = (status) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
        case 'nouveau': return '#dc3545';
        case 'en cours': return '#FAB95B';
        case 'terminé': return '#28a745';
        default: return '#6c757d';
    }
};

const getStatusLabel = (status) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
        case 'nouveau': return 'Nouveau';
        case 'en cours': return 'En cours';
        case 'terminé': return 'Terminé';
        default: return status;
    }
};

// Composant pour contrôler le zoom/pan de la carte
function MapController({ center, zoom }) {
    const map = useMap()
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom || 15, { duration: 1.5 })
        }
    }, [center, zoom, map])
    return null
}

export default function Signalement() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [signalements, setSignalements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchLocation, setSearchLocation] = useState(null);
    const [searchName, setSearchName] = useState('');
    const [searchError, setSearchError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [filteredSignalements, setFilteredSignalements] = useState([]);

    // Géocoder la ville recherchée via Nominatim (OpenStreetMap)
    useEffect(() => {
        const query = searchParams.get('q')
        if (!query) {
            setSearchLocation(null)
            setSearchName('')
            setSearchError(null)
            return
        }

        const geocode = async () => {
            try {
                setSearchError(null)
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=mg&limit=1`,
                    { headers: { 'Accept-Language': 'fr' } }
                )
                const results = await response.json()
                if (results.length > 0) {
                    const { lat, lon, display_name } = results[0]
                    setSearchLocation([parseFloat(lat), parseFloat(lon)])
                    setSearchName(display_name.split(',')[0])
                } else {
                    setSearchError(`Aucun résultat pour "${query}"`)
                    setSearchLocation(null)
                }
            } catch (err) {
                console.error('Geocoding error:', err)
                setSearchError('Erreur lors de la recherche de localisation')
            }
        }
        geocode()
    }, [searchParams])

    // Fonction pour récupérer les signalements depuis l'API
    const fetchSignalements = async () => {
        try {
            setLoading(true);
            setError(null); // Reset error state
            
            const response = await fetch(ENDPOINTS.REPORTS_PUBLIC, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('API Response:', result); // Debug log
            
            if (result.success) {
                // Transformer les données pour le format attendu par la carte
                const transformedData = result.data.map(signal => ({
                    id: signal.id_signalement,
                    position: [parseFloat(signal.lat || 0), parseFloat(signal.lon || 0)],
                    problem: signal.description || 'Problème de route',
                    location: signal.lieu || 'Non spécifié',
                    date: signal.daty_signalement ? new Date(signal.daty_signalement).toLocaleDateString('fr-FR') : 'Non défini',
                    status: signal.dernier_statut?.statut?.libelle || 'Nouveau',
                    surface: signal.surface || 'N/A',
                    budget: signal.budget ? Number(signal.budget).toLocaleString() + ' Ar' : 'Non défini',
                    entreprise: signal.entreprise?.nom || 'Non assignée'
                }));
                
                console.log('Transformed data:', transformedData); // Debug log
                setSignalements(transformedData);
            } else {
                setError(`Erreur API: ${result.message || 'Erreur lors du chargement des signalements'}`);
            }
        } catch (err) {
            console.error('Fetch error:', err); // Debug log
            setError(`Erreur de connexion: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

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

    // Charger les signalements au montage du composant
    useEffect(() => {
        fetchSignalements();
    }, []);

    // Filter signalements based on activeFilter and searchQuery
    useEffect(() => {
        let filtered = signalements;
        
        if (activeFilter !== 'all') {
            filtered = filtered.filter(s => s.status.toLowerCase() === activeFilter);
        }
        
        if (searchQuery) {
            filtered = filtered.filter(s => 
                s.problem.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.location && s.location.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }
        
        setFilteredSignalements(filtered);
    }, [signalements, activeFilter, searchQuery]);

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
            ) : loading ? (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5" 
                    style={{ 
                        background: 'linear-gradient(135deg, #E8E2DB 0%, #d4cfc7 100%)',
                        minHeight: '100vh'
                    }}>
                    <CSpinner size="xl" className="mb-3" style={{ color: '#1A3263' }} />
                    <h3 style={{ color: '#1A3263', fontWeight: 700 }}>Chargement de la carte...</h3>
                    <p style={{ color: '#666' }}>Récupération des signalements en cours</p>
                </div>
            ) : error ? (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5" 
                    style={{ 
                        background: 'linear-gradient(135deg, #E8E2DB 0%, #d4cfc7 100%)',
                        minHeight: '100vh'
                    }}>
                    <CAlert color="danger" className="text-center">
                        <h4>Erreur de chargement</h4>
                        <p>{error}</p>
                        <button 
                            className="btn btn-outline-danger"
                            onClick={fetchSignalements}
                        >
                            Réessayer
                        </button>
                    </CAlert>
                </div>
            ) : (
                <>
                    {searchError && (
                        <CAlert color="warning" className="m-3 mb-0 d-flex align-items-center justify-content-between">
                            <span>{searchError}</span>
                            <button className="btn btn-sm btn-outline-warning" onClick={() => { setSearchParams({}); setSearchError(null); }}>Effacer</button>
                        </CAlert>
                    )}
                    {searchName && !searchError && (
                        <CAlert color="info" className="m-3 mb-0 d-flex align-items-center justify-content-between">
                            <span>📍 Résultat : <strong>{searchName}</strong></span>
                            <button className="btn btn-sm btn-outline-info" onClick={() => { setSearchParams({}); setSearchLocation(null); setSearchName(''); }}>Effacer</button>
                        </CAlert>
                    )}

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
                        <MapController center={searchLocation} zoom={15} />
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    
                        
                        {filteredSignalements.length === 0 && signalements.length > 0 ? (
                            <div className="position-absolute top-50 start-50 translate-middle bg-white p-4 rounded shadow border">
                                <div className="text-center">
                                    <CIcon icon={cilLocationPin} size="xxl" className="text-muted mb-2" />
                                    <h5 className="text-muted">Aucun résultat pour cette recherche</h5>
                                    <p className="text-muted mb-0">Essayez de modifier vos filtres</p>
                                </div>
                            </div>
                        ) : signalements.length === 0 ? (
                            <div className="position-absolute top-50 start-50 translate-middle bg-white p-4 rounded shadow border">
                                <div className="text-center">
                                    <CIcon icon={cilLocationPin} size="xxl" className="text-muted mb-2" />
                                    <h5 className="text-muted">Aucun signalement trouvé</h5>
                                    <p className="text-muted mb-0">Aucun signalement n'a encore été enregistré</p>
                                </div>
                            </div>
                        ) : null}
                        
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
