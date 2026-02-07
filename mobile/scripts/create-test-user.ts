/**
 * Script pour créer un utilisateur test dans Firebase Auth + Firestore
 * 
 * Usage: npx ts-node scripts/create-test-user.ts
 * Ou:    npx tsx scripts/create-test-user.ts
 * 
 * Identifiants du compte test:
 *   Email:    test@lalantsika.mg
 *   Mot de passe: Test1234!
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDyiDpodbZ2yPLNFnERQAt-oXGs1-RZq4M",
  authDomain: "lalantsika-project.firebaseapp.com",
  databaseURL: "https://lalantsika-project-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "lalantsika-project",
  storageBucket: "lalantsika-project.firebasestorage.app",
  messagingSenderId: "681061277527",
  appId: "1:681061277527:web:ef6250570defc155512812",
  measurementId: "G-MP6R0PCT51"
};

const TEST_EMAIL = 'testtest@lalantsika.mg';
const TEST_PASSWORD = 'Test1234!';

async function main() {
  console.log('🔧 Création du compte test Lalantsika...\n');

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  let uid: string;

  // 1. Créer l'utilisateur dans Firebase Auth (ou récupérer s'il existe)
  try {
    const cred = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    uid = cred.user.uid;
    console.log('✅ Utilisateur Firebase Auth créé:', uid);
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  Utilisateur Firebase Auth existe déjà, connexion...');
      const cred = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
      uid = cred.user.uid;
      console.log('✅ Connecté avec UID:', uid);
    } else {
      console.error('❌ Erreur Firebase Auth:', error.message);
      process.exit(1);
    }
  }

  // 2. Vérifier si le document Firestore existe déjà
  const usersRef = collection(db, 'utilisateurs');
  const q = query(usersRef, where('email', '==', TEST_EMAIL));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    console.log('ℹ️  Document Firestore existe déjà, mise à jour de l\'UID...');
    const existingDoc = snapshot.docs[0];
    await setDoc(existingDoc.ref, { uid, firebase_uid: uid }, { merge: true });
    console.log('✅ Document mis à jour.\n');
  } else {
    // 3. Créer le document utilisateur dans Firestore
    const userDoc = {
      uid: uid,
      firebase_uid: uid,
      id_utilisateur: 9999,
      email: TEST_EMAIL,
      identifiant: 'testuser',
      nom: 'Test',
      prenom: 'Utilisateur',
      dtn: '2000-01-01',
      sexe: {
        id_sexe: 1,
        libelle: 'Masculin'
      },
      type_utilisateur: {
        id_type_utilisateur: 2,
        libelle: 'Utilisateur'
      },
      photoUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      last_sync_at: null,
      synchronized: true
    };

    await setDoc(doc(usersRef), userDoc);
    console.log('✅ Document Firestore créé.\n');
  }

  console.log('════════════════════════════════════════');
  console.log('  COMPTE TEST PRÊT');
  console.log('  Email:       test@lalantsika.mg');
  console.log('  Mot de passe: Test1234!');
  console.log('════════════════════════════════════════\n');

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
