const express = require("express");
const router = express.Router();
const {
  sendColonyDetails,
  colonyCreator,
  joinColony,
  createDecision,
  voteInDecision,
  mintTokens,
  promoteUser,
  createExpenditure,
  addColony,
  getAllDecisions,
  getActiveColonyDetails,
} = require("../controllers/colonyController");
const { isAuthenticated } = require("../middlewares/authoriser");

router.post("/add", addColony);

router.post("/", isAuthenticated, sendColonyDetails);

router.post("/create", isAuthenticated, colonyCreator);

router.post("/join", joinColony);

router.get("/getAllDecisions", getAllDecisions);

router.post("/create-decision/:type", createDecision);

router.post("/vote", isAuthenticated, voteInDecision);

router.post("/mint-tokens", isAuthenticated, mintTokens);

router.post("/promote", isAuthenticated, promoteUser);

router.post("/createExpenditure", createExpenditure);

router.post("/getActiveColony", getActiveColonyDetails);

module.exports = router;
