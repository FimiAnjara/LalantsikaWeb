<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Inscription - Lalantsika</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            max-width: 500px;
            width: 100%;
        }
        
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 10px;
        }
        
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 5px;
            color: #555;
            font-weight: 500;
        }
        
        input, select {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        
        input:focus, select:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        button:hover {
            transform: translateY(-2px);
        }
        
        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .message {
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            display: none;
        }
        
        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .message.show {
            display: block;
        }
        
        .response-box {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
            border: 1px solid #dee2e6;
            display: none;
        }
        
        .response-box.show {
            display: block;
        }
        
        .response-box h3 {
            margin-bottom: 10px;
            color: #333;
            font-size: 16px;
        }
        
        .response-box pre {
            background: #fff;
            padding: 10px;
            border-radius: 3px;
            overflow-x: auto;
            font-size: 12px;
        }
        
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Test d'Inscription</h1>
        <p class="subtitle">Formulaire de test sans connexion internet</p>
        
        <div id="message" class="message"></div>
        
        <form id="registerForm">
            <div class="form-group">
                <label for="identifiant">Identifiant *</label>
                <input type="text" id="identifiant" name="identifiant" required value="testuser123">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="nom">Nom *</label>
                    <input type="text" id="nom" name="nom" value="TestNom" required>
                </div>
                
                <div class="form-group">
                    <label for="prenom">Prénom *</label>
                    <input type="text" id="prenom" name="prenom" value="TestPrenom" required>
                </div>
            </div>
            
            <div class="form-group">
                <label for="email">Email *</label>
                <input type="email" id="email" name="email" required value="testuser@example.com">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="dtn">Date de naissance *</label>
                    <input type="date" id="dtn" name="dtn" value="2000-01-01" required>
                </div>
                
                <div class="form-group">
                    <label for="id_sexe">Sexe *</label>
                    <select id="id_sexe" name="id_sexe" required>
                        <option value="">Sélectionner</option>
                        <option value="1" selected>Masculin</option>
                        <option value="2">Féminin</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label for="mdp">Mot de passe *</label>
                <input type="password" id="mdp" name="mdp" value="password123" required minlength="6">
            </div>
            
            <div class="form-group">
                <label for="mdp_confirmation">Confirmer mot de passe *</label>
                <input type="password" id="mdp_confirmation" name="mdp_confirmation" value="password123" required minlength="6">
            </div>
            
            <button type="submit" id="submitBtn">
                <span id="btnText">S'inscrire</span>
                <span id="btnLoading" style="display: none;" class="loading"></span>
            </button>
        </form>
        
        <div id="responseBox" class="response-box">
            <h3>Réponse de l'API :</h3>
            <pre id="responseContent"></pre>
        </div>
    </div>
    
    <script>
        const form = document.getElementById('registerForm');
        const messageDiv = document.getElementById('message');
        const responseBox = document.getElementById('responseBox');
        const responseContent = document.getElementById('responseContent');
        const submitBtn = document.getElementById('submitBtn');
        const btnText = document.getElementById('btnText');
        const btnLoading = document.getElementById('btnLoading');
        
        function showMessage(text, type) {
            messageDiv.textContent = text;
            messageDiv.className = `message ${type} show`;
            setTimeout(() => {
                messageDiv.classList.remove('show');
            }, 5000);
        }
        
        function showResponse(data) {
            responseContent.textContent = JSON.stringify(data, null, 2);
            responseBox.classList.add('show');
        }
        
        function setLoading(loading) {
            submitBtn.disabled = loading;
            btnText.style.display = loading ? 'none' : 'inline';
            btnLoading.style.display = loading ? 'inline-block' : 'none';
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Collecter les données du formulaire
            const formData = {
                identifiant: document.getElementById('identifiant').value,
                nom: document.getElementById('nom').value,
                prenom: document.getElementById('prenom').value,
                email: document.getElementById('email').value,
                dtn: document.getElementById('dtn').value,
                id_sexe: parseInt(document.getElementById('id_sexe').value),
                mdp: document.getElementById('mdp').value,
                mdp_confirmation: document.getElementById('mdp_confirmation').value
            };
            
            // Vérifier que les mots de passe correspondent
            if (formData.mdp !== formData.mdp_confirmation) {
                showMessage('Les mots de passe ne correspondent pas', 'error');
                return;
            }
            
            setLoading(true);
            responseBox.classList.remove('show');
            
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showMessage('✅ Inscription réussie! Synchronisation: ' + (data.synchronized ? 'OUI' : 'NON'), 'success');
                    showResponse(data);
                    form.reset();
                } else {
                    showMessage('❌ Erreur: ' + (data.message || 'Inscription échouée'), 'error');
                    showResponse(data);
                }
            } catch (error) {
                showMessage('❌ Erreur de connexion: ' + error.message, 'error');
                showResponse({ error: error.message });
            } finally {
                setLoading(false);
            }
        });
    </script>
</body>
</html>
