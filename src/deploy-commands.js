import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Emoji } from './utils/constants.js';

config();

const __dirname = dirname(fileURLToPath(import.meta.url));

async function deployCommands() {
  const commands = [];
  const commandsPath = join(__dirname, 'commands');
  const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  console.log(`${Emoji.LOADING} Cargando comandos...`);
  
  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = await import(`file://${filePath}`);
    
    if ('data' in command) {
      commands.push(command.data.toJSON());
      console.log(`${Emoji.CHECK} ${command.data.name}`);
    }
  }
  
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  
  try {
    console.log(`\n${Emoji.LOADING} Registrando ${commands.length} comandos...`);
    
    // Registrar comandos globalmente
    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    
    console.log(`${Emoji.SPARKLE} ¡${data.length} comandos registrados exitosamente!`);
    console.log(`${Emoji.HEART} Hitomi esta lista para usar~`);
  } catch (error) {
    console.error(`${Emoji.CROSS} Error registrando comandos:`, error);
  }
}

deployCommands();
