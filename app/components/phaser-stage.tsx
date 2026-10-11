import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";

export function PhaserStage({ title }: { title: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let game: { destroy: (removeCanvas: boolean) => void } | undefined;
    let cancelled = false;

    import("../games/blobber/mount").then(({ mountBlobber }) => {
      if (cancelled || !host.isConnected) return;
      game = mountBlobber(host, { onExit: () => navigate("/") });
    });

    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, [navigate]);

  return (
    <div className="stage" role="region" aria-label={`${title} playfield`}>
      <div ref={hostRef} className="stage-host" />
    </div>
  );
}
