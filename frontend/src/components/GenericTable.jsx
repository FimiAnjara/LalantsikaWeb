import { useState } from 'react'
import {
    CTable,
    CTableHead,
    CTableBody,
    CTableHeaderCell,
    CTableDataCell,
    CTableRow,
    CCard,
    CCardHeader,
    CCardBody,
    CPagination,
    CPaginationItem,
} from '@coreui/react'
import './GenericTable.css'

export default function GenericTable({
    title,
    subtitle,
    columns,
    data,
    rowKey,
    renderRow,
    emptyMessage = 'Aucun enregistrement trouvé',
    itemsPerPage = 10,
}) {
    const [currentPage, setCurrentPage] = useState(1)
    
    const totalPages = Math.ceil((data?.length || 0) / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedData = data?.slice(startIndex, endIndex) || []

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <CCard className="generic-table-card">
            <CCardHeader className="table-header">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="mb-0">{title}</h5>
                        {subtitle && <small className="text-muted">{subtitle}</small>}
                    </div>
                    <div className="table-count-badge">
                        {data?.length || 0} ligne(s)
                    </div>
                </div>
            </CCardHeader>
            <CCardBody className="p-0">
                <CTable responsive hover className="generic-table">
                    <CTableHead>
                        <CTableRow>
                            {columns.map((col) => (
                                <CTableHeaderCell key={col.key} scope="col">
                                    {col.label}
                                </CTableHeaderCell>
                            ))}
                        </CTableRow>
                    </CTableHead>
                    <CTableBody>
                        {paginatedData && paginatedData.length > 0 ? (
                            paginatedData.map((row) => renderRow(row))
                        ) : (
                            <CTableRow>
                                <CTableDataCell
                                    colSpan={columns.length}
                                    className="text-center py-5"
                                >
                                    <p className="text-muted mb-0">{emptyMessage}</p>
                                </CTableDataCell>
                            </CTableRow>
                        )}
                    </CTableBody>
                </CTable>

                {totalPages > 1 && (
                    <div className="pagination-container">
                        <CPagination className="pagination-control">
                            <CPaginationItem
                                disabled={currentPage === 1}
                                onClick={() => handlePageChange(1)}
                            >
                                Première
                            </CPaginationItem>
                            <CPaginationItem
                                disabled={currentPage === 1}
                                onClick={() => handlePageChange(currentPage - 1)}
                            >
                                Précédente
                            </CPaginationItem>

                            {[...Array(totalPages)].map((_, i) => {
                                const pageNum = i + 1
                                // Afficher les 5 pages autour de la page actuelle
                                if (
                                    pageNum === 1 ||
                                    pageNum === totalPages ||
                                    (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                                ) {
                                    return (
                                        <CPaginationItem
                                            key={pageNum}
                                            active={pageNum === currentPage}
                                            onClick={() => handlePageChange(pageNum)}
                                        >
                                            {pageNum}
                                        </CPaginationItem>
                                    )
                                }
                                // Afficher les points de suspension
                                if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
                                    return (
                                        <CPaginationItem key={`dots-${pageNum}`} disabled>
                                            ...
                                        </CPaginationItem>
                                    )
                                }
                                return null
                            })}

                            <CPaginationItem
                                disabled={currentPage === totalPages}
                                onClick={() => handlePageChange(currentPage + 1)}
                            >
                                Suivante
                            </CPaginationItem>
                            <CPaginationItem
                                disabled={currentPage === totalPages}
                                onClick={() => handlePageChange(totalPages)}
                            >
                                Dernière
                            </CPaginationItem>
                        </CPagination>
                    </div>
                )}
            </CCardBody>
        </CCard>
    )
}
