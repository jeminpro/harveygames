import { Link } from "react-router";
import type { GameRecord } from "../games/catalog";

export function GameCard({ game }: { game: GameRecord }) {
  const index = String(game.order).padStart(2, "0");

  return (
    <Link to={`/play/${game.id}`} className="card">
      <span className="card-index">{index}</span>
      <h2>{game.title}</h2>
      <p>{game.tagline}</p>
      <span className="play-pill">Play</span>
    </Link>
  );
}
