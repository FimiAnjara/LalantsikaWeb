import { useEffect } from 'react'
import {
    CModal,
    CModalHeader,
    CModalBody,
    CModalFooter,
    CButton,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilXCircle } from '@coreui/icons'
import PropTypes from 'prop-types'
import './Modals.css'

/**
 * ErrorModal - Modal d'erreur réutilisable
 * Utilise les couleurs de base CoreUI (danger)
 */
export default function ErrorModal({
    visible = false,
    title = 'Erreur',
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
            className="unified-modal error-modal"
        >
            <CModalHeader className="border-0 pb-0">
                <div className="d-flex align-items-center gap-2">
                    <div className="modal-icon-wrapper bg-danger bg-opacity-10 text-danger">
                        <CIcon icon={cilXCircle} size="xl" />
                    </div>
                    <h5 className="mb-0 fw-semibold text-danger">{title}</h5>
                </div>
            </CModalHeader>

            <CModalBody className="pt-3">
                <p className="mb-0 text-body">{message}</p>
            </CModalBody>

            <CModalFooter className="border-0 pt-0">
                <CButton
                    color="danger"
                    onClick={onClose}
                    className="px-4"
                >
                    {closeText}
                </CButton>
            </CModalFooter>
        </CModal>
    )
}

ErrorModal.propTypes = {
    visible: PropTypes.bool,
    title: PropTypes.string,
    message: PropTypes.string,
    onClose: PropTypes.func,
    closeText: PropTypes.string,
}
