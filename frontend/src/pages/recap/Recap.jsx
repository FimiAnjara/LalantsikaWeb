import React from 'react'
import { 
    CCard, 
    CCardBody, 
    CCardHeader, 
    CCol, 
    CRow, 
    CWidgetStatsA,
    CTable,
    CTableBody,
    CTableDataCell,
    CTableHead,
    CTableHeaderCell,
    CTableRow,
    CProgress,
    CBadge
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { 
    cilLocationPin, 
    cilResizeBoth, 
    cilMoney, 
    cilChartPie,
    cilCheckCircle,
    cilReload,
    cilBell
} from '@coreui/icons'

const signalements = [
    {
        id: 1,
        problem: "Nid-de-poule majeur",
        date: "2024-01-15",
        status: "nouveau",
        surface: 12,
        budget: 500000,
        entreprise: "Axe Construction"
    },
    {
        id: 2,
        problem: "Route affaissée",
        date: "2024-01-10",
        status: "en cours",
        surface: 45,
        budget: 2500000,
        entreprise: "Colas M'car"
    },
    {
        id: 3,
        problem: "Fissures transversales",
        date: "2023-12-20",
        status: "terminé",
        surface: 8,
        budget: 2000000,
        entreprise: "HERY TP"
    }
];

const getStatusBadge = (status) => {
    switch (status) {
        case 'nouveau': return <CBadge color="danger" shape="rounded-pill"><CIcon icon={cilBell} className="me-1" />Nouveau</CBadge>;
        case 'en cours': return <CBadge color="warning" shape="rounded-pill"><CIcon icon={cilReload} className="me-1" />En cours</CBadge>;
        case 'terminé': return <CBadge color="success" shape="rounded-pill"><CIcon icon={cilCheckCircle} className="me-1" />Terminé</CBadge>;
        default: return <CBadge color="secondary">{status}</CBadge>;
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

export default function Recap() {
    const totalPoints = signalements.length;
    const totalSurface = signalements.reduce((acc, s) => acc + s.surface, 0);
    const totalBudget = signalements.reduce((acc, s) => acc + s.budget, 0);
    const averageProgress = Math.round(signalements.reduce((acc, s) => acc + getProgressValue(s.status), 0) / totalPoints);

    return (
        <div className="recap-page">
            <h3 className="mb-4 fw-bold">Récapitulatif Général</h3>

            {/* Widgets de statistiques */}
            <CRow className="mb-4 g-4">
                <CCol sm={6} lg={3}>
                    <CWidgetStatsA
                        className="pb-3 border-0 shadow-sm"
                        color="primary"
                        value={totalPoints}
                        title="Nombre de Points"
                        icon={<CIcon icon={cilLocationPin} height={48} className="my-2 opacity-50" />}
                    />
                </CCol>
                <CCol sm={6} lg={3}>
                    <CWidgetStatsA
                        className="pb-3 border-0 shadow-sm text-white"
                        style={{ backgroundColor: '#2d3436' }}
                        value={`${totalSurface} m²`}
                        title="Surface Totale"
                        icon={<CIcon icon={cilResizeBoth} height={48} className="my-2 opacity-50 text-white" />}
                    />
                </CCol>
                <CCol sm={6} lg={3}>
                    <CWidgetStatsA
                        className="pb-3 border-0 shadow-sm"
                        color="warning"
                        value={`${averageProgress}%`}
                        title="Avancement Global"
                        icon={<CIcon icon={cilChartPie} height={48} className="my-2 opacity-50" />}
                    />
                </CCol>
                <CCol sm={6} lg={3}>
                    <CWidgetStatsA
                        className="pb-3 border-0 shadow-sm"
                        color="success"
                        value={`${totalBudget.toLocaleString()} Ar`}
                        title="Budget Total"
                        icon={<CIcon icon={cilMoney} height={48} className="my-2 opacity-50" />}
                    />
                </CCol>
            </CRow>

            {/* Tableau détaillé */}
            <CCard className="shadow-sm border-0 rounded-4 overflow-hidden">
                <CCardHeader className="bg-navy text-white py-3">
                    <h5 className="mb-0">Détails des interventions</h5>
                </CCardHeader>
                <CCardBody className="p-0">
                    <CTable hover responsive align="middle" className="mb-0 border-top-0">
                        <CTableHead color="light">
                            <CTableRow>
                                <CTableHeaderCell className="ps-4">Problème</CTableHeaderCell>
                                <CTableHeaderCell>Entreprise</CTableHeaderCell>
                                <CTableHeaderCell>Surface</CTableHeaderCell>
                                <CTableHeaderCell>Budget</CTableHeaderCell>
                                <CTableHeaderCell>Statut</CTableHeaderCell>
                                <CTableHeaderCell className="pe-4" style={{width: '200px'}}>Progression</CTableHeaderCell>
                            </CTableRow>
                        </CTableHead>
                        <CTableBody>
                            {signalements.map((s) => (
                                <CTableRow key={s.id}>
                                    <CTableDataCell className="ps-4">
                                        <div className="fw-bold">{s.problem}</div>
                                        <div className="small text-secondary">{s.date}</div>
                                    </CTableDataCell>
                                    <CTableDataCell>{s.entreprise}</CTableDataCell>
                                    <CTableDataCell>{s.surface} m²</CTableDataCell>
                                    <CTableDataCell>{s.budget.toLocaleString()} Ar</CTableDataCell>
                                    <CTableDataCell>{getStatusBadge(s.status)}</CTableDataCell>
                                    <CTableDataCell className="pe-4">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-grow-1 me-2">
                                                <CProgress 
                                                    height={6} 
                                                    value={getProgressValue(s.status)} 
                                                    color={s.status === 'terminé' ? 'success' : s.status === 'en cours' ? 'warning' : 'danger'}
                                                />
                                            </div>
                                            <span className="small fw-semibold">{getProgressValue(s.status)}%</span>
                                        </div>
                                    </CTableDataCell>
                                </CTableRow>
                            ))}
                        </CTableBody>
                    </CTable>
                </CCardBody>
            </CCard>
        </div>
    )
}
