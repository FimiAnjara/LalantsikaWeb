import React from 'react'
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

const signalements = [
    {
        id: 1,
        problem: "Nid-de-poule majeur",
        location: "Analakely",
        date: "2024-01-15",
        status: "nouveau",
        surface: 12,
        budget: 500000,
        entreprise: "Axe Construction"
    },
    {
        id: 2,
        problem: "Route affaissée",
        location: "Anosy",
        date: "2024-01-10",
        status: "en cours",
        surface: 45,
        budget: 2500000,
        entreprise: "Colas M'car"
    },
    {
        id: 3,
        problem: "Fissures transversales",
        location: "Ivandry",
        date: "2023-12-20",
        status: "terminé",
        surface: 8,
        budget: 2000000,
        entreprise: "HERY TP"
    },
    {
        id: 4,
        problem: "Effondrement partiel",
        location: "Andohalo",
        date: "2024-01-20",
        status: "nouveau",
        surface: 25,
        budget: 1200000,
        entreprise: "En attente"
    },
    {
        id: 5,
        problem: "Revêtement dégradé",
        location: "Ankorondrano",
        date: "2024-01-05",
        status: "en cours",
        surface: 60,
        budget: 3000000,
        entreprise: "Sogea Satom"
    }
];

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
    switch (status) {
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
    const totalPoints = signalements.length;
    const totalSurface = signalements.reduce((acc, s) => acc + s.surface, 0);
    const totalBudget = signalements.reduce((acc, s) => acc + s.budget, 0);
    const averageProgress = Math.round(signalements.reduce((acc, s) => acc + getProgressValue(s.status), 0) / totalPoints);

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
