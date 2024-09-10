const mongoose = require("mongoose");
const Decision = require("../decision");

const assignmentSchema = new mongoose.Schema(
  {
    assignment: {type: String, required: true},
    reassigned: { type: mongoose.Types.ObjectId, ref: "user", required: true },
    assigner: { type: mongoose.Types.ObjectId, ref: "user", required: true },
    position: { type: String, required: true },
  },
  { id: false }
);

const reassignDecision = Decision.discriminator(
  "Reassign",
  new mongoose.Schema({
    details: { type: assignmentSchema, required: true },
  })
);

module.exports = reassignDecision;
