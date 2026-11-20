import { EMBED_HOST } from "./youtube-links.js";
import { loadYoutubeApi } from "./youtube-api.js";

const SWIPE_THRESHOLD_PX = 50;
const PLAYER_ELEMENT_ID = "viewer-player";

export function createViewer({ onOpen }) {
  const root = document.getElementById("viewer");
  const counter = root.querySelector(".viewer-counter");
  const youtubeLink = root.querySelector(".viewer-link");
  const errorMessage = root.querySelector(".viewer-error");
  const previousButton = root.querySelector('[data-action="previous"]');
  const nextButton = root.querySelector('[data-action="next"]');
  const closeButton = root.querySelector('[data-action="close"]');

  const state = {
    videos: [],
    isOpen: false,
    currentIndex: 0,
    player: null,
    isPlayerReady: false,
    pendingVideoId: null,
    isInFullscreen: false,
    touchStart: null,
  };

  function showError(text) {
    errorMessage.textContent = text;
    errorMessage.hidden = false;
  }

  function hideError() {
    errorMessage.hidden = true;
  }

  function handlePlayerReady(event) {
    state.isPlayerReady = true;
    if (!state.isOpen) return;
    if (state.pendingVideoId) {
      event.target.loadVideoById(state.pendingVideoId);
      state.pendingVideoId = null;
    } else {
      event.target.playVideo();
    }
  }

  function handlePlayerStateChange(event) {
    if (event.data !== window.YT.PlayerState.ENDED) return;
    event.target.seekTo(0, true);
    event.target.playVideo();
  }

  function handlePlayerError() {
    showError("Это видео нельзя воспроизвести здесь. Откройте его на YouTube.");
  }

  function loadVideo(videoId) {
    if (!state.player) {
      state.player = new window.YT.Player(PLAYER_ELEMENT_ID, {
        host: EMBED_HOST,
        videoId,
        width: "100%",
        height: "100%",
        playerVars: { autoplay: 1, playsinline: 1, rel: 0, fs: 0, modestbranding: 1 },
        events: {
          onReady: handlePlayerReady,
          onStateChange: handlePlayerStateChange,
          onError: handlePlayerError,
        },
      });
      return;
    }
    if (state.isPlayerReady) {
      state.player.loadVideoById(videoId);
    } else {
      state.pendingVideoId = videoId;
    }
  }

  async function showVideo(index) {
    if (index < 0 || index >= state.videos.length) return;
    const video = state.videos[index];
    state.currentIndex = index;
    root.dataset.format = video.format;
    counter.textContent = `${index + 1} / ${state.videos.length}`;
    youtubeLink.href = video.originalUrl;
    previousButton.disabled = index === 0;
    nextButton.disabled = index === state.videos.length - 1;
    hideError();

    try {
      await loadYoutubeApi();
    } catch {
      showError("Не удалось загрузить плеер YouTube. Проверьте подключение к интернету.");
      return;
    }
    if (state.isOpen && state.currentIndex === index) loadVideo(video.videoId);
  }

  function showNext() {
    showVideo(state.currentIndex + 1);
  }

  function showPrevious() {
    showVideo(state.currentIndex - 1);
  }

  function enterFullscreen() {
    if (typeof root.requestFullscreen !== "function" || document.fullscreenElement) return;
    root
      .requestFullscreen()
      .then(() => {
        state.isInFullscreen = true;
      })
      .catch(() => {
        state.isInFullscreen = false;
      });
  }

  function open(playlist, index) {
    state.videos = playlist;
    if (!state.isOpen) {
      state.isOpen = true;
      onOpen?.();
      root.hidden = false;
      document.body.classList.add("is-viewer-open");
      history.pushState({ isViewerOpen: true }, "");
      enterFullscreen();
      closeButton.focus({ preventScroll: true });
    }
    showVideo(index);
  }

  function close({ isTriggeredByHistory = false } = {}) {
    if (!state.isOpen) return;
    state.isOpen = false;
    state.isInFullscreen = false;
    if (state.isPlayerReady) state.player.pauseVideo();
    root.hidden = true;
    document.body.classList.remove("is-viewer-open");
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    if (!isTriggeredByHistory && history.state?.isViewerOpen) history.back();
  }

  const keyActions = {
    ArrowDown: showNext,
    ArrowRight: showNext,
    PageDown: showNext,
    ArrowUp: showPrevious,
    ArrowLeft: showPrevious,
    PageUp: showPrevious,
    Escape: () => close(),
  };

  const clickActions = {
    next: showNext,
    previous: showPrevious,
    close: () => close(),
  };

  root.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-action]");
    clickActions[actionButton?.dataset.action]?.();
  });

  root.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches[0];
      state.touchStart = { x: touch.clientX, y: touch.clientY };
    },
    { passive: true },
  );

  root.addEventListener("touchend", (event) => {
    if (!state.touchStart) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - state.touchStart.x;
    const deltaY = touch.clientY - state.touchStart.y;
    state.touchStart = null;
    if (Math.abs(deltaY) < SWIPE_THRESHOLD_PX || Math.abs(deltaY) < Math.abs(deltaX)) return;
    if (deltaY < 0) showNext();
    else showPrevious();
  });

  document.addEventListener("keydown", (event) => {
    if (!state.isOpen) return;
    const action = keyActions[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  });

  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && state.isInFullscreen) close();
  });

  window.addEventListener("popstate", () => close({ isTriggeredByHistory: true }));

  return { open, close };
}
