const pool = require("../pool.js");
const util = require("../utilities");
const request = require("request");
const bcrypt = require("bcrypt");




const userRegister = async (req, res) => {
  try {
    const { phone_no, pincode, password, repassword } = req.body;
    if (repassword != password) {
      res.json({ msg: "Passwords do not match" });


    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    
    

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

    const response = await pool.query(
      "INSERT INTO users (phone_no, pincode, password, lat , long , geolocation) VALUES ($1, $2, $3, $4, $5, ST_MakePoint($5, $4))",
      [phone_no, pincode, hashedPassword, parseFloat(lat), parseFloat(long)]
    );
    console.log("successfully queried");
    res.redirect("/user/login");

    // console.log(JSON.stringify(response.rows));
    res.json(response);
  } catch (err) {
    if (err) {
      console.log(err);
      res.status(500).json({ msg: "Internal Server error" });
    }
  }
};




const userLogin =  async (req, res) => 
{
	let errors = [];
    const { phone_no, password } = req.body;
    		await pool.query('SELECT password FROM users WHERE phone_no = $1', [phone_no], 
        (error, results)=> {
        	
        	if(error)
        		throw error;
        	else
        	{
        		if(results.rows.length == 0)
        		{        	
        			errors.push({ message: "Register yourself first!" });	
        			console.log("NO MATCH");
        			res.render('userRegister' ,{ errors});
        		
        		}
        		else
        		{
        			flag = 0;
        			for (var i = 0; i < results.rows.length; i++)
	        		{
	        			if(bcrypt.compareSync(password , results.rows[i].password))
	        			{
	        				flag = 1;
	        				break;       				

	        			}
	        		}
	        		if(flag == 1)
	        		{
							console.log("Matches");
	        				res.redirect("/");
	        		}
	        		else
	        		{
	        			errors.push({ message: "Incorrect password!" });
	        			res.render("userLogin", { errors});
	        			
	        		}
	        		
        		}       		
        	}
        });

};




module.exports = { userRegister, userLogin };