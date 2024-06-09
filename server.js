const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.log(err));

// Routes
const userRouter = require("./routes/userRouter");
const gameRouter = require("./routes/gameRouter");
app.use("/users", userRouter);
app.use("/game", gameRouter);

// const authenticateToken = require("./middleware/authenticateToken");

// Example protected route
// router.get("/protected", authenticateToken, (req, res) => {
//   res.send("This is a protected route");
// });

// Define a simple route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// HTTP and WebSocket Servers
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let games = {}; // Store game data
let clients = {}; // Store client connections

// WebSocket Connection
wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (message) => {
    console.log("Received:", message);
    // Handle incoming messages
    handleClientMessage(ws, message);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

function handleClientMessage(ws, message) {
  const data = JSON.parse(message);
  console.log("message", message);
  console.log("data", data);
  // Handle different types of messages
  switch (data.type) {
    case "registerClient":
      clients[data.playerName] = ws;
      console.log(`Registered client: ${data.playerName}`);
      break;
    case "createGame":
      handleCreateGame(ws, data);
      break;
    case "factionSelection":
      handleFactionSelection(ws, data);
      break;
    case "joinGame":
      handleJoinGame(ws, data);
      break;
    case "invite":
      handleInvitePlayer(ws, data);
      break;
    case "move":
      handlePlayerMove(ws, data);
      break;
    case "getPlayerList":
      handleGetPlayerList(ws, data);
      break;
    case "startGame":
      handleStartGame(ws, data);
      break;
    case "endTurn":
      handleEndTurn(ws, data);
      break;
    // Add more cases as needed
  }
}

function handleCreateGame(ws, data) {
  const gameId = generateGameId();
  games[gameId] = {
    host: data.playerName,
    players: [data.playerName],
    playerFactions: {},
    currentTurnIndex: 0,
    turnOrder: [
      "Germany",
      "Russia",
      "Japan",
      "USA",
      "China",
      "UK",
      "Italy",
      "Anzac",
      "France",
    ],
  };
  ws.send(
    JSON.stringify({
      type: "gameCreated",
      gameId: gameId,
      players: games[gameId].players,
    })
  );
  console.log(`Game created with ID: ${gameId} by ${data.playerName}`);
}

function handleStartGame(ws, data) {
  const game = games[data.gameId];
  if (game) {
    // game.playerFactions = data.playerFactions;
    // Notify all players in the game to start the game
    game.players.forEach((player) => {
      const client = clients[player];
      if (client) {
        client.send(
          JSON.stringify({
            type: "startGame",
            gameId: data.gameId,
            players: game.players,
            playerFactions: game.playerFactions, // Include this line
          })
        );
      }
    });

    console.log(`Game ${data.gameId} started by ${data.playerName}`);
  } else {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Game not found",
      })
    );
    console.log(`Game not found: ${data.gameId}`);
  }
}

function handleGetPlayerList(ws, data) {
  const game = games[data.gameId];
  if (game) {
    ws.send(
      JSON.stringify({
        type: "joinGame",
        players: game.players,
      })
    );
    console.log(`Sent player list for game ${data.gameId}`);
  } else {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Game not found",
      })
    );
    console.log(`Game not found: ${data.gameId}`);
  }
}

function handleFactionSelection(ws, data) {
  console.log("handleFaction selection: ", data);
  const game = games[data.gameId];
  if (game) {
    if (!game.playerFactions[data.playerName]) {
      game.playerFactions[data.playerName] = [];
    }
    game.playerFactions[data.playerName] = data.factions;
  }

  broadcastFactionSelections(data.gameId, data.playerName);
}

function broadcastFactionSelections(gameId, playerName) {
  const game = games[gameId];
  if (game) {
    game.players.forEach((player) => {
      const client = clients[player];
      if (client) {
        client.send(
          JSON.stringify({
            type: "updateFactionSelections",
            playerFactions: game.playerFactions,
            playerName: playerName,
          })
        );
      }
    });
    console.log(
      "broadcasted faction selection: ",
      game.playerFactions,
      " ",
      playerName
    );
  }
}

function handleJoinGame(ws, data) {
  const game = games[data.gameId];
  if (game) {
    // Add player to the game
    game.players.push(data.playerName);

    // Notify all players in the game about the updated player list
    game.players.forEach((player) => {
      const client = clients[player];
      if (client) {
        client.send(
          JSON.stringify({
            type: "joinGame",
            players: game.players,
          })
        );
      }
    });

    console.log(`${data.playerName} joined game ${data.gameId}`);
  } else {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Game not found",
      })
    );
    console.log(`Game not found: ${data.gameId}`);
  }
}

function handleInvitePlayer(ws, data) {
  const game = games[data.gameId];
  if (game) {
    console.log(`Inviting ${data.invitedPlayer} to game ${data.gameId}`);
    // Broadcast the invitation to the invited player
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "invite",
            gameId: data.gameId,
            invitedPlayer: data.invitedPlayer,
          })
        );
      }
    });
  } else {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Game not found",
      })
    );
    console.log(`Game not found for ID: ${data.gameId}`);
  }
}

function handleEndTurn(ws, data) {
  const game = games[data.gameId];
  if (game) {
    game.currentTurnIndex++;
    if (game.currentTurnIndex >= game.turnOrder.length) {
      game.currentTurnIndex = 0;
    }
    const currentTurnFaction = game.turnOrder[game.currentTurnIndex];
    broadcastToGame(data.gameId, {
      type: "updateTurn",
      currentTurnFaction: currentTurnFaction,
    });
    console.log(`Turn ended. It's now ${currentTurnFaction}'s turn.`);
  } else {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Game not found",
      })
    );
  }
}

function handlePlayerMove(ws, data) {
  // Handle player move
  // Update game state and broadcast to all clients
  broadcastToGame(games[data.gameId], {
    type: "gameState",
    state: getCurrentGameState(),
  });
}

function broadcastToGame(game, data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function getCurrentGameState() {
  // Return current game state
  return {};
}

function generateGameId() {
  return "game-" + Math.random().toString(36).substr(2, 9);
}

// Start the server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
