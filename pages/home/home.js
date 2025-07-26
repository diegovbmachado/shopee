function logout() {
  firebase
    .auth()
    .signOut()
    .then(() => {
      const isLocal = window.location.protocol === "file:";
      const path = isLocal ? "../../index.html" : "/index.html";
      window.location.href = path;
    })
    .catch(() => {
      alert("Erro ao fazer logout");
    });
}

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    findTransactions(user);
    inicializarFiltroComMesAtual(); // ⬅️ Adicione essa linha aqui
  }
});

function newTransaction() {
  const isLocal = window.location.protocol === "file:";
  const path = isLocal
    ? "../transaction/transaction.html"
    : "/pages/transaction/transaction.html";
  window.location.href = path;
}

function findTransactions(user) {
  showLoading();
  transactionService
    .findByUser(user)
    .then((transactions) => {
      hideLoading();
      gerarGraficoPizza(transactions); // ⬅️ adicione esta linha aqui
      addTransactionsToScreen(transactions);
    })
    .catch((error) => {
      hideLoading();
      console.log(error);
      alert("Erro ao recuperar transacoes");
    });
}

function addTransactionsToScreen(transactions) {
  const orderedList = document.getElementById("transactions");

  transactions.forEach((transaction) => {
    const li = createTransactionListItem(transaction);
    li.appendChild(createDeleteButton(transaction));
    li.appendChild(createParagraph(formatDate(transaction.date)));
    li.appendChild(createParagraph(formatMoney(transaction.money)));
    li.appendChild(createParagraph(transaction.type));

    if (transaction.description) {
      li.appendChild(createParagraph(transaction.description));
    }

    if (transaction.parcela) {
      li.appendChild(createParagraph("Parcela: " + transaction.parcela));
    }

    // Adiciona o quadrado colorido da categoria
    if (transaction.transactionType) {
      const indicador = criarIndicadorCategoria(transaction.transactionType);
      li.appendChild(indicador);
    }

    orderedList.appendChild(li);
  });
}
function criarIndicadorCategoria(categoria) {
  const cor = coresCategoriasMap[categoria] || "#cccccc"; // cinza caso a categoria não esteja mapeada
  const span = document.createElement("span");
  span.style.display = "inline-block";
  span.style.width = "12px";
  span.style.height = "12px";
  span.style.backgroundColor = cor;
  span.style.marginTop = "8px";
  span.style.borderRadius = "2px";
  return span;
}

function createTransactionListItem(transaction) {
  const li = document.createElement("li");
  li.classList.add(transaction.type);
  li.id = transaction.uid;
  li.addEventListener("click", () => {
    const isLocal = window.location.protocol === "file:";
    const path = isLocal
      ? `../transaction/transaction.html?uid=${transaction.uid}`
      : `/pages/transaction/transaction.html?uid=${transaction.uid}`;
    window.location.href = path;
  });
  return li;
}

function createDeleteButton(transaction) {
  const deleteButton = document.createElement("button");
  deleteButton.innerHTML = "Remover";
  deleteButton.classList.add("outline", "danger");

  if (window.innerWidth <= 768) {
    // Define o display como "block" se a largura da janela for menor ou igual a 768
    deleteButton.style.display = "block";
    console.log("Acessado por um dispositivo móvel");
  }

  deleteButton.addEventListener("click", (event) => {
    event.stopPropagation();
    askRemoveTransaction(transaction);
  });

  return deleteButton;
}

function createParagraph(value) {
  const element = document.createElement("p");
  element.innerHTML = value;
  return element;
}

function askRemoveTransaction(transaction) {
  const shouldRemove = confirm("Deseja remover a transaçao?");
  if (shouldRemove) {
    removeTransaction(transaction);
  }
}

function removeTransaction(transaction) {
  showLoading();

  transactionService
    .remove(transaction)
    .then(() => {
      hideLoading();
      document.getElementById(transaction.uid).remove();
    })
    .catch((error) => {
      hideLoading();
      console.log(error);
      alert("Erro ao remover transaçao");
    });
}

function addDayToDate(dateString) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + 1);
  return date;
}
//addDayToDate(dateString) é uma gambiarra para resolver o problema de fusorario.
function formatDate(date) {
  let realDate;

  if (date && typeof date.toDate === "function") {
    // É um Timestamp do Firebase
    realDate = date.toDate();
  } else {
    // Pode ser uma string ou Date
    realDate = new Date(date);
  }

  realDate.setDate(realDate.getDate() + 1); // gambiarra de fuso horário

  return realDate.toLocaleDateString("pt-BR");
}

// function formatDate(date) {
//   return new Date(date).toLocaleDateString("pt-br");
// } fiz uma gambiarra pra resolver o problema de fusorário

// Substitua a função formatMoney existente pela nova função formatMoney
function formatMoney(money) {
  if (typeof money.value === "number") {
    return `${money.currency} ${money.value.toFixed(2)}`;
  } else {
    return `${money.currency} Valor Inválido`;
  }
}
// NOVA FUNÇÃO DE FILTRO POR MÊS/ANO
function atualizarTransacoesPorFiltro() {
  const mes = document.getElementById("mes").value;
  const ano = document.getElementById("ano").value;
  const mesAno = `${ano}-${mes}`;

  const user = firebase.auth().currentUser;
  if (user) {
    showLoading();
    transactionService
      .findByUser(user)
      .then((transactions) => {
        hideLoading();
        const filtradas = transactions.filter((t) => {
          let dateObj;
          if (t.date?.toDate) {
            dateObj = t.date.toDate();
          } else {
            dateObj = new Date(t.date);
          }

          const yearMonth = `${dateObj.getFullYear()}-${String(
            dateObj.getMonth() + 1
          ).padStart(2, "0")}`;
          return yearMonth === mesAno;
        });
        limparLista();
        gerarGraficoPizza(filtradas);
        addTransactionsToScreen(filtradas);
      })
      .catch((error) => {
        hideLoading();
        alert("Erro ao filtrar transações");
        console.error(error);
      });
  }
}

