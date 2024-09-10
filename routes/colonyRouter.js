const express = require("express");
const router = express.Router();
const {
  sendColonyDetails,
  colonyCreator,
  joinColony,
  createDecision,
  voteInDecision,
  mintTokens,
  promoteorDemoteUser,
  createExpenditure,
  addColony,
  getAllDecisions,
  getActiveColonyDetails,
  createNewTeam,
  editTeam,
  editColonyDetails,
} = require("../controllers/colonyController");
const { isAuthenticated } = require("../middlewares/authoriser");

router.post("/", isAuthenticated, sendColonyDetails);

router.post("/add", addColony);

router.post("/create", isAuthenticated, colonyCreator);

router.post("/join", isAuthenticated, joinColony);

router.post("/getActiveColony", isAuthenticated, getActiveColonyDetails);

router.post("/create-decision/", isAuthenticated, createDecision);

router.post("/getAllDecisions", isAuthenticated, getAllDecisions);

router.post("/vote", isAuthenticated, voteInDecision);

router.post("/create/team", isAuthenticated, createNewTeam);

router.post("/edit/team/:id", isAuthenticated, editTeam);

router.post("/edit/cololny/:id", isAuthenticated, editColonyDetails);

router.post("/mint-tokens", mintTokens);

router.post("/promote", promoteorDemoteUser);

router.post("/createExpenditure", createExpenditure);


module.exports = router;
