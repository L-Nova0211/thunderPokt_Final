const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const stakeAmountSchema = new Schema({ 
    amount: {
        type: Object,
        required: true
    }
});

module.exports = stakeAmount = mongoose.model("stakeAmounts", stakeAmountSchema);
