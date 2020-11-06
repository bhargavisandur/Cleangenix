const neoDriver = require("./neodriver");

const insertWardInGraphDB = async (ward_id, ward_name) => {
  try {
    const session = neoDriver.session();
    const result = await session.run(
      "CREATE (a:Ward {name: $ward_name, ward_id:$ward_id}) RETURN a",
      { ward_name: ward_name, ward_id: ward_id }
    );
    session.close();
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const addUserToWard = async (ward_name, ref_id) => {
  try {
    const session1 = neoDriver.session();
    const result = await session1.run(
      "CREATE (a:User {ref_id:$ref_id}) RETURN a",
      { ref_id: ref_id }
    );

    console.log(ref_id);
    let temp_ref_id = "";
    result.records.forEach((r) => {
      temp_ref_id = r._fields[0].properties.ref_id;
    });
    // const session2 = neoDriver.session();
    const res = await session1.run(
      "MATCH (a:Ward {name:$ward_name}), (b:User {ref_id:$ref_id}) MERGE (a)-[r:contains]->(b) return a",
      { ref_id: temp_ref_id, ward_name: ward_name }
    );
    console.log(res);
    session1.close();
    // session2.close();
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const connectUsers = async (newUser_ref_id, oldUser_ref_id) => {
  try {
    const session = neoDriver.session();
    const result = await session.run(
      "MATCH (b:User {ref_id:$newUser_ref_id}), (a:User {ref_id:$oldUser_ref_id}) MERGE (a)-[r:`recommendedTo`]->(b) return a",
      { newUser_ref_id: newUser_ref_id, oldUser_ref_id: oldUser_ref_id }
    );
    console.log(result);
    session.close();
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const calculateUserRewardPoints = async (ref_id) => {
  try {
    const session = neoDriver.session();
    const result = await session.run(
      "MATCH (a:User {ref_id:$ref_id})-[r:recommendedTo]->(b:User) return b",
      { ref_id: ref_id }
    );
    console.log(result.records.length);
    return result.records.length;
    session.close();
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const calculateWardRewardPoints = async (ward_name) => {
  try {
    const session = neoDriver.session();
    const result = await session.run(
      "MATCH (a:Ward {name:$ward_name})-[r:contains]->(b:User) return b",
      { ward_name: ward_name }
    );
    console.log(result.records.length);
    session.close();
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = {
  insertWardInGraphDB,
  addUserToWard,
  connectUsers,
  calculateUserRewardPoints,
  calculateWardRewardPoints,
};
