import { SlashCommandBuilder } from 'discord.js';
import { getQueue, setVolume } from '../services/player.js';
import { Messages, Emoji } from '../utils/constants.js';
import { successEmbed, errorEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('volume')
  .setDescription('Cambia el volumen de la musica')
  .addIntegerOption(option =>
    option
      .setName('nivel')
      .setDescription('Nivel de volumen (1-100)')
      .setMinValue(1)
      .setMaxValue(100)
      .setRequired(true)
  );

export async function execute(interaction) {
  const queue = getQueue(interaction.guildId);
  const volume = interaction.options.getInteger('nivel');
  
  if (!queue || !queue.currentSong) {
    return interaction.reply({ 
      embeds: [errorEmbed(Messages.NOTHING_PLAYING)], 
      ephemeral: true 
    });
  }
  
  setVolume(queue, volume);
  
  // Elegir emoji segun volumen
  let volumeEmoji = Emoji.VOLUME;
  if (volume < 30) volumeEmoji = Emoji.VOLUME_LOW;
  else if (volume < 10) volumeEmoji = Emoji.VOLUME_MUTE;
  
  await interaction.reply({ 
    embeds: [successEmbed(`${volumeEmoji} Volumen: **${volume}%**`)] 
  });
}
