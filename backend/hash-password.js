// hash-password.js — one-off helper. Run once to create your admin login,
// then you can leave this file alone or delete it.
const bcrypt = require("bcrypt");

const password = process.argv[2]; // grabs whatever you type after the filename

if (!password) {
  console.log("Usage: node hash-password.js yourPasswordHere");
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  console.log("Your password hash:");
  console.log(hash);
});