const mongoose = require("mongoose");

const colonySchema = new mongoose.Schema(
  {
    colonyName: {
      type: String,
      required: [true, "Colony name is required"],
      unique: true,
      trim: true,
      minlength: [3, "Colony name must be at least 3 characters long"],
      maxlength: [20, "Colony name must be at most 20 characters long"],
    },
    colonyPicture: {
      type: String,
      default: "default.jpg",
    },
    funds: {
      type: Number,
      default: 0,
      min: [0, "Funds cannot be negative"],
    },
    nativeToken: {
      type: String,
      unique: true,
      required: [true, "Native token is required"],
      trim: true,
    },
    nativeTokenSymbol: {
      type: String,
      required: [true, "Native token symbol is required"],
      trim: true,
      unique: true,
      uppercase: true,
      minlength: [1, "Native token symbol must be at least 1 character long"],
      maxlength: [3, "Native token symbol must be at most 5 characters long"],
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Creator ID is required"],
    },
    rootUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        default: [],
      },
    ],
    contributors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        default: [],
      },
    ],
    watchers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        default: [],
      },
    ],
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "team",
        default: [],
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("colony", colonySchema);
