import { CButton } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilInfo, cilCloudDownload, cilTrash } from '@coreui/icons'
import './ActionButtons.css'

export default function ActionButtons({ 
    id, 
    onView, 
    onEdit, 
    onDelete 
}) {
    return (
        <div className="action-buttons">
            <CButton
                color="info"
                size="sm"
                className="btn-action btn-view"
                onClick={() => onView(id)}
                title="Voir"
            >
                <CIcon icon={cilInfo} className="me-1" />
                Voir
            </CButton>
            <CButton
                color="warning"
                size="sm"
                className="btn-action btn-edit"
                onClick={() => onEdit(id)}
                title="Modifier"
            >
                <CIcon icon={cilCloudDownload} className="me-1" />
                Éditer
            </CButton>
            <CButton
                color="danger"
                size="sm"
                className="btn-action btn-delete"
                onClick={() => onDelete(id)}
                title="Supprimer"
            >
                <CIcon icon={cilTrash} className="me-1" />
                Supprimer
            </CButton>
        </div>
    )
}
