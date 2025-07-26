
function isNewTransaction() {
  const urlParams = new URLSearchParams(window.location.search);
  return !urlParams.has("id");
}

function createTransaction() {
  return {
    type: document.getElementById("type").value,
    date: document.getElementById("date").value,
    money: {
      currency: "BRL",
      value: parseFloat(document.getElementById("value").value)
    },
    transactionType: document.getElementById("transaction-type").value,
    description: document.getElementById("description").value,
    user: firebase.auth().currentUser.uid
  };
}

function saveTransaction() {
  const transaction = createTransaction();
  const installments = parseInt(document.getElementById("installments").value);

  if (installments > 1) {
    saveInstallments(transaction, installments);
  } else {
    if (isNewTransaction()) {
      save(transaction);
    } else {
      update(transaction);
    }
  }
}

function saveInstallments(baseTransaction, installments) {
  const totalValue = baseTransaction.money.value;
  const monthlyValue = +(totalValue / installments).toFixed(2);
  const originalDate = new Date(baseTransaction.date);
  const groupId = crypto.randomUUID();

  const allInstallments = [];

  for (let i = 0; i < installments; i++) {
    const installmentDate = new Date(originalDate);
    installmentDate.setMonth(installmentDate.getMonth() + i);

    allInstallments.push({
      ...baseTransaction,
      date: installmentDate.toISOString().split("T")[0],
      money: {
        ...baseTransaction.money,
        value: monthlyValue
      },
      parcela: `${i + 1}/${installments}`,
      groupId: groupId
    });
  }

  showLoading();
  Promise.all(allInstallments.map((t) => transactionService.save(t)))
    .then(() => {
      hideLoading();
      const isLocal = window.location.protocol === "file:";
      const path = isLocal ? "../../pages/home/home.html" : "../../pages/home/home.html";
      window.location.href = "../home/home.html";
    })
    .catch(() => {
      hideLoading();
      alert("Erro ao salvar parcelas");
    });
}
