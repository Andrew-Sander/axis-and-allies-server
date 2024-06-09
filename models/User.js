const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  activeGameIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ActiveGame",
    },
  ],
});

module.exports = mongoose.model("User", UserSchema);
