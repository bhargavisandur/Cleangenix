const express = require("express");

const app = express();

const db = require("./spatial_queries/combinedQueries");

// For parsing application/json
app.use(express.json());

// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.post("/user/register", db.userRegister);

app.get("/test", (req, res) => {
  const developers = [
    { id: 1, name: "Bhargavi Sandur", age: 20 },
    { id: 2, name: "Khushi Jagad", age: 21 },
    { id: 3, name: "Ritika Mangla", age: 20 },
  ];
  res.status(200).json(developers);
});

const PORT = 5000;

app.listen(PORT, (err) => {
  console.log(`server running on port ${PORT}`);
});
