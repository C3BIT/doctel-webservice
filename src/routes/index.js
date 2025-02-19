const express = require("express");
const devRoute = require("./health.route.js");
const doctorRoute = require("./doctor.route.js");
const router = express.Router();

const defaultRoutes = [
  {
    path: "/dev",
    route: devRoute,
  },
  {
    path: "/doctor",
    route: doctorRoute,
  }
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
module.exports = router;