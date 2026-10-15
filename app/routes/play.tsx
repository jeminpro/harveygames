import { Link } from "react-router";
import { PhaserStage } from "../components/phaser-stage";
import { findGame } from "../games/catalog";
import { absoluteUrl, siteName } from "../site";
import type { Route } from "./+types/play";

export function meta({ params }: Route.MetaArgs) {
  const game = findGame(params.gameId);
  const title = game ? `${game.title} · ${siteName}` : siteName;
  const description = game
    ? `Play ${game.title} on ${siteName}. ${game.tagline}`
    : `${siteName} is a free browser game cabinet.`;
  const url = absoluteUrl(game ? `play/${game.id}/` : "");
  const image = absoluteUrl(game ? `covers/${game.id}.jpg` : "logo.png");

  return [
    { title },
    { name: "description", content: description },
    { name: "robots", content: "index, follow" },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: siteName },
    { property: "og:image", content: image },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];
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
