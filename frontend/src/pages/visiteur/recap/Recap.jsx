import React, { useState, useEffect } from 'react'
import { CSpinner, CAlert } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
    cilLocationPin,
    cilResizeBoth,
    cilMoney,
    cilChartPie,
    cilCheckCircle,
    cilReload,
    cilBell,
    cilCloudDownload,
    cilFilter
} from '@coreui/icons'
import { subscribeToSignalements } from '../../../services/firebase/signalementService'

const getStatusBadgeClass = (status) => {
    switch (status) {
        case 'nouveau': return 'nouveau';
        case 'en cours': return 'en-cours';
        case 'terminé': return 'termine';
        default: return '';
    }
};

const getStatusIcon = (status) => {
    switch (status) {
        case 'nouveau': return cilBell;
        case 'en cours': return cilReload;
        case 'terminé': return cilCheckCircle;
        default: return cilBell;
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

const getProgressValue = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
        case 'nouveau': return 0;
        case 'en cours': return 50;
        case 'terminé': return 100;
        default: return 0;
    }
};

const getProgressClass = (status) => {
    switch (status) {
        case 'nouveau': return 'danger';
        case 'en cours': return 'warning';
        case 'terminé': return 'success';
        default: return 'danger';
    }
};

export default function Recap() {
    const [signalements, setSignalements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSignalements = () => {
        const unsubscribe = subscribeToSignalements(
            (data) => {
                const transformed = data.map(s => ({
                    id: s.id,
                    problem: s.problem,
                    location: s.location,
                    date: s.date,
                    status: s.status,
                    surface: s.surface || 0,
                    budget: s.budget || 0,
                    entreprise: s.entreprise
                }))
                setSignalements(transformed)
                setLoading(false)
                setError(null)
            },
            (err) => {
                setError(`Erreur Firestore: ${err.message}`)
                setLoading(false)
            }
        )
        return unsubscribe
    }

    useEffect(() => {
        const unsubscribe = fetchSignalements()
        return () => { if (unsubscribe) unsubscribe() }
    }, []);

    const totalPoints = signalements.length;
    const totalSurface = signalements.reduce((acc, s) => acc + s.surface, 0);
    const totalBudget = signalements.reduce((acc, s) => acc + s.budget, 0);
    const averageProgress = totalPoints > 0
        ? Math.round(signalements.reduce((acc, s) => acc + getProgressValue(s.status), 0) / totalPoints)
        : 0;

    if (loading) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center py-5">
                <CSpinner className="mb-3" />
                <h5 className="text-secondary">Chargement du récapitulatif...</h5>
            </div>
        );
    }

    if (error) {
        return (
            <CAlert color="danger" className="text-center">
                <h4>Erreur de chargement</h4>
                <p>{error}</p>
                <button className="btn btn-outline-danger" onClick={() => window.location.reload()}>Réessayer</button>
            </CAlert>
        );
    }

    return (
        <div className="recap-page-modern" style={{ padding: '40px 2rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div className="recap-header">
                <h1>Tableau de bord</h1>
                <p>Vue d'ensemble des signalements et interventions à Antananarivo</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-cards-grid">
                <div className="stat-card primary">
                    <div className="stat-card-icon">
                        <CIcon icon={cilLocationPin} size="xl" />
                    </div>
                    <div className="stat-card-value">{totalPoints}</div>
                    <div className="stat-card-label">Signalements</div>
                </div>

                <div className="stat-card secondary">
                    <div className="stat-card-icon">
                        <CIcon icon={cilResizeBoth} size="xl" />
                    </div>
                    <div className="stat-card-value">{totalSurface} m²</div>
                    <div className="stat-card-label">Surface Totale</div>
                </div>

                <div className="stat-card warning">
                    <div className="stat-card-icon">
                        <CIcon icon={cilChartPie} size="xl" />
                    </div>
                    <div className="stat-card-value">{averageProgress}%</div>
                    <div className="stat-card-label">Avancement</div>
                </div>

                <div className="stat-card success">
                    <div className="stat-card-icon">
                        <CIcon icon={cilMoney} size="xl" />
                    </div>
                    <div className="stat-card-value">{(totalBudget / 1000000).toFixed(1)}M Ar</div>
                    <div className="stat-card-label">Budget Total</div>
                </div>
            </div>

            {/* Table */}
            <div className="recap-table-card">
                <div className="recap-table-header">
                    <h3>
                        <CIcon icon={cilChartPie} />
                        Détails des interventions
                    </h3>
                    <div className="recap-table-actions">
                        <button className="action-btn">
                            <CIcon icon={cilFilter} />
                            Filtrer
                        </button>
                        <button className="action-btn">
                            <CIcon icon={cilCloudDownload} />
                            Exporter
                        </button>
                    </div>
                </div>
                <table className="recap-table">
                    <thead>
                        <tr>
                            <th>Problème</th>
                            <th>Lieu</th>
                            <th>Entreprise</th>
                            <th>Surface</th>
                            <th>Budget</th>
                            <th>Statut</th>
                            <th>Progression</th>
                        </tr>
                    </thead>
                    <tbody>
                        {signalements.map((s) => (
                            <tr key={s.id}>
                                <td>
                                    <div className="problem-cell">
                                        <span className="problem-title">{s.problem}</span>
                                        <span className="problem-date">{s.date}</span>
                                    </div>
                                </td>
                                <td>{s.location}</td>
                                <td>{s.entreprise}</td>
                                <td>{s.surface} m²</td>
                                <td>{s.budget.toLocaleString()} Ar</td>
                                <td>
                                    <span className={`status-badge ${getStatusBadgeClass(s.status)}`}>
                                        <CIcon icon={getStatusIcon(s.status)} size="sm" />
                                        {getStatusLabel(s.status)}
                                    </span>
                                </td>
                                <td>
                                    <div className="progress-cell">
                                        <div className="progress-bar-custom">
                                            <div
                                                className={`progress-fill ${getProgressClass(s.status)}`}
                                                style={{ width: `${getProgressValue(s.status)}%` }}
                                            ></div>
                                        </div>
                                        <span className="progress-text">{getProgressValue(s.status)}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
