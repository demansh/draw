import { normalizeTagKey } from "./video-catalog.js";

const TYPE_QUERY_PARAM = "type";
const TAGS_QUERY_PARAM = "tags";
const TAGS_SEPARATOR = ",";
export const DEFAULT_TYPE = "all";

export const TYPE_FILTERS = {
  all: { matches: () => true },
  shorts: { matches: (video) => video.format === "portrait" },
  videos: { matches: (video) => video.format === "landscape" },
};

export function readFilterStateFromUrl() {
  const params = new URLSearchParams(location.search);
  const typeName = params.get(TYPE_QUERY_PARAM);
  const tagKeys = (params.get(TAGS_QUERY_PARAM) ?? "")
    .split(TAGS_SEPARATOR)
    .map(normalizeTagKey)
    .filter(Boolean);
  return {
    type: Object.prototype.hasOwnProperty.call(TYPE_FILTERS, typeName) ? typeName : DEFAULT_TYPE,
    selectedTagKeys: new Set(tagKeys),
  };
}

export function writeFilterStateToUrl({ type, selectedTagKeys }) {
  const url = new URL(location.href);
  if (type === DEFAULT_TYPE) url.searchParams.delete(TYPE_QUERY_PARAM);
  else url.searchParams.set(TYPE_QUERY_PARAM, type);
  if (selectedTagKeys.size === 0) url.searchParams.delete(TAGS_QUERY_PARAM);
  else url.searchParams.set(TAGS_QUERY_PARAM, [...selectedTagKeys].join(TAGS_SEPARATOR));
  history.replaceState(history.state, "", url);
}

export function filterByType(videos, type) {
  return videos.filter(TYPE_FILTERS[type].matches);
}

export function hasAllTags(video, tagKeys) {
  const videoTagKeys = new Set(video.tags.map((tag) => tag.key));
  return [...tagKeys].every((tagKey) => videoTagKeys.has(tagKey));
}

export function filterByTags(videos, selectedTagKeys) {
  if (selectedTagKeys.size === 0) return videos;
  return videos.filter((video) => hasAllTags(video, selectedTagKeys));
}

export function countTags(videos) {
  const tagCounts = new Map();
  videos.forEach((video) => {
    video.tags.forEach((tag) => {
      const existing = tagCounts.get(tag.key);
      if (existing) existing.count += 1;
      else tagCounts.set(tag.key, { ...tag, count: 1 });
    });
  });
  return [...tagCounts.values()].sort(
    (left, right) => right.count - left.count || left.label.localeCompare(right.label, "ru"),
  );
}
