const express = require("express");
const path = require("path");
const app = express();
const ejs = require("ejs");
const db = require("./spatial_queries/combinedQueries");

const { uploadImage } = require("./contollers/multipart");
const { resizeImages } = require("./contollers/resize");

//for using passport
const flash = require("connect-flash");
const passport = require("passport");
const request = require("request");
const session = require("express-session");
const pool = require("./pool");
const bcrypt = require("bcrypt");
const LocalStrategy = require("passport-local").Strategy;
app.use(require("cookie-parser")());
const expressSession = require("express-session");
app.use(expressSession({ secret: "mySecretKey" }));
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use(session({ secret: "keyboard cat" }));

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
// app.get("/user/register", (req, res) => {
//   res.render("userRegister");
// });

//GET@ /user/register/:ref_id
//get user registration page with reference, public
app.get("/user/register/:ref_id", (req, res) => {
  res.render("userRegister", { ref_id: req.params.ref_id });
});

//GET@ /user/login
//get user login page, public
app.get("/user/login", (req, res) => {
  res.render("userLogin");
});

//POST@ /user/register
//post register form, public
app.post("/user/register/:ref_id", db.userRegister);

//POST@ /user/login
//post login form, public
// app.post("/user/login", db.userLogin);
app.post(
  "/user/login",
  passport.authenticate("local", {
    successRedirect: "/user/home",
    failureRedirect: "/user/login",
    failureFlash: true,
  }),
  function (req, res) {
    console.log(req.user);
    res.redirect("/user/home");
  }
);

//GET@ /user/home
app.get("/user/home", (req, res) => {
  if (req.isAuthenticated()) {
    console.log("user id is");

    res.redirect(`/user/complaints/view/${req.user[0].user_id}`);
  } else {
    res.redirect("/user/login");
  }
});

//GET@ /user/logout
app.get("/user/logout", (req, res) => {
  console.log(req.isAuthenticated());
  req.logout();
  console.log(req.isAuthenticated());
  req.flash("success", "Logged out. See you soon!");
  res.redirect("/");
});

//passport initialization
passport.use(
  "local",
  new LocalStrategy(
    { passReqToCallback: true },
    (req, username, password, done) => {
      loginAttempt();
      async function loginAttempt() {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          var currentAccountsData = await JSON.stringify(
            client.query(
              "SELECT * FROM users WHERE phone_no=$1",
              [username],
              function (err, result) {
                if (err) {
                  console.log(err);
                  return done(err);
                }
                if (result.rows[0] == null) {
                  console.log("wrong credentials(no user found)");
                  req.flash("danger", "Oops. Incorrect login details.");
                  return done(null, false);
                } else {
                  console.log("email found");
                  bcrypt.compare(
                    password,
                    result.rows[0].password,
                    function (err, check) {
                      if (err) {
                        console.log("Error while checking password");
                        return done();
                      } else {
                        if (check === true) {
                          console.log("password match");
                          console.log(result.rows[0].user_id);
                          return done(null, [
                            {
                              lat: result.rows[0].lat,
                              long: result.rows[0].long,
                              user_id: result.rows[0].user_id,
                              ref_id: result.rows[0].ref_id,
                            },
                          ]);
                        } else {
                          console.log(result.rows[0].password);
                          console.log(password);
                          console.log(password);
                          console.log("no match");
                          return done(null, false);
                        }
                      }
                    }
                  );
                }
              }
            )
          );
        } catch (e) {
          throw e;
        }
      }
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (user, done) {
  done(null, user);
});

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
  if (!req.isAuthenticated()) {
    res.redirect("/user/login");
  } else {
    res.render("uploadComplaintForm", {
      user_id: req.params.user_id,
      color: "green",
      errors: [{ message: "Make sure to turn on your GPS" }],
    });
  }
});

// GET@ /user/complaints/view/:user_id
// view all complaints posted by other users, private
app.get("/user/complaints/view/:user_id", (req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect("/user/login");
  } else {
    console.log(req.params.user_id);
    db.viewAllComplaints(req, res);
  }
});

//*****************************end ************************ */

//*****************drives route************* */

// GET@ /user/drives/enroll/:user_id
// shows all the drives organized
app.get("/user/drives/enroll/:user_id", (req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect("/user/login");
  } else {
    db.activeDrives(req, res);
  }
});

// POST@ /user/drives/enroll/:user_id
// for enrolling in a drive
app.post("/user/drives/enroll/:user_id", db.participateCampaign);

// POST@ /user/drives/enroll/filter/:user_id
// for filtering the nearest drives
app.post("/user/drives/enroll/filter/:user_id", db.filterCampaign);

//*****************************end ************************ */
//*******************************admin routes******************** */

//for automatic insertion of wards in sdb and gdb
app.post("/admin/insert/wards", db.insertWardGeoJSON);

//GET @ /admin/login
app.get("/admin/login", (req, res) => {
  res.render("adminLogin");
});

//POST @ /admin/login
app.post("/admin/login", db.adminLogin);

//GET @ /admin/home
app.get("/admin/home/:ward_id", (req, res) => {
  res.render("adminHome", { ward_id: req.params.ward_id });
});

//GET @ /admin/logout
app.get("/admin/logout", (req, res) => {
  res.redirect("/admin/login");
});

//GET @ /admin/complaints/active/:ward_id
//view all active complaints
app.get("/admin/complaints/active/:ward_id", async (req, res) => {
  try {
    const activeComplaints = await db.getActiveComplaints(req.params.ward_id);
    res.render("adminActiveComplaints", {
      ward_id: req.params.ward_id,
      active_complaints: activeComplaints,
    });
  } catch (error) {
    throw error;
  }
});

//POST @ /admin/complaints/resolve/:ward_id/:complaint_id
//resolved a particular complaint
app.post(
  "/admin/complaints/resolve/:ward_id/:complaint_id",
  db.resolveComplaint
);

//GET @ /admin/complaints/resolved/:ward_id
app.get("/admin/complaints/resolved/:ward_id", async (req, res) => {
  try {
    const resolvedComplaints = await db.getResolvedComplaints(
      req.params.ward_id
    );
    res.render("adminResolvedComplaints", {
      ward_id: req.params.ward_id,
      resolved_complaints: resolvedComplaints,
    });
  } catch (error) {
    throw error;
  }
});

//*************************************end************************** */

//******************************profile routes ******************** */

app.get("/user/profile/view/:user_id", (req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect("/user/login");
  } else {
    db.getUserProfilePage(req, res);
  }
});

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
