const transactionService = {
  findByUser: (user) => {
    const query = firebase
      .firestore()
      .collection("transactions")
      .where("user.uid", "==", user.uid)
      .orderBy("date", "desc");

    return query
      .get()
      .then((snapshot) => {
        return snapshot.docs.map((doc) => ({
          ...doc.data(),
          uid: doc.id,
        }));
      })
      .catch((error) => {
        console.error("Erro ao buscar transações:", error.message);
        throw error; // permite que o .catch externo trate corretamente
      });
  },

  findByUid: (uid) => {
    return firebase
      .firestore()
      .collection("transactions")
      .doc(uid)
      .get()
      .then((doc) => {
        return doc.data();
      });
  },

  remove: (transaction) => {
    return firebase
      .firestore()
      .collection("transactions")
      .doc(transaction.uid)
      .delete();
  },

  save: (transaction) => {
    return firebase.firestore().collection("transactions").add(transaction);
  },

  update: (transaction) => {
    return firebase
      .firestore()
      .collection("transactions")
      .doc(getTransactionUid()) // OBS: isso deve retornar o UID correto
      .update(transaction);
  },
};
