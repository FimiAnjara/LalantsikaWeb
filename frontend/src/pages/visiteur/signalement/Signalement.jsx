import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { CAlert, CSpinner } from '@coreui/react'
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
    cilLayers,
    cilX,
    cilImage,
    cilChevronLeft,
    cilChevronRight
} from '@coreui/icons'

// Correction des icônes par défaut de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom markers avec couleurs
const getMarkerIconPath = (status) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
        case 'nouveau':
            return `<g transform="translate(9.5, 9.5) scale(0.38)">
                <circle cx="12" cy="12" r="10" fill="none" stroke="#EA4335" stroke-width="2.5"/>
                <line x1="12" y1="8" x2="12" y2="13" stroke="#EA4335" stroke-width="2.5" stroke-linecap="round"/>
                <circle cx="12" cy="16" r="1.2" fill="#EA4335"/>
            </g>`;
        case 'en cours':
            return `<g transform="translate(9, 9) scale(0.42)">
                <path d="M21 12a9 9 0 1 1-6.22-8.56" fill="none" stroke="#4285F4" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M21 3v5h-5" fill="none" stroke="#4285F4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </g>`;
        case 'terminé':
            return `<g transform="translate(9, 9) scale(0.42)">
                <polyline points="20 6 9 17 4 12" fill="none" stroke="#34A853" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </g>`;
        default:
            return `<g transform="translate(9, 9) scale(0.42)">
                <line x1="18" y1="6" x2="6" y2="18" stroke="#78909C" stroke-width="3" stroke-linecap="round"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="#78909C" stroke-width="3" stroke-linecap="round"/>
            </g>`;
    }
};

const createColoredIcon = (status, isSelected = false) => {
    const color = getStatusColor(status);
    const iconPath = getMarkerIconPath(status);
    const size = isSelected ? 40 : 28;
    const height = isSelected ? 54 : 38;

    return L.divIcon({
        className: `custom-marker ${isSelected ? 'selected' : ''}`,
        html: `<div class="gm-pin-marker">
            <svg width="${size}" height="${height}" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 0C6.27 0 0 6.27 0 14c0 9.8 14 24 14 24s14-14.2 14-24C28 6.27 21.73 0 14 0z" fill="${color}"/>
                <circle cx="14" cy="14" r="8" fill="white"/>
                ${iconPath}
            </svg>
        </div>`,
        iconSize: [size, height],
        iconAnchor: [size / 2, height],
        popupAnchor: [0, -height]
    });
};

const getStatusColor = (status) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
        case 'nouveau': return '#EA4335';
        case 'en cours': return '#4285F4';
        case 'terminé': return '#34A853';
        default: return '#78909C';
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
function MapController({ center, zoom, offset = false }) {
    const map = useMap()
    useEffect(() => {
        if (center) {
            if (offset && window.innerWidth > 768) {
                // Décaler le centre vers la gauche si le panneau est ouvert sur desktop
                const targetPoint = map.project(center, zoom || 15);
                targetPoint.x = targetPoint.x + (200); // Décale de la moitié de la largeur du panel
                const targetLatLng = map.unproject(targetPoint, zoom || 15);
                map.flyTo(targetLatLng, zoom || 15, { duration: 1.5 })
            } else {
                map.flyTo(center, zoom || 15, { duration: 1.5 })
            }
        }
    }, [center, zoom, map, offset])
    return null
}

