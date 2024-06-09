const mongoose = require("mongoose");

const GameStateSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
  },
  state: {
    type: Object,
    required: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  players: {
    type: [String],
    required: true,
  },
});

module.exports = mongoose.model("GameState", GameStateSchema);
