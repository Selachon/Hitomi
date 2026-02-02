import { SlashCommandBuilder } from 'discord.js';
import { getQueue, shuffleQueue } from '../services/player.js';
import { Messages } from '../utils/constants.js';
import { successEmbed, errorEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('shuffle')
  .setDescription('Mezcla aleatoriamente la cola de reproduccion');

export async function execute(interaction) {
  const queue = getQueue(interaction.guildId);

  if (!queue || !queue.currentSong) {
    return interaction.reply({
      embeds: [errorEmbed(Messages.NOTHING_PLAYING)],
      ephemeral: true
    });
  }

  if (queue.songs.length <= 1) {
    return interaction.reply({
      embeds: [errorEmbed('No hay suficientes canciones en la cola para mezclar~')],
      ephemeral: true
    });
  }

  shuffleQueue(queue);

  await interaction.reply({
    embeds: [successEmbed(`${Messages.SHUFFLED}\n${queue.songs.length} canciones mezcladas~`)]
  });
}
