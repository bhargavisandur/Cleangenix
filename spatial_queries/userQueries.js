const pool = require("../pool.js");
const util = require("../utilities");
const { v4: uuidv4, uuid } = require("uuid");
const fs = require("fs");
const request = require("request");
const moment = require("moment");
const bcrypt = require("bcrypt");
const axios = require("axios");

const userRegister = async (req, res) => {
  try {
    const { phone_no, pincode, password, repassword } = req.body;
    if (repassword != password) {
      res.json({ msg: "Passwords do not match" });
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const config = {
      method: "get",
      url: `https://us1.locationiq.com/v1/search.php?key=pk.9e8187ff3784e0e5cfef0fe6733bfd25&postalcode=${pincode}&format=json\n&limit=1&countrycodes=IN`,
      headers: {
        Cookie: "__cfduid=d87813cbe48abdce582fcd0f95df5d5331602794222",
      },
    };

    const latlongRes = await axios(config);
    console.log(JSON.stringify(latlongRes.data));
    const lat = latlongRes.data[0].lat;
    const long = latlongRes.data[0].lon;
    console.log(typeof lat);

    const response = await pool.query(
      "INSERT INTO users (phone_no, pincode, password, lat , long , geolocation) VALUES ($1, $2, $3, $4, $5, ST_MakePoint($5, $4))",
      [phone_no, pincode, hashedPassword, parseFloat(lat), parseFloat(long)]
    );
    console.log("successfully queried");
    res.redirect("/user/login");

    // console.log(JSON.stringify(response.rows));
  } catch (err) {
    if (err) {
      console.log(err);
      res.status(500).json({ msg: "Internal Server error" });
    }
  }
};

const userLogin = async (req, res) => {
  let errors = [];
  const { phone_no, password } = req.body;
  await pool.query(
    "SELECT * FROM users WHERE phone_no = $1",
    [phone_no],
    (error, results) => {
      if (error) throw error;
      else {
        if (results.rows.length == 0) {
          errors.push({ message: "Register yourself first!" });
          console.log("NO MATCH");
          res.render("userRegister", { errors });
        } else {
          flag = 0;
          let user_id = "";
          for (var i = 0; i < results.rows.length; i++) {
            if (bcrypt.compareSync(password, results.rows[i].password)) {
              user_id = results.rows[i].user_id;
              flag = 1;
              break;
            }
          }
          if (flag == 1) {
            console.log("Matches");
            res.redirect(`/user/complaints/view/${user_id}`);
          } else {
            errors.push({ message: "Incorrect password!" });
            res.render("userLogin", { errors });
          }
        }
      }
    }
  );
};

//POST@ /users/complaints/post/:user_id
const postUserComplaintForm = async (req, res) => {
  try {
    const user_id = req.params.user_id;
    console.log(user_id);
    let errors = [];
    // if (!req.body.images[0]) {
    //   errors.push({ message: "File not chosen" });
    //   res.render("uploadComplaintForm", { errors, user_id });
    // }
    if (!req.file) {
      errors.push({ message: "File not chosen, or incorrect format of file" });
      res.render("uploadComplaintForm", { errors, user_id });
    } else if (req.errmessage) {
      errors.push({ message: req.errmessage });
      res.render("uploadComplaintForm", { errors, user_id });
    } else {
      console.log(req.file);
      const { filename, path } = req.file;

      let location = await util.getLocationFromPhoto(filename);
      console.log(location);
      // await utililties.getLocation("8.jpg");
      const lat = parseFloat(location.lat);
      const long = parseFloat(location.lng);
      const ward_id = null;

      console.log(lat);
      console.log(long);

      const today = new Date();
      const currentMonth =
        today.getMonth() < 10 ? "0" + today.getMonth() : "" + today.getMonth();
      console.log(currentMonth);
      const currentDate =
        today.getFullYear() + "" + currentMonth + "" + today.getDate();
      var currentTime = moment().format("HHmmss");

      const status = "OK";

      const queryResult = await pool.query(
        "INSERT INTO active_complaints ( user_id, lat, long, geolocation,ward_id,   image, date,time, status) values ($1, $2, $3,ST_MakePoint($3, $2),  $4,$5, TO_DATE($7, $8),TO_TIMESTAMP($9, $10), $6)",
        [
          user_id,
          lat,
          long,
          ward_id,
          req.file.path,
          status,
          currentDate,
          "YYYYMMDD",
          currentTime,
          "HH24MIss",
        ]
      );
      res.redirect(`/user/complaints/post/${user_id}`);
    }
    console.log(user_id);
  } catch (err) {
    throw err;
    res.send(err);
  }
};

//GET@ /user/complaints/post/:user_id
const getUserComplaintForm = async (req, res) => {
  try {
    res.render("uploadComplaint");
  } catch (err) {
    throw err;
  }
};

//GET@ /user/complaints/view/:user_id
const viewAllComplaints = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM active_complaints");

    res.render("allComplaints", {
      complaints: result.rows,
      user_id: req.params.user_id,
    });
  } catch (error) {
    throw error;
  }
};

const activeDrives = (req, res) => {
  var user_id = req.params.user_id;
  console.log(user_id);
  pool.query("SELECT * FROM campaign", (err, result) => {
    if (err) throw err;
    else {
      // console.log(result.rows);
      var campaignItems = result.rows;
      res.render("user_enroll", {
        campaignItems: campaignItems,
        user_id: user_id,
      });
    }
  });
};

const participateCampaign = (req, res) => {
  var user_id = req.params.user_id;
  var campaign_id = req.body.enroll;
  // console.log(typeof(user_id));
  pool.query(
    "INSERT INTO campaign_participation (user_id, campaign_id) VALUES ($1, $2)",
    [user_id.toString(), campaign_id.toString()],
    (err, result) => {
      if (err) throw err;
      else {
        res.redirect("/user/drives/enroll/" + user_id);
      }
    }
  );
};

const filterCampaign = (req, res) => {
  var buf = parseFloat(req.body.distance) * 1000;
  var user_id = req.params.user_id;
  console.log(typeof buf);
  pool.query(
    "SELECT * FROM campaign,users WHERE st_intersects(campaign.geolocation,st_buffer(users.geolocation,$1)) AND users.user_id=$2",
    [buf, user_id],

    (err, result) => {
      if (err) throw err;

      console.log(result.rows);
      var campaignItems = result.rows;
      res.render("user_enroll", {
        campaignItems: campaignItems,
        user_id: user_id,
      });
    }
  );
};

module.exports = {
  userRegister,
  userLogin,
  viewAllComplaints,
  postUserComplaintForm,
  getUserComplaintForm,
  activeDrives,
  participateCampaign,
  filterCampaign,
};
