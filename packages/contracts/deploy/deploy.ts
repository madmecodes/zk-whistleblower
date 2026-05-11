import { ethers, run } from "hardhat";

async function main() {
  const SEMAPHORE_SEPOLIA = "0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D";

  const WhistleblowerPlatform = await ethers.getContractFactory(
    "WhistleblowerPlatform"
  );
  const platform = await WhistleblowerPlatform.deploy(SEMAPHORE_SEPOLIA);
  await platform.waitForDeployment();

  const address = await platform.getAddress();
  console.log("WhistleblowerPlatform deployed to:", address);

  console.log("Waiting for block confirmations...");
  await platform.deploymentTransaction()?.wait(5);

  console.log("Verifying on Etherscan...");
  await run("verify:verify", {
    address: address,
    constructorArguments: [SEMAPHORE_SEPOLIA],
  });

  console.log("Verified.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
