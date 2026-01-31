import { SlashCommandBuilder } from 'discord.js';
import { getQueue } from '../services/player.js';
import { Messages } from '../utils/constants.js';
import { nowPlayingEmbed, errorEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('nowplaying')
  .setDescription('Muestra la cancion que esta sonando');

export async function execute(interaction) {
  const queue = getQueue(interaction.guildId);
  
  if (!queue || !queue.currentSong) {
    return interaction.reply({ 
      embeds: [errorEmbed(Messages.NOTHING_PLAYING)], 
      ephemeral: true 
    });
  }
  
  await interaction.reply({ 
    embeds: [nowPlayingEmbed(queue.currentSong)] 
  });
}
