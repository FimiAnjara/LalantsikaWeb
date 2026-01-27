import { CCard, CCardHeader, CCardBody, CAlert } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilMap } from '@coreui/icons'
import './Carte.css'

export default function SignalementCarte() {
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

            <CCard>
                <CCardHeader className="carte-header">
                    <h5 className="mb-0">Affichage cartographique</h5>
                </CCardHeader>
                <CCardBody>
                    <CAlert color="info" className="mb-4">
                        <strong>Intégration en cours</strong>
                        <p className="mb-0">
                            La carte interactive sera intégrée avec OpenStreetMap ou Google Maps.
                            Les signalements seront affichés comme des marqueurs avec les informations suivantes:
                        </p>
                        <ul className="mt-2 mb-0">
                            <li>Localisation (coordonnées point)</li>
                            <li>Description du signalement</li>
                            <li>Statut (En attente, En cours, Résolu)</li>
                            <li>Photo et détails</li>
                        </ul>
                    </CAlert>

                    <div className="map-placeholder">
                        <div className="placeholder-content">
                            <CIcon icon={cilMap} size="xl" className="mb-3" />
                            <h4>Carte interactive</h4>
                            <p className="text-muted">La carte s'affichera ici</p>
                        </div>
                    </div>

                    <div className="map-features mt-5">
                        <h5>Fonctionnalités prévues:</h5>
                        <div className="features-grid">
                            <div className="feature-card">
                                <div className="feature-icon en-attente">📍</div>
                                <h6>En attente</h6>
                                <p>Signalements non traités</p>
                            </div>
                            <div className="feature-card">
                                <div className="feature-icon en-cours">🔄</div>
                                <h6>En cours</h6>
                                <p>Signalements en traitement</p>
                            </div>
                            <div className="feature-card">
                                <div className="feature-icon resolu">✓</div>
                                <h6>Résolu</h6>
                                <p>Signalements traités</p>
                            </div>
                        </div>
                    </div>
                </CCardBody>
            </CCard>
        </div>
    )
}
