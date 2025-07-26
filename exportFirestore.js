const fs = require("fs");
const admin = require("firebase-admin");

// Caminho para sua chave privada
const serviceAccount = require("./serviceAccountKey.json");

// Inicializa o Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Altere aqui para o nome da sua coleção
const COLLECTION_NAME = "transactions";

async function exportCollection() {
  const snapshot = await db.collection(COLLECTION_NAME).get();
  const data = [];

  snapshot.forEach((doc) => {
    data.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  fs.writeFileSync(`${COLLECTION_NAME}.json`, JSON.stringify(data, null, 2));
  console.log(`✅ Dados exportados para ${COLLECTION_NAME}.json`);
}

exportCollection().catch(console.error);
