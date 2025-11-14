let isEffectActive = false;
let site = null; 
let userColor = null; 


if (window.location.hostname.includes('chess.com')) {
  site = 'chesscom';
} else if (window.location.hostname.includes('lichess.org')) {
  site = 'lichess';
}


function triggerTrollEffect() {
  if (isEffectActive) return;
  isEffectActive = true;


  const sounds = ['aura1.mp3', 'aura2.mp3', 'epic.mp3'];
  const audio = new Audio(chrome.runtime.getURL(sounds[Math.floor(Math.random() * sounds.length)]));
  audio.volume = 0.8;
  audio.play().catch(e => console.warn('Звук не проигран:', e));


  document.body.style.filter = 'grayscale(100%)';


  const images = ['troll1.png', 'troll2.png', 'troll.png'];
  const img = document.createElement('img');
  img.src = chrome.runtime.getURL(images[Math.floor(Math.random() * images.length)]);
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
    transition: opacity 0.4s ease, transform 0.4s ease;
  `;
  document.body.appendChild(img);

 
  setTimeout(() => {
    img.style.opacity = '0.9';
    img.style.transform = 'translate(-50%, -50%) scale(1)';
  }, 50);


  setTimeout(() => {
    img.style.opacity = '0';
    img.style.transform = 'translate(-50%, -50%) scale(0.8)';
    setTimeout(() => {
      img.remove();
      document.body.style.filter = '';
      isEffectActive = false;
    }, 400);
  }, 2000);
}


function detectLichessColor() {
  const messageDiv = document.querySelector('.message div');
  if (!messageDiv) return null;

  const text = messageDiv.textContent;
  if (text.includes('белыми')) return 'white';
  if (text.includes('чёрными') || text.includes('черными')) return 'black';
  return null;
}

function isUserMoveLichess() {
  if (!userColor) return false;

  const moveEls = document.querySelectorAll('l4x kwdb');
  const totalMoves = moveEls.length;

  if (totalMoves === 0) return false;

  const lastIsWhite = totalMoves % 2 === 1; 
  return userColor === 'white' ? lastIsWhite : !lastIsWhite;
}


function startChessComObserver() {
  function observe() {
    const scrollContainer = document.getElementById('scroll-container');
    const moveList = scrollContainer?.querySelector('wc-simple-move-list');
    if (!moveList) {
      setTimeout(observe, 1000);
      return;
    }

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && node.classList?.contains('main-line-row')) {
            triggerTrollEffect(); 
          }
        }
      }
    });
    observer.observe(moveList, { childList: true, subtree: true });
  }
  observe();
}

function startLichessObserver() {

  function detectUserColor() {
    const myUsername = document.body.dataset.username;
    if (!myUsername) return null;

    const whitePlayer = document.querySelector('.game__meta__players .player.white .user-link');
    const blackPlayer = document.querySelector('.game__meta__players .player.black .user-link');

    const whiteName = whitePlayer?.textContent?.trim().split(' ')[0];
    const blackName = blackPlayer?.textContent?.trim().split(' ')[0];

    if (whiteName === myUsername) return 'white';
    if (blackName === myUsername) return 'black';
    return null;
  }

  userColor = detectUserColor();
  if (!userColor) {
    console.warn('lichess: не удалось определить цвет игрока. Повтор через 1с.');
    setTimeout(startLichessObserver, 1000);
    return;
  }

  console.log(`lichess: вы играете за ${userColor}`);

  const moveList = document.querySelector('l4x');
  if (!moveList) {
    setTimeout(startLichessObserver, 1000);
    return;
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        let hasNewMove = false;
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'KWDB') {
            hasNewMove = true;
            break;
          }
        }
        if (hasNewMove) {
          const allMoves = moveList.querySelectorAll('kwdb');
          const totalMoves = allMoves.length;
          const lastMoveIsWhite = totalMoves % 2 === 1; 

          const isUserMove = userColor === 'white' ? lastMoveIsWhite : !lastMoveIsWhite;
          if (isUserMove) {
            console.log(' lichess: ход пользователя');
            triggerTrollEffect();
          } else {
            console.log(' lichess: ход соперника');
          }
        }
      }
    }
  });

  observer.observe(moveList, { childList: true });
}


if (site === 'chesscom') {
  startChessComObserver();
} else if (site === 'lichess') {
  startLichessObserver();
}