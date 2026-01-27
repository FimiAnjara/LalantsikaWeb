import { CModal, CModalHeader, CModalBody, CModalFooter, CButton } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckAlt, cilX, cilWarning, cilInfo } from '@coreui/icons'
import './Modal.css'

export default function Modal({
    visible = false,
    type = 'success', // 'success', 'error', 'warning', 'info'
    title = '',
    message = '',
    onClose = () => {},
    onConfirm = null,
    confirmText = 'Confirmer',
    closeText = 'Fermer',
    size = 'md',
}) {
    const getIconAndColor = () => {
        switch (type) {
            case 'success':
                return { icon: cilCheckAlt, color: 'success' }
            case 'error':
                return { icon: cilX, color: 'danger' }
            case 'warning':
                return { icon: cilWarning, color: 'warning' }
            case 'info':
                return { icon: cilInfo, color: 'info' }
            default:
                return { icon: cilCheckAlt, color: 'primary' }
        }
    }

    const { icon, color } = getIconAndColor()

    return (
        <CModal
            visible={visible}
            onClose={onClose}
            backdrop="static"
            size={size}
            className={`custom-modal modal-${type}`}
        >
            <CModalHeader closeButton className={`modal-header-${type}`}>
                <div className="d-flex align-items-center gap-2">
                    <div className={`modal-icon modal-icon-${type}`}>
                        <CIcon icon={icon} size="lg" />
                    </div>
                    <h5 className="mb-0">{title}</h5>
                </div>
            </CModalHeader>

            <CModalBody className="modal-body-content">
                <p className="modal-message">{message}</p>
            </CModalBody>

            <CModalFooter className="modal-footer-custom">
                <CButton
                    color="secondary"
                    onClick={onClose}
                    className="btn-modal-close"
                >
                    {closeText}
                </CButton>
                {onConfirm && (
                    <CButton
                        color={color}
                        onClick={onConfirm}
                        className={`btn-modal-confirm btn-modal-${type}`}
                    >
                        {confirmText}
                    </CButton>
                )}
            </CModalFooter>
        </CModal>
    )
}
