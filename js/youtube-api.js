let youtubeApiPromise = null;

export function loadYoutubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve, reject) => {
    const previousReadyCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReadyCallback?.();
      resolve(window.YT);
    };

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      youtubeApiPromise = null;
      script.remove();
      reject(new Error("YouTube IFrame API failed to load"));
    };
    document.head.append(script);
  });

  return youtubeApiPromise;
}
