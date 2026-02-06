import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet'
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

// Correction des icônes par défaut de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});



const getStatusColor = (status) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
        case 'nouveau': return 'danger';
        case 'en cours': return 'warning';
        case 'terminé': return 'success';
        default: return 'secondary';
    }
};

export default function Signalement() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [signalements, setSignalements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                    <MapContainer 
                        center={[-18.8792, 47.5079]} 
                        zoom={13} 
                        style={{ height: '700px', width: '100%' }}
                    >
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
