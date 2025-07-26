function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}
function validatePassword(password) {
  var re =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@!#%^&*])[A-Za-z\d@!#%^&*]{8,}$/;
  return re.test(password);
}
