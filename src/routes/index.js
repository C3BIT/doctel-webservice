const express = require("express");
const devRoute = require("./health.route.js");
const doctorRoute = require("./doctor.route.js");
const otpRoute = require("./otp.route.js");
const patientRoute = require("./patient.route.js");
const router = express.Router();

const defaultRoutes = [
  {
    path: "/dev",
    route: devRoute,
  },
  {
    path: "/doctors",
    route: doctorRoute,
  },
  {
    path: "/otp",
    route: otpRoute,
  },
  {
    path: "/patient",
    route: patientRoute,
  }
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
module.exports = router;