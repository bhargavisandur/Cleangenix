const express = require("express");
const path = require("path");
const app = express();
const ejs = require("ejs");
const db = require("./spatial_queries/combinedQueries");
const bcrypt = require('bcrypt');




// For parsing application/json
app.use(express.json());

// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.get('/', (req, res) => {
    //res.json({ info: "Node.js, Express, and Postgres API" });
    res.render('index');
});

app.get('/user/register', (req, res) => {
     res.render('userRegister');
 });

app.get('/user/login', (req, res) => {
     res.render('userLogin');
 });

app.post("/user/register", db.userRegister);

app.post("/user/login", db.userLogin);




app.get("/test", (req, res) => {
  const developers = [
    { id: 1, name: "Bhargavi Sandur", age: 20 },
    { id: 2, name: "Khushi Jagad", age: 21 },
    { id: 3, name: "Ritika Mangla", age: 20 },
  ];
  //res.status(200).json(developers);
  res.render("test", { developers });
});

const PORT = 5000;

app.listen(PORT, (err) => {
  console.log(`server running on port ${PORT}`);
});
