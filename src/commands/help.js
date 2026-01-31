import { SlashCommandBuilder } from 'discord.js';
import { helpEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Muestra la ayuda de Hitomi');

export async function execute(interaction) {
  await interaction.reply({ embeds: [helpEmbed()] });
}
