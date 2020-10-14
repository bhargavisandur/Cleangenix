const express = require("express");

const app = express();

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
