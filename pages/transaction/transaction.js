// transaction.js

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    carregarParcelas();
    carregarCategorias();

    document.getElementById("date").addEventListener("input", validateForm);
    document.getElementById("value").addEventListener("input", validateForm);
    document
      .getElementById("transaction-type")
      .addEventListener("change", validateForm);

    document
      .getElementById("add-category")
      .addEventListener("click", abrirInputNovaCategoria);
    document
      .getElementById("remove-category")
      .addEventListener("click", removerCategoria);
    document
      .getElementById("salvar-nova-categoria")
      .addEventListener("click", salvarNovaCategoria);

    if (!isNewTransaction()) {
      const uid = getTransactionUid();
      findTransactionByUid(uid);
    }

    validateForm();
  } else {
    window.location.href = "../../login.html";
  }
});

const categoriasFixas = [
  "Acomodação",
  "Alimentação",
  "Outros",
  "Salário",
  "Supermercado",
  "Transporte",
];

function carregarParcelas() {
  const select = document.getElementById("installments");
  for (let i = 1; i <= 48; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${i}x`;
    select.appendChild(option);
  }
}

async function carregarCategorias() {
  const user = firebase.auth().currentUser;
  const select = document.getElementById("transaction-type");
  select.innerHTML = "";

  categoriasFixas.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    option.setAttribute("data-fixa", "true");
    select.appendChild(option);
  });

  const snapshot = await firebase
    .firestore()
    .collection("categorias")
    .where("uid", "==", user.uid)
    .get();

  snapshot.forEach((doc) => {
    const option = document.createElement("option");
    option.value = doc.data().nome;
    option.textContent = doc.data().nome;
    option.setAttribute("data-id", doc.id);
    select.appendChild(option);
  });

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- Selecione um tipo de transação --";
  select.insertBefore(defaultOption, select.firstChild);
}

function abrirInputNovaCategoria() {
  const container = document.getElementById("nova-categoria");
  if (container) container.classList.remove("hidden");
}

async function salvarNovaCategoria() {
  const input = document.getElementById("nova-categoria-input");
  const nome = input.value.trim();

  if (!nome || categoriasFixas.includes(nome)) {
    alert("Nome inválido ou categoria fixa já existente.");
    return;
  }

  const user = firebase.auth().currentUser;

  const snapshot = await firebase
    .firestore()
    .collection("categorias")
    .where("uid", "==", user.uid)
    .where("nome", "==", nome)
    .get();

  if (!snapshot.empty) {
    alert("Categoria personalizada já existe.");
    return;
  }

  await firebase
    .firestore()
    .collection("categorias")
    .add({ uid: user.uid, nome });

  input.value = "";
  document.getElementById("nova-categoria").classList.add("hidden");
  carregarCategorias();
}

async function removerCategoria() {
  const select = document.getElementById("transaction-type");
  const selectedOption = select.options[select.selectedIndex];

  const isFixa = selectedOption.getAttribute("data-fixa") === "true";
  const id = selectedOption.getAttribute("data-id");

  if (isFixa || !id) {
    alert("Categorias fixas não podem ser removidas.");
    return;
  }

  await firebase.firestore().collection("categorias").doc(id).delete();
  carregarCategorias();
}

function getTransactionUid() {
  const params = new URLSearchParams(window.location.search);
  return params.get("uid");
}

function isNewTransaction() {
  return !getTransactionUid();
}

function findTransactionByUid(uid) {
  showLoading();
  transactionService
    .findByUid(uid)
    .then((transaction) => {
      hideLoading();
      if (transaction) {
        fillTransactionScreen(transaction);
        validateForm();
      } else {
        alert("Documento não encontrado");
        paraCasa();
      }
    })
    .catch(() => {
      hideLoading();
      alert("Erro ao recuperar documento");
      paraCasa();
    });
}

function fillTransactionScreen(transaction) {
  if (transaction.type === "expense") {
    form.typeExpense().checked = true;
  } else {
    form.typeIncome().checked = true;
  }

  const dateObj = transaction.date.toDate
    ? transaction.date.toDate()
    : new Date(transaction.date);
  form.date().value = dateObj.toISOString().split("T")[0];

  form.currency().value = transaction.money.currency;
  form.value().value = transaction.money.value;
  form.transactionType().value = transaction.transactionType;

  if (transaction.description) {
    form.description().value = transaction.description;
  }
}

function saveTransaction() {
  const transaction = createTransaction();
  const installments = parseInt(document.getElementById("installments").value);

  if (installments > 1) {
    saveInstallments(transaction, installments);
  } else {
    isNewTransaction() ? save(transaction) : update(transaction);
  }
}

function save(transaction) {
  showLoading();
  transactionService
    .save(transaction)
    .then(() => {
      hideLoading();
      paraCasa();
    })
    .catch(() => {
      hideLoading();
      alert("Erro ao salvar transação");
    });
}

function update(transaction) {
  showLoading();
  transactionService
    .update(transaction)
    .then(() => {
      hideLoading();
      paraCasa();
    })
    .catch(() => {
      hideLoading();
      alert("Erro ao atualizar transação");
    });
}

function createTransaction() {
  const dateValue = form.date().value;
  const parsedDate = new Date(dateValue);

  return {
    type: form.typeExpense().checked ? "expense" : "income",
    date: parsedDate,
    money: {
      currency: form.currency().value,
      value: parseFloat(form.value().value),
    },
    transactionType: form.transactionType().value,
    description: form.description().value,
    user: {
      uid: firebase.auth().currentUser.uid,
    },
  };
}

function validateForm() {
  const date = form.date().value;
  const value = parseFloat(form.value().value);
  const type = form.transactionType().value;

  const isValid = date && !isNaN(value) && value > 0 && type;
  form.saveButton().disabled = !isValid;
}

function paraCasa() {
  const isLocal = window.location.protocol === "file:";
  const path = isLocal ? "../../pages/home/home.html" : "../home/home.html";
  window.location.href = path;
}

function saveInstallments(baseTransaction, installments) {
  const totalValue = baseTransaction.money.value;
  const monthlyValue = +(totalValue / installments).toFixed(2);
  const originalDate = new Date(baseTransaction.date);
  const groupId = crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substr(2, 9);

  const allInstallments = [];

  for (let i = 0; i < installments; i++) {
    const installmentDate = new Date(originalDate);
    installmentDate.setMonth(installmentDate.getMonth() + i);

    allInstallments.push({
      ...baseTransaction,
      date: firebase.firestore.Timestamp.fromDate(installmentDate),
      money: {
        ...baseTransaction.money,
        value: monthlyValue,
      },
      parcela: `${i + 1}/${installments}`,
      groupId,
    });
  }

  showLoading();
  Promise.all(allInstallments.map((t) => transactionService.save(t)))
    .then(() => {
      hideLoading();
      paraCasa();
    })
    .catch(() => {
      hideLoading();
      alert("Erro ao salvar parcelas");
    });
}

const form = {
  currency: () => document.getElementById("currency"),
  date: () => document.getElementById("date"),
  description: () => document.getElementById("description"),
  saveButton: () => document.getElementById("save-button"),
  transactionType: () => document.getElementById("transaction-type"),
  typeExpense: () => document.getElementById("expense"),
  typeIncome: () => document.getElementById("income"),
  value: () => document.getElementById("value"),
};
