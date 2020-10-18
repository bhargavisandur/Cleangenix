const request = require("request");

const getCoordinatesFromPincode = (pincode) => {
  const options = {
    method: "GET",
    url: `https://us1.locationiq.com/v1/search.php?key=pk.9e8187ff3784e0e5cfef0fe6733bfd25&postalcode=${pincode}&format=json\n&limit=1&countrycodes=IN`,
    headers: {
      Cookie: "__cfduid=d87813cbe48abdce582fcd0f95df5d5331602794222",
    },
  };
  var temp;
  request(options, function (error, response) {
    if (error) return error;
    //console.log(response.body);
    temp = response.body;
    return response.body;
  });
  return temp;
};

const tempFunction = () => {
  return "abc";
};

module.exports = { getCoordinatesFromPincode, tempFunction };
