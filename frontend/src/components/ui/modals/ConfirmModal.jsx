import { useEffect } from 'react'
import {
    CModal,
    CModalHeader,
    CModalBody,
    CModalFooter,
    CButton,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilWarning, cilTrash, cilInfo } from '@coreui/icons'
import PropTypes from 'prop-types'
import './Modals.css'

/**
 * ConfirmModal - Modal de confirmation réutilisable
 * Supporte plusieurs types: warning, danger, info
 */
export default function ConfirmModal({
    visible = false,
    type = 'warning', // 'warning', 'danger', 'info'
    title = 'Confirmation',
    message = '',
    onClose = () => {},
    onConfirm = () => {},
    closeText = 'Annuler',
    confirmText = 'Confirmer',
    isLoading = false,
}) {
    // Fermer avec Échap
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && visible && !isLoading) {
                onClose()
            }
        }
        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [visible, onClose, isLoading])

    const getIcon = () => {
        switch (type) {
            case 'danger':
                return cilTrash
            case 'info':
                return cilInfo
            default:
                return cilWarning
        }
    }

    const getColor = () => {
        switch (type) {
            case 'danger':
                return 'danger'
            case 'info':
                return 'info'
            default:
                return 'warning'
        }
    }

    const color = getColor()

    return (
        <CModal
            visible={visible}
            onClose={isLoading ? undefined : onClose}
            backdrop={isLoading ? 'static' : true}
            keyboard={!isLoading}
            alignment="center"
            className={`unified-modal confirm-modal confirm-modal-${type}`}
        >
            <CModalHeader className="border-0 pb-0">
                <div className="d-flex align-items-center gap-2">
                    <div className={`modal-icon-wrapper bg-${color} bg-opacity-10 text-${color}`}>
                        <CIcon icon={getIcon()} size="xl" />
                    </div>
                    <h5 className={`mb-0 fw-semibold text-${color}`}>{title}</h5>
                </div>
            </CModalHeader>

            <CModalBody className="pt-3">
                <p className="mb-0 text-body">{message}</p>
            </CModalBody>

            <CModalFooter className="border-0 pt-0">
                <CButton
                    color="secondary"
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-4"
                >
                    {closeText}
                </CButton>
                <CButton
                    color={color}
                    onClick={onConfirm}
                    disabled={isLoading}
                    className="px-4"
                >
                    {isLoading ? 'Chargement...' : confirmText}
                </CButton>
            </CModalFooter>
        </CModal>
    )
}

ConfirmModal.propTypes = {
    visible: PropTypes.bool,
    type: PropTypes.oneOf(['warning', 'danger', 'info']),
    title: PropTypes.string,
    message: PropTypes.string,
    onClose: PropTypes.func,
    onConfirm: PropTypes.func,
    closeText: PropTypes.string,
    confirmText: PropTypes.string,
    isLoading: PropTypes.bool,
}
