const mongoose = require("mongoose");
const Decision = require("../decision");
const decisionSchema = new mongoose.Schema(
  {
    votesInFavor: { type: Number },
    votesAgainst: { type: Number },
  },
  { id: false }
);

const simpleDecision = Decision.discriminator(
  "simpleDecision",
  new mongoose.Schema({
    details: { type: decisionSchema, required: true },
  })
);

module.exports = simpleDecision;
