import Phaser from "phaser";
import { BlobberSession } from "./session";
import "./blobber.css";

type MountOptions = {
  onExit: () => void;
};

class BlobberScene extends Phaser.Scene {
  private session?: BlobberSession;
  private alive = true;

  constructor(
    private readonly overlay: HTMLElement,
    private readonly onExit: () => void,
  ) {
    super("blobber");
  }

  private readonly onPostRender = () => {
    this.session?.render();
  };

  create() {
    if (!this.alive) return;
    const canvas = this.game.canvas;
    const context = this.game.context;
    if (!(context instanceof CanvasRenderingContext2D)) {
      throw new Error("Blobber needs the canvas renderer.");
    }

    canvas.id = "arena";
    canvas.setAttribute("aria-label", "Blobber arena");
    this.session = new BlobberSession({
      root: this.overlay,
      canvas,
      context,
      onExit: this.onExit,
      getView: () => {
        const bounds = canvas.getBoundingClientRect();
        return {
          width: bounds.width,
          height: bounds.height,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
        };
      },
    });
    this.game.events.on(Phaser.Core.Events.POST_RENDER, this.onPostRender);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.session.render();
  }

  update(_time: number, delta: number) {
    this.session?.step(delta);
  }

  shutdown() {
    this.alive = false;
    this.game?.events.off(Phaser.Core.Events.POST_RENDER, this.onPostRender);
    this.session?.destroy();
    this.session = undefined;
  }
}

export function mountBlobber(parent: HTMLElement, options: MountOptions) {
  const overlay = document.createElement("div");
  overlay.className = "blobber";
  parent.append(overlay);

  const scene = new BlobberScene(overlay, options.onExit);
  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent,
    banner: false,
    backgroundColor: "#090f25",
    autoFocus: false,
    input: false,
    width: parent.clientWidth || window.innerWidth,
    height: parent.clientHeight || window.innerHeight,
    scale: {
      mode: Phaser.Scale.RESIZE,
      resizeInterval: 200,
    },
    scene,
  });

  return {
    destroy(removeCanvas: boolean) {
      scene.shutdown();
      game.destroy(removeCanvas);
      overlay.remove();
    },
  };
}
