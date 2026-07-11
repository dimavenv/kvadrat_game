import Phaser from 'phaser';
import { buildGameConfig } from './config/gameConfig';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';

new Phaser.Game(buildGameConfig([BootScene, MenuScene]));
