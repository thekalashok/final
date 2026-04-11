import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function checkProducts() {
  const snapshot = await getDocs(collection(db, 'products'));
  const products = snapshot.docs.map(doc => doc.data());
  console.log('Products in DB:', products.length);
  console.log(products);
}

checkProducts().catch(console.error);
