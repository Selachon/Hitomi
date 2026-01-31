import { SlashCommandBuilder } from 'discord.js';
import { getQueue } from '../services/player.js';
import { Messages } from '../utils/constants.js';
import { queueEmbed, errorEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('queue')
  .setDescription('Muestra la cola de reproduccion')
  .addIntegerOption(option =>
    option
      .setName('pagina')
      .setDescription('Numero de pagina')
      .setMinValue(1)
      .setRequired(false)
  );

export async function execute(interaction) {
  const queue = getQueue(interaction.guildId);
  const page = (interaction.options.getInteger('pagina') || 1) - 1;
  
  if (!queue || (!queue.currentSong && queue.songs.length === 0)) {
    return interaction.reply({ 
      embeds: [errorEmbed(Messages.QUEUE_EMPTY)], 
      ephemeral: true 
    });
  }
  
  const embed = queueEmbed(queue.songs, queue.currentSong, page);
  
  await interaction.reply({ embeds: [embed] });
}
