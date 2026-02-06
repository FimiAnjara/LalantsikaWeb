/**
 * ===========================================
 * Guide d'utilisation des composants UI unifiés
 * ===========================================
 * 
 * Ce fichier montre comment utiliser les nouveaux composants
 * ErrorModal, SuccessModal, ConfirmModal et LoadingSpinner
 * ainsi que le contexte UI global (useUI).
 */

import { useState } from 'react'
import { CButton, CContainer, CRow, CCol, CCard, CCardBody, CCardHeader } from '@coreui/react'

// ==========================================
// MÉTHODE 1: Utilisation avec le contexte global UIProvider
// ==========================================
// Le UIProvider est déjà ajouté dans App.jsx, donc vous pouvez
// utiliser le hook useUI dans n'importe quel composant enfant.

import { useUI } from '../../context/UIContext'

export function ExempleAvecContexte() {
    const { 
        showLoading, 
        hideLoading, 
        showError, 
        showSuccess, 
        showConfirm 
    } = useUI()

    // Exemple: Afficher un spinner de chargement
    const handleLoadData = async () => {
        showLoading('Chargement des données...', true) // fullPage = true
        
        try {
            // Simuler un appel API
            await new Promise(resolve => setTimeout(resolve, 2000))
            showSuccess('Données chargées avec succès !')
        } catch (error) {
            showError('Erreur lors du chargement des données')
        } finally {
            hideLoading()
        }
    }

    // Exemple: Confirmation avant suppression
    const handleDelete = (itemId) => {
        showConfirm({
            type: 'danger',
            title: 'Confirmer la suppression',
            message: 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.',
            confirmText: 'Supprimer',
            closeText: 'Annuler',
            onConfirm: async () => {
                // Logique de suppression
                await deleteItem(itemId)
                showSuccess('Élément supprimé avec succès')
            }
        })
    }

    return (
        <CContainer>
            <CRow className="g-3">
                <CCol xs={12} sm={6} md={4}>
                    <CButton color="primary" onClick={handleLoadData}>
                        Charger les données
                    </CButton>
                </CCol>
                <CCol xs={12} sm={6} md={4}>
                    <CButton color="danger" onClick={() => handleDelete(1)}>
                        Supprimer
                    </CButton>
                </CCol>
            </CRow>
        </CContainer>
    )
}


// ==========================================
// MÉTHODE 2: Utilisation directe des composants
// ==========================================
// Si vous préférez gérer l'état localement dans un composant

import { ErrorModal, SuccessModal, ConfirmModal } from '../../components/ui/modals'
import { LoadingSpinner } from '../../components/ui'

