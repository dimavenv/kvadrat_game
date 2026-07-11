import Phaser from 'phaser';
import { buildGameConfig } from './config/gameConfig';
import { BarScene } from './scenes/BarScene';
import { BootScene } from './scenes/BootScene';
import { EndingScene } from './scenes/EndingScene';
import { MenuScene } from './scenes/MenuScene';
import { ScooterScene } from './scenes/ScooterScene';

new Phaser.Game(buildGameConfig([BootScene, MenuScene, BarScene, EndingScene, ScooterScene]));
