const admin = require("firebase-admin");
const fs = require("fs");

// Caminho para seu arquivo de chave
const serviceAccount = require("./serviceAccountKey.json");

// Inicializa o Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function corrigirTransacoes() {
  const snapshot = await db.collection("transactions").get();
  const atualizadas = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Verifica se não tem user ou user.uid
    if (!data.user || !data.user.uid) {
      // Atualiza com um uid padrão
      const uidPadrao = "uid-desconhecido"; // Você pode alterar esse valor

      const novaUser = {
        user: {
          uid: uidPadrao
        }
      };

      await db.collection("transactions").doc(doc.id).update(novaUser);
      atualizadas.push(doc.id);
      console.log(`Corrigido: ${doc.id}`);
    }
  }

  console.log(`✅ Corrigidas ${atualizadas.length} transações que estavam sem user.uid.`);
}

corrigirTransacoes().catch(console.error);