export function ExempleComposantsDirects() {
    const [loading, setLoading] = useState(false)
    const [errorModal, setErrorModal] = useState({ visible: false, message: '' })
    const [successModal, setSuccessModal] = useState({ visible: false, message: '' })
    const [confirmModal, setConfirmModal] = useState({ visible: false })

    const handleAction = async () => {
        setLoading(true)
        try {
            // Action async...
            await someAsyncAction()
            setSuccessModal({ visible: true, message: 'Action réussie !' })
        } catch (error) {
            setErrorModal({ visible: true, message: error.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            {/* Spinner de chargement */}
            <LoadingSpinner 
                isLoading={loading} 
                fullPage={true} 
                message="Traitement en cours..." 
            />

            {/* Modal d'erreur */}
            <ErrorModal
                visible={errorModal.visible}
                title="Erreur"
                message={errorModal.message}
                onClose={() => setErrorModal({ visible: false, message: '' })}
            />

            {/* Modal de succès */}
            <SuccessModal
                visible={successModal.visible}
                title="Succès"
                message={successModal.message}
                onClose={() => setSuccessModal({ visible: false, message: '' })}
            />

            {/* Modal de confirmation */}
            <ConfirmModal
                visible={confirmModal.visible}
                type="warning"
                title="Confirmation"
                message="Voulez-vous continuer ?"
                onClose={() => setConfirmModal({ visible: false })}
                onConfirm={handleAction}
                confirmText="Oui, continuer"
                closeText="Non, annuler"
            />

            <CButton onClick={() => setConfirmModal({ visible: true })}>
                Ouvrir confirmation
            </CButton>
        </>
    )
}


// ==========================================
// GRILLE RESPONSIVE - Exemples
// ==========================================
// Utiliser les classes Bootstrap/CoreUI pour le responsive

export function ExempleGrilleResponsive() {
    return (
        <CContainer fluid className="p-2 p-sm-3 p-lg-4">
            {/* Grille qui s'adapte aux tailles d'écran */}
            <CRow className="g-2 g-sm-3 g-lg-4">
                {/* 
                    xs={12} : pleine largeur sur mobile
                    sm={6}  : 2 colonnes sur tablette
                    lg={4}  : 3 colonnes sur desktop
                    xl={3}  : 4 colonnes sur grand écran
                */}
                <CCol xs={12} sm={6} lg={4} xl={3}>
                    <CCard>
                        <CCardBody>Carte 1</CCardBody>
                    </CCard>
                </CCol>
                <CCol xs={12} sm={6} lg={4} xl={3}>
                    <CCard>
                        <CCardBody>Carte 2</CCardBody>
                    </CCard>
                </CCol>
                <CCol xs={12} sm={6} lg={4} xl={3}>
                    <CCard>
                        <CCardBody>Carte 3</CCardBody>
                    </CCard>
                </CCol>
            </CRow>

            {/* Formulaire responsive */}
            <CRow className="g-3 mt-4">
                <CCol xs={12} md={6}>
                    <label className="form-label">Nom</label>
                    <input type="text" className="form-control" />
                </CCol>
                <CCol xs={12} md={6}>
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" />
                </CCol>
                <CCol xs={12}>
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows={3}></textarea>
                </CCol>
            </CRow>

            {/* Utilitaires d'affichage responsive */}
            <div className="mt-4">
                {/* Caché sur mobile, visible sur tablette+ */}
                <p className="d-none d-sm-block">Visible uniquement sur tablette et desktop</p>
                
                {/* Visible uniquement sur mobile */}
                <p className="d-sm-none">Visible uniquement sur mobile</p>
                
                {/* Padding responsive */}
                <div className="p-2 p-sm-3 p-lg-4 bg-light">
                    Padding qui s'adapte à la taille d'écran
                </div>
            </div>
        </CContainer>
    )
}


// ==========================================
// BREAKPOINTS COREUI/BOOTSTRAP
// ==========================================
/*
    xs  : < 576px   (mobile)
    sm  : ≥ 576px   (mobile large)
    md  : ≥ 768px   (tablette)
    lg  : ≥ 992px   (desktop)
    xl  : ≥ 1200px  (grand desktop)
    xxl : ≥ 1400px  (très grand écran)

    Utilisation dans les classes:
    - col-{breakpoint}-{size}  : Grille
    - d-{breakpoint}-{value}   : Display (none, block, flex, etc.)
    - p-{breakpoint}-{size}    : Padding
    - m-{breakpoint}-{size}    : Margin
    - text-{breakpoint}-{align}: Alignement texte
*/


// ==========================================
// STRUCTURE DES FICHIERS
// ==========================================
/*
src/
├── components/
│   ├── ui/
│   │   ├── modals/
│   │   │   ├── ErrorModal.jsx      # Modal d'erreur
│   │   │   ├── SuccessModal.jsx    # Modal de succès
│   │   │   ├── ConfirmModal.jsx    # Modal de confirmation
│   │   │   ├── Modals.css          # Styles des modals
│   │   │   └── index.js            # Export des modals
│   │   ├── LoadingSpinner.jsx      # Composant de chargement
│   │   ├── LoadingSpinner.css      # Styles du spinner
│   │   └── index.js                # Export principal
│   ├── GenericTable.jsx            # Table générique responsive
│   ├── GenericTable.css
│   ├── ActionButtons.jsx
│   └── Modal.jsx                   # Ancien modal (rétrocompatible)
├── context/
│   ├── UIContext.jsx               # Contexte UI global
│   └── index.js
├── layouts/
│   └── manager/
│       ├── MainManager.jsx         # Layout responsive avec sidebar mobile
│       └── MainManager.css
└── pages/
    └── manager/
        ├── login/
        │   ├── Login.jsx           # Page login responsive
        │   └── Login.css
        └── utilisateurs/
            └── liste/
                ├── Home.jsx        # Liste utilisateurs
                └── Liste.css       # Styles responsive
*/


// Fonction fictive pour l'exemple
async function deleteItem(id) {
    return new Promise(resolve => setTimeout(resolve, 1000))
}

async function someAsyncAction() {
    return new Promise(resolve => setTimeout(resolve, 1000))
}

export default ExempleAvecContexte
