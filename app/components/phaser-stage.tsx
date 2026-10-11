import { useEffect, useRef } from "react";

export function PhaserStage({ title }: { title: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let game: { destroy: (removeCanvas: boolean) => void } | undefined;
    let cancelled = false;

    import("../games/shell-scene").then(({ mountShellGame }) => {
      if (cancelled || !host.isConnected) return;
      game = mountShellGame(host, title);
    });

    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, [title]);

  return (
    <div className="stage" role="region" aria-label={`${title} playfield`}>
      <div ref={hostRef} className="stage-host" />
    </div>
  );
}
