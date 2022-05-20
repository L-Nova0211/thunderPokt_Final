const hre = require("hardhat");
async function main() {
  await hre.run("compile");

  const signer = (await hre.ethers.getSigners())[0]
  const ThunderPOKTPolygonMainnetAddress = '0x5430a0B6C11f870571ffA891d59dec8C4608Ea9A';
  const tpoktContract = await hre.ethers.getContractAt('tPokt',
    ThunderPOKTPolygonMainnetAddress,
    signer
  );

  const tpoktDecimals = await tpoktContract.decimals();

  const tpoktBalance = (await tpoktContract.balanceOf('0x26542d2cb22aae14311455f4347aec9a97c84d02')).toString()
  const wtPOKTContractAddress = '0xe95872fcc10ea0a782a58cb1380f8337b1aff288';
  const wtpoktContract = await hre.ethers.getContractAt('WtPOKT', wtPOKTContractAddress, signer)
  const wtpoktDecimals = await wtpoktContract.decimals();
  const wtpoktBalance = (await wtpoktContract.getWtPOKTByTPOKT(tpoktBalance)).toString()
  const tpoktConvertedBalance = (await wtpoktContract.getTPOKTByWtPOKT(wtpoktBalance)).toString()

  console.log({
    tpoktBalance,
    formattedTpoktBalance: hre.ethers.utils.formatUnits(tpoktBalance, tpoktDecimals),
     wtpoktBalance,
    formattedWtpoktBalance: hre.ethers.utils.formatUnits(wtpoktBalance, wtpoktDecimals), 
    tpoktConvertedBalance,
    formattedTpoktConvertedBalance: hre.ethers.utils.formatUnits(tpoktConvertedBalance, tpoktDecimals),
  })

  const tpoktExchangeRate = (await wtpoktContract.getTPOKTByWtPOKT(hre.ethers.utils.parseUnits('1', wtpoktDecimals)))
  const wtpoktExchangeRate = (await wtpoktContract.getWtPOKTByTPOKT(hre.ethers.utils.parseUnits('1', tpoktDecimals)))

  const tpoktPerToken  = await wtpoktContract.tPoktPerToken()
  const wtpoktPerToken = await wtpoktContract.tokensPerTPokt()

  console.log('tpoktExchangeRate 1 wtPOKT = ' + hre.ethers.utils.formatUnits(tpoktExchangeRate, tpoktDecimals)  + ' tPOKT')
  console.log('wtpoktExchangeRate 1 tPOKT = ' + hre.ethers.utils.formatUnits(wtpoktExchangeRate, wtpoktDecimals) + ' wtPOKT')
  console.log('tpoktPerToken 1 wtPOKT = ' + hre.ethers.utils.formatUnits(tpoktPerToken, tpoktDecimals) + ' wtPOKT')
  console.log('wtpoktPerToken 1 tPOKT = ' + hre.ethers.utils.formatUnits(wtpoktPerToken, wtpoktDecimals) + ' wtPOKT')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
