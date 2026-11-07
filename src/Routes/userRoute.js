const express = require("express");
const router = express.Router();
const { getusers } = require("../Controllers/user");

router.get("/getusers", getusers);
module.exports = router;