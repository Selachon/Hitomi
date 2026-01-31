import { SlashCommandBuilder } from 'discord.js';
import { getQueue, stop } from '../services/player.js';
import { Messages } from '../utils/constants.js';
import { successEmbed, errorEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('stop')
  .setDescription('Detiene la musica y limpia la cola');

export async function execute(interaction) {
  const queue = getQueue(interaction.guildId);
  
  if (!queue) {
    return interaction.reply({ 
      embeds: [errorEmbed(Messages.NOTHING_PLAYING)], 
      ephemeral: true 
    });
  }
  
  stop(queue);
  
  await interaction.reply({ 
    embeds: [successEmbed(Messages.STOPPED)] 
  });
}
