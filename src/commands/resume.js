import { SlashCommandBuilder } from 'discord.js';
import { getQueue, resume } from '../services/player.js';
import { Messages } from '../utils/constants.js';
import { successEmbed, errorEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('resume')
  .setDescription('Reanuda la musica pausada');

export async function execute(interaction) {
  const queue = getQueue(interaction.guildId);
  
  if (!queue || !queue.currentSong) {
    return interaction.reply({ 
      embeds: [errorEmbed(Messages.NOTHING_PLAYING)], 
      ephemeral: true 
    });
  }
  
  if (queue.playing) {
    return interaction.reply({ 
      embeds: [errorEmbed('La musica ya esta sonando~')], 
      ephemeral: true 
    });
  }
  
  resume(queue);
  
  await interaction.reply({ 
    embeds: [successEmbed(Messages.RESUMED)] 
  });
}
