import { parseYoutubeLink } from "./youtube-links.js";

export function normalizeTagKey(tag) {
  return tag.trim().replace(/\s+/g, " ").toLocaleLowerCase("ru");
}

function readTagLabels(rawTags) {
  if (typeof rawTags === "string") return rawTags.split(",");
  if (Array.isArray(rawTags)) return rawTags.filter((tag) => typeof tag === "string");
  return [];
}

function parseTags(rawTags) {
  const tagsByKey = new Map();
  readTagLabels(rawTags).forEach((rawTag) => {
    const label = rawTag.trim().replace(/\s+/g, " ");
    const key = normalizeTagKey(label);
    if (key && !tagsByKey.has(key)) tagsByKey.set(key, { key, label });
  });
  return [...tagsByKey.values()];
}

function readEntry(entry) {
  if (typeof entry === "string") return { url: entry, rawTags: [] };
  if (entry && typeof entry === "object") return { url: entry.url, rawTags: entry.tags };
  return { url: null, rawTags: [] };
}

export function readVideoCatalog(rawEntries) {
  if (!Array.isArray(rawEntries)) return [];
  const videos = [];
  rawEntries.forEach((entry) => {
    const { url, rawTags } = readEntry(entry);
    const parsedVideo = parseYoutubeLink(url);
    if (!parsedVideo) {
      console.warn("Не удалось распознать ссылку на YouTube:", entry);
      return;
    }
    videos.push({ ...parsedVideo, position: videos.length + 1, tags: parseTags(rawTags) });
  });
  return videos;
}
