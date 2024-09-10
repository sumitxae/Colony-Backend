const mongoose = require("mongoose");
const Decision = require("../decision");

const mintSchema = new mongoose.Schema(
  {
    mintedToken: {
      type: String,
      required: true,
    },
    mintee: { type: mongoose.Types.ObjectId, ref: "user", required: true },
    amount: { type: Number, required: true },
  },
  { timestamps: true, id: false }
);

const mintDecision = Decision.discriminator(
  "MintTokens",
  new mongoose.Schema({
    details: { type: mintSchema, required: true },
  })
);

module.exports = mintDecision;
