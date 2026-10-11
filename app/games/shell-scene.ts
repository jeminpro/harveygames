import Phaser from "phaser";

export function mountShellGame(parent: HTMLElement, title: string) {
  class ShellScene extends Phaser.Scene {
    constructor() {
      super("shell");
    }

    create() {
      const { width, height } = this.scale;
      this.cameras.main.setBackgroundColor("#07080d");

      const grid = this.add.graphics();
      grid.lineStyle(1, 0xc8f542, 0.14);
      const step = 64;
      for (let x = step; x < width; x += step) {
        grid.lineBetween(x, 48, x, height - 48);
      }
      for (let y = step; y < height; y += step) {
        grid.lineBetween(48, y, width - 48, y);
      }

      this.add
        .rectangle(width / 2, height / 2, width - 36, height - 36)
        .setStrokeStyle(2, 0xc8f542, 0.85);

      this.add
        .text(width / 2, height / 2 - 36, title, {
          fontFamily: "Syne, sans-serif",
          fontSize: "64px",
          color: "#f4f1ea",
        })
        .setOrigin(0.5);

      this.add
        .text(width / 2, height / 2 + 28, "SHELL ONLINE", {
          fontFamily: "Outfit, sans-serif",
          fontSize: "16px",
          color: "#c8f542",
        })
        .setOrigin(0.5);

      const marker = this.add.rectangle(width / 2 - 140, height - 88, 22, 22, 0xc8f542);
      this.tweens.add({
        targets: marker,
        x: width / 2 + 140,
        duration: 1600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 1280,
    height: 720,
    backgroundColor: "#07080d",
    banner: false,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: ShellScene,
  });
}
