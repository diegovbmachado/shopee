firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    const isLocal = window.location.protocol === "file:";
      const path = isLocal ? "../../pages/home/home.html" : "../../pages/home/home.html";
      window.location.href = "pages/home/home.html";
  }
});

let emailInputTimer;

function onChangeEmail() {
  clearTimeout(emailInputTimer); // Limpa o temporizador anterior
  const email = form.email().value;
  if (email.length > 4) {
    emailInputTimer = setTimeout(() => {
      toggleEmailErrors(); // Chama a validação após um atraso
      toggleButtonsDisable();
    }, 500); // Define o atraso em milissegundos (por exemplo, 500ms)
  }
}

function onChangePassword() {
  clearTimeout(emailInputTimer);
  const password = form.password().value;
  if (password.length > 1) {
    emailInputTimer = setTimeout(() => {
      togglePasswordErrors();
      toggleButtonsDisable();
    }, 500);
  }
}

function login() {
  showLoading();
  firebase
    .auth()
    .signInWithEmailAndPassword(form.email().value, form.password().value)
    .then(() => {
      hideLoading();
      const isLocal = window.location.protocol === "file:";
      const path = isLocal ? "../../pages/home/home.html" : "../../pages/home/home.html";
      window.location.href = "pages/home/home.html";
    })
    .catch((error) => {
      hideLoading();
      alert(getErrorMessage(error));
    });
}

function register() {
  const isLocal = window.location.protocol === "file:";
      const path = isLocal ? "../../pages/home/home.html" : "../../pages/home/home.html";
      window.location.href = "pages/register/register.html";
}

function recoverPassword() {
  showLoading();
  firebase
    .auth()
    .sendPasswordResetEmail(form.email().value)
    .then(() => {
      hideLoading();
      alert("Email enviado com sucesso");
    })
    .catch((error) => {
      hideLoading();
      alert(getErrorMessage(error));
    });
}

function getErrorMessage(error) {
  if (error.code == "auth/user-not-found") {
    return "Usuário nao encontrado";
  }
  if (error.code == "auth/wrong-password") {
    return "Senha inválida";
  }
  return error.message;
}

function toggleEmailErrors() {
  const email = form.email().value;
  form.emailRequiredError().style.display = email ? "none" : "block";

  form.emailInvalidError().style.display = validateEmail(email)
    ? "none"
    : "block";
}

function togglePasswordErrors() {
  const password = form.password().value;
  form.passwordRequiredError().style.display = isPasswordValid()
    ? "none"
    : "block";
}

function toggleButtonsDisable() {
  const emailValid = isEmailValid();
  form.recoverPasswordButton().disabled = !emailValid;

  const passwordValid = isPasswordValid();
  form.loginButton().disabled = !emailValid || !passwordValid;
}

function isEmailValid() {
  const email = form.email().value;
  if (!email) {
    return false;
  }
  return validateEmail(email);
}

function isPasswordValid() {
  const password = form.password().value;
  if (!password) {
    return false;
  } else {
    return validatePassword(password);
  }
}

const form = {
  email: () => document.getElementById("email"),
  emailInvalidError: () => document.getElementById("email-invalid-error"),
  emailRequiredError: () => document.getElementById("email-required-error"),
  loginButton: () => document.getElementById("login-button"),
  password: () => document.getElementById("password"),
  passwordRequiredError: () =>
    document.getElementById("password-required-error"),
  recoverPasswordButton: () =>
    document.getElementById("recover-password-button"),
};
