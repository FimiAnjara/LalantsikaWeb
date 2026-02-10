import { Link } from 'react-router-dom'
import CIcon from '@coreui/icons-react'
import {
    cilLocationPin,
    cilMap,
    cilSpeedometer,
    cilShieldAlt,
    cilChartLine
} from '@coreui/icons'
import { cibGooglePlay, cibApple } from '@coreui/icons'

export default function Home() {
    return (
        <div className="home-page-modern">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-background"></div>
                <div className="hero-content">
                    <div className="hero-text">
                        <h1>
                            Ensemble pour des <span>routes plus sûres</span> à Madagascar
                        </h1>
                        <p>
                            Lalantsika est une plateforme citoyenne qui permet de signaler les problèmes
                            routiers, suivre les interventions et contribuer à l'amélioration de notre
                            réseau routier national.
                        </p>
                        <div className="hero-buttons">
                            <Link to="/visiteur/signalement" className="btn-primary-custom">
                                <CIcon icon={cilLocationPin} />
                                Voir la carte
                            </Link>
                            <Link to="/visiteur/recap" className="btn-secondary-custom">
                                <CIcon icon={cilChartLine} />
                                Statistiques
                            </Link>
                        </div>
                    </div>
                    <div className="hero-image">
                        <img
                            src="/assets/img/slide1.png"
                            alt="Routes Madagascar"
                        />
                        <div className="hero-floating-card card-1">
                            <div className="floating-icon orange">
                                <CIcon icon={cilLocationPin} size="xl" />
                            </div>
                            <div className="floating-text">
                                <h4>Signalement rapide</h4>
                                <p>En quelques clics</p>
                            </div>
                        </div>
                        <div className="hero-floating-card card-2">
                            <div className="floating-icon blue">
                                <CIcon icon={cilShieldAlt} size="xl" />
                            </div>
                            <div className="floating-text">
                                <h4>Suivi en temps réel</h4>
                                <p>Interventions visibles</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="section-container">
                    <div className="section-header">
                        <h2>Comment ça fonctionne ?</h2>
                        <p>
                            Une solution simple et efficace pour améliorer nos infrastructures routières
                            grâce à la participation citoyenne.
                        </p>
                    </div>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon orange">
                                <CIcon icon={cilLocationPin} size="3xl" />
                            </div>
                            <h3>Signalez un problème</h3>
                            <p>
                                Repérez un nid-de-poule, une route endommagée ou un obstacle ?
                                Signalez-le facilement avec photo et localisation GPS précise.
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon blue">
                                <CIcon icon={cilMap} size="3xl" />
                            </div>
                            <h3>Visualisez sur la carte</h3>
                            <p>
                                Consultez la carte interactive pour voir tous les signalements
                                dans votre région et dans tout Madagascar.
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon dark">
                                <CIcon icon={cilSpeedometer} size="3xl" />
                            </div>
                            <h3>Suivez les interventions</h3>
                            <p>
                                Restez informé de l'avancement des travaux et des interventions
                                programmées par les autorités compétentes.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="section-container">
                    <div className="cta-content">
                        <h2>Téléchargez l'application mobile</h2>
                        <p>
                            Emportez Lalantsika partout avec vous et signalez les problèmes
                            routiers directement depuis votre smartphone.
                        </p>
                        <div className="app-buttons">
                            <a href="https://www.mediafire.com/file/hrrgvslw6bpkv8q/Lalantsika.apk/file" className="app-btn">
                                <CIcon icon={cibGooglePlay} size="xl" />
                                <div>
                                    <small>Disponible sur</small>
                                    <strong> MediaFire</strong>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
