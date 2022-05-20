const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// const autoIncrement = require("mongoose-auto-increment");
// Create Schema
const state = new Schema({ 
    lastBlock: {
        type: String,
        required: true
    },
});

module.exports = mongoose.model("state", state);
