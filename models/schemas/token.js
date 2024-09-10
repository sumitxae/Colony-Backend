const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      // unique: true,
      required: true,
    },
    symbol: {
      type: String,
      required: true,
    },
    colony: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "colony",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    id: false,
  }
);

module.exports = tokenSchema;
