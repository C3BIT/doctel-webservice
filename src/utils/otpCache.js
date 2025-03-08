const NodeCache = require("node-cache");
const otpCache = new NodeCache({ stdTTL: 150, checkperiod: 60 });

module.exports = { otpCache };
