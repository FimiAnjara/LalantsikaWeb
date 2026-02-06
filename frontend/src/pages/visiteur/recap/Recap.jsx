import React, { useState, useEffect } from 'react'
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
    CBadge,
    CSpinner,
    CAlert
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
import { ENDPOINTS } from '../../../config/api'

const getStatusBadge = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
        case 'nouveau': return <CBadge color="danger" shape="rounded-pill"><CIcon icon={cilBell} className="me-1" />Nouveau</CBadge>;
        case 'en cours': return <CBadge color="warning" shape="rounded-pill"><CIcon icon={cilReload} className="me-1" />En cours</CBadge>;
        case 'terminé': return <CBadge color="success" shape="rounded-pill"><CIcon icon={cilCheckCircle} className="me-1" />Terminé</CBadge>;
        default: return <CBadge color="secondary">{status || 'Inconnu'}</CBadge>;
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

export default function Recap() {
    const [signalements, setSignalements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSignalements = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(ENDPOINTS.REPORTS_PUBLIC, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            const result = await response.json();
            if (result.success) {
                const data = result.data.map(s => ({
                    id: s.id_signalement,
                    problem: s.description || 'Problème de route',
                    date: s.daty_signalement ? new Date(s.daty_signalement).toLocaleDateString('fr-FR') : 'N/A',
                    status: s.dernier_statut?.statut?.libelle || 'Nouveau',
                    surface: parseFloat(s.surface) || 0,
                    budget: parseFloat(s.budget) || 0,
                    entreprise: s.entreprise?.nom || 'Non assignée'
                }));
                setSignalements(data);
            } else {
                setError(result.message || 'Erreur lors du chargement');
            }
        } catch (err) {
            setError(`Erreur de connexion: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSignalements(); }, []);

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
                <button className="btn btn-outline-danger" onClick={fetchSignalements}>Réessayer</button>
            </CAlert>
        );
    }

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
                                <CTableHeaderCell>Date</CTableHeaderCell>
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
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        <div className="small fw-semibold">{s.date}</div>
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
                                                    color={s.status.toLowerCase() === 'terminé' ? 'success' : s.status.toLowerCase() === 'en cours' ? 'warning' : 'danger'}
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
