const express = require("express");
const router = express.Router();
const GameState = require("../models/GameState");

// Endpoint to save or update game state
router.post("/saveGameState", async (req, res) => {
  const { gameId, state, players } = req.body;

  try {
    const gameState = await GameState.findOneAndUpdate(
      { gameId: gameId },
      {
        state: state,
        lastUpdated: Date.now(),
        isActive: true,
        players: players,
      },
      { upsert: true, new: true }
    );
    res.status(200).json(gameState);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Endpoint to get active games
router.get("/activeGames", async (req, res) => {
  try {
    const activeGames = await GameState.find({ isActive: true });
    res.status(200).json(activeGames);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Endpoint to load game state by gameId
router.get("/loadGameState/:gameId", async (req, res) => {
  const { gameId } = req.params;

  try {
    const gameState = await GameState.findOne({ gameId: gameId });

    if (!gameState) {
      return res.status(404).json({ message: "Game not found" });
    }

    res.status(200).json({
      players: gameState.players,
      playerFactions: gameState.state.playerFactions,
      currentTurnFaction: gameState.state.currentTurnFaction,
      playerResources: gameState.state.playerResources,
      territories: gameState.state.territories,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
