import { SlashCommandBuilder } from 'discord.js';
import { getQueue, pause } from '../services/player.js';
import { Messages } from '../utils/constants.js';
import { successEmbed, errorEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('pause')
  .setDescription('Pausa la musica actual');

export async function execute(interaction) {
  const queue = getQueue(interaction.guildId);
  
  if (!queue || !queue.currentSong) {
    return interaction.reply({ 
      embeds: [errorEmbed(Messages.NOTHING_PLAYING)], 
      ephemeral: true 
    });
  }
  
  if (!queue.playing) {
    return interaction.reply({ 
      embeds: [errorEmbed('La musica ya esta pausada~')], 
      ephemeral: true 
    });
  }
  
  pause(queue);
  
  await interaction.reply({ 
    embeds: [successEmbed(Messages.PAUSED)] 
  });
}
