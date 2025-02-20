const { Pool } = require("@uniswap/v3-sdk");

async function main() {
  require("dotenv").config();
  const { ETH_NODE_URL } = process.env;
  const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
  const web3 = createAlchemyWeb3(ETH_NODE_URL);
  const ABI = require("./swifyFactoryABI.json");
  const poolABI = require("./swifyPoolABI.json");

  const contractAddress = "0x6f58989Cda2c51c6b80F822181025Fac71d750d8";

  // Check if contract code exists at the given address
  console.log("testing contract");
  const code = await web3.eth.getCode(contractAddress);
  if (code === "0x") {
    console.error(`No contract deployed at address ${contractAddress}`);
  } else {
    console.log("contract exists");
  }

  const swifyFactory = new web3.eth.Contract(ABI, contractAddress);

  //read owner
  try {
    const owner = await swifyFactory.methods.owner().call();
    console.log("Contract owner:", owner);
  } catch (err) {
    console.error("Error calling owner() method:", err.message);
  }

  //get pool address
  try {
    const Pool = await swifyFactory.methods
      .getPool(
        "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
        "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357",
        3000
      )
      .call();
    console.log("Pool:", Pool);
  } catch (err) {
    console.error("Error calling getPool() method:", err.message);
  }

  const swifyPool = new web3.eth.Contract(
    poolABI,
    "0x6ecd2884a1a2983356e22679c2ea48feb9786176"
  );
  //get pool details
  try {
    const poolConfig = await swifyPool.methods.slot0().call();
    console.log("Pool configurations:", poolConfig);
  } catch (err) {
    console.error("Error calling getPool() method:", err.message);
  }
}

main();
