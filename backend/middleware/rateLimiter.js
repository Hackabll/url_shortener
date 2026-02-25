const rate_limiter = require("express-rate-limit");

module.exports = rate_limiter({
    windowMs : 60 * 1000,
    max: 100
});