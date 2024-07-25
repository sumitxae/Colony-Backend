const mongoose = require("mongoose");
const voteSchema = require("./schemas/vote");

const decisionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    colony: { type: mongoose.Types.ObjectId, ref: "colony", required: true },
    creator: { type: mongoose.Types.ObjectId, ref: "user", required: true },
    forced: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    votingEndsAt: { type: Date },
    status: {
      type: String,
      enum: ["Pending", "Passed", "Rejected"],
      default: "Pending",
    },
    team: { type: mongoose.Types.ObjectId, ref: "team"},
    voters: [{ type: mongoose.Types.ObjectId, ref: "user", default: [] }],
    votes: [voteSchema],
    maxStake: { type: Number },
  },
  { discriminatorKey: "type", collection: "decisions" }
);

module.exports = mongoose.model("Decision", decisionSchema);
