import { cabinetHomeMarkup } from "../play-chrome";

export const blobberMarkup = `
<header>
  <div class="header-left">
    ${cabinetHomeMarkup}
    <button type="button" class="brand" id="brand" aria-label="Blobber home">
      <span class="brand-blob" aria-hidden="true"><i></i><i></i></span>
      <span class="brand-word">Blobber</span>
    </button>
  </div>
  <div class="header-right">
    <button id="sound" type="button" class="icon" aria-label="Turn sound effects on" title="Toggle sound effects">🔊<span id="soundMark">×</span></button>
    <button id="music" type="button" class="icon music-control" aria-label="Turn background music on" aria-pressed="false" title="Turn background music on"><span aria-hidden="true">♫</span><span class="music-label">Music</span></button>
    <button id="pause" type="button" class="icon hidden" aria-label="Pause game" title="Pause (Esc)">Ⅱ</button>
  </div>
</header>
<main id="menu" class="menu">
  <div class="eyebrow"><span></span> EAT. GROW. TAKE OVER.</div>
  <h1>Small blob.<br>Big <em>appetite.</em></h1>
  <p class="intro">Start small. Snack your way up.<br>Triangles add 5%. Squares take away 5%.</p>
  <div class="menu-scroll">
  <form id="startForm" class="play-card">
    <label for="name">YOUR BLOB'S NAME</label>
    <input id="name" maxlength="16" placeholder="Give your blob a name" value="" autocomplete="off">
    <div class="customize">
      <div>
        <label>PICK YOUR COLOR</label>
        <div class="swatches" id="swatches"></div>
      </div>
      <div>
        <label for="difficulty">ARENA</label>
        <select id="difficulty">
          <option value="normal">Classic</option>
          <option value="easy">Chill</option>
          <option value="hard">Wild</option>
        </select>
      </div>
    </div>
    <div class="level-choice">
      <label for="level">CHOOSE YOUR LEVEL</label>
      <select id="level" aria-describedby="levelDescription">
        <option value="triangles" selected>1 · Triangle trail</option>
        <option value="slalom">2 · Square slalom</option>
        <option value="diamonds">3 · Diamond keys</option>
        <option value="free">Free arena</option>
      </select>
      <p id="levelDescription">Collect 4 golden triangles.</p>
    </div>
    <button class="primary" type="submit">Let’s blob <span>↗</span></button>
    <div class="card-note">36 computer rivals · 3 shape challenges + a free arena.</div>
  </form>
  <div class="instructions">
    <div><span class="key">↖</span><p><b>Move</b><small>Mouse · arrows · touch</small></p></div>
    <div><span class="key wide">SPACE</span><p><b>Split</b><small>Catch smaller rivals</small></p></div>
    <div><span class="key">J</span><p><b>Join</b><small>Join one step at a time</small></p></div>
    <div><span class="key">W</span><p><b>Eject</b><small>Drop a little mass</small></p></div>
  </div>
  <div class="best-line">PERSONAL BEST <b id="menuBest">0</b><span>mass</span></div>
  </div>
</main>
<div id="worldNote" class="world-note"><span class="tiny-blob"></span><div><b>A little ambition goes a long way.</b><small>Collect dots and triangles. Watch out for squares.</small></div></div>
<div id="hud" class="hud hidden">
  <div class="score-panel">
    <div><small>YOUR MASS</small><strong id="mass">0</strong></div>
    <div><small>BEST</small><b id="best">0</b></div>
    <div><small>TIME</small><b id="time">0:00</b></div>
  </div>
  <aside id="challengePanel" class="challenge-panel hidden" aria-label="Level objective">
    <div class="challenge-heading"><b id="levelTitle">Triangle trail</b><span id="levelCount">0 / 4</span></div>
    <p id="levelGoal">Collect 4 golden triangles.</p>
    <progress id="levelBar" max="4" value="0" aria-label="Level progress"></progress>
  </aside>
  <button id="leaderboardToggle" type="button" class="leaderboard-toggle" aria-controls="leaderboard" aria-expanded="false" aria-label="Show leaderboard"><span class="board-label">Leaderboard</span><span class="board-label-short">Ranks</span><b id="boardToggleRank">#—</b><span class="board-chevron" aria-hidden="true">⌄</span></button>
  <aside id="leaderboard" class="leaderboard hidden" aria-label="Leaderboard">
    <div class="board-head">TOP BLOBS <span id="rank">#—</span></div>
    <div class="board-columns"><span>BLOB</span><span>MASS</span></div>
    <ol id="leaders"></ol>
    <div class="arena-note">Top 5 + your position</div>
  </aside>
  <div class="bottom-hud">
    <span><i></i> <b id="hint">Eat the dots. Find your moment.</b></span>
    <div>
      <button id="split" type="button" class="control">Split <kbd>SPACE</kbd></button>
      <button id="join" type="button" class="control" disabled title="Join one step at a time (J)">Join <kbd>J</kbd></button>
      <button id="eject" type="button" class="control">Eject <kbd>W</kbd></button>
    </div>
  </div>
  <canvas id="minimap" width="144" height="144" aria-label="Arena minimap"></canvas>
</div>
<div id="dialog" class="dialog hidden" role="dialog" aria-modal="true" aria-labelledby="dialogTitle">
  <div class="dialog-card">
    <div class="dialog-blob" aria-hidden="true"><i></i><i></i></div>
    <div id="dialogTag" class="eyebrow">TAKE A BREATHER</div>
    <h2 id="dialogTitle">Snack break.</h2>
    <p id="dialogCopy">The arena can wait a moment.</p>
    <div id="roundStats" class="round-stats hidden"></div>
    <button id="resume" type="button" class="primary">Back to the arena <span>→</span></button>
    <button id="nextLevel" type="button" class="primary hidden">Next level <span>→</span></button>
    <button id="restart" type="button" class="primary hidden">One more round <span>↗</span></button>
    <button id="home" type="button" class="text-button">Back to home</button>
  </div>
</div>
<div id="toast" class="toast" role="status"></div>
<footer id="footer">A game of growth &amp; good timing.<span>Made for the joy of playing.</span></footer>
`;
