const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: [true, "Team name is required"],
      unique: true,
      trim: true,
      minlength: [3, "Team name must be at least 3 characters long"],
      maxlength: [50, "Team name must be at most 50 characters long"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description must be at most 500 characters long"],
    },
    funds: {
      type: Number,
      default: 0,
    },
    colony: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "colony",
      required: [true, "Colony is required"],
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        default: [],
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Created by user is required"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("team", teamSchema);
