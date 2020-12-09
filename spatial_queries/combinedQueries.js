const adminQueries = require("./adminQueries");
const userQueries = require("./userQueries");
const complaintQueries = require("./complaintQueries");
const workerQueries = require("./workerQueries");
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

const workerLogin = workerQueries.workerLogin;

const postWorkerResolvedForm = workerQueries.postWorkerResolvedForm;
const viewMyActiveComplaints = userQueries.viewMyActiveComplaints;
const viewMyResolvedComplaints = userQueries.viewMyResolvedComplaints;
const acknowledgeComplaintResolution =
  userQueries.acknowledgeComplaintResolution;

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
  workerLogin,
  postWorkerResolvedForm,
  viewMyActiveComplaints,
  viewMyResolvedComplaints,
  acknowledgeComplaintResolution,
};
