const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const lpStakeSchema = new Schema({
    tokenId: {
        type: String,
        required: true
    },
    stakedTime: {
        type: Number,
        required: true
    },
    incentiveKey: {
        type: Object,
        required: true
    },
    stakedBlock: {
        type: Number,
        required: true
    }
});

module.exports = lpStake = mongoose.model("lpStakes", lpStakeSchema);
