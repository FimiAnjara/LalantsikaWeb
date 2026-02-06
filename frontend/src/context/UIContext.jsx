import { createContext, useContext, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { LoadingSpinner, ErrorModal, SuccessModal, ConfirmModal } from '../components/ui'

/**
 * UIContext - Contexte global pour gérer les états UI
 * (modals, loading, notifications)
 */
const UIContext = createContext(null)

export function UIProvider({ children }) {
    // Loading state
    const [loading, setLoading] = useState({
        isLoading: false,
        fullPage: false,
        message: '',
    })

    // Error modal state
    const [errorModal, setErrorModal] = useState({
        visible: false,
        title: 'Erreur',
        message: '',
    })

    // Success modal state
    const [successModal, setSuccessModal] = useState({
        visible: false,
        title: 'Succès',
        message: '',
    })

    // Confirm modal state
    const [confirmModal, setConfirmModal] = useState({
        visible: false,
        type: 'warning',
        title: 'Confirmation',
        message: '',
        onConfirm: () => {},
        isLoading: false,
    })

    // Loading helpers
    const showLoading = useCallback((message = '', fullPage = false) => {
        setLoading({ isLoading: true, fullPage, message })
    }, [])

    const hideLoading = useCallback(() => {
        setLoading({ isLoading: false, fullPage: false, message: '' })
    }, [])

    // Error modal helpers
    const showError = useCallback((message, title = 'Erreur') => {
        setErrorModal({ visible: true, title, message })
    }, [])

    const hideError = useCallback(() => {
        setErrorModal(prev => ({ ...prev, visible: false }))
    }, [])

    // Success modal helpers
    const showSuccess = useCallback((message, title = 'Succès') => {
        setSuccessModal({ visible: true, title, message })
    }, [])

    const hideSuccess = useCallback(() => {
        setSuccessModal(prev => ({ ...prev, visible: false }))
    }, [])

    // Confirm modal helpers
    const showConfirm = useCallback((options) => {
        const {
            type = 'warning',
            title = 'Confirmation',
            message = '',
            onConfirm = () => {},
            confirmText = 'Confirmer',
            closeText = 'Annuler',
        } = options

        setConfirmModal({
            visible: true,
            type,
            title,
            message,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isLoading: true }))
                try {
                    await onConfirm()
                } finally {
                    setConfirmModal(prev => ({ ...prev, visible: false, isLoading: false }))
                }
            },
            confirmText,
            closeText,
            isLoading: false,
        })
    }, [])

    const hideConfirm = useCallback(() => {
        if (!confirmModal.isLoading) {
            setConfirmModal(prev => ({ ...prev, visible: false }))
        }
    }, [confirmModal.isLoading])

    const value = {
        // Loading
        loading,
        showLoading,
        hideLoading,
        // Error
        errorModal,
        showError,
        hideError,
        // Success
        successModal,
        showSuccess,
        hideSuccess,
        // Confirm
        confirmModal,
        showConfirm,
        hideConfirm,
    }

    return (
        <UIContext.Provider value={value}>
            {children}

            {/* Global Loading Spinner */}
            <LoadingSpinner
                isLoading={loading.isLoading}
                fullPage={loading.fullPage}
                message={loading.message}
            />

            {/* Global Error Modal */}
            <ErrorModal
                visible={errorModal.visible}
                title={errorModal.title}
                message={errorModal.message}
                onClose={hideError}
            />

            {/* Global Success Modal */}
            <SuccessModal
                visible={successModal.visible}
                title={successModal.title}
                message={successModal.message}
                onClose={hideSuccess}
            />

            {/* Global Confirm Modal */}
            <ConfirmModal
                visible={confirmModal.visible}
                type={confirmModal.type}
                title={confirmModal.title}
                message={confirmModal.message}
                onClose={hideConfirm}
                onConfirm={confirmModal.onConfirm}
                confirmText={confirmModal.confirmText}
                closeText={confirmModal.closeText}
                isLoading={confirmModal.isLoading}
            />
        </UIContext.Provider>
    )
}

UIProvider.propTypes = {
    children: PropTypes.node.isRequired,
}

/**
 * Hook pour accéder au contexte UI
 */
export function useUI() {
    const context = useContext(UIContext)
    if (!context) {
        throw new Error('useUI doit être utilisé dans un UIProvider')
    }
    return context
}

export default UIContext
