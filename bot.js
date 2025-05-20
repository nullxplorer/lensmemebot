const TelegramBot = require("node-telegram-bot-api");
const { deployToken, verifyContract } = require("./deploy");
const { userFollowsBot } = require("./lens");
const { Provider } = require("zksync-ethers");
const fs = require("fs");
require("dotenv").config();

// Add explorer URL
const EXPLORER_URL = "https://explorer.testnet.lens.xyz";

// Add contract artifact
const contractArtifact = JSON.parse(
  fs.readFileSync("./artifacts-zk/contracts/MemeToken.sol/MemeToken.json")
);

// Add provider
const provider = new Provider(process.env.RPC_URL || "https://rpc.testnet.lens.xyz");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const userSessions = {};

// Define bot commands - commands must be lowercase and without spaces
// Add new commands
// Update commands array
const commands = [
  { command: 'creatememetoken', description: 'Create a new meme token' },
  { command: 'help', description: 'Show available commands' },
  { command: 'start', description: 'Start the bot' },
  { command: 'tokeninfo', description: 'Get information about a deployed token' },
  { command: 'transfers', description: 'View recent token transfers' },
  { command: 'balance', description: 'Check token balance of any wallet' }
];

// Set bot commands
(async () => {
  try {
    await bot.setMyCommands(commands);
    console.log('Bot commands set successfully');
  } catch (error) {
    console.error('Error setting bot commands:', error.message);
  }
})();

// Add help command handler
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpText = commands
    .map(cmd => `/${cmd.command} - ${cmd.description}`)
    .join('\n');
  bot.sendMessage(chatId, `Available commands:\n${helpText}`);
});

// Add start command handler
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = 
    "🚀 *Welcome to Lens Meme Token Bot!*\n\n" +
    "I can help you:\n" +
    "• 🎯 Create your own meme token on Lens Chain\n" +
    "• 📊 Check token information\n" +
    "• 💰 View wallet balances\n" +
    "• 🔄 Track token transfers\n\n" +
    "Commands:\n" +
    "📝 /creatememetoken - Deploy your meme token\n" +
    "ℹ️ /tokeninfo - View token details\n" +
    "💼 /balance - Check wallet balance\n" +
    "📈 /transfers - View recent transfers\n" +
    "❓ /help - Show all commands\n\n" +
    "Ready to create your meme token? Use /creatememetoken to start!";
    
  bot.sendMessage(chatId, welcomeMessage, { parse_mode: "Markdown" });
});

// Update command regex to match new lowercase command
bot.onText(/\/creatememetoken/, (msg) => {
  const chatId = msg.chat.id;
  userSessions[chatId] = {};
  bot.sendMessage(chatId, "📛 What should be the token *name*?", { parse_mode: "Markdown" });
});

