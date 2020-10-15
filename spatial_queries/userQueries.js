const pool = require("../pool.js");

//Sign Up of User

const userRegister = async (req, res) => {
  try {
    const { phone_no, pincode, password, repassword } = req.body;
    if (repassword != password) {
      res.json({ msg: "Passwords do not match" });
    }
    const lat = 27.7;
    const long = 78.04;

    const response = await pool.query(
      "INSERT INTO users (phone_no, pincode, password, user_location) VALUES ($1, $2, $3, ST_MakePoint($5, $4))",
      [phone_no, pincode, password, lat, long]
    );
    console.log("successfully queried");
    console.log(JSON.stringify(response.rows));
    res.json(response);
  } catch (err) {
    if (err) {
      console.log(err);
      res.status(500).json({ msg: "Internal Server error" });
    }
  }
};

module.exports = { userRegister };
