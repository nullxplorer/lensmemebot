const { Wallet, Provider, Contract, ContractFactory } = require("zksync-ethers");
const { exec } = require('child_process');
const fs = require("fs");
require("dotenv").config();

async function deployToken(name, symbol, supply, recipient) {
  try {
    console.log('Starting deployment...');
    
    // Initialize the provider and wallet
    const provider = new Provider(process.env.RPC_URL || "https://rpc.testnet.lens.xyz");
    const wallet = new Wallet(process.env.PRIVATE_KEY, provider);

    // Load the artifact
    const artifact = JSON.parse(
      fs.readFileSync("./artifacts-zk/contracts/MemeToken.sol/MemeToken.json")
    );

    // Create contract factory
    const factory = new ContractFactory(artifact.abi, artifact.bytecode, wallet);
    
    console.log('Deploying MemeToken...');
    const token = await factory.deploy(name, symbol, supply, recipient);
    await token.waitForDeployment();
    
    // Show the contract info
    const contractAddress = await token.getAddress();
    console.log(`MemeToken was deployed to ${contractAddress}`);
    
    // Verify the contract
    await verifyContract(contractAddress, [name, symbol, supply, recipient]);
    
    return contractAddress;
  } catch (error) {
    console.error('Deployment error:', error);
    throw error;
  }
}

async function verifyContract(address, constructorArguments) {
  return new Promise((resolve, reject) => {
    console.log('Verifying contract...');
    const command = `npx hardhat verify --network lensTestnet ${address} ${constructorArguments.join(' ')}`;
    
    exec(command, (error, stdout, stderr) => {
      // Check if the error message indicates the contract is already verified
      if (error && error.message.includes('contract is already verified')) {
        console.log('Contract is already verified!');
        resolve('Contract already verified');
        return;
      }
      
      if (error) {
        console.error('Verification error:', error);
        reject(error);
        return;
      }
      
      // Only show verification success message
      if (stdout.includes('Successfully verified')) {
        console.log('Contract successfully verified!');
      }
      
      resolve(stdout);
    });
  });
}

module.exports = {
  deployToken,
  verifyContract
};
