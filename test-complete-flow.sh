#!/bin/bash

API="http://127.0.0.1:8000/api"
TIMESTAMP=$(date +%s%N)

echo "🧪 TEST COMPLET: Upload photo + Create utilisateur"
echo "=================================================="

# 1. Login
echo ""
echo "1️⃣  Login pour obtenir token..."
LOGIN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "mdp": "Bossy2024"
  }')

TOKEN=$(echo "$LOGIN" | jq -r '.data.token // empty')
if [ -z "$TOKEN" ]; then
  echo "❌ Erreur login"
  echo "$LOGIN" | jq .
  exit 1
fi
echo "✅ Token obtenu"

# 2. Upload photo
echo ""
echo "2️⃣  Créer et uploader une image de test..."

python3 << 'PYTHON'
from PIL import Image
img = Image.new('RGB', (100, 100), color='green')
img.save('/tmp/test.png')
PYTHON

UPLOAD=$(curl -s -X POST "$API/storage/upload/user-photo" \
  -H "Authorization: Bearer $TOKEN" \
  -F "photo=@/tmp/test.png")

PHOTO_PATH=$(echo "$UPLOAD" | jq -r '.path // empty')
if [ -z "$PHOTO_PATH" ]; then
  echo "❌ Erreur upload"
  echo "$UPLOAD" | jq .
  exit 1
fi
echo "✅ Photo uploadée: $PHOTO_PATH"

# 3. Create utilisateur avec photo_path
echo ""
echo "3️⃣  Créer utilisateur avec la photo..."

EMAIL="test_$TIMESTAMP@example.com"
IDENTIFIANT="user_$TIMESTAMP"

REGISTER=$(curl -s -X POST "$API/auth/register" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "identifiant=$IDENTIFIANT" \
  --data-urlencode "nom=Test" \
  --data-urlencode "prenom=User" \
  --data-urlencode "dtn=2000-01-01" \
  --data-urlencode "email=$EMAIL" \
  --data-urlencode "id_sexe=1" \
  --data-urlencode "mdp=password123" \
  --data-urlencode "mdp_confirmation=password123" \
  --data-urlencode "photo_path=$PHOTO_PATH")

echo "Response: $(echo "$REGISTER" | jq -c .)"

SAVED_PHOTO=$(echo "$REGISTER" | jq -r '.data.user.photo_url // empty')

echo ""
echo "📊 RÉSULTAT:"
echo "  Upload path: $PHOTO_PATH"
echo "  Saved in DB: $SAVED_PHOTO"
echo ""

if [ "$PHOTO_PATH" = "$SAVED_PHOTO" ]; then
  echo "✅✅✅ SUCCESS! Photo correctement sauvegardée!"
else
  echo "❌ ERREUR: Photos ne correspondent pas"
  exit 1
fi
