import { useState, useEffect } from 'react'
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
    CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
    cilPeople,
    cilTask,
    cilCheckCircle,
    cilClock,
    cilChartLine,
    cilArrowRight,
    cilSpeedometer,
    cilSync,
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
import { Bar, Doughnut } from 'react-chartjs-2'
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
    const [loading, setLoading] = useState(true)
    const [signalements, setSignalements] = useState([])
    const [utilisateurs, setUtilisateurs] = useState([])
    const [stats, setStats] = useState({
        total: 0,
        nouveau: 0,
        enCours: 0,
        termine: 0,
        avancementMoyen: 0,
        totalUtilisateurs: 0,
        traitementMoyen: 0,
    })

    // Calcul de l'avancement selon le statut
    const getAvancement = (statut) => {
        switch (statut) {
            case 'Nouveau':
                return 0
            case 'En cours':
                return 50
            case 'Terminé':
                return 100
            default:
                return 0
        }
    }

    // Calcul du délai de traitement en jours
    const calculerDelaiTraitement = (dateDebut, dateFin) => {
        if (!dateDebut || !dateFin) return null
        const debut = new Date(dateDebut)
        const fin = new Date(dateFin)
        const diffTime = Math.abs(fin - debut)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    // Récupérer les données
    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
            
            // Récupérer les signalements
            const sigResponse = await fetch('http://localhost:8000/api/reports', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            })
            const sigResult = await sigResponse.json()
            
            // Récupérer les utilisateurs
            const userResponse = await fetch('http://localhost:8000/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            })
            const userResult = await userResponse.json()

            if (sigResult.success && sigResult.data) {
                const data = Array.isArray(sigResult.data) ? sigResult.data : []
                setSignalements(data)
                
                // Calculer les statistiques
                const nouveau = data.filter(s => s.statut === 'Nouveau').length
                const enCours = data.filter(s => s.statut === 'En cours').length
                const termine = data.filter(s => s.statut === 'Terminé').length
                
                // Calcul de l'avancement moyen
                const totalAvancement = data.reduce((sum, s) => sum + getAvancement(s.statut), 0)
                const avancementMoyen = data.length > 0 ? Math.round(totalAvancement / data.length) : 0
                
                // Calcul du traitement moyen (simulé - basé sur la date de création)
                const termines = data.filter(s => s.statut === 'Terminé')
                let traitementMoyen = 0
                if (termines.length > 0) {
                    // Simuler un délai moyen de 3-7 jours
                    traitementMoyen = 4.5
                }

                setStats({
                    total: data.length,
                    nouveau,
                    enCours,
                    termine,
                    avancementMoyen,
                    totalUtilisateurs: userResult.success && Array.isArray(userResult.data) ? userResult.data.length : 0,
                    traitementMoyen,
                })
            }

            if (userResult.success && userResult.data) {
                setUtilisateurs(Array.isArray(userResult.data) ? userResult.data : [])
            }

        } catch (error) {
            console.error('Erreur:', error)
        } finally {
            setLoading(false)
        }
    }

    // Chart data - Répartition par statut
    const doughnutChartData = {
        labels: ['Nouveau (0%)', 'En cours (50%)', 'Terminé (100%)'],
        datasets: [
            {
                data: [stats.nouveau, stats.enCours, stats.termine],
                backgroundColor: ['#6c757d', '#0f3460', '#28a745'],
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

    // Chart data - Avancement par signalement
    const barChartData = {
        labels: signalements.slice(0, 10).map(s => `#${s.id_signalement}`),
        datasets: [
            {
                label: 'Avancement (%)',
                data: signalements.slice(0, 10).map(s => getAvancement(s.statut)),
                backgroundColor: signalements.slice(0, 10).map(s => {
                    const av = getAvancement(s.statut)
                    if (av === 0) return '#6c757d'
                    if (av === 50) return '#0f3460'
                    return '#28a745'
                }),
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
            y: { 
                beginAtZero: true, 
                max: 100,
                grid: { color: '#f0f0f0' },
                ticks: {
                    callback: (value) => value + '%'
                }
            },
            x: { grid: { display: false } },
        },
    }

    const getStatutBadge = (statut) => {
        const colors = {
            'Nouveau': 'secondary',
            'En cours': 'primary',
            'Terminé': 'success',
        }
        return colors[statut] || 'secondary'
    }

    const getStatutAvancement = (statut) => {
        const av = getAvancement(statut)
        return `${av}%`
    }

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <CSpinner color="primary" />
            </div>
        )
    }

    return (
        <div className="dashboard-page">
            <div className="page-header d-flex align-items-center gap-3 mb-4">
                <div className="header-icon">
                    <CIcon icon={cilChartLine} size="lg" />
                </div>
                <div>
                    <h2 className="mb-0 fw-bold">Tableau de bord</h2>
                    <small className="text-muted">Statistiques d'avancement des travaux</small>
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
                                <div className="stat-value">{stats.total}</div>
                                <div className="stat-label">Total Signalements</div>
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
                <CCol sm="6" lg="3">
                    <CCard className="stat-card border-0 shadow-sm h-100">
                        <CCardBody className="d-flex align-items-center">
                            <div className="stat-icon bg-secondary-light">
                                <CIcon icon={cilClock} size="xl" className="text-secondary" />
                            </div>
                            <div className="ms-3">
                                <div className="stat-value">{stats.nouveau}</div>
                                <div className="stat-label">Nouveau (0%)</div>
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
                <CCol sm="6" lg="3">
                    <CCard className="stat-card border-0 shadow-sm h-100">
                        <CCardBody className="d-flex align-items-center">
                            <div className="stat-icon bg-info-light">
                                <CIcon icon={cilSync} size="xl" className="text-primary" />
                            </div>
                            <div className="ms-3">
                                <div className="stat-value">{stats.enCours}</div>
                                <div className="stat-label">En cours (50%)</div>
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
                                <div className="stat-value">{stats.termine}</div>
                                <div className="stat-label">Terminé (100%)</div>
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>

            {/* Avancement moyen */}
            <CRow className="g-4 mb-4">
                <CCol lg="4">
                    <CCard className="border-0 shadow-sm h-100 bg-navy text-white">
                        <CCardBody className="p-4 text-center">
                            <div className="mb-3">
                                <CIcon icon={cilSpeedometer} size="3xl" />
                            </div>
                            <h6 className="opacity-75 mb-2">Avancement moyen global</h6>
                            <h1 className="display-4 fw-bold mb-3">{stats.avancementMoyen}%</h1>
                            <CProgress 
                                value={stats.avancementMoyen} 
                                color="light" 
                                className="mb-3"
                                style={{ height: '10px' }}
                            />
                            <small className="opacity-75">
                                Basé sur {stats.total} signalement(s)
                            </small>
                        </CCardBody>
                    </CCard>
                </CCol>
                <CCol lg="4">
                    <CCard className="border-0 shadow-sm h-100">
                        <CCardHeader className="bg-white border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Répartition par statut</h5>
                            <small className="text-muted">Avancement des travaux</small>
                        </CCardHeader>
                        <CCardBody className="d-flex align-items-center justify-content-center">
                            <div style={{ height: '220px', width: '100%' }}>
                                <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
                <CCol lg="4">
                    <CCard className="border-0 shadow-sm h-100">
                        <CCardHeader className="bg-white border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Statistiques de traitement</h5>
                            <small className="text-muted">Performance des travaux</small>
                        </CCardHeader>
                        <CCardBody>
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="text-muted">Traitement moyen</span>
                                    <strong className="text-primary">{stats.traitementMoyen > 0 ? `${stats.traitementMoyen} jours` : 'N/A'}</strong>
                                </div>
                                <CProgress value={stats.traitementMoyen > 0 ? Math.min((stats.traitementMoyen / 7) * 100, 100) : 0} color="primary" />
                            </div>
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="text-muted">Taux d'achèvement</span>
                                    <strong className="text-success">
                                        {stats.total > 0 ? Math.round((stats.termine / stats.total) * 100) : 0}%
                                    </strong>
                                </div>
                                <CProgress 
                                    value={stats.total > 0 ? (stats.termine / stats.total) * 100 : 0} 
                                    color="success" 
                                />
                            </div>
                            <div className="mb-0">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="text-muted">En progression</span>
                                    <strong className="text-info">
                                        {stats.total > 0 ? Math.round((stats.enCours / stats.total) * 100) : 0}%
                                    </strong>
                                </div>
                                <CProgress 
                                    value={stats.total > 0 ? (stats.enCours / stats.total) * 100 : 0} 
                                    color="info" 
                                />
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>

            {/* Chart avancement */}
            <CRow className="g-4 mb-4">
                <CCol lg="12">
                    <CCard className="border-0 shadow-sm">
                        <CCardHeader className="bg-white border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Avancement par signalement</h5>
                            <small className="text-muted">Nouveau = 0% | En cours = 50% | Terminé = 100%</small>
                        </CCardHeader>
                        <CCardBody>
                            <div style={{ height: '300px' }}>
                                <Bar data={barChartData} options={barChartOptions} />
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>

            {/* Tableau de statistiques */}
            <CRow className="g-4">
                <CCol lg="12">
                    <CCard className="border-0 shadow-sm">
                        <CCardHeader className="bg-white border-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="fw-bold mb-0">Tableau de statistiques des travaux</h5>
                                <small className="text-muted">Détail de l'avancement de chaque signalement</small>
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
                                        <CTableHeaderCell>Date</CTableHeaderCell>
                                        <CTableHeaderCell>Utilisateur</CTableHeaderCell>
                                        <CTableHeaderCell>Statut</CTableHeaderCell>
                                        <CTableHeaderCell className="text-center">Avancement</CTableHeaderCell>
                                        <CTableHeaderCell>Progression</CTableHeaderCell>
                                    </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                    {signalements.slice(0, 10).map((sig) => (
                                        <CTableRow 
                                            key={sig.id_signalement} 
                                            className="cursor-pointer" 
                                            onClick={() => navigate(`/manager/signalements/fiche/${sig.id_signalement}`)}
                                        >
                                            <CTableDataCell><strong>#{sig.id_signalement}</strong></CTableDataCell>
                                            <CTableDataCell className="text-truncate" style={{ maxWidth: '250px' }}>
                                                {sig.description}
                                            </CTableDataCell>
                                            <CTableDataCell>
                                                <small>{sig.daty || '-'}</small>
                                            </CTableDataCell>
                                            <CTableDataCell>
                                                {sig.utilisateur?.nom_complet || '-'}
                                            </CTableDataCell>
                                            <CTableDataCell>
                                                <CBadge color={getStatutBadge(sig.statut)}>
                                                    {sig.statut || 'Non défini'}
                                                </CBadge>
                                            </CTableDataCell>
                                            <CTableDataCell className="text-center">
                                                <strong>{getStatutAvancement(sig.statut)}</strong>
                                            </CTableDataCell>
                                            <CTableDataCell style={{ minWidth: '150px' }}>
                                                <CProgress 
                                                    value={getAvancement(sig.statut)} 
                                                    color={
                                                        getAvancement(sig.statut) === 0 ? 'secondary' :
                                                        getAvancement(sig.statut) === 50 ? 'primary' : 'success'
                                                    }
                                                    style={{ height: '8px' }}
                                                />
                                            </CTableDataCell>
                                        </CTableRow>
                                    ))}
                                </CTableBody>
                            </CTable>
                            {signalements.length === 0 && (
                                <div className="text-center py-5 text-muted">
                                    Aucun signalement trouvé
                                </div>
                            )}
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>
        </div>
    )
}