// Composant pour gérer les clics sur la carte
function MapEvents({ onMapClick }) {
    useMapEvents({
        click: () => {
            onMapClick();
        },
    });
    return null;
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
    const [selectedSignalement, setSelectedSignalement] = useState(null);
    const [signalementHistory, setSignalementHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [historyImageIndexes, setHistoryImageIndexes] = useState({});

    // Collect all available photos for the selected signalement
    const allPhotos = useMemo(() => {
        if (!selectedSignalement) return [];
        const photos = [];
        // Add main photo
        if (selectedSignalement.photo) photos.push(selectedSignalement.photo);

        // Add photos from history items
        signalementHistory.forEach(h => {
            // Support both 'photo' (singular) and 'images' (array)
            if (h.photo && !photos.includes(h.photo)) {
                photos.push(h.photo);
            }
            if (h.images && Array.isArray(h.images)) {
                h.images.forEach(img => {
                    if (!photos.includes(img)) photos.push(img);
                });
            }
        });
        return photos;
    }, [selectedSignalement, signalementHistory]);

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

    // Fetch history when a signalement is selected
    useEffect(() => {
        if (selectedSignalement) {
            setCurrentPhotoIndex(0)
            setHistoryImageIndexes({})
            setLoadingHistory(true)
            fetch(ENDPOINTS.REPORT_HISTO_PUBLIC(selectedSignalement.id))
                .then(res => res.json())
                .then(result => {
                    if (result.success && result.data) {
                        const history = result.data.map(h => ({
                            id: h.id_histo_statut,
                            date: new Date(h.daty).toLocaleDateString('fr-FR'),
                            description: h.description,
                            photo: h.images && h.images.length > 0 ? h.images[0].image : null,
                            images: h.images ? h.images.map(img => img.image) : [],
                            statut: h.statut
                        }))
                        setSignalementHistory(history)
                    }
                    setLoadingHistory(false)
                })
                .catch(err => {
                    console.error('History error:', err)
                    setLoadingHistory(false)
                })
        } else {
            setSignalementHistory([])
            setHistoryImageIndexes({})
        }
    }, [selectedSignalement])

    // Charger les signalements depuis l'API publique
    useEffect(() => {
        const fetchSignalements = async () => {
            try {
                const response = await fetch(ENDPOINTS.REPORTS_PUBLIC)
                const result = await response.json()
                if (result.success && result.data) {
                    const transformed = result.data.map(s => ({
                        id: s.id_signalement,
                        problem: s.description,
                        position: [parseFloat(s.lat), parseFloat(s.lon)],
                        location: `${parseFloat(s.lat).toFixed(4)}, ${parseFloat(s.lon).toFixed(4)}`,
                        surface: s.surface ? `${parseFloat(s.surface).toLocaleString('fr-FR')} m²` : 'N/A',
                        budget: s.budget ? `${parseFloat(s.budget).toLocaleString('fr-FR')} Ar` : 'Non défini',
                        niveau: s.niveau || null,
                        date: new Date(s.daty_signalement).toLocaleDateString('fr-FR'),
                        status: s.dernier_statut?.statut?.libelle || 'Inconnu',
                        entreprise: s.entreprise?.nom || 'Non assigné',
                        photo: null
                    }))
                    setSignalements(transformed)
                }
                setLoading(false)
                setError(null)
            } catch (err) {
                setError(`Erreur lors du chargement: ${err.message}`)
                setLoading(false)
            }
        }
        fetchSignalements()
    }, [])

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
                            onClick={() => window.location.reload()}
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
                    <div className="map-controls-bar" style={{ right: selectedSignalement ? '415px' : '15px', transition: 'right 0.3s ease-in-out' }}>
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
                                🔵 En cours
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
                    <div style={{ position: 'relative', height: '100%', width: '100%', overflow: 'hidden' }}>
                        <MapContainer
                            center={[-18.8792, 47.5079]}
                            zoom={13}
                            className={`map-fullscreen ${selectedSignalement ? 'with-panel' : ''}`}
                            zoomControl={false}
                        >
                            <MapController
                                center={selectedSignalement ? selectedSignalement.position : searchLocation}
                                zoom={selectedSignalement ? 18 : 15}
                                offset={!!selectedSignalement}
                            />
                            <MapEvents onMapClick={() => setSelectedSignalement(null)} />
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />


                            {filteredSignalements.length === 0 && signalements.length > 0 ? (
                                <div className="position-absolute top-50 start-50 translate-middle bg-white p-4 rounded shadow border" style={{ zIndex: 1000 }}>
                                    <div className="text-center">
                                        <CIcon icon={cilLocationPin} size="xxl" className="text-muted mb-2" />
                                        <h5 className="text-muted">Aucun résultat pour cette recherche</h5>
                                        <p className="text-muted mb-0">Essayez de modifier vos filtres</p>
                                    </div>
                                </div>
                            ) : signalements.length === 0 ? (
                                <div className="position-absolute top-50 start-50 translate-middle bg-white p-4 rounded shadow border" style={{ zIndex: 1000 }}>
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
                                    icon={createColoredIcon(s.status, selectedSignalement?.id === s.id)}
                                    eventHandlers={{
                                        click: () => {
                                            setSelectedSignalement(s)
                                        },
                                    }}
                                >
                                    <Tooltip direction="top" offset={[0, -45]} opacity={1} permanent={false} className="map-tooltip-wrapper">
                                        <div className="map-tooltip">
                                            <div className="tooltip-header">
                                                <span className="tooltip-status-dot" style={{ backgroundColor: getStatusColor(s.status) }}></span>
                                                <span className="tooltip-status-text">{getStatusLabel(s.status)}</span>
                                            </div>
                                            <div className="tooltip-body">
                                                <div className="tooltip-title">{s.problem}</div>
                                                <div className="tooltip-meta">
                                                    <span>{s.surface}</span>
                                                    {s.niveau && (
                                                        <>
                                                            <span className="separator">•</span>
                                                            <span>Niveau {s.niveau}</span>
                                                        </>
                                                    )}
                                                    <span className="separator">•</span>
                                                    <span>{s.location}</span>
                                                </div>
                                            </div>
                                            <div className="tooltip-footer">
                                                Cliquer pour plus de détails
                                            </div>
                                        </div>
                                    </Tooltip>
                                </Marker>
                            ))}
                        </MapContainer>

                        {/* Side Panel */}
                        <div className={`signalement-side-panel ${selectedSignalement ? 'open' : ''}`}>
                            {selectedSignalement && (
                                <>
                                    <div className="panel-header">
                                        <button
                                            className="close-panel-btn"
                                            onClick={() => setSelectedSignalement(null)}
                                        >
                                            <CIcon icon={cilX} />
                                        </button>

                                        {allPhotos.length > 0 ? (
                                            <>
                                                <img
                                                    src={allPhotos[currentPhotoIndex]}
                                                    alt={selectedSignalement.problem}
                                                    className="panel-header-img"
                                                    onClick={() => window.open(allPhotos[currentPhotoIndex], '_blank')}
                                                    style={{ cursor: 'zoom-in' }}
                                                />
                                                {allPhotos.length > 1 && (
                                                    <div className="photo-navigation">
                                                        <button
                                                            className="photo-nav-btn prev"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setCurrentPhotoIndex(prev => (prev === 0 ? allPhotos.length - 1 : prev - 1));
                                                            }}
                                                        >
                                                            <CIcon icon={cilChevronLeft} />
                                                        </button>
                                                        <div className="photo-counter">
                                                            {currentPhotoIndex + 1} / {allPhotos.length}
                                                        </div>
                                                        <button
                                                            className="photo-nav-btn next"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setCurrentPhotoIndex(prev => (prev === allPhotos.length - 1 ? 0 : prev + 1));
                                                            }}
                                                        >
                                                            <CIcon icon={cilChevronRight} />
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="panel-header-placeholder">
                                                <CIcon icon={cilImage} size="3xl" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="panel-content">
                                        <div className="mb-4">
                                            <div
                                                className="panel-status-badge"
                                                style={{
                                                    backgroundColor: getStatusColor(selectedSignalement.status),
                                                    color: 'white'
                                                }}
                                            >
                                                {getStatusLabel(selectedSignalement.status)}
                                            </div>
                                            <h2 style={{ color: '#1A3263', fontWeight: 800, fontSize: '1.75rem', marginBottom: '8px' }}>
                                                {selectedSignalement.problem}
                                            </h2>
                                            <p style={{ color: '#777', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                                                <CIcon icon={cilLocationPin} style={{ color: '#EA4335' }} />
                                                {selectedSignalement.location}
                                            </p>
                                        </div>

                                        <div className="panel-section">
                                            <h3 className="panel-section-title">
                                                <span>Détails techniques</span>
                                            </h3>
                                            <div className="panel-info-grid">
                                                <div className="panel-info-card">
                                                    <div className="panel-info-icon" style={{ background: '#F8F9FA', color: '#547792' }}>
                                                        <CIcon icon={cilCalendar} />
                                                    </div>
                                                    <div>
                                                        <small style={{ color: '#999', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Soumission</small>
                                                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#333' }}>{selectedSignalement.date}</div>
                                                    </div>
                                                </div>
                                                <div className="panel-info-card">
                                                    <div className="panel-info-icon" style={{ background: '#F8F9FA', color: '#547792' }}>
                                                        <CIcon icon={cilResizeBoth} />
                                                    </div>
                                                    <div>
                                                        <small style={{ color: '#999', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Surface</small>
                                                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#333' }}>{selectedSignalement.surface} </div>
                                                    </div>
                                                </div>
                                                {selectedSignalement.niveau && (
                                                    <div className="panel-info-card">
                                                        <div className="panel-info-icon" style={{ background: '#FFF3E0', color: '#E65100' }}>
                                                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedSignalement.niveau}</span>
                                                        </div>
                                                        <div>
                                                            <small style={{ color: '#999', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Niveau</small>
                                                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#E65100' }}>/ 10</div>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="panel-info-card">
                                                    <div className="panel-info-icon" style={{ background: '#E6F4EA', color: '#34A853' }}>
                                                        <CIcon icon={cilMoney} />
                                                    </div>
                                                    <div>
                                                        <small style={{ color: '#999', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Budget</small>
                                                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#34A853' }}>{selectedSignalement.budget}</div>
                                                    </div>
                                                </div>
                                                <div className="panel-info-card">
                                                    <div className="panel-info-icon" style={{ background: '#E8F0FE', color: '#4285F4' }}>
                                                        <CIcon icon={cilBuilding} />
                                                    </div>
                                                    <div>
                                                        <small style={{ color: '#999', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Prestataire</small>
                                                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#333' }}>{selectedSignalement.entreprise}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="panel-section">
                                            <h3 className="panel-section-title">
                                                <span>Chronologie des travaux</span>
                                            </h3>
                                            <div className="status-timeline" style={{ position: 'relative', paddingLeft: '35px' }}>
                                                {loadingHistory ? (
                                                    <div className="text-center py-4">
                                                        <CSpinner size="sm" style={{ color: 'var(--primary-dark)' }} />
                                                        <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '10px' }}>Chargement de l'historique...</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {selectedSignalement.status.toLowerCase() !== 'terminé' && (
                                                            <div className="timeline-item">
                                                                <div className="timeline-title" style={{ color: '#ccc' }}>Prochaines étapes</div>
                                                                <div className="timeline-desc">En attente des prochaines interventions sur le terrain.</div>
                                                            </div>
                                                        )}

                                                        {/* Display history items (descending) */}
                                                        {signalementHistory.map((h, idx) => (
                                                            <div key={h.id} className="timeline-item active">
                                                                <div className="timeline-date">{h.date}</div>
                                                                <div className="timeline-title">{h.statut?.libelle || 'Mise à jour du chantier'}</div>
                                                                <div className="timeline-desc">{h.description || 'Action effectuée pour la résolution du problème.'}</div>
                                                                {h.images && h.images.length > 0 && (
                                                                    <div className="timeline-img-container" style={{ position: 'relative' }}>
                                                                        <img
                                                                            src={h.images[historyImageIndexes[h.id] || 0]}
                                                                            alt="Preuve des travaux"
                                                                            className="timeline-img"
                                                                            onClick={() => window.open(h.images[historyImageIndexes[h.id] || 0], '_blank')}
                                                                        />
                                                                        {h.images.length > 1 && (
                                                                            <div className="timeline-img-nav" style={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                gap: '8px',
                                                                                marginTop: '6px'
                                                                            }}>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        const currentIdx = historyImageIndexes[h.id] || 0;
                                                                                        const newIdx = currentIdx === 0 ? h.images.length - 1 : currentIdx - 1;
                                                                                        setHistoryImageIndexes(prev => ({ ...prev, [h.id]: newIdx }));
                                                                                    }}
                                                                                    style={{
                                                                                        background: 'rgba(0,0,0,0.5)',
                                                                                        border: 'none',
                                                                                        borderRadius: '50%',
                                                                                        width: '24px',
                                                                                        height: '24px',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'center',
                                                                                        cursor: 'pointer',
                                                                                        color: 'white'
                                                                                    }}
                                                                                >
                                                                                    <CIcon icon={cilChevronLeft} size="sm" />
                                                                                </button>
                                                                                <span style={{ fontSize: '0.75rem', color: '#666' }}>
                                                                                    {(historyImageIndexes[h.id] || 0) + 1} / {h.images.length}
                                                                                </span>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        const currentIdx = historyImageIndexes[h.id] || 0;
                                                                                        const newIdx = currentIdx === h.images.length - 1 ? 0 : currentIdx + 1;
                                                                                        setHistoryImageIndexes(prev => ({ ...prev, [h.id]: newIdx }));
                                                                                    }}
                                                                                    style={{
                                                                                        background: 'rgba(0,0,0,0.5)',
                                                                                        border: 'none',
                                                                                        borderRadius: '50%',
                                                                                        width: '24px',
                                                                                        height: '24px',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'center',
                                                                                        cursor: 'pointer',
                                                                                        color: 'white'
                                                                                    }}
                                                                                >
                                                                                    <CIcon icon={cilChevronRight} size="sm" />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}

                                                        {/* Ensure creation item is visible at the bottom if not in history */}
                                                        {!signalementHistory.some(h => h.statut?.id_statut === 1 || h.description === 'Signalement créé') && (
                                                            <div className="timeline-item active">
                                                                <div className="timeline-date">{selectedSignalement.date}</div>
                                                                <div className="timeline-title">Signalement enregistré</div>
                                                                <div className="timeline-desc">Le problème a été identifié et validé par les services techniques.</div>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Info Panel */}
                    <div className={`map-info-panel ${selectedSignalement ? 'hidden-mobile' : ''}`}>
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
                                En cours
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot success"></span>
                                Problème résolu
                            </div>
                        </div>
                    </div>
                </>
            )
            }
        </div >
    )
}
