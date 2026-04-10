require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const { addResult, getResults } = require('./storage');

const WORDLE_REGEX = /Wordle\s+(\d+)\s+([1-6X])\/6/i;
const COMMAND_REGEX = /^!ranking\s+(\S+)$/i;
const WORDLE_EPOCH = new Date('2021-06-19T00:00:00Z').getTime();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const WORDLE_CHANNEL_ID = process.env.WORDLE_CHANNEL_ID;

if (!DISCORD_TOKEN) {
  console.error('Missing DISCORD_TOKEN in environment variables.');
  process.exit(1);
}

if (!WORDLE_CHANNEL_ID) {
  console.error('Missing WORDLE_CHANNEL_ID in environment variables.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== WORDLE_CHANNEL_ID) return;

  // Handle !ranking command
  const cmdMatch = message.content.match(COMMAND_REGEX);
  if (cmdMatch) {
    let gameNumber = cmdMatch[1];

    if (gameNumber.toLowerCase() === 'today') {
      gameNumber = String(Math.floor((Date.now() - WORDLE_EPOCH) / 86_400_000));
    }

    const results = getResults(gameNumber);

    if (results.length === 0) {
      message.reply(`No results found for Wordle ${gameNumber}.`);
      return;
    }

    const lines = results.map((r, i) => {
      return `${i + 1}. ${r.username} — ${r.attempts}/6`;
    });

    message.reply(`🏆 **Wordle ${gameNumber} Ranking:**\n${lines.join('\n')}`);
    return;
  }

  // Detect Wordle result
  const match = message.content.match(WORDLE_REGEX);
  if (match) {
    const gameNumber = match[1];
    const attempts = match[2].toUpperCase();

    addResult(gameNumber, {
      userId: message.author.id,
      username: message.author.username,
      attempts,
      timestamp: message.createdAt.toISOString(),
    });
  }
});

client.login(DISCORD_TOKEN);
