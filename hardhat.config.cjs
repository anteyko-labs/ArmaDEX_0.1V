// Hardhat config - only for local development
// This file is ignored in Vercel builds via .vercelignore
try {
  require("@nomiclabs/hardhat-ethers");
  require("dotenv").config();
} catch (e) {
  // Ignore if dependencies are not available (e.g., in Vercel build)
  console.warn("Hardhat dependencies not available, skipping config");
}

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_KEY",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};