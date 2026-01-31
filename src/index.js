import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Emoji } from './utils/constants.js';

// Cargar variables de entorno
config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// Crear cliente de Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ],
});

// Coleccion de comandos
client.commands = new Collection();

// Cargar comandos
async function loadCommands() {
  const commandsPath = join(__dirname, 'commands');
  const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = await import(`file://${filePath}`);
    
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      console.log(`${Emoji.CHECK} Comando cargado: /${command.data.name}`);
    } else {
      console.log(`${Emoji.WARN} Comando ${file} no tiene data o execute`);
    }
  }
}

// Evento: Bot listo
client.once(Events.ClientReady, (c) => {
  console.log(`\n${Emoji.SPARKLE} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`${Emoji.FLOWER} Hitomi esta lista~!`);
  console.log(`${Emoji.HEART} Conectada como: ${c.user.tag}`);
  console.log(`${Emoji.NOTES} Servidores: ${c.guilds.cache.size}`);
  console.log(`${Emoji.SPARKLE} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  // Estado del bot
  client.user.setActivity('musica kawaii~ | /help', { type: 2 }); // 2 = Listening
});

// Evento: Interaccion (comandos)
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  const command = client.commands.get(interaction.commandName);
  
  if (!command) {
    console.error(`Comando no encontrado: ${interaction.commandName}`);
    return;
  }
  
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error ejecutando ${interaction.commandName}:`, error);
    
    const errorMessage = { 
      content: `${Emoji.SAD} Ocurrio un error al ejecutar el comando...`, 
      ephemeral: true 
    };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Iniciar bot
async function start() {
  console.log(`\n${Emoji.LOADING} Iniciando Hitomi...`);
  
  await loadCommands();
  
  if (!process.env.DISCORD_TOKEN) {
    console.error(`${Emoji.CROSS} No se encontro DISCORD_TOKEN en .env`);
    process.exit(1);
  }
  
  await client.login(process.env.DISCORD_TOKEN);
}

start().catch(error => {
  console.error(`${Emoji.CROSS} Error fatal:`, error);
  process.exit(1);
});
