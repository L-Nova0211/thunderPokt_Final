var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var thunderPokt = require('../../models/thunderPokt.js');
var lpStake = require('../../models/lpStake.js');
var lpState = require('../../models/lpState.js');
var serverState = require('../../models/state.js');
var stakeAmount = require('../../models/stakeAmount.js')
const fetch = require('node-fetch');
var w3 = require('web3');
var web3= new w3("wss://polygon-mainnet.g.alchemy.com/v2/00FzjGqN484VOzWAqImJ5M_DH4x6zhXo");
// const web3 = createAlchemyWeb3("wss://eth-rinkeby.alchemyapi.io/v2/8GSflcYeKedpsujrr4DceWbhucZts7P3");
web3.eth.handleRevert = true;
const stakingContract = require('../../contract/StakeContract.json');
const nftContract = require('../../contract/NftContract.json');
const stakingRewardContract = new web3.eth.Contract(stakingContract, "0x80b7859967d0e40A0cB87560EA120DCB93c56230");
const nonfungibleContract = new web3.eth.Contract(nftContract, "0xC36442b4a4522E871399CD717aBDD847Ab11FE88");

// use starting block from the state :)
let startingBlock=28351081;

/* GET ALL Report */
const whitelistIps = [
    "54.68.63.193",
    "66.27.73.149",
    "::1",
    "::ffff:127.0.0.1"
]

let ip = ""

router.post("/savePokt", (req, res) => {
    ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (whitelistIps.indexOf(ip.trim()) > 0) {
        const thunder = new thunderPokt(req.body);
        thunder.save()
        .then(item => {
            res.send("item saved to database");
        })
        .catch(err => {
            res.status(400).send("unable to save to database");
        });
    }
});

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

let delay = 0

async function updateState(height) {
  state = await serverState.find().sort({_id:-1}).limit(1)
  if (height>state.lastBlock) {
    state.lastBlock = height
    state.save()
    return height
  }
  else {
    return state.lastBlock
  }
}

async function reload() {
  var web3= new w3("wss://polygon-mainnet.g.alchemy.com/v2/00FzjGqN484VOzWAqImJ5M_DH4x6zhXo");
  const stakingRewardContract = new web3.eth.Contract(stakingContract, "0x80b7859967d0e40A0cB87560EA120DCB93c56230");
  const nonfungibleContract = new web3.eth.Contract(nftContract, "0xC36442b4a4522E871399CD717aBDD847Ab11FE88");
  return 0;
}

setInterval(reload, 43200000);

// stakingRewardContract.events.TokenStaked({
//     fromBlock: startingBlock
// }, function(error, event){})
// .on('data', async function(event){
//     delay+=1
//     await sleep(delay*25)
//     const { tokenId } = event.returnValues;
//     state = await lpState.findOne({tokenId: tokenId})
//     if (state == null) {
//       let tokenState ={
//           tokenId: tokenId,
//           status: "Deposit",
//           syncedBlock:event.blockNumber
//       }
//       state = new lpState(tokenState);
//       await state.save()
//       console.log("made new state (unstake)", state)
//     }
//     if (state.syncedBlock<event.blockNumber) {
//       await updateState(event.blockNumber);
//       const latestIncentive = await thunderPokt.findOne().sort({_id:-1}).limit(1)
//       let stakeToken ={
//         tokenId: tokenId,
//         stakedTime: Number(new Date().getTime()),
//         incentiveKey: latestIncentive,
//         stakedBlock: event.blockNumber
//       }
//       const stake = new lpStake(stakeToken)
//       stake.save()
//       .then(item => {
//         console.log("Saved stakedToken");
//       })
//       .catch(err => {
//         console.log("Token save Failed");
//       });
//       lpState.findOneAndUpdate({ tokenId: tokenId}, { $set:{status: "Unstake", syncedBlock: event.blockNumber} }, {new: true}).then(updated => {
//         console.log("Stake Success");
//       }).catch(err => {
//         console.log("Stake Failed")
//       });
//     }
// })
// .on('error', console.error);


// stakingRewardContract.events.TokenUnstaked({
//     fromBlock: startingBlock
// }, function(error, event){})
// .on('data', async function(event){
//     delay+=1
//     await sleep(delay*25)
//     const { tokenId } = event.returnValues;
//     state = await lpState.findOne({tokenId: tokenId});
//     if (state == null) {
//       let tokenState ={
//           tokenId: tokenId,
//           status: "Deposit",
//           syncedBlock:event.blockNumber
//       }
//       state = new lpState(tokenState);
//       await state.save()
//       console.log("made new state (unstake)", state)
//     }
//     console.log("state??", state)
//     stake = await lpStake.findOne({tokenId: tokenId});
//     if (stake==null) {
//       stake={stakedBlock:1}
//     }
//     if (state.syncedBlock<event.blockNumber && stake.stakedBlock<event.blockNumber) {
//       await updateState(event.blockNumber);
//       await lpStake.findOneAndRemove({ tokenId: tokenId}).then(deleted => {
//         console.log("Removed");
//       }).catch(err => {
//         console.log("Failed");
//       });
//       lpState.findOneAndUpdate({ tokenId: tokenId}, { $set:{status: "Deposit", syncedBlock: event.blockNumber} }, {new: true}).then(updated => {
//         console.log("Unstake Success")
//       }).catch(err => {
//         console.log("Unstake Failed")
//       });
//     }
//   })
// .on('error', console.error);

