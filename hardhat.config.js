require("@matterlabs/hardhat-zksync");
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",

  zksolc: {
    version: "1.5.12", // Specify version instead of "latest"
    settings: {
      codegen: "evmla" // Add this to use EVM legacy assembly codegen
    }
  },
  defaultNetwork: "lensTestnet",

  networks: {
    lensTestnet: {
      chainId: 37111,
      ethNetwork: "sepolia",
      url: process.env.RPC_URL || "https://rpc.testnet.lens.xyz",
      verifyURL: "https://block-explorer-verify.testnet.lens.dev/contract_verification",
      zksync: true,
      accounts: [process.env.PRIVATE_KEY]
    },
    lensMainnet: {
      chainId: 232,
      ethNetwork: "mainnet",
      url: process.env.RPC_URL || "https://rpc.lens.xyz",
      verifyURL: "https://verify.lens.xyz/contract_verification",
      zksync: true,
      accounts: [process.env.PRIVATE_KEY]
    },
    hardhat: {
      zksync: true
    }
  }
};
