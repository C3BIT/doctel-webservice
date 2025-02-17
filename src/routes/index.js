const express = require("express");
const devRoute = require("./health.route.js");
const router = express.Router();

const defaultRoutes = [
  {
    path: "/dev",
    route: devRoute,
  }
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
module.exports = router;