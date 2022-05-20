require('dotenv').config()
require("@nomiclabs/hardhat-waffle");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("transfer", "Prints the list of accounts")
  .addParam("to", "The account's address")
.setAction(async (taskArgs, hre) => {
  const signer = (await hre.ethers.getSigners())[0];

  console.log("Transfering 100 ETH to " + taskArgs.to)

  const tx = await signer.sendTransaction({
    to: taskArgs.to,
    value: ethers.utils.parseEther("100.0")
  });

  await tx.wait()

  console.log("Transferred 100 ETH to " + taskArgs.to)
});


// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.7",
      },
      {
        version: "0.6.12",
      },
    ]
  },
  networks: {
    hardhat: {
      forking: process.env.ARCHIVE_URL ? { url: process.env.ARCHIVE_URL } : undefined
    }
  }
};
