import React, { useState } from 'react'
import { API_BASE_URL } from '../config/api'

/**
 * Composant de test pour diagnostiquer les problèmes d'authentification
 */
export function StorageDebug() {
    const [testResults, setTestResults] = useState([])
    const [loading, setLoading] = useState(false)

    const addResult = (title, success, message) => {
        setTestResults(prev => [...prev, { title, success, message }])
    }

    const runTests = async () => {
        setTestResults([])
        setLoading(true)

        try {
            // Test 1: Token disponible
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
            addResult('Token disponible', !!token, token ? `✓ Token trouvé (${token.substring(0, 20)}...)` : '✗ Aucun token')

            if (!token) {
                setLoading(false)
                return
            }

            // Test 2: Auth endpoint
            try {
                const testResponse = await fetch(`${API_BASE_URL}/api/debug/auth`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                })
                const authData = await testResponse.json()
                addResult('JWT Auth', testResponse.ok, testResponse.ok ? `✓ Authentifié - User: ${authData.user?.email}` : `✗ Erreur ${testResponse.status}`)
            } catch (e) {
                addResult('JWT Auth', false, `✗ ${e.message}`)
            }

            // Test 3: Storage check
            try {
                const storageResponse = await fetch(`${API_BASE_URL}/api/debug/storage-check`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                })
                const storageData = await storageResponse.json()
                const success = storageData.public_writable && storageData.utilisateur_writable
                addResult(
                    'Storage permissions', 
                    success, 
                    success ? '✓ Dossiers accessible en écriture' : `⚠️ public:${storageData.public_writable}, utilisateur:${storageData.utilisateur_writable}`
                )
            } catch (e) {
                addResult('Storage permissions', false, `✗ ${e.message}`)
            }

            // Test 4: Upload test simple
            try {
                const canvas = document.createElement('canvas')
                canvas.width = 100
                canvas.height = 100
                const ctx = canvas.getContext('2d')
                ctx.fillStyle = 'blue'
                ctx.fillRect(0, 0, 100, 100)
                
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
                const formData = new FormData()
                formData.append('file', blob, 'test.png')

                const uploadResponse = await fetch(`${API_BASE_URL}/api/debug/upload`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                    body: formData,
                })

                const uploadData = await uploadResponse.json()
                addResult('Debug upload', uploadResponse.ok, uploadResponse.ok ? `✓ Upload réussi: ${uploadData.path}` : `✗ ${uploadData.error || uploadResponse.statusText}`)
            } catch (e) {
                addResult('Debug upload', false, `✗ ${e.message}`)
            }

            // Test 5: Photo upload endpoint
            try {
                const canvas = document.createElement('canvas')
                canvas.width = 100
                canvas.height = 100
                const ctx = canvas.getContext('2d')
                ctx.fillStyle = 'red'
                ctx.fillRect(0, 0, 100, 100)
                
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
                const formData = new FormData()
                formData.append('photo', blob, 'photo-test.png')

                const photoResponse = await fetch(`${API_BASE_URL}/api/storage/upload/user-photo`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                    body: formData,
                })

                const photoData = await photoResponse.json()
                addResult('Photo upload', photoResponse.ok, photoResponse.ok ? `✓ Photo: ${photoData.path}` : `✗ ${photoData.error || photoResponse.statusText}`)
            } catch (e) {
                addResult('Photo upload', false, `✗ ${e.message}`)
            }

        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px' }}>
            <h3>🔧 Diagnostic Storage</h3>
            <button onClick={runTests} disabled={loading} style={{ marginBottom: '20px', padding: '10px 20px' }}>
                {loading ? 'Test en cours...' : 'Exécuter les tests'}
            </button>
            
            {testResults.map((result, idx) => (
                <div key={idx} style={{ 
                    marginBottom: '10px', 
                    padding: '10px', 
                    backgroundColor: result.success ? '#e8f5e9' : '#ffebee',
                    borderLeft: `4px solid ${result.success ? '#4caf50' : '#f44336'}`,
                    borderRadius: '4px'
                }}>
                    <strong>{result.title}:</strong> {result.message}
                </div>
            ))}
        </div>
    )
}

export default StorageDebug

