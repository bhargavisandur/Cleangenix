const pool = require("../pool.js");
const util = require("../utilities");
const { v4: uuidv4, uuid } = require("uuid");
const fs = require("fs");
const request = require("request");
const moment = require("moment");
const bcrypt = require("bcrypt");
const axios = require("axios");
const alert = require("alert");

const gdQueries = require("../graph_queries/userQueries");
const complaintQueries = require("../graph_queries/complaintQueries");

const userRegister = async (req, res) => {
  try {
    let errors = [];
    const { phone_no, pincode, password, repassword } = req.body;
    if (repassword != password) {
      res.json({ msg: "Passwords do not match" });
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    //Find out the lat and long of the user from the pincode using the locationIQ API
    const config = {
      method: "get",
      url: `https://us1.locationiq.com/v1/search.php?key=pk.9e8187ff3784e0e5cfef0fe6733bfd25&postalcode=${pincode}&format=json\n&limit=1&countrycodes=IN`,
      headers: {
        Cookie: "__cfduid=d87813cbe48abdce582fcd0f95df5d5331602794222",
      },
    };

    const latlongRes = await axios(config);
    // console.log(JSON.stringify(latlongRes.data));
    const lat = latlongRes.data[0].lat;
    const long = latlongRes.data[0].lon;
    // console.log(typeof lat);
    console.log(lat);
    console.log(long);

    //Generate the user ref_id;
    const ref_id = uuidv4();

    //Generate the user_id
    const user_id = uuidv4();

    //Insert the user details into the table
    const response = await pool.query(
      "INSERT INTO users (phone_no, pincode, password, lat , long , geolocation, ref_id, user_id) VALUES ($1, $2, $3, $4, $5, ST_MakePoint($5, $4),$6, $7 )",
      [
        phone_no,
        pincode,
        hashedPassword,
        parseFloat(lat),
        parseFloat(long),
        ref_id,
        user_id,
      ]
    );

    //Add the user to the ward in neo4j
    //1. First find ward_name of user, if not from mumbai assign to Outside-Mumbai node
    const wards_of_user = await util.getBMC_ward(lat, long);
    let ward_name_of_user = "";
    if (wards_of_user.length == 0) {
      console.log("user is not from Mumbai, cannot assign ward");
      ward_name_of_user = "Outside-Mumbai";
    } else {
      ward_name_of_user = wards_of_user[0].ward_name;
      console.log("ward name of user is ");
      console.log(ward_name_of_user);
    }
    //2. Add a relation between ward and user;
    console.log("I am adding this user ID in neo4j", user_id);
    const userDetails = { phone_no, pincode, lat, long, ref_id, user_id };
    await gdQueries.addUserToWard(ward_name_of_user, userDetails);

    //Check if someone has recommended the user our application
    if (req.params.ref_id != "no_ref") {
      //If yes, add the cypher query to connect the 2 users with the relation "recommended to"
      //here, ref_id is that of the new user and the req.params.id is the user who has recommended the new user the app
      gdQueries.connectUsers(ref_id, req.params.ref_id);
      console.log(ref_id);
      console.log(req.params.ref_id);
    }

    console.log("successfully queried");

    res.redirect("/user/login");

    // console.log(JSON.stringify(response.rows));
  } catch (err) {
    if (err.response && err.response.status && err.response.status == "404") {
      res.render("userRegister", {
        errors: [{ message: "Please enter a valid pincode" }],
        ref_id: req.params.ref_id,
      });
    } else {
      console.log(err);
      res.status(500).json({ msg: "Internal Server error" });
    }
  }
};

const userLogin = async (req, res) => {
  alert("Foo");
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
          res.render("userRegister", { errors, ref_id: "no_ref" });
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
    console.log("user id isS");
    console.log(user_id);
    let errors = [];
    // if (!req.body.images[0]) {
    //   errors.push({ message: "File not chosen" });
    //   res.render("uploadComplaintForm", { errors, user_id });
    // }
    if (!req.file) {
      errors.push({ message: "File not chosen, or incorrect format of file" });
      res.render("uploadComplaintForm", { errors, user_id, color: "red" });
    } else if (req.errmessage) {
      errors.push({ message: req.errmessage });
      res.render("uploadComplaintForm", { errors, user_id, color: "red" });
    } else {
      //get location from the photo
      console.log(req.file);
      const { filename, path } = req.file;

      let location = await util.getLocationFromPhoto(
        filename,
        "active_complaints"
      );
      console.log(location);

      const lat = location.lat;
      const long = location.lng;
      if (lat == 0) {
        errors.push({
          message:
            "Could not identify location of the picture. Make sure you have enabled your GPS and given permission to geocode your photos",
        });
        res.render("uploadComplaintForm", { errors, user_id, color: "red" });
      } else {
        //get the ward corresponding to the location of pic
        const wards = await util.getBMC_ward(lat, long);

        if (wards.length == 0) {
          errors.push({
            message: "Picture not taken in Mumbai, cannot assign a ward",
          });
          res.render("uploadComplaintForm", { errors, user_id, color: "red" });
        } else {
          const ward_id = wards[0].ward_id;
          console.log("the ward of the pic is");
          console.log(wards[0].ward_name);
          //calculate current date and time
          const today = new Date();
          const currentMonth =
            today.getMonth() < 10
              ? "0" + today.getMonth()
              : "" + today.getMonth();
          console.log(currentMonth);
          const currentDate =
            today.getFullYear() + "" + currentMonth + "" + today.getDate();
          var currentTime = moment().format("HHmmss");

          //get status of the complaint
          const status = "active";

          //generate the complaint_id
          const complaint_id = uuidv4();

          //find the address of the complaint
          const config = {
            method: "get",
            url: `https://us1.locationiq.com/v1/reverse.php?key=pk.9e8187ff3784e0e5cfef0fe6733bfd25&lat=${lat}&lon=${long}&format=json`,
            headers: {
              Cookie: "__cfduid=d87813cbe48abdce582fcd0f95df5d5331602794222",
            },
          };

          const addressRes = await axios(config);
          console.log(addressRes.data.display_name);

          const queryResult = await pool.query(
            "INSERT INTO active_complaints ( user_id, lat, long, geolocation,ward_id,   image, date,time, status, complaint_id, complaint_address) values ($1, $2, $3,ST_MakePoint($3, $2),  $4,$5, TO_DATE($7, $8),TO_TIMESTAMP($9, $10), $6, $11, $12)",
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
              complaint_id,
              addressRes.data.display_name,
            ]
          );

          const complaintInfo = { lat, long, complaint_id };

          await complaintQueries.addComplaintToUser(user_id, complaintInfo);

          res.redirect(`/user/complaints/post/${user_id}`);
        }
      }
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
    console.log("in view all complaints");
    console.log(req.params.user_id);
    console.log(result.rows.length);
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

//GET @ /user/profile/view/:user_id

const getUserProfilePage = async (req, res) => {
  try {
    const user_id = req.params.user_id;
    const result = await pool.query("SELECT * FROM users WHERE user_id=$1", [
      user_id,
    ]);
    const ref_id = result.rows[0].ref_id;

    const rewardPoints = await gdQueries.calculateUserRewardPoints(ref_id);

    const refLink = `http://localhost:5000/user/register/${ref_id}`;
    res.render("userProfile", {
      ref_id: ref_id,
      user_id: user_id,
      rewardPoints,
      refLink,
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const viewMyActiveComplaints = async (req, res) => {
  try {
    const user_id = req.user[0].user_id;
    const response = await pool.query(
      "SELECT * FROM active_complaints WHERE user_id=$1",
      [user_id]
    );
    res.render("userMyActiveComplaints", {
      complaints: response.rows,
      user_id: req.params.user_id,
    });
  } catch (error) {
    throw error;
  }
};

const viewMyResolvedComplaints = async (req, res) => {
  try {
    const user_id = req.user[0].user_id;
    const response = await pool.query(
      "SELECT * FROM resolved_complaints WHERE user_id=$1",
      [user_id]
    );
    res.render("userMyResolvedComplaints", {
      complaints: response.rows,
      user_id: req.params.user_id,
    });
  } catch (error) {
    throw error;
  }
};

const acknowledgeComplaintResolution = async (req, res) => {
  try {
    const user_id = req.params.user_id;
    const resolved_complaint_id = req.params.resolved_complaint_id;

    await pool.query(
      "UPDATE resolved_complaints SET status=$1 WHERE complaint_id=$2",
      ["R", resolved_complaint_id]
    );
    res.redirect(`/user/complaints/view/resolved/${user_id}`);
  } catch (error) {
    throw error;
  }
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
  getUserProfilePage,
  viewMyActiveComplaints,
  viewMyResolvedComplaints,
  acknowledgeComplaintResolution,
};
