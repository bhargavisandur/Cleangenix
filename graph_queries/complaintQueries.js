const neoDriver = require("./neodriver");

const addComplaintToUser = async (user_id, complaintInfo) => {
  try {
    const { lat, long, complaint_id } = complaintInfo;
    const session1 = neoDriver.session();
    const result = await session1.run(
      "CREATE (a:Complaint { lat:$lat, long:$long,  complaint_id:$complaint_id}) RETURN a",
      {
        lat: lat,
        long: long,
        complaint_id: complaint_id,
      }
    );

    let temp_complaint_id = "";
    result.records.forEach((r) => {
      temp_complaint_id = r._fields[0].properties.complaint_id;
    });
    // const session2 = neoDriver.session();
    const res = await session1.run(
      "MATCH (a:User {user_id:$user_id}), (b:Complaint {complaint_id:$complaint_id}) MERGE (a)-[r:reports]->(b) return a",
      { user_id: user_id, complaint_id: temp_complaint_id }
    );
    console.log(res);
    session1.close();
  } catch (error) {
    throw error;
  }
};

// const addUserToWard = async (ward_name, userDetails) => {
//   try {
//     const session1 = neoDriver.session();
//     const result = await session1.run(
//       "CREATE (a:User {ref_id:$ref_id, phone_no:$phone_no, pincode:$pincode, lat:$lat, long:$long, user_id:$user_id}) RETURN a",
//       {
//         ref_id: ref_id,
//         phone_no: phone_no,
//         lat: lat,
//         long: long,
//         pincode: pincode,
//         user_id: user_id,
//       }
//     );

//     console.log(ref_id);
//     let temp_ref_id = "";
//     result.records.forEach((r) => {
//       temp_ref_id = r._fields[0].properties.ref_id;
//     });
//     // const session2 = neoDriver.session();
//     const res = await session1.run(
//       "MATCH (a:Ward {name:$ward_name}), (b:User {ref_id:$ref_id}) MERGE (a)-[r:contains]->(b) return a",
//       { ref_id: temp_ref_id, ward_name: ward_name }
//     );
//     console.log(res);
//     session1.close();
//     // session2.close();
//   } catch (err) {
//     console.log(err);
//     throw err;
//   }
// };

module.exports = { addComplaintToUser };
