const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, "jwt_token", {
    expiresIn: "30d",
  });
};

module.exports = generateToken;
