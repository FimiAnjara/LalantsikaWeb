import { useNavigate } from 'react-router-dom'
import {
    CCard,
    CCardBody,
    CCardHeader,
    CCol,
    CRow,
    CTable,
    CTableHead,
    CTableBody,
    CTableRow,
    CTableDataCell,
    CTableHeaderCell,
    CBadge,
    CProgress,
    CButton,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
    cilPeople,
    cilTask,
    cilWarning,
    cilCheckCircle,
    cilClock,
    cilChartLine,
    cilArrowRight,
    cilMoney,
} from '@coreui/icons'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import './Home.css'

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
)

export default function ManagerHome() {
    const navigate = useNavigate()

    // Mock data
    const stats = {
        totalSignalements: 156,
        enAttente: 42,
        enCours: 38,
        resolus: 76,
        totalUtilisateurs: 1250,
        utilisateursActifs: 1180,
        budgetTotal: 15750000,
    }

    const dernierSignalements = [
        { id: 1, description: 'Route endommagée secteur nord', statut: 'En attente', date: '27/01/2026', utilisateur: 'Jean Dupont' },
        { id: 2, description: 'Pont dégradé - zone industrielle', statut: 'En cours', date: '26/01/2026', utilisateur: 'Marie Martin' },
        { id: 3, description: 'Trottoir cassé centre-ville', statut: 'Résolu', date: '25/01/2026', utilisateur: 'Pierre Bernard' },
        { id: 4, description: 'Nids de poule avenue principale', statut: 'En attente', date: '25/01/2026', utilisateur: 'Hery Rakoto' },
        { id: 5, description: 'Éclairage public défaillant', statut: 'En cours', date: '24/01/2026', utilisateur: 'Lova Andria' },
    ]

    // Chart data - Signalements par mois
    const barChartData = {
        labels: ['Août', 'Sept', 'Oct', 'Nov', 'Déc', 'Jan'],
        datasets: [
            {
                label: 'Signalements',
                data: [18, 25, 22, 30, 28, 33],
                backgroundColor: '#0f3460',
                borderRadius: 8,
            },
        ],
    }

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
            x: { grid: { display: false } },
        },
    }

    // Chart data - Répartition par statut
    const doughnutChartData = {
        labels: ['En attente', 'En cours', 'Résolu'],
        datasets: [
            {
                data: [stats.enAttente, stats.enCours, stats.resolus],
                backgroundColor: ['#ff9800', '#2196f3', '#4caf50'],
                borderWidth: 0,
            },
        ],
    }

    const doughnutChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' },
        },
        cutout: '65%',
    }

    // Chart data - Evolution des résolutions
    const lineChartData = {
        labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
        datasets: [
            {
                label: 'Résolus',
                data: [12, 19, 15, 22],
                borderColor: '#4caf50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                fill: true,
                tension: 0.4,
            },
            {
                label: 'Nouveaux',
                data: [15, 22, 18, 25],
                borderColor: '#ff9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                fill: true,
                tension: 0.4,
            },
        ],
    }

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
            x: { grid: { display: false } },
        },
    }

    const getStatutBadge = (statut) => {
        const colors = {
            'En attente': 'warning',
            'En cours': 'info',
            'Résolu': 'success',
        }
        return colors[statut] || 'secondary'
    }

    return (
        <div className="dashboard-page">
            <div className="page-header d-flex align-items-center gap-3 mb-4">
                <div className="header-icon">
                    <CIcon icon={cilChartLine} size="lg" />
                </div>
                <div>
                    <h2 className="mb-0 fw-bold">Tableau de bord</h2>
                    <small className="text-muted">Vue d'ensemble de l'activité</small>
                </div>
            </div>

            {/* Stats Cards */}
            <CRow className="g-4 mb-4">
                <CCol sm="6" lg="3">
                    <CCard className="stat-card border-0 shadow-sm h-100">
                        <CCardBody className="d-flex align-items-center">
                            <div className="stat-icon bg-primary-light">
                                <CIcon icon={cilTask} size="xl" className="text-primary" />
                            </div>
                            <div className="ms-3">
                                <div className="stat-value">{stats.totalSignalements}</div>
                                <div className="stat-label">Total Signalements</div>
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
                <CCol sm="6" lg="3">
                    <CCard className="stat-card border-0 shadow-sm h-100">
                        <CCardBody className="d-flex align-items-center">
                            <div className="stat-icon bg-warning-light">
                                <CIcon icon={cilClock} size="xl" className="text-warning" />
                            </div>
                            <div className="ms-3">
                                <div className="stat-value">{stats.enAttente}</div>
                                <div className="stat-label">En attente</div>
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
                <CCol sm="6" lg="3">
                    <CCard className="stat-card border-0 shadow-sm h-100">
                        <CCardBody className="d-flex align-items-center">
                            <div className="stat-icon bg-success-light">
                                <CIcon icon={cilCheckCircle} size="xl" className="text-success" />
                            </div>
                            <div className="ms-3">
                                <div className="stat-value">{stats.resolus}</div>
                                <div className="stat-label">Résolus</div>
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
                <CCol sm="6" lg="3">
                    <CCard className="stat-card border-0 shadow-sm h-100">
                        <CCardBody className="d-flex align-items-center">
                            <div className="stat-icon bg-info-light">
                                <CIcon icon={cilPeople} size="xl" className="text-info" />
                            </div>
                            <div className="ms-3">
                                <div className="stat-value">{stats.totalUtilisateurs}</div>
                                <div className="stat-label">Utilisateurs</div>
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>

            {/* Charts Row */}
            <CRow className="g-4 mb-4">
                <CCol lg="8">
                    <CCard className="border-0 shadow-sm h-100">
                        <CCardHeader className="bg-white border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Signalements par mois</h5>
                            <small className="text-muted">Évolution sur les 6 derniers mois</small>
                        </CCardHeader>
                        <CCardBody>
                            <div style={{ height: '300px' }}>
                                <Bar data={barChartData} options={barChartOptions} />
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
                <CCol lg="4">
                    <CCard className="border-0 shadow-sm h-100">
                        <CCardHeader className="bg-white border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Répartition par statut</h5>
                            <small className="text-muted">État actuel des signalements</small>
                        </CCardHeader>
                        <CCardBody className="d-flex align-items-center justify-content-center">
                            <div style={{ height: '280px', width: '100%' }}>
                                <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>

            {/* Second Row */}
            <CRow className="g-4 mb-4">
                <CCol lg="5">
                    <CCard className="border-0 shadow-sm h-100">
                        <CCardHeader className="bg-white border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Tendance hebdomadaire</h5>
                            <small className="text-muted">Nouveaux vs Résolus (Janvier)</small>
                        </CCardHeader>
                        <CCardBody>
                            <div style={{ height: '250px' }}>
                                <Line data={lineChartData} options={lineChartOptions} />
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
                <CCol lg="7">
                    <CCard className="border-0 shadow-sm h-100">
                        <CCardHeader className="bg-white border-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="fw-bold mb-0">Derniers signalements</h5>
                                <small className="text-muted">Les 5 plus récents</small>
                            </div>
                            <CButton 
                                color="primary" 
                                variant="ghost" 
                                size="sm"
                                onClick={() => navigate('/manager/signalements/liste')}
                            >
                                Voir tout <CIcon icon={cilArrowRight} size="sm" />
                            </CButton>
                        </CCardHeader>
                        <CCardBody className="p-0">
                            <CTable hover responsive className="mb-0">
                                <CTableHead className="bg-light">
                                    <CTableRow>
                                        <CTableHeaderCell>ID</CTableHeaderCell>
                                        <CTableHeaderCell>Description</CTableHeaderCell>
                                        <CTableHeaderCell>Utilisateur</CTableHeaderCell>
                                        <CTableHeaderCell>Statut</CTableHeaderCell>
                                    </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                    {dernierSignalements.map((sig) => (
                                        <CTableRow key={sig.id} className="cursor-pointer" onClick={() => navigate(`/manager/signalements/fiche/${sig.id}`)}>
                                            <CTableDataCell><strong>#{sig.id}</strong></CTableDataCell>
                                            <CTableDataCell className="text-truncate" style={{ maxWidth: '200px' }}>{sig.description}</CTableDataCell>
                                            <CTableDataCell>{sig.utilisateur}</CTableDataCell>
                                            <CTableDataCell>
                                                <CBadge color={getStatutBadge(sig.statut)}>{sig.statut}</CBadge>
                                            </CTableDataCell>
                                        </CTableRow>
                                    ))}
                                </CTableBody>
                            </CTable>
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>

            {/* Progress Section */}
            <CRow className="g-4">
                <CCol lg="6">
                    <CCard className="border-0 shadow-sm">
                        <CCardHeader className="bg-white border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Taux de résolution</h5>
                            <small className="text-muted">Performance mensuelle</small>
                        </CCardHeader>
                        <CCardBody>
                            <div className="mb-4">
                                <div className="d-flex justify-content-between mb-1">
                                    <span>Janvier 2026</span>
                                    <strong>76%</strong>
                                </div>
                                <CProgress value={76} color="success" className="progress-bar-animated" />
                            </div>
                            <div className="mb-4">
                                <div className="d-flex justify-content-between mb-1">
                                    <span>Décembre 2025</span>
                                    <strong>68%</strong>
                                </div>
                                <CProgress value={68} color="info" />
                            </div>
                            <div className="mb-0">
                                <div className="d-flex justify-content-between mb-1">
                                    <span>Novembre 2025</span>
                                    <strong>72%</strong>
                                </div>
                                <CProgress value={72} color="warning" />
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
                <CCol lg="6">
                    <CCard className="border-0 shadow-sm bg-navy text-white">
                        <CCardBody className="p-4">
                            <div className="d-flex align-items-center mb-4">
                                <div className="budget-icon me-3">
                                    <CIcon icon={cilMoney} size="xl" />
                                </div>
                                <div>
                                    <h6 className="mb-0 opacity-75">Budget total estimé</h6>
                                    <h3 className="mb-0 fw-bold">Ar {stats.budgetTotal.toLocaleString()}</h3>
                                </div>
                            </div>
                            <hr className="opacity-25" />
                            <CRow className="text-center">
                                <CCol>
                                    <div className="opacity-75 small">Moyenne/signalement</div>
                                    <div className="fw-bold">Ar {Math.round(stats.budgetTotal / stats.totalSignalements).toLocaleString()}</div>
                                </CCol>
                                <CCol>
                                    <div className="opacity-75 small">Signalements/jour</div>
                                    <div className="fw-bold">~5.2</div>
                                </CCol>
                                <CCol>
                                    <div className="opacity-75 small">Délai moyen</div>
                                    <div className="fw-bold">3.5 jours</div>
                                </CCol>
                            </CRow>
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>
        </div>
    )
}

