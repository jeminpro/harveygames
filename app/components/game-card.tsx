import { Link } from "react-router";
import { findGame, type GameRecord } from "../games/catalog";

export function GameCard({ game }: { game: GameRecord }) {
  const details = { ...game, ...findGame(game.id) };
  const cover = `${import.meta.env.BASE_URL.replace(/\/?$/, "/")}covers/${details.id}.jpg`;

  return (
    <Link to={`/play/${details.id}`} className="card">
      <span className="card-shot">
        <img src={cover} alt="" />
      </span>
      <span className="card-genre">{details.genre}</span>
      <h2>{details.title}</h2>
      <p>{details.tagline}</p>
    </Link>
  );
}