// Add token info command handler
bot.onText(/\/tokeninfo/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Please enter the token contract address:");
  
  // Create a one-time listener for the next message
  const listener = async (response) => {
    if (response.chat.id === chatId) {
      const address = response.text.trim();
      
      try {
        // Create contract instance
        const tokenContract = new ethers.Contract(
          address,
          contractArtifact.abi,
          provider
        );

        // Fetch token information
        const [name, symbol, totalSupply, decimals, owner] = await Promise.all([
          tokenContract.name(),
          tokenContract.symbol(),
          tokenContract.totalSupply(),
          tokenContract.decimals(),
          tokenContract.owner()  // Get the owner address
        ]);

        // Format total supply with decimals
        const formattedSupply = ethers.formatUnits(totalSupply, decimals);

        // Get balance of the owner
        const ownerBalance = await tokenContract.balanceOf(owner);
        const formattedBalance = ethers.formatUnits(ownerBalance, decimals);
        
        await bot.sendMessage(
          chatId,
          `📊 *Token Information*\n\n` +
          `*Name:* ${name}\n` +
          `*Symbol:* ${symbol}\n` +
          `*Total Supply:* ${formattedSupply} ${symbol}\n` +
          `*Owner Address:* \`${owner}\`\n` +
          `*Owner Balance:* ${formattedBalance} ${symbol}\n` +
          `*Contract:* \`${address}\`\n\n` +
          `🔗 View on Explorer: ${EXPLORER_URL}/address/${address}`,
          { parse_mode: "Markdown" }
        );

      } catch (error) {
        bot.sendMessage(
          chatId,
          "❌ Error fetching token information. Please make sure:\n" +
          "1. The contract address is valid\n" +
          "2. The contract is a valid ERC20 token\n" +
          "3. The contract is deployed on the Lens Chain"
        );
      }
      
      // Remove the listener
      bot.removeListener('message', listener);
    }
  };

  // Add the listener
  bot.on('message', listener);
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const session = userSessions[chatId];

  if (!session) return;

  if (!session.name) {
    session.name = msg.text;
    bot.sendMessage(chatId, "🔤 Token *symbol*?");
    return;
  }

  if (!session.symbol) {
    session.symbol = msg.text;
    bot.sendMessage(chatId, "🔢 Total supply (e.g. 1000000)?");
    return;
  }

  if (!session.supply) {
    session.supply = msg.text;
    if (isNaN(session.supply)) {
        return bot.sendMessage(chatId, "⚠️ Please enter a valid number for supply.");
    }
    await bot.sendMessage(chatId, "🌿 Your Lens username? (e.g. @lensmemebot)");
    await bot.sendMessage(chatId, "📝 *Note:* Don't have a Lens account yet? Create one for free at [Lens Onboarding](https://onboarding.lens.xyz/)", {
      parse_mode: "Markdown",
      disable_web_page_preview: true
    });
    return;
  }

  if (!session.lensUsername) {
    session.lensUsername = msg.text.replace('@', '');

    const result = await userFollowsBot(session.lensUsername);

    // 💥 ADD THIS FOLLOW CHECK BEFORE DEPLOYMENT
    const isFollowing = result.isFollowing;
    if (!isFollowing) {
      return bot.sendMessage(chatId, "❌ You must follow LensMemeBot on Lens to deploy a token.\n\n👉 [Follow Here](https://hey.xyz/u/lensmemebot)", {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      });
    }

    bot.sendMessage(chatId, "🚀 Deploying your meme token...");

    try {
      console.log('Deployment parameters:', {
        name: session.name,
        symbol: session.symbol,
        supply: session.supply,
        recipient: result.ownerAddress,
        lensUsername: session.lensUsername
      });
      
      const address = await deployToken(
        session.name,
        session.symbol,
        session.supply,
        result.ownerAddress
      );

      console.log('Deployment completed, address:', address);

      // Send initial success message
      await bot.sendMessage(
        chatId,
        `✅ Meme Token Deployed on Lens Chain!\n\n📦 *Contract Address*: \`${address}\`\n🪙 *Token*: ${session.name} (${session.symbol})\n👑 *Owner*: ${result.ownerAddress}\n🌿 *Lens Username*: @${session.lensUsername}\n🔗 Explorer: ${EXPLORER_URL}/address/${address}`,
        { parse_mode: "Markdown" }
      );

      // Send verification status
      await bot.sendMessage(
        chatId,
        "🔍 Verifying contract on block explorer...",
        { parse_mode: "Markdown" }
      );

      try {
        await verifyContract(
          address,
          [session.name, session.symbol, session.supply, result.ownerAddress]
        );
        
        await bot.sendMessage(
          chatId,
          "✅ Contract verified successfully! You can now view it on the block explorer.\n\n**Happy Meme-ing! 🚀**",
          { parse_mode: "Markdown" }
        );
      } catch (verifyErr) {
        await bot.sendMessage(
          chatId,
          `⚠️ Contract deployed but verification failed: ${verifyErr.message}\nYou can try verifying manually on the block explorer.`,
          { parse_mode: "Markdown" }
        );
      }
    } catch (err) {
      console.error('Deployment error:', err);
      bot.sendMessage(chatId, `❌ Deployment failed: ${err.message}\n\nPlease check:\n1. Valid wallet address\n2. Sufficient gas fees\n3. Network connectivity`);
    }

    delete userSessions[chatId];
  }
});

