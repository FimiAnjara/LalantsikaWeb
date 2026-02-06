import { useEffect } from 'react'
import {
    CModal,
    CModalHeader,
    CModalBody,
    CModalFooter,
    CButton,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckCircle } from '@coreui/icons'
import PropTypes from 'prop-types'
import './Modals.css'

/**
 * SuccessModal - Modal de succès réutilisable
 * Utilise les couleurs de base CoreUI (success)
 */
export default function SuccessModal({
    visible = false,
    title = 'Succès',
    message = '',
    onClose = () => {},
    closeText = 'Fermer',
}) {
    // Fermer avec Échap
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && visible) {
                onClose()
            }
        }
        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [visible, onClose])

    return (
        <CModal
            visible={visible}
            onClose={onClose}
            backdrop={true}
            keyboard={true}
            alignment="center"
            className="unified-modal success-modal"
        >
            <CModalHeader className="border-0 pb-0">
                <div className="d-flex align-items-center gap-2">
                    <div className="modal-icon-wrapper bg-success bg-opacity-10 text-success">
                        <CIcon icon={cilCheckCircle} size="xl" />
                    </div>
                    <h5 className="mb-0 fw-semibold text-success">{title}</h5>
                </div>
            </CModalHeader>

            <CModalBody className="pt-3">
                <p className="mb-0 text-body">{message}</p>
            </CModalBody>

            <CModalFooter className="border-0 pt-0">
                <CButton
                    color="success"
                    onClick={onClose}
                    className="px-4"
                >
                    {closeText}
                </CButton>
            </CModalFooter>
        </CModal>
    )
}

SuccessModal.propTypes = {
    visible: PropTypes.bool,
    title: PropTypes.string,
    message: PropTypes.string,
    onClose: PropTypes.func,
    closeText: PropTypes.string,
}
