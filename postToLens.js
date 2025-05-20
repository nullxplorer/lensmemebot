const { PublicClient, mainnet, uri } = require("@lens-protocol/client");
const { textOnly } = require("@lens-protocol/metadata");
const { post } = require("@lens-protocol/client/actions");
const { signMessageWith } = require("@lens-protocol/client/viem");
require("dotenv").config();

// Initialize the Lens client
const lensClient = PublicClient.create({
  environment: mainnet,
  origin: "https://hey.xyz/",
});

// Authentication function
async function authenticateWithLens() {
  try {
    const authenticated = await lensClient.login({
      accountOwner: {
        account: process.env.LENS_ACCOUNT_ADDRESS,
        app: process.env.LENS_APP_ID || "0x8A5Cc31180c37078e1EbA2A23c861Acf351a97cE", // Mainnet default app
        owner: process.env.LENS_OWNER_ADDRESS,
      },
      signMessage: signMessageWith(process.env.LENS_PRIVATE_KEY),
    });

    if (authenticated.isErr()) {
      throw new Error(`Authentication failed: ${authenticated.error.message}`);
    }

    return authenticated.value; // Returns SessionClient
  } catch (err) {
    console.error('Lens authentication failed:', err);
    throw err;
  }
}

async function createLensPost(tokenName, tokenSymbol, contractAddress, ownerAddress) {
  try {
    // Authenticate first
    const sessionClient = await authenticateWithLens();

    // Create post metadata following Lens standards
    const metadata = textOnly({
      content: `🚀 New Meme Token Deployed on Lens Chain!\n\n` +
              `🪙 Token: ${tokenName} (${tokenSymbol})\n` +
              `📦 Contract: ${contractAddress}\n` +
              `👑 Owner: ${ownerAddress}\n\n` +
              `#LensProtocol #MemeToken #Web3`,
      locale: 'en',
    });

    // Upload metadata to storage
    const { uri: contentUri } = await sessionClient.storage.uploadAsJson(metadata);

    // Create the post using authenticated session
    const result = await post(sessionClient, {
      contentUri: uri(contentUri)
    });

    if (result.isErr()) {
      throw new Error(`Failed to create post: ${result.error.message}`);
    }

    return result.unwrap().txId;
  } catch (err) {
    console.error('Error creating Lens post:', err);
    throw err;
  }
}

module.exports = { createLensPost };