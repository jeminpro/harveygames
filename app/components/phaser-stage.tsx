import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";

export function PhaserStage({ gameId, title }: { gameId: string; title: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let game: { destroy: (removeCanvas: boolean) => void } | undefined;
    let cancelled = false;

    const load =
      gameId === "rustwing"
        ? import("../games/rustwing/mount").then((mod) => mod.mountRustwing)
        : import("../games/blobber/mount").then((mod) => mod.mountBlobber);

    load
      .then((mount) => {
        if (cancelled || !host.isConnected) return;
        const next = mount(host, { onExit: () => navigate("/") });
        if (cancelled || !host.isConnected) {
          next.destroy(true);
          return;
        }
        game = next;
      })
      .catch((error: unknown) => {
        console.error("Could not open the playfield", error);
      });

    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, [gameId, navigate]);

  return (
    <div className="stage" role="region" aria-label={`${title} playfield`}>
      <div ref={hostRef} className="stage-host" />
    </div>
  );
}
