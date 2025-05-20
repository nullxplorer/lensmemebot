const { PublicClient, testnet, mainnet, evmAddress } = require("@lens-protocol/client");
// const { evmAddress } = require("@lens-protocol/types");
const { fetchAccount, fetchFollowers, fetchFollowStatus } = require("@lens-protocol/client/actions");

const lensClient = PublicClient.create({
  environment: mainnet,
  origin: "https://hey.xyz/",
});
const BOT_HANDLE = "lensmemebot";
// const BOT_ADDRESS = "0xaaE1d769D7d5f3dBA2216F20b0930916D8C05349";
const BOT_ADDRESS = "0x63fc2a3152991202a15c8A699343CC0c726d759d";

async function userFollowsBot(username) {
  try {
    const userAccountResult = await fetchAccount(lensClient, {
      username: {
        localName: username,
      },
    });
    console.log("User Account Username result:", userAccountResult);

    const userAddress = userAccountResult.value.address;
    const ownerAddress = userAccountResult.value.owner;
    
    const result = await fetchFollowStatus(lensClient, {
      pairs: [
        {
          account: evmAddress(BOT_ADDRESS),    // The bot's account being followed
          follower: evmAddress(userAddress),   // The user wallet trying to deploy
        },
      ],
    });

    console.log("Follow status:", result);
    if (result.isErr()) {
      console.error("Error fetching follow status:", result.error);
      return false;
    }
    const followStatusRaw = JSON.stringify(result.value, null, 2);
    console.log("Follow status raw:", followStatusRaw);
    console.log("Follow status exact:", JSON.stringify(result.value, null, 2));

    // const followStatus = followStatusRaw[0].isFollowing.onChain;
    const followStatus = result.value[0].isFollowing.onChain;
    console.log("Follow status:", followStatus);
    return { isFollowing: followStatus, ownerAddress: ownerAddress };
    // return followStatus;
  } catch (err) {
    console.error("Lens check failed:", err.message);
    return { isFollowing: false, ownerAddress: null };
    return false;
  }
}

module.exports = { userFollowsBot };

