import { CSpinner } from '@coreui/react'
import PropTypes from 'prop-types'
import './LoadingSpinner.css'

/**
 * LoadingSpinner - Composant de chargement unifié
 * 
 * @param {boolean} isLoading - Affiche le spinner si true
 * @param {boolean} fullPage - Overlay pleine page si true
 * @param {string} message - Message optionnel sous le spinner
 * @param {string} size - Taille du spinner ('sm', 'md', 'lg')
 * @param {string} color - Couleur CoreUI ('primary', 'secondary', etc.)
 */
export default function LoadingSpinner({
    isLoading = false,
    fullPage = false,
    message = '',
    size = 'md',
    color = 'primary',
}) {
    if (!isLoading) return null

    const getSpinnerSize = () => {
        switch (size) {
            case 'sm':
                return { width: '1.5rem', height: '1.5rem' }
            case 'lg':
                return { width: '4rem', height: '4rem' }
            default:
                return { width: '2.5rem', height: '2.5rem' }
        }
    }

    const spinnerContent = (
        <div className="spinner-content">
            <CSpinner
                color={color}
                style={getSpinnerSize()}
            />
            {message && (
                <p className="spinner-message mt-3 mb-0">{message}</p>
            )}
        </div>
    )

    if (fullPage) {
        return (
            <div className="loading-overlay loading-fullpage">
                {spinnerContent}
            </div>
        )
    }

    return (
        <div className="loading-container">
            {spinnerContent}
        </div>
    )
}

LoadingSpinner.propTypes = {
    isLoading: PropTypes.bool,
    fullPage: PropTypes.bool,
    message: PropTypes.string,
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    color: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark']),
}
