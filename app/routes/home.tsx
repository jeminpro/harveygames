import { useLiveQuery } from "dexie-react-hooks";
import { GameCard } from "../components/game-card";
import { getDb } from "../db/client";
import { catalog } from "../games/catalog";

export default function Home() {
  const liveGames = useLiveQuery(() => getDb().games.orderBy("order").toArray());
  const currentIds = new Set(catalog.map((game) => game.id));
  const savedGames = (liveGames ?? catalog).filter((game) => currentIds.has(game.id));
  const games = savedGames.length > 0 ? savedGames : catalog;

  return (
    <main className="library">
      <div className="library-intro">
        <p className="eyebrow">Choose a game</p>
      </div>
      <ul className="grid">
        {games.map((game) => (
          <li key={game.id}>
            <GameCard game={game} />
          </li>
        ))}
      </ul>
    </main>
  );
}
