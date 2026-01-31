import { SlashCommandBuilder } from 'discord.js';
import { getQueue, skip } from '../services/player.js';
import { Messages } from '../utils/constants.js';
import { successEmbed, errorEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('skip')
  .setDescription('Salta a la siguiente cancion');

export async function execute(interaction) {
  const queue = getQueue(interaction.guildId);
  
  if (!queue || !queue.currentSong) {
    return interaction.reply({ 
      embeds: [errorEmbed(Messages.NOTHING_PLAYING)], 
      ephemeral: true 
    });
  }
  
  const skippedSong = queue.currentSong.title;
  skip(queue);
  
  await interaction.reply({ 
    embeds: [successEmbed(`${Messages.SKIPPED}\nSalte: **${skippedSong}**`)] 
  });
}
