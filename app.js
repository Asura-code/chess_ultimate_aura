let isEffectActive = false;
let site = null;
let userColor = null;

if (window.location.hostname.includes("chess.com")) {
  site = "chesscom";
} else if (window.location.hostname.includes("lichess.org")) {
  site = "lichess";
}

if (!document.getElementById("chess-troll-sway-style")) {
  const style = document.createElement("style");
  style.id = "chess-troll-sway-style";
  style.textContent = `
    @keyframes chessTrollSway {
      0%, 100% { transform: translateX(0); }
      50% { transform: translateX(-3px); }
    }
  `;
  document.head.appendChild(style);
}

function triggerMoveEffect() {
  if (isEffectActive) return;
  isEffectActive = true;

  if (Math.random() >= 0.75) {
    isEffectActive = false;
    return;
  }

  const sounds = ["aura1.mp3", "aura2.mp3", "epic.mp3"];
  const audio = new Audio(
    chrome.runtime.getURL(sounds[Math.floor(Math.random() * sounds.length)])
  );
  audio.volume = 0.8;
  audio.play().catch((e) => console.warn("Звук хода не проигран:", e));

  document.body.style.animation = "chessTrollSway 0.5s ease-in-out";
  setTimeout(() => {
    document.body.style.animation = "";
  }, 500);

  document.body.style.filter = "grayscale(100%)";

  const images = ["troll1.png", "troll2.png", "troll.png"];
  const img = document.createElement("img");
  img.src = chrome.runtime.getURL(
    images[Math.floor(Math.random() * images.length)]
  );
  img.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    width: 260px;
    height: auto;
    z-index: 999999;
    pointer-events: none;
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
    transition: opacity 0.4s, transform 0.4s;
  `;
  document.body.appendChild(img);

  setTimeout(() => {
    img.style.opacity = "0.92";
    img.style.transform = "translate(-50%, -50%) scale(1)";
  }, 50);

  setTimeout(() => {
    document.body.style.filter = "";
    img.remove();
    isEffectActive = false;
  }, 2000);
}

function triggerVictoryEffect() {
  if (isEffectActive) return;
  isEffectActive = true;

  const audio = new Audio(chrome.runtime.getURL("papa.mp3"));
  audio.volume = 1.0;
  audio.loop = false;
  audio.play().catch((e) => console.warn("Победный звук не проигран:", e));

  const trollImg = document.createElement("img");
  trollImg.src = chrome.runtime.getURL("troll.png");
  trollImg.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    width: 320px;
    height: auto;
    z-index: 9999999;
    pointer-events: none;
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
    transition: opacity 0.5s, transform 0.5s;
  `;
  document.body.appendChild(trollImg);

  setTimeout(() => {
    trollImg.style.opacity = "0.95";
    trollImg.style.transform = "translate(-50%, -50%) scale(1)";
  }, 100);

  const gifUrls = ["gif1.gif", "gif2.gif", "gif3.gif"];
  const gifElements = [];

  gifUrls.forEach((gif, i) => {
    const el = document.createElement("img");
    el.src = chrome.runtime.getURL(gif);

    const size = 70 + Math.random() * 80;

    const maxX = window.innerWidth - size - 20;
    const maxY = window.innerHeight - size - 20;

    const x = Math.floor(Math.random() * maxX);
    const y = Math.floor(Math.random() * maxY);

    el.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    width: ${size}px;
    height: auto;
    opacity: 0.9;
    z-index: 9999998;
    pointer-events: none;
    animation: victoryFloat${i} ${6 + Math.random() * 6}s infinite ease-in-out;
  `;
    document.body.appendChild(el);
    gifElements.push(el);

    const animStyle = document.createElement("style");
    animStyle.textContent = `
    @keyframes victoryFloat${i} {
      0%   { transform: translate(0px, 0px); }
      50%  { transform: translate(0px, -20px); }
      100% { transform: translate(0px, 0px); }
    }
  `;
    document.head.appendChild(animStyle);
  });

  setTimeout(() => {
    audio.pause();
    audio.currentTime = 0;
    trollImg.remove();
    gifElements.forEach((el) => el.remove());
    isEffectActive = false;
  }, 15000);
}

function detectLichessColor() {
  const myUsername = document.body.dataset.username;
  if (!myUsername) return null;
  const whiteName = document
    .querySelector(".game__meta__players .player.white .user-link")
    ?.textContent?.split(" ")[0];
  const blackName = document
    .querySelector(".game__meta__players .player.black .user-link")
    ?.textContent?.split(" ")[0];
  if (whiteName === myUsername) return "white";
  if (blackName === myUsername) return "black";
  return null;
}

function checkIfUserWon() {
  const statusEl = document.querySelector(".status, .result-wrap .status");
  if (!statusEl) return false;

  const text = statusEl.textContent;
  const isWin = /Победа|Win/i.test(text);
  if (!isWin) return false;

  if (site === "chesscom") {
    const myUsername = window.context?.user?.username;
    const bottomName = document
      .querySelector("#player-bottom .cc-user-username-component")
      ?.textContent.trim();
    const topName = document
      .querySelector("#player-top .cc-user-username-component")
      ?.textContent.trim();
    return bottomName === myUsername || topName === myUsername;
  }

  if (site === "lichess") {
    const myUsername = document.body.dataset.username;
    const whiteName = document
      .querySelector(".game__meta__players .player.white .user-link")
      ?.textContent?.split(" ")[0];
    const blackName = document
      .querySelector(".game__meta__players .player.black .user-link")
      ?.textContent?.split(" ")[0];
    return (
      (userColor === "white" && whiteName === myUsername) ||
      (userColor === "black" && blackName === myUsername)
    );
  }

  return false;
}

function startChessCom() {
  function observe() {
    const container = document.getElementById("scroll-container");
    const list = container?.querySelector("wc-simple-move-list");
    if (!list) {
      setTimeout(observe, 1000);
      return;
    }

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            node.classList?.contains("main-line-row")
          ) {
            if (checkIfUserWon()) {
              triggerVictoryEffect();
              return;
            }
            triggerMoveEffect();
          }
        }
      }
    });
    observer.observe(list, { childList: true, subtree: true });

    const checkEnd = () => {
      if (checkIfUserWon()) {
        triggerVictoryEffect();
      } else {
        setTimeout(checkEnd, 1000);
      }
    };
    checkEnd();
  }
  observe();
}

function startLichess() {
  const tryDetect = () => {
    userColor = detectLichessColor();
    if (!userColor) {
      setTimeout(tryDetect, 1000);
      return;
    }
    startObserver();
  };
  tryDetect();

  function startObserver() {
    const moveList = document.querySelector("l4x");
    if (!moveList) {
      setTimeout(startObserver, 1000);
      return;
    }

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "childList") {
          let hasMove = false;
          for (const node of m.addedNodes) {
            if (
              node.nodeType === Node.ELEMENT_NODE &&
              node.tagName === "KWDB"
            ) {
              hasMove = true;
              break;
            }
          }
          if (hasMove) {
            if (checkIfUserWon()) {
              triggerVictoryEffect();
              return;
            }

            const total = moveList.querySelectorAll("kwdb").length;
            const lastIsWhite = total % 2 === 1;
            const isUserMove =
              userColor === "white" ? lastIsWhite : !lastIsWhite;
            if (isUserMove) {
              triggerMoveEffect();
            }
          }
        }
      }
    });
    observer.observe(moveList, { childList: true });

    const checkEnd = () => {
      if (checkIfUserWon()) {
        triggerVictoryEffect();
      } else {
        setTimeout(checkEnd, 1000);
      }
    };
    checkEnd();
  }
}

if (site === "chesscom") {
  startChessCom();
} else if (site === "lichess") {
  startLichess();
}
