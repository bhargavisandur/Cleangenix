const pool = require("../pool.js");
const util = require("../utilities");
const request = require("request");

//Sign Up of User

const userRegister = async (req, res) => {
  try {
    const { phone_no, pincode, password, repassword } = req.body;
    if (repassword != password) {
      res.json({ msg: "Passwords do not match" });
    }

    const options = {
      method: "GET",
      url: `https://us1.locationiq.com/v1/search.php?key=pk.9e8187ff3784e0e5cfef0fe6733bfd25&postalcode=${pincode}&format=json\n&limit=1&countrycodes=IN`,
      headers: {
        Cookie: "__cfduid=d87813cbe48abdce582fcd0f95df5d5331602794222",
      },
    };
    var temp;
    var lat;
    var long;
    request(options, function (error, response) {
      if (error) return error;
      console.log(response.body);
      temp = response.body;
      lat = response.body[0].lat;
      long = response.body[0].lon;
    });

    // const resGeocodingAPI = await util.getCoordinatesFromPincode(pincode);

    // console.log(util.tempFunction());

    // const lat = resGeocodingAPI[0].lat;
    // const long = resGeocodingAPI[0].lon;

    const response = await pool.query(
      "INSERT INTO users (phone_no, pincode, password, user_location) VALUES ($1, $2, $3, ST_MakePoint($5, $4))",
      [phone_no, pincode, password, parseFloat(lat), parseFloat(long)]
    );
    console.log("successfully queried");

    // console.log(JSON.stringify(response.rows));
    res.json(response);
  } catch (err) {
    if (err) {
      console.log(err);
      res.status(500).json({ msg: "Internal Server error" });
    }
  }
};

module.exports = { userRegister };
