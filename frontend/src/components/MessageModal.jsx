import { useEffect } from 'react'
import {
    CModal,
    CModalBody,
    CButton,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckCircle, cilXCircle, cilX } from '@coreui/icons'
import './MessageModal.css'

export default function MessageModal({ 
    visible, 
    type = 'success', // 'success' | 'error'
    title,
    message, 
    onClose,
    autoClose = true,
    autoCloseDelay = 3000 
}) {
    useEffect(() => {
        if (visible && autoClose) {
            const timer = setTimeout(() => {
                onClose()
            }, autoCloseDelay)
            return () => clearTimeout(timer)
        }
    }, [visible, autoClose, autoCloseDelay, onClose])

    const isSuccess = type === 'success'

    return (
        <CModal 
            visible={visible} 
            onClose={onClose}
            alignment="center"
            className={`message-modal ${type}`}
            backdrop="static"
        >
            <CModalBody className="p-0">
                <div className={`modal-content-wrapper ${type}`}>
                    {/* Close button */}
                    <button className="modal-close-btn" onClick={onClose}>
                        <CIcon icon={cilX} />
                    </button>

                    {/* Icon */}
                    <div className={`modal-icon ${type}`}>
                        <CIcon 
                            icon={isSuccess ? cilCheckCircle : cilXCircle} 
                            size="3xl"
                        />
                    </div>

                    {/* Title */}
                    <h4 className={`modal-title ${type}`}>
                        {title || (isSuccess ? 'Succès!' : 'Erreur!')}
                    </h4>

                    {/* Message */}
                    <p className="modal-message">
                        {message}
                    </p>

                    {/* Progress bar for auto-close */}
                    {autoClose && (
                        <div className="modal-progress-container">
                            <div 
                                className={`modal-progress-bar ${type}`}
                                style={{ animationDuration: `${autoCloseDelay}ms` }}
                            />
                        </div>
                    )}

                    {/* Button */}
                    <CButton 
                        className={`modal-btn ${type}`}
                        onClick={onClose}
                    >
                        {isSuccess ? 'Continuer' : 'Fermer'}
                    </CButton>
                </div>
            </CModalBody>
        </CModal>
    )
}
