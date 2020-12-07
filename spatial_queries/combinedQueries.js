const adminQueries = require("./adminQueries");
const userQueries = require("./userQueries");
const complaintQueries = require("./complaintQueries");

//Admin Queries

//User Queries

const userRegister = userQueries.userRegister;
const userLogin = userQueries.userLogin;
const postUserComplaintForm = userQueries.postUserComplaintForm;
const viewAllComplaints = userQueries.viewAllComplaints;
const getUserComplaintForm = userQueries.getUserComplaintForm;
const activeDrives = userQueries.activeDrives;
const participateCampaign = userQueries.participateCampaign;
const filterCampaign = userQueries.filterCampaign;
const insertWardGeoJSON = adminQueries.insertWardGeoJSON;
const getUserProfilePage = userQueries.getUserProfilePage;
const adminLogin = adminQueries.adminLogin;

const getActiveComplaints = complaintQueries.getActiveComplaints;
const resolveComplaint = complaintQueries.resolveComplaint;
const getResolvedComplaints = complaintQueries.getResolvedComplaints;

//Worker Queries

module.exports = {
  userRegister,
  userLogin,
  postUserComplaintForm,
  viewAllComplaints,
  getUserComplaintForm,
  activeDrives,
  participateCampaign,
  filterCampaign,
  insertWardGeoJSON,
  getUserProfilePage,
  adminLogin,
  getActiveComplaints,
  resolveComplaint,
  getResolvedComplaints,
};
