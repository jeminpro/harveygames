import { cabinetHomeMarkup } from "../play-chrome";

export const rustwingMarkup = `
<header>
  <div class="header-left">
    ${cabinetHomeMarkup}
    <button type="button" class="brand" id="brand" aria-label="Flight Simulator menu">
      <span class="brand-plane" aria-hidden="true"></span>
      <span class="brand-word">Flight Simulator</span>
    </button>
  </div>
  <div class="coin-counter">
    <i aria-hidden="true"></i>
    <div>
      <small id="coinLabel">Coins</small>
      <strong id="coins">0</strong>
    </div>
  </div>
</header>
<main id="menu" class="menu">
  <p class="eyebrow"><span></span> Open fields</p>
  <h1>Ruined wings.<br>Still <em>flying.</em></h1>
  <p class="intro">A patched-up plane that still works. Coins you earn stay with you until you spend them at the market.</p>
  <div class="menu-actions">
    <button id="market" class="market-button" type="button">Market</button>
    <button id="start" class="primary" type="button">Take off <span>↗</span></button>
  </div>
  <p class="controls">Up points the nose up · Down points it down</p>
</main>
<div id="hud" class="hud hidden">
  <div class="score-pill">
    <div><small>Flown</small><b id="distance">0 m</b></div>
  </div>
  <p id="rate">Coins for every stretch you stay up.</p>
  <p id="hint">Up to point up. Down to point down.</p>
</div>
<div id="pitchControls" class="pitch-controls hidden">
  <button id="pitchUp" type="button" aria-label="Point up" aria-pressed="false">Up</button>
  <button id="pitchDown" type="button" aria-label="Point down" aria-pressed="false">Down</button>
</div>
<div id="dialog" class="dialog hidden" role="dialog" aria-modal="true" aria-labelledby="dialogTitle">
  <div class="dialog-card">
    <p class="eyebrow"><span></span> Still airworthy</p>
    <h2 id="dialogTitle">Caught by the field.</h2>
    <p id="dialogCopy">The wreck is down. Your coins stayed with you.</p>
    <div class="round-stats">
      <div><small>Earned</small><b id="dialogEarned">0</b></div>
      <div><small>Flown</small><b id="dialogDistance">0 m</b></div>
      <div><small>Coins</small><b id="dialogCoins">0</b></div>
    </div>
    <button id="again" class="primary" type="button">Fly again <span>↗</span></button>
    <button id="menuReturn" class="text-button" type="button">Back to the menu</button>
  </div>
</div>
<div id="shop" class="dialog hidden" role="dialog" aria-modal="true" aria-labelledby="shopTitle">
  <div class="dialog-card shop-card">
    <p class="eyebrow"><span></span> Market</p>
    <h2 id="shopTitle">Spend your coins.</h2>
    <p>Buy it once and it stays on the plane. Coins only leave when you buy.</p>
    <ul id="shopList" class="shop-list"></ul>
    <button id="shopClose" class="text-button" type="button">Back</button>
  </div>
</div>
`;
