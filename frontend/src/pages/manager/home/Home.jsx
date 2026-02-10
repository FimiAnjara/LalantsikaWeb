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
    CFormInput,
    CInputGroup,
    CInputGroupText,
} from '@coreui/react'
import { LoadingSpinner } from '../../../components/ui'
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
    cilFilter,
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
import { Line, Doughnut } from 'react-chartjs-2'
import { ENDPOINTS, getAuthHeaders } from '../../../config/api'
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
    const [statsDelai, setStatsDelai] = useState({
        moyenne: 0,
        min: 0,
        max: 0,
        total: 0,
        delaiPar100m2: 0,
        surfaceTotale: 0
    })
    const [statsParEntreprise, setStatsParEntreprise] = useState([])
    
    // Filtres de date pour le graphique
    const [dateDebut, setDateDebut] = useState('')
    const [dateFin, setDateFin] = useState('')
    const [showDateFilter, setShowDateFilter] = useState(false)

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

    // Calcul du délai de traitement basé sur l'historique des statuts
    const calculerDelaiAvecHistorique = (signalement) => {
        const histoStatut = signalement.histo_statut || []
        const surface = signalement.surface || 0
        
        // Trouver les dates importantes dans l'historique
        let dateCreation = null
        let dateEnCours = null
        let dateTermine = null
        
        if (histoStatut.length > 0) {
            histoStatut.forEach(histo => {
                const date = new Date(histo.date_changement || histo.daty)
                const statut = histo.nouveau_statut || histo.statut?.libelle || histo.statut
                
                if (statut === 'Nouveau') {
                    if (!dateCreation || date < dateCreation) {
                        dateCreation = date
                    }
                }
                if (statut === 'En cours') {
                    if (!dateEnCours || date > dateEnCours) {
                        dateEnCours = date
                    }
                }
                if (statut === 'Terminé') {
                    if (!dateTermine || date > dateTermine) {
                        dateTermine = date
                    }
                }
            })
        }
        
        // Si pas de date de création dans l'historique, utiliser la date du signalement
        if (!dateCreation && signalement.daty) {
            dateCreation = new Date(signalement.daty)
        }
        
        if (!dateCreation) return null
        
        // Calculer le délai réel depuis la création jusqu'à maintenant ou jusqu'à la fin
        const dateFin = dateTermine || new Date()
        const delaiReel = Math.ceil((dateFin - dateCreation) / (1000 * 60 * 60 * 24))
        
        return {
            delaiReel: delaiReel,
            surface: surface,
            dateCreation: dateCreation,
            dateEnCours: dateEnCours,
            dateTermine: dateTermine
        }
    }
    
    // Calcul des statistiques de délai avec délai par 100m²
    const calculerStatistiquesDelaiAvecSurface = (signalements) => {
        const delaisReels = []
        let surfaceTotale = 0
        let delaiTotal = 0
        
        signalements.forEach(sig => {
            const resultDelai = calculerDelaiAvecHistorique(sig)
            if (resultDelai && resultDelai.delaiReel) {
                delaisReels.push(resultDelai.delaiReel)
                
                const surface = resultDelai.surface || 0
                surfaceTotale += surface
                delaiTotal += resultDelai.delaiReel
            }
        })
        
        // Moyenne des délais réels
        const moyenneReelle = delaisReels.length > 0 ? delaisReels.reduce((a, b) => a + b, 0) / delaisReels.length : 0
        
        const min = delaisReels.length > 0 ? Math.min(...delaisReels) : 0
        const max = delaisReels.length > 0 ? Math.max(...delaisReels) : 0
        
        // Délai par 100m² = (délai total / surface totale) * 100
        const delaiPar100m2 = surfaceTotale > 0 ? (delaiTotal / surfaceTotale) * 100 : 0
        
        return {
            moyenneReelle: Math.round(moyenneReelle * 10) / 10,
            min,
            max,
            total: delaisReels.length,
            delaiPar100m2: Math.round(delaiPar100m2 * 10) / 10,
            surfaceTotale: Math.round(surfaceTotale)
        }
    }
    
    // Calcul des statistiques par entreprise
    const calculerStatsParEntreprise = (signalements, delaiPar100m2Global) => {
        const entreprisesMap = new Map()
        
        signalements.forEach(sig => {
            const entreprise = sig.entreprise
            if (!entreprise) return
            
            // L'API retourne id, pas id_entreprise
            const id = entreprise.id || entreprise.id_entreprise
            const nom = entreprise.nom || `Entreprise #${id}`
            
            if (!id) return
            
            if (!entreprisesMap.has(id)) {
                entreprisesMap.set(id, {
                    id,
                    nom,
                    signalements: [],
                    surfaces: [],
                    delais: [],
                    termines: 0,
                    enCours: 0,
                    nouveaux: 0
                })
            }
            
            const stats = entreprisesMap.get(id)
            stats.signalements.push(sig)
            
            if (sig.surface) stats.surfaces.push(sig.surface)
            
            const delaiInfo = calculerDelaiAvecHistorique(sig)
            if (delaiInfo) {
                stats.delais.push(delaiInfo.delaiReel)
            }
            
            if (sig.statut === 'Terminé') stats.termines++
            else if (sig.statut === 'En cours') stats.enCours++
            else stats.nouveaux++
        })
        
        // Transformer en tableau avec calculs
        const result = Array.from(entreprisesMap.values()).map(e => {
            const surfaceTotale = e.surfaces.reduce((a, b) => a + b, 0)
            const surfaceMoyenne = e.surfaces.length > 0 
                ? surfaceTotale / e.surfaces.length 
                : 0
            const totalDelai = e.delais.reduce((a, b) => a + b, 0)
            const delaiMoyen = e.delais.length > 0 
                ? totalDelai / e.delais.length 
                : 0
            const tauxAchevement = e.signalements.length > 0 
                ? (e.termines / e.signalements.length) * 100 
                : 0
            
            // Délai par 100m² pour cette entreprise
            const delaiPar100m2 = surfaceTotale > 0 ? (totalDelai / surfaceTotale) * 100 : 0
            
            // Écart par rapport à la moyenne globale
            const ecartDelai = delaiPar100m2Global > 0 
                ? ((delaiPar100m2 - delaiPar100m2Global) / delaiPar100m2Global) * 100 
                : 0
            
            return {
                id: e.id,
                nom: e.nom,
                nbSignalements: e.signalements.length,
                termines: e.termines,
                enCours: e.enCours,
                nouveaux: e.nouveaux,
                surfaceTotale: Math.round(surfaceTotale),
                surfaceMoyenne: Math.round(surfaceMoyenne),
                delaiMoyen: Math.round(delaiMoyen * 10) / 10,
                delaiPar100m2: Math.round(delaiPar100m2 * 10) / 10,
                tauxAchevement: Math.round(tauxAchevement),
                ecartDelai: Math.round(ecartDelai)
            }
        })
        
        // Trier par délai par 100m² croissant (plus rapide en premier)
        return result.sort((a, b) => a.delaiPar100m2 - b.delaiPar100m2)
    }

    // Récupérer les données
    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
            console.log('Token utilisé:', token ? 'Token présent' : 'Token ABSENT')
            
            if (!token) {
                console.error('Pas de token! Redirection vers login...')
                navigate('/manager/login')
                return
            }
            
            // Récupérer les signalements
            const sigResponse = await fetch(ENDPOINTS.REPORTS, {
                headers: getAuthHeaders()
            })
            const sigResult = await sigResponse.json()
            
            // Récupérer les utilisateurs
            const userResponse = await fetch(ENDPOINTS.USERS, {
                headers: getAuthHeaders()
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
                
                // Calcul des statistiques de délai réelles basées sur l'historique
                const statistiquesDelai = calculerStatistiquesDelaiAvecSurface(data)
                
                setStats({
                    total: data.length,
                    nouveau,
                    enCours,
                    termine,
                    avancementMoyen,
                    totalUtilisateurs: userResult.success && Array.isArray(userResult.data) ? userResult.data.length : 0,
                    traitementMoyen: statistiquesDelai.moyenneReelle,
                })
                
                setStatsDelai(statistiquesDelai)
                
                // Calcul des statistiques par entreprise
                const statsEntreprises = calculerStatsParEntreprise(data, statistiquesDelai.delaiPar100m2)
                setStatsParEntreprise(statsEntreprises)
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

    // Calculer l'avancement moyen par mois
    const calculerAvancementParMois = () => {
        // Regrouper les signalements par mois
        const parMois = new Map()
        
        // Convertir les filtres en dates
        const dateDebutFilter = dateDebut ? new Date(dateDebut) : null
        const dateFinFilter = dateFin ? new Date(dateFin + 'T23:59:59') : null
        
        signalements.forEach(sig => {
            // Utiliser la date du signalement ou de l'historique
            const delaiInfo = calculerDelaiAvecHistorique(sig)
            let date = sig.daty ? new Date(sig.daty) : null
            
            // Utiliser la dernière date de changement de statut si disponible
            if (delaiInfo?.dateTermine) {
                date = delaiInfo.dateTermine
            } else if (delaiInfo?.dateEnCours) {
                date = delaiInfo.dateEnCours
            } else if (delaiInfo?.dateCreation) {
                date = delaiInfo.dateCreation
            }
            
            if (!date) return
            
            // Appliquer le filtre de dates
            if (dateDebutFilter && date < dateDebutFilter) return
            if (dateFinFilter && date > dateFinFilter) return
            
            // Grouper par mois (format: "Jan 2026")
            const moisStr = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
            const moisKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            
            if (!parMois.has(moisKey)) {
                parMois.set(moisKey, { label: moisStr, total: 0, count: 0, dateObj: new Date(date.getFullYear(), date.getMonth(), 1) })
            }
            
            const stats = parMois.get(moisKey)
            stats.total += getAvancement(sig.statut)
            stats.count++
        })
        
        // Convertir en tableau et trier par date
        const result = Array.from(parMois.entries())
            .map(([key, stats]) => ({
                mois: stats.label,
                dateObj: stats.dateObj,
                moyenne: Math.round(stats.total / stats.count)
            }))
            .sort((a, b) => a.dateObj - b.dateObj)
        
        return result
    }
    
    const avancementParMois = calculerAvancementParMois()
    
    // Chart data - Évolution de l'avancement moyen par mois
    const lineChartData = {
        labels: avancementParMois.map(d => d.mois),
        datasets: [
            {
                label: 'Avancement moyen (%)',
                data: avancementParMois.map(d => d.moyenne),
                borderColor: '#0f3460',
                backgroundColor: 'rgba(15, 52, 96, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#0f3460',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            },
        ],
    }

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'top' },
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
            x: { 
                grid: { display: false }
            },
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
        return <LoadingSpinner isLoading={true} message="Chargement des statistiques..." />
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
                                    <span className="text-muted">Délai moyen réel</span>
                                    <strong className="text-primary">{statsDelai.moyenneReelle > 0 ? `${statsDelai.moyenneReelle} jours` : 'N/A'}</strong>
                                </div>
                                <CProgress value={statsDelai.moyenneReelle > 0 ? Math.min((statsDelai.moyenneReelle / 30) * 100, 100) : 0} color="primary" />
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

            {/* Statistiques de délai et graphique */}
            <CRow className="g-4 mb-4">
                <CCol lg="12">
                    <CCard className="border-0 shadow-sm">
                        <CCardHeader className="bg-white border-0 pt-4 pb-0">
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                <div>
                                    <h5 className="fw-bold mb-0">Évolution de l'avancement moyen</h5>
                                    <small className="text-muted">Avancement moyen des signalements par mois</small>
                                </div>
                                <div className="d-flex gap-2 align-items-center flex-wrap">
                                    <CButton 
                                        color="primary" 
                                        variant={showDateFilter ? "" : "outline"}
                                        size="sm"
                                        onClick={() => setShowDateFilter(!showDateFilter)}
                                    >
                                        <CIcon icon={cilFilter} className="me-1" />
                                        Filtrer
                                    </CButton>
                                    {showDateFilter && (
                                        <>
                                            <CInputGroup size="sm" style={{ width: 'auto' }}>
                                                <CInputGroupText>Du</CInputGroupText>
                                                <CFormInput 
                                                    type="date" 
                                                    value={dateDebut}
                                                    onChange={(e) => setDateDebut(e.target.value)}
                                                />
                                            </CInputGroup>
                                            <CInputGroup size="sm" style={{ width: 'auto' }}>
                                                <CInputGroupText>Au</CInputGroupText>
                                                <CFormInput 
                                                    type="date" 
                                                    value={dateFin}
                                                    onChange={(e) => setDateFin(e.target.value)}
                                                />
                                            </CInputGroup>
                                            {(dateDebut || dateFin) && (
                                                <CButton 
                                                    color="secondary" 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => { setDateDebut(''); setDateFin(''); }}
                                                >
                                                    Réinitialiser
                                                </CButton>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </CCardHeader>
                        <CCardBody className="pt-4">
                            <div style={{ height: '250px' }}>
                                <Line data={lineChartData} options={lineChartOptions} />
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>

            {/* Tableau par entreprise */}
            <CRow className="g-4 mb-4">
                <CCol lg="12">
                    <CCard className="border-0 shadow-sm">
                        <CCardHeader className="bg-white border-0 pt-4 pb-0">
                            <div>
                                <h5 className="fw-bold mb-0">Performance par entreprise</h5>
                                <small className="text-muted">Délai moyen par 100m² comparé à la moyenne globale ({statsDelai.delaiPar100m2}j/100m²)</small>
                            </div>
                        </CCardHeader>
                        <CCardBody className="p-0">
                            <CTable hover responsive className="mb-0">
                                <CTableHead className="bg-light">
                                    <CTableRow>
                                        <CTableHeaderCell>Entreprise</CTableHeaderCell>
                                        <CTableHeaderCell className="text-center">Projets</CTableHeaderCell>
                                        <CTableHeaderCell className="text-center">Surface totale</CTableHeaderCell>
                                        <CTableHeaderCell className="text-center">Délai moyen</CTableHeaderCell>
                                        <CTableHeaderCell className="text-center">j/100m²</CTableHeaderCell>
                                        <CTableHeaderCell className="text-center">Écart/Moy.</CTableHeaderCell>
                                        <CTableHeaderCell className="text-center">Achèvement</CTableHeaderCell>
                                    </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                    {statsParEntreprise.map((ent, index) => (
                                        <CTableRow key={ent.id}>
                                            <CTableDataCell>
                                                <div className="d-flex align-items-center">
                                                    <span className={`badge me-2 ${index === 0 ? 'bg-success' : index === statsParEntreprise.length - 1 ? 'bg-danger' : 'bg-secondary'}`}>
                                                        #{index + 1}
                                                    </span>
                                                    <div>
                                                        <strong>{ent.nom}</strong>
                                                        <br />
                                                        <small className="text-muted">
                                                            {ent.termines} terminé, {ent.enCours} en cours, {ent.nouveaux} nouveau
                                                        </small>
                                                    </div>
                                                </div>
                                            </CTableDataCell>
                                            <CTableDataCell className="text-center">
                                                <strong>{ent.nbSignalements}</strong>
                                            </CTableDataCell>
                                            <CTableDataCell className="text-center">
                                                {ent.surfaceTotale.toLocaleString()}m²
                                            </CTableDataCell>
                                            <CTableDataCell className="text-center">
                                                <strong>{ent.delaiMoyen}j</strong>
                                            </CTableDataCell>
                                            <CTableDataCell className="text-center">
                                                <span className={`badge ${ent.delaiPar100m2 <= statsDelai.delaiPar100m2 ? 'bg-success' : 'bg-warning'}`}>
                                                    {ent.delaiPar100m2}j
                                                </span>
                                            </CTableDataCell>
                                            <CTableDataCell className="text-center">
                                                <span className={`badge ${ent.ecartDelai <= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                                    {ent.ecartDelai <= 0 ? '' : '+'}{ent.ecartDelai}%
                                                </span>
                                            </CTableDataCell>
                                            <CTableDataCell className="text-center">
                                                <CProgress 
                                                    value={ent.tauxAchevement} 
                                                    color={ent.tauxAchevement >= 75 ? 'success' : ent.tauxAchevement >= 50 ? 'primary' : 'warning'}
                                                    style={{ height: '8px', minWidth: '60px' }}
                                                />
                                                <small>{ent.tauxAchevement}%</small>
                                            </CTableDataCell>
                                        </CTableRow>
                                    ))}
                                </CTableBody>
                            </CTable>
                            {statsParEntreprise.length === 0 && (
                                <div className="text-center py-5 text-muted">
                                    Aucune entreprise avec des signalements
                                </div>
                            )}
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
                                <small className="text-muted">Délais calculés selon historique des statuts et surface</small>
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
                                        <CTableHeaderCell>Surface</CTableHeaderCell>
                                        <CTableHeaderCell>Statut</CTableHeaderCell>
                                        <CTableHeaderCell className="text-center">Délai (jours)</CTableHeaderCell>
                                        <CTableHeaderCell className="text-center">Avancement</CTableHeaderCell>
                                    </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                    {signalements.slice(0, 10).map((sig) => {
                                        const delaiInfo = calculerDelaiAvecHistorique(sig)
                                        return (
                                            <CTableRow 
                                                key={sig.id_signalement} 
                                                className="cursor-pointer" 
                                                onClick={() => navigate(`/manager/signalements/fiche/${sig.id_signalement}`)}
                                            >
                                                <CTableDataCell><strong>#{sig.id_signalement}</strong></CTableDataCell>
                                                <CTableDataCell className="text-truncate" style={{ maxWidth: '200px' }}>
                                                    {sig.description}
                                                    <br />
                                                    <small className="text-muted">
                                                        {sig.daty ? new Date(sig.daty).toLocaleDateString() : '-'} | 
                                                        {sig.utilisateur?.nom_complet || 'N/A'}
                                                    </small>
                                                </CTableDataCell>
                                                <CTableDataCell>
                                                    <div className="fw-bold">{sig.surface || 0}m²</div>
                                                </CTableDataCell>
                                                <CTableDataCell>
                                                    <CBadge color={getStatutBadge(sig.statut)}>
                                                        {sig.statut || 'Non défini'}
                                                    </CBadge>
                                                    {delaiInfo && delaiInfo.dateEnCours && (
                                                        <><br /><small className="text-muted">
                                                            En cours: {delaiInfo.dateEnCours.toLocaleDateString()}
                                                        </small></>
                                                    )}
                                                    {delaiInfo && delaiInfo.dateTermine && (
                                                        <><br /><small className="text-success">
                                                            Fini: {delaiInfo.dateTermine.toLocaleDateString()}
                                                        </small></>
                                                    )}
                                                </CTableDataCell>
                                                <CTableDataCell className="text-center">
                                                    {delaiInfo ? (
                                                        <div className="fw-bold">{delaiInfo.delaiReel} j</div>
                                                    ) : '-'}
                                                </CTableDataCell>
                                                <CTableDataCell className="text-center">
                                                    <strong>{getStatutAvancement(sig.statut)}</strong>
                                                </CTableDataCell>
                                            </CTableRow>
                                        )
                                    })}
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