// stakingRewardContract.events.DepositTransferred({
//     fromBlock: startingBlock
// }, function(error, event){})
// .on('data', async function(event){
//     delay+=1
//     await sleep(delay*25)
//     const { tokenId } = event.returnValues;
//     state = await lpState.findOne({tokenId: tokenId})
//     if (state != null) {
//       if (state.syncedBlock<event.blockNumber) {
//         await updateState(event.blockNumber);
//         lpState.findOneAndRemove({ tokenId: tokenId}).then(deleted => {
//           console.log("Withdraw Success")
//         }).catch(err => {
//           console.log("Withdraw Failed")
//         });
//       }
//     }
// })
// .on('error', console.error);

// nonfungibleContract.events.Approval({
//     fromBlock: startingBlock
// }, function(error, event){})
// .on('data', async function(event){
//     delay+=1
//     await sleep(delay*25)
//     const { tokenId } = event.returnValues;
//     state = await lpState.findOne({tokenId: tokenId})
//     console.log(tokenId, state)
//     if (state==null) {
//       let tokenState ={
//           tokenId: tokenId,
//           status: "Approve",
//           syncedBlock:event.blockNumber
//       }
//       await updateState(event.blockNumber);
//       const state = new lpState(tokenState);
//       console.log("created state approve", tokenId)
//       await state.save()
//       .then(item => {
//           console.log("Approve Success")
//       })
//       .catch(err => {
//           console.log("Approve Failed")
//       })
//     }
// })
// .on('error', console.error);

// nonfungibleContract.events.Transfer({
//     fromBlock: startingBlock
// }, function(error, event){})
// .on('data', async function(event){
//     delay+=1
//     await sleep(delay*25)
//     const { to, tokenId } = event.returnValues;
//     await updateState(event.blockNumber);
//     let addr2 = "0x80b7859967d0e40A0cB87560EA120DCB93c56230";
//     if ( to.toLowerCase() === addr2.toLowerCase() ){
//       state = await lpState.findOne({tokenId: tokenId})
//       // console.log("????")
//       if (state==null) {
//         let tokenState ={
//             tokenId: tokenId,
//             status: "Deposit",
//             syncedBlock:event.blockNumber
//         }
//         const state = new lpState(tokenState);
//         await state.save()
//         console.log("created new state transfer", tokenId)
//       }
//       else {
//         state = await lpState.findOne({tokenId: tokenId})
//         if (state.syncedBlock<event.blockNumber) {
//           lpState.findOneAndUpdate({ tokenId: tokenId}, { $set:{status: "Deposit", syncedBlock: event.blockNumber} }, {new: true}).then(updated => {
//             console.log("Transfer Success")
//           }).catch(err => {
//             console.log("Transfer Failed")
//           });
//         }

//       }
//     }

// })
// .on('error', console.error);

router.post("/getIncentive", (req, res) => {
    const { tokenId } = req.body;
    lpStake.findOne({ tokenId: tokenId})
    .then(item => {
        res.json(item);
    })
    .catch(err => {
        res.send("Not exist")
    })
});

router.get("/getLatestIncentive", async (req, res) => {
    const latestIncentive = await thunderPokt.findOne().sort({_id:-1}).limit(1)
    res.json({
        latestIncentive: latestIncentive
    })
});

router.post("/getStakedIncentive", async (req, res) => {
  console.log(req.body)
  const { stakedTime } = req.body
  console.log(stakedTime)
  const stakedIncentives = await thunderPokt.find()
  stakedIncentives.map(stakedIncentive => {
    console.log(stakedIncentive.startTime)
    if(stakedIncentive.startTime <= stakedTime && stakedTime <= stakedIncentive.endTime){
      console.log(stakedIncentive);
      res.json({
        stakedIncentive: stakedIncentive
      })    
    }
  })
});

router.get("/allStake", async (req, res) => {
    const allStaks = await lpStake.find()
    res.json({
        stakes: allStaks,
    })
})

router.get("/allState", async (req, res) => {
    const allStates = await lpState.find()
    res.json({
        states: allStates
    })
})

module.exports = router;
