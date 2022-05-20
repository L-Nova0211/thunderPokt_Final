const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// const autoIncrement = require("mongoose-auto-increment");
// Create Schema
const lpStateSchema = new Schema({
    tokenId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    syncedBlock: {
        type: Number,
        required: true
    }
});

module.exports = lpState = mongoose.model("lpStates", lpStateSchema);
