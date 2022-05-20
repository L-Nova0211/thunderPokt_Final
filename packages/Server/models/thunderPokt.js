const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// const autoIncrement = require("mongoose-auto-increment");
// Create Schema
const thunderPoktSchema = new Schema({ 
    rewardToken: {
        type: String,
        required: true
    },
    pool: {
        type: String,
        required: true
    },
    wtAmount: {
        type: String,
        required: true
    },
    startTime: {
        type: Number,
        required: true
    },
    endTime: {
        type: Number,
        required: true
    },
    refundee: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});
// thunderPoktSchema.plugin(autoIncrement.plugin, 'countId');
module.exports = thunderPokt = mongoose.model("thunderPokts", thunderPoktSchema);