// LIMPA LISTA ANTES DE EXIBIR NOVAMENTE
function limparLista() {
  const lista = document.getElementById("transactions");
  lista.innerHTML = "";
}
let graficoAtual = null;

const coresCategoriasMap = {}; // variável global para guardar cores por categoria

function gerarGraficoPizza(transacoes) {
  const totaisPorCategoria = {};
  let totalGeral = 0;

  transacoes.forEach((transacao) => {
    const categoria = transacao.transactionType;
    const valor = Number(transacao.money?.value || 0);

    if (!totaisPorCategoria[categoria]) {
      totaisPorCategoria[categoria] = 0;
    }

    totaisPorCategoria[categoria] += valor;
    totalGeral += valor;
  });

  const categorias = Object.keys(totaisPorCategoria);
  const valores = categorias.map((cat) => totaisPorCategoria[cat]);
  const porcentagens = valores.map((v) => ((v / totalGeral) * 100).toFixed(1));

  const cores = gerarCores(categorias.length);
  categorias.forEach((cat, i) => {
    coresCategoriasMap[cat] = cores[i]; // associa cor à categoria
  });

  const ctx = document.getElementById("graficoPizza").getContext("2d");

  if (graficoAtual) {
    graficoAtual.destroy();
  }

  graficoAtual = new Chart(ctx, {
    type: "pie",
    data: {
      labels: categorias,
      datasets: [
        {
          data: valores,
          backgroundColor: cores,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false, // Oculta a legenda padrão
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.raw;
              const perc = porcentagens[context.dataIndex];
              return `${label}: R$ ${value.toFixed(2)} (${perc}%)`;
            },
          },
        },
      },
    },
  });
  // Calcular totais de income e expense
  let totalIncome = 0;
  let totalExpense = 0;

  transacoes.forEach((transacao) => {
    const valor = Number(transacao.money?.value || 0);
    if (transacao.type === "income") {
      totalIncome += valor;
    } else if (transacao.type === "expense") {
      totalExpense += valor;
    }
  });

  const saldo = totalIncome - totalExpense;

  // Atualizar na tela
  document.getElementById(
    "total-income"
  ).textContent = `R$ ${totalIncome.toFixed(2)}`;
  document.getElementById(
    "total-expense"
  ).textContent = `R$ ${totalExpense.toFixed(2)}`;
  document.getElementById("saldo-total").textContent = `R$ ${saldo.toFixed(2)}`;

  // Cria legenda personalizada
  const legendaContainer = document.getElementById("grafico-legend");
  if (legendaContainer) {
    legendaContainer.innerHTML = ""; // limpa legendas anteriores

    const ul = document.createElement("ul");
    ul.className = "grafico-legend-ul";

    categorias.forEach((categoria, i) => {
      const li = document.createElement("li");
      const box = document.createElement("span");
      box.style.backgroundColor = cores[i];
      box.style.display = "inline-block";
      box.style.width = "16px";
      box.style.height = "16px";
      box.style.borderRadius = "4px";

      const texto = document.createElement("span");
      texto.textContent = " " + categoria;

      li.appendChild(box);
      li.appendChild(texto);
      ul.appendChild(li);
    });

    legendaContainer.appendChild(ul);
  }
}

// FORA da função gerarGraficoPizza
function gerarCores(quantidade) {
  const coresDistintas = [
    "#e6194B",
    "#3cb44b",
    "#ffe119",
    "#4363d8",
    "#f58231",
    "#911eb4",
    "#46f0f0",
    "#f032e6",
    "#bcf60c",
    "#fabebe",
    "#008080",
    "#e6beff",
    "#9A6324",
    "#fffac8",
    "#800000",
  ];
  while (coresDistintas.length < quantidade) {
    coresDistintas.push(
      "#" + Math.floor(Math.random() * 16777215).toString(16)
    );
  }
  return coresDistintas.slice(0, quantidade);
}

// Função para preencher selects e filtrar automaticamente pelo mês atual
function inicializarFiltroComMesAtual() {
  const selectMes = document.getElementById("mes");
  const selectAno = document.getElementById("ano");

  const dataAtual = new Date();
  const mesAtual = String(dataAtual.getMonth() + 1).padStart(2, "0");
  const anoAtual = dataAtual.getFullYear();

  // Preenche os meses (caso ainda não estejam preenchidos)
  if (selectMes && selectMes.options.length === 0) {
    for (let m = 1; m <= 12; m++) {
      const mesValor = String(m).padStart(2, "0");
      const option = document.createElement("option");
      option.value = mesValor;
      option.textContent = new Date(0, m - 1).toLocaleString("pt-BR", {
        month: "long",
      });
      selectMes.appendChild(option);
    }
  }

  // Preenche os anos (ex: últimos 10 anos até o atual)
  if (selectAno && selectAno.options.length === 0) {
    for (let a = anoAtual; a >= anoAtual - 10; a--) {
      const option = document.createElement("option");
      option.value = a;
      option.textContent = a;
      selectAno.appendChild(option);
    }
  }

  // Seleciona o mês e ano atuais
  selectMes.value = mesAtual;
  selectAno.value = anoAtual;

  // Filtra transações automaticamente
  atualizarTransacoesPorFiltro();
}
