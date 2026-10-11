import { useLiveQuery } from "dexie-react-hooks";
import { GameCard } from "../components/game-card";
import { getDb } from "../db/client";
import { catalog } from "../games/catalog";

export default function Home() {
  const liveGames = useLiveQuery(() => getDb().games.orderBy("order").toArray());
  const games = liveGames?.length ? liveGames : catalog;

  return (
    <main className="library">
      <div className="library-intro">
        <p className="eyebrow">Choose a game</p>
        <h1>Ready when you are.</h1>
        <p>
          Pick a title and play it here. The cabinet stays on this device.
        </p>
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
