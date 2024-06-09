const mongoose = require("mongoose");

const ActiveGameSchema = new mongoose.Schema({
  players: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  currentTurn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  gameStateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GameState",
  },
  status: {
    type: String,
    enum: ["ongoing", "completed"],
    default: "ongoing",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ActiveGame", ActiveGameSchema);