// Add transfers command handler
bot.onText(/\/transfers/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Please enter the token contract address:");
  
  // Create a one-time listener for the next message
  const listener = async (response) => {
    if (response.chat.id === chatId) {
      const address = response.text.trim();
      
      try {
        // Create contract instance
        const tokenContract = new ethers.Contract(
          address,
          contractArtifact.abi,
          provider
        );

        // Get Transfer events from the last 100 blocks
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 100);
        
        const filter = tokenContract.filters.Transfer();
        const events = await tokenContract.queryFilter(filter, fromBlock, currentBlock);

        if (events.length === 0) {
          await bot.sendMessage(
            chatId,
            "No recent transfers found for this token."
          );
          return;
        }

        // Format transfer events
        const transfers = await Promise.all(events.map(async (event) => {
          const [from, to, value] = [
            event.args[0],
            event.args[1],
            ethers.formatUnits(event.args[2], await tokenContract.decimals())
          ];
          return `From: ${from.slice(0, 6)}...${from.slice(-4)}\n` +
                 `To: ${to.slice(0, 6)}...${to.slice(-4)}\n` +
                 `Amount: ${value}\n` +
                 `TX: https://explorer.testnet.lens.xyz/tx/${event.transactionHash}\n`;
        }));

        // Send transfers in batches to avoid message length limits
        const batchSize = 5;
        for (let i = 0; i < transfers.length; i += batchSize) {
          const batch = transfers.slice(i, i + batchSize);
          await bot.sendMessage(
            chatId,
            `🔄 *Recent Transfers*\n\n${batch.join('\n')}`,
            { parse_mode: "Markdown" }
          );
        }

      } catch (error) {
        bot.sendMessage(
          chatId,
          "❌ Error fetching transfer history. Please make sure:\n" +
          "1. The contract address is valid\n" +
          "2. The contract is a valid ERC20 token\n" +
          "3. The contract is deployed on the Lens Chain"
        );
      }
      
      // Remove the listener
      bot.removeListener('message', listener);
    }
  };

  // Add the listener
  bot.on('message', listener);
});

// Add balance command handler
bot.onText(/\/balance/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Please enter the token contract address:");
  
  let tokenContract;
  let tokenSymbol;
  let decimals;
  
  const listener = async (response) => {
    if (response.chat.id === chatId) {
      if (!tokenContract) {
        // First message - get token contract
        const tokenAddress = response.text.trim();
        
        try {
          tokenContract = new ethers.Contract(
            tokenAddress,
            contractArtifact.abi,
            provider
          );
          
          // Get token info
          [tokenSymbol, decimals] = await Promise.all([
            tokenContract.symbol(),
            tokenContract.decimals()
          ]);
          
          bot.sendMessage(chatId, "Now enter the wallet address to check balance:");
          return;
        } catch (error) {
          bot.sendMessage(
            chatId,
            "❌ Invalid token contract address. Please make sure:\n" +
            "1. The contract address is valid\n" +
            "2. The contract is a valid ERC20 token\n" +
            "3. The contract is deployed on the Lens Chain"
          );
          bot.removeListener('message', listener);
          return;
        }
      } else {
        // Second message - get wallet balance
        const walletAddress = response.text.trim();
        
        try {
          const balance = await tokenContract.balanceOf(walletAddress);
          const formattedBalance = ethers.formatUnits(balance, decimals);
          
          await bot.sendMessage(
            chatId,
            `💰 *Wallet Balance*\n\n` +
            `*Address:* \`${walletAddress}\`\n` +
            `*Balance:* ${formattedBalance} ${tokenSymbol}\n\n` +
            `🔗 View on Explorer: https://explorer.testnet.lens.xyz/address/${walletAddress}`,
            { parse_mode: "Markdown" }
          );
        } catch (error) {
          bot.sendMessage(
            chatId,
            "❌ Error checking balance. Please make sure the wallet address is valid."
          );
        }
        
        // Remove listener after getting balance
        bot.removeListener('message', listener);
      }
    }
  };
  
  // Add the listener
  bot.on('message', listener);
});
