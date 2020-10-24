
const adminQueries = require("./adminQueries");
const userQueries = require("./userQueries");



//Admin Queries


//User Queries

const userRegister = userQueries.userRegister;
const userLogin = userQueries.userLogin;


//Worker Queries

module.exports = 
{
  userRegister,
  userLogin,
};
