document.addEventListener("DOMContentLoaded", () => {
  form.email().addEventListener("keyup", onChangeEmail);
  form.password().addEventListener("keyup", onChangePassword);
  form.confirmPassword().addEventListener("keyup", onChangeConfirmPassword);
  form.registerButton().addEventListener("click", register);

  toggleRegisterButtonDisable(); // Validação inicial
});

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    const isLocal = window.location.protocol === "file:";
    const path = isLocal ? "../home/home.html" : "/pages/home/home.html";
    window.location.href = path;
  }
});

function onChangeEmail() {
  const email = form.email().value;
  form.emailRequiredError().style.display = email ? "none" : "block";
  form.emailInvalidError().style.display = validateEmail(email)
    ? "none"
    : "block";
  toggleRegisterButtonDisable();
}

function onChangePassword() {
  const password = form.password().value;
  form.passwordRequiredError().style.display = password ? "none" : "block";
  form.passwordMinLengthError().style.display = validatePassword(password)
    ? "none"
    : "block";
  validatePasswordsMatch();
  toggleRegisterButtonDisable();
}

function onChangeConfirmPassword() {
  validatePasswordsMatch();
  toggleRegisterButtonDisable();
}

function validatePasswordsMatch() {
  const password = form.password().value;
  const confirmPassword = form.confirmPassword().value;
  form.confirmPasswordDoesntMatchError().style.display =
    password === confirmPassword ? "none" : "block";
}

function toggleRegisterButtonDisable() {
  form.registerButton().disabled = !isFormValid();
}

function isFormValid() {
  const email = form.email().value;
  const password = form.password().value;
  const confirmPassword = form.confirmPassword().value;

  return (
    email &&
    validateEmail(email) &&
    password &&
    validatePassword(password) &&
    password === confirmPassword
  );
}

function register() {
  if (!isFormValid()) return;

  showLoading();

  const email = form.email().value;
  const password = form.password().value;

  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then(() => {
      hideLoading();
      const isLocal = window.location.protocol === "file:";
      const path = isLocal
        ? "../../pages/home/home.html"
        : "/pages/home/home.html";
      window.location.href = path;
    })
    .catch((error) => {
      hideLoading();
      alert(getErrorMessage(error));
    });
}

function getErrorMessage(error) {
  if (error.code === "auth/email-already-in-use") {
    return "Email já está em uso";
  }
  return error.message;
}

const form = {
  email: () => document.getElementById("email"),
  emailRequiredError: () => document.getElementById("email-required-error"),
  emailInvalidError: () => document.getElementById("email-invalid-error"),
  password: () => document.getElementById("password"),
  passwordRequiredError: () =>
    document.getElementById("password-required-error"),
  passwordMinLengthError: () =>
    document.getElementById("password-min-length-error"),
  confirmPassword: () => document.getElementById("confirmPassword"),
  confirmPasswordDoesntMatchError: () =>
    document.getElementById("password-doesnt-match-error"),
  registerButton: () => document.getElementById("register-button"),
};
