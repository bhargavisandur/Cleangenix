const wards = require("../geoJSON/BMC_wards");
const pool = require("../pool");

const insertWardGeoJSON = async (req, res) => {
  try {
    var i = 0;
    wards.wards.features.forEach(async (feature) => {
      const response = await pool.query(
        "INSERT INTO ward(ward_name, rewards, ward_location, username, password ) VALUES ($1, $2, ST_setSRID(ST_GeomFromGeoJSON($3)::geography,4326), $4, $5 )",
        [
          feature.properties.name,
          10,
          JSON.stringify(feature.geometry),
          `wardID${feature.properties.gid}`,
          `mypassword${feature.properties.gid}`,
        ]
      );
    });

    res.send("success");
  } catch (error) {
    throw error;
  }
};

module.exports = { insertWardGeoJSON };
