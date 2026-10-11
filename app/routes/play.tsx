import { Link } from "react-router";
import { PhaserStage } from "../components/phaser-stage";
import { findGame } from "../games/catalog";
import type { Route } from "./+types/play";

export function meta({ params }: Route.MetaArgs) {
  const game = findGame(params.gameId);
  return [{ title: game ? `${game.title} · Harvey Games` : "Harvey Games" }];
}

export default function Play({ params }: Route.ComponentProps) {
  const game = findGame(params.gameId);

  if (!game) {
    return (
      <main className="missing">
        <p className="eyebrow">Missing title</p>
        <h1>That game is not in the cabinet.</h1>
        <Link to="/" className="back-link">
          Back to the library
        </Link>
      </main>
    );
  }

  return (
    <main className="play-screen">
      <PhaserStage key={game.id} gameId={game.id} title={game.title} />
    </main>
  );
}
