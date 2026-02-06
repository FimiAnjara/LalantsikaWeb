import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { CBadge, CCard, CCardBody, CCardHeader, CAlert, CRow, CCol, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { ENDPOINTS } from '../../../config/api'
import { 
    cilMap, 
    cilCalendar, 
    cilLocationPin, 
    cilResizeBoth, 
    cilMoney, 
    cilBuilding,
    cilWifiSignalOff
} from '@coreui/icons'

// Icônes personnalisées par statut
const createStatusIcon = (status) => {
    const statusLower = status.toLowerCase();
    let iconFile = 'nouveau.png';
    if (statusLower === 'en cours') iconFile = 'en cours.png';
    else if (statusLower === 'terminé') iconFile = 'terminé.png';

    return new L.Icon({
        iconUrl: `/assets/icone/${iconFile}`,
        iconSize: [50, 50],
        iconAnchor: [25, 50],
        tooltipAnchor: [0, -50],
        shadowUrl: null,
        shadowSize: null,
    });
};

const getStatusColor = (status) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
        case 'nouveau': return 'danger';
        case 'en cours': return 'warning';
        case 'terminé': return 'success';
        default: return 'secondary';
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

    return (
        <CCard className="shadow-sm border-0">
            <CCardHeader className="bg-navy text-white d-flex justify-content-between align-items-center py-3">
                <h5 className="mb-0 fs-4 fw-bold d-flex align-items-center">
                    <CIcon icon={cilMap} className="me-2" size="xl" />
                    Carte des Signalements - Antananarivo
                </h5>
                <CBadge color="light" className="text-dark">
                    {loading ? 'Chargement...' : `${signalements.length} point${signalements.length !== 1 ? 's' : ''} détecté${signalements.length !== 1 ? 's' : ''}`}
                </CBadge>
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
                ) : loading ? (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5 bg-light" style={{ minHeight: '600px' }}>
                        <CSpinner size="xl" className="mb-3" />
                        <h3 className="text-secondary">Chargement de la carte...</h3>
                        <p className="text-muted">Récupération des signalements en cours</p>
                    </div>
                ) : error ? (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5 bg-light" style={{ minHeight: '600px' }}>
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
                    <MapContainer 
                        center={[-18.8792, 47.5079]} 
                        zoom={13} 
                        style={{ height: '700px', width: '100%' }}
                    >
                        <MapController center={searchLocation} zoom={15} />
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    
                        
                        {signalements.length === 0 ? (
                            <div className="position-absolute top-50 start-50 translate-middle bg-white p-4 rounded shadow border">
                                <div className="text-center">
                                    <CIcon icon={cilLocationPin} size="xxl" className="text-muted mb-2" />
                                    <h5 className="text-muted">Aucun signalement trouvé</h5>
                                    <p className="text-muted mb-0">Aucun signalement n'a encore été enregistré</p>
                                </div>
                            </div>
                        ) : null}
                        
                        {signalements.map((s) => (
                            <Marker key={s.id} position={s.position} icon={createStatusIcon(s.status)}>
                                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                                    <div style={{ minWidth: '250px', padding: '8px' }}>
                                        <h6 className="fw-bold mb-2 pb-2 border-bottom text-primary d-flex align-items-center" style={{ fontSize: '0.85rem' }}>
                                            <CIcon icon={cilLocationPin} className="me-1" />
                                            {s.problem}
                                        </h6>
                                        
                                        <div className="d-flex flex-column gap-1" style={{ fontSize: '0.78rem' }}>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted"><CIcon icon={cilCalendar} size="sm" className="me-1" />Date</span>
                                                <span className="fw-semibold">{s.date}</span>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted"><CIcon icon={cilResizeBoth} size="sm" className="me-1" />Surface</span>
                                                <span className="fw-semibold">{s.surface} m²</span>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted"><CIcon icon={cilMoney} size="sm" className="me-1" />Budget</span>
                                                <span className="fw-semibold text-success">{s.budget}</span>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted"><CIcon icon={cilBuilding} size="sm" className="me-1" />Entreprise</span>
                                                <span className="fw-semibold">{s.entreprise}</span>
                                            </div>
                                            <div className="mt-1">
                                                <CBadge color={getStatusColor(s.status)} className="w-100 py-1 text-uppercase" style={{ fontSize: '0.7rem' }}>
                                                    {s.status}
                                                </CBadge>
                                            </div>
                                        </div>
                                    </div>
                                </Tooltip>
                            </Marker>
                        ))}
                    </MapContainer>
                    </>
                )}
            </CCardBody>
        </CCard>
    )
}
