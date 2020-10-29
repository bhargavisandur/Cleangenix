const express = require("express");
const path = require("path");
const app = express();
const ejs = require("ejs");
const db = require("./spatial_queries/combinedQueries");
const bcrypt = require("bcrypt");
const { uploadImage } = require("./contollers/multipart");
const { resizeImages } = require("./contollers/resize");

// For parsing application/json
app.use(express.json());

// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

//GET@ public
//get landing page, public
app.get("/", (req, res) => {
  //res.json({ info: "Node.js, Express, and Postgres API" });
  res.render("index");
});

//***********user authentication routes**********//

//GET@ /user/register
//get user register page, public
app.get("/user/register", (req, res) => {
  res.render("userRegister");
});

//GET@ /user/login
//get user login page, public
app.get("/user/login", (req, res) => {
  res.render("userLogin");
});

//POST@ /user/register
//post register form, public
app.post("/user/register", db.userRegister);

//POST@ /user/login
//post login form, public
app.post("/user/login", db.userLogin);

//******************end********************** */

//*****************complaint routes************* */

// POST@ /user/complaints/post/:user_id
// user posts a complaint, private

app.post(
  "/user/complaints/post/:user_id",
  uploadImage,
  db.postUserComplaintForm
);

// GET@ /user/complaints/post/:user_id
// show user the complaint form, private
app.get("/user/complaints/post/:user_id", (req, res) => {
  console.log(req.params.user_id);
  res.render("uploadComplaintForm", {
    user_id: req.params.user_id,
    color: "green",
    errors: [{ message: "Make sure to turn on your GPS" }],
  });
});

// GET@ /user/complaints/view/:user_id
// view all complaints posted by other users, private
app.get("/user/complaints/view/:user_id", (req, res) => {
  console.log(req.params.user_id);
  db.viewAllComplaints(req, res);
});

//*****************************end ************************ */

//*****************drives route************* */

// GET@ /user/drives/enroll/:user_id
// shows all the drives organized
app.get("/user/drives/enroll/:user_id", (req, res) => {
  db.activeDrives(req, res);
});

// POST@ /user/drives/enroll/:user_id
// for enrolling in a drive
app.post("/user/drives/enroll/:user_id", db.participateCampaign);

// POST@ /user/drives/enroll/filter/:user_id
// for filtering the nearest drives
app.post("/user/drives/enroll/filter/:user_id", db.filterCampaign);

//*****************************end ************************ */
//*******************************admin routes******************** */

app.post("/admin/insert/wards", db.insertWardGeoJSON);

app.get("/test", (req, res) => {
  const developers = [
    { id: 1, name: "Bhargavi Sandur", age: 20 },
    { id: 2, name: "Khushi Jagad", age: 21 },
    { id: 3, name: "Ritika Mangla", age: 20 },
  ];
  //res.status(200).json(developers);
  res.render("test", { developers });
});

const PORT = 5000 || process.env.PORT;

app.listen(PORT, (err) => {
  console.log(`server running on port ${PORT}`);
});
