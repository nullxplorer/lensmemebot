# 🚀 Lens Meme Token Deployer Bot on Lens Chain

[![Telegram Bot](https://img.shields.io/badge/Telegram-Bot-blue.svg?logo=telegram)](https://t.me/your_bot_username)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Lens Protocol](https://img.shields.io/badge/Built%20for-Lens%20Chain-purple.svg)](https://lens.xyz)
[![Deploys on](https://img.shields.io/badge/Deploys%20on-ZKSync%20Lens%20Chain-29b6f6.svg)](https://hey.xyz)

A powerful Telegram bot that lets anyone deploy a verified **ERC-20 meme token** on the **Lens Chain (ZKsync-based Layer 2)** in seconds — no coding needed!

Created for memecoin enthusiasts, this bot integrates with **Lens Social Primitives** to ensure tokens are posted socially, enabling discoverability and virality.

---

## ⚙️ Features

- 🔧 Deploy meme tokens with name, symbol, supply & Lens handle
- ✅ Auto-verifies contracts on Lens Chain explorer
- 👑 Transfers 100% token supply and contract ownership to the Lens profile owner's wallet
- 🔍 View token info (name, symbol, owner, supply, balance)
- 🔄 View recent token transfers
- 📢 Auto-posts deployed tokens to [Hey.xyz](https://hey.xyz/u/lensmemebot)
- 👣 Enforces follow-gate (users must follow `@lensmemebot` to deploy)
- 🌿 Resolves user wallet from Lens handle automatically
- 💬 Telegram bot interface with session tracking per user

---

## 🧪 Commands

| Command              | Description                              |
|----------------------|------------------------------------------|
| `/start`             | Start the bot                            |
| `/help`              | List all available commands              |
| `/creatememetoken`   | Deploy a new meme token on Lens Chain    |
| `/tokeninfo`         | View token details of a deployed token   |
| `/transfers`         | View recent transfers of a token         |
| `/balance`           | Check token balance of any wallet        |

---

## 🛠 How Deployment Works

1. User types `/creatememetoken`
2. Bot collects:
   - 📛 Token name
   - 🔤 Token symbol
   - 🔢 Total supply
   - 🌿 Lens handle (e.g. `@vitalik`)
3. Bot:
   - Resolves the Lens profile owner wallet from handle
   - Verifies if user follows `@lensmemebot` on Lens
   - Deploys the ERC-20 token on Lens Chain
   - Mints total supply to user's Lens profile owner wallet
   - Transfers ownership to that wallet
   - Verifies the contract on explorer
   - Posts the token launch to [Hey.xyz](https://hey.xyz/u/lensmemebot)
4. User receives:
   - ✅ Verified contract address
   - 💰 Full token supply
   - 🔗 Explorer link
   - 📢 Lens post for sharing

---

## 🔐 Security

- Bot deploys from a backend wallet (set via `.env`)
- User provides only their **Lens handle**, not wallet address
- After deployment:
  - 💸 Full token supply is transferred to the Lens profile owner
  - 👑 Contract ownership is transferred to that wallet
- ✅ Bot retains **no control or access** post-deployment

---

## 📢 Lens Social Integration

### 🔒 Follow Gate
- Users **must follow `@lensmemebot` on Lens** to deploy a token
- Bot checks this using Lens SDK's `fetchFollowStatus()`

### 📝 Auto Posts to Hey.xyz
- Bot auto-publishes a **Lens post** with:
  - Token name
  - Symbol
  - Contract address
  - Explorer link
- Appears on [https://hey.xyz/u/lensmemebot](https://hey.xyz/u/lensmemebot)

---

## 📁 Project Structure

```
.
├── bot.js                # Main Telegram bot logic
├── deploy.js             # Handles contract deployment & verification
├── postToLens.js         # Creates onchain Lens post via Lens SDK
├── lens.js               # Follower check and handle resolution
├── artifacts-zk/         # Compiled ZKsync-compatible contract ABI
│   └── MemeToken.json
├── contracts/
│   └── MemeToken.sol     # ERC-20 token contract
└── .env                  # Environment variables
```

---

## 🧱 Smart Contract Template

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MemeToken is ERC20, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner
    ) ERC20(name, symbol) {
        _mint(owner, initialSupply);
        transferOwnership(owner);
    }
}
```

---

## 🌐 Lens Chain
- ✅ Tokens deployed on **Lens Chain** (ZKsync-based)
- 🔍 Verified via zkSync block explorer
- ⚡ Fast finality & low gas fees
- 📢 Posted to Lens via `createPost()` and `textOnly()` metadata

---

## ⚙️ Requirements

- Node.js
- `ethers`, `dotenv`, `node-telegram-bot-api`, `viem`, `@lens-protocol/client`, `@lens-protocol/metadata`, `@lens-protocol/storage`
- Lens RPC endpoint (ZKsync-compatible)
- A funded bot wallet (PRIVATE_KEY in `.env`)
- An existing Lens Profile (e.g. `@lensmemebot`)

---

## 🧪 Environment Setup

```ini
BOT_TOKEN=your_telegram_bot_token
PRIVATE_KEY=your_deployer_wallet_private_key
RPC_URL=https://rpc.zksync.io
```

---

## 🚀 Setup & Installation

1. **Clone the repository:**

```bash
git clone https://github.com/nullxplorer/lensmemebot.git
cd lensmemebot
```

2. **Configure environment:**

```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Compile contracts:**

```bash
npx hardhat compile
```

4. **Start the bot:**

```bash
npm start
```

5. **Test it in Telegram:**

- Start your bot
- Type `/creatememetoken`
- Follow the prompts

---

## 📬 Output Example

```text
User: /creatememetoken
Bot: What should be the token name?
User: DogeKing
Bot: Token symbol?
User: DKING
Bot: Total supply?
User: 69420000
Bot: Your Lens handle?
User: @vitalik
```

🚀 Deploying your meme token...

✅ Deployed!  
📦 Contract Address: `0xABCDEF...`  
👑 Owner: Wallet behind `@vitalik`  
🔗 Explorer: `https://explorer.lenschain.xyz/address/0xABCDEF...`  
📢 View post: `https://hey.xyz/u/lensmemebot`  

---

## 🧠 License & Contributions

Open-source under MIT. PRs welcome!