import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
import { DEMO_UPLOADS } from "./assets/demo-uploads/manifest.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const typePills = document.getElementById("type-pills");
const itemCombobox = document.getElementById("item-combobox");
const itemSearchInput = document.getElementById("item-search");
const itemList = document.getElementById("item-list");
const detailsBox = document.getElementById("item-details");

const platformPills = document.getElementById("platform-pills");
const assetPills = document.getElementById("asset-pills");
const tonePills = document.getElementById("tone-pills");
const aiGenerateBtn = document.getElementById("ai-generate-btn");

const captionInput = document.getElementById("caption-input");

const uploadField = document.getElementById("upload-field");
const openFinderBtn = document.getElementById("open-finder-btn");
const uploadInput = document.getElementById("media-upload");
const uploadLabelText = document.getElementById("upload-label-text");
const clearUploadBtn = document.getElementById("clear-upload-btn");
const uploadError = document.getElementById("upload-error");

const finderOverlay = document.getElementById("finder-overlay");
const finderTitle = document.getElementById("finder-title");
const finderGrid = document.getElementById("finder-grid");
const finderDeviceBtn = document.getElementById("finder-device-btn");
const finderCancelBtn = document.getElementById("finder-cancel-btn");
const finderOpenBtn = document.getElementById("finder-open-btn");

const composer = document.getElementById("composer");
// The composer's inner markup is rebuilt per platform (see COMPOSER_TEMPLATES), so
// these are re-queried after every rebuild instead of cached once at load.
let composerMedia = null;
let composerCaption = null;
let composerHashtags = null;

const postNowBtn = document.getElementById("post-now-btn");
const scheduleToggleBtn = document.getElementById("schedule-toggle-btn");
const schedulePanel = document.getElementById("schedule-panel");
const postDateInput = document.getElementById("post-date");
const confirmScheduleBtn = document.getElementById("confirm-schedule-btn");
const saveStatus = document.getElementById("save-status");

const refreshHistoryBtn = document.getElementById("refresh-history-btn");
const historyTabs = document.getElementById("history-tabs");
const upcomingPanel = document.getElementById("upcoming-panel");
const publishedPanel = document.getElementById("published-panel");
const upcomingBody = document.getElementById("upcoming-body");
const publishedBody = document.getElementById("published-body");
const upcomingCount = document.getElementById("upcoming-count");
const publishedCount = document.getElementById("published-count");

let books = [];
let events = [];
let selectedItem = null;
let platformLinks = {};
let uploadedMediaUrl = null;
let itemListOptions = [];
let itemListActiveIndex = -1;
let currentHashtags = "";
let selectedTone = null;

// Matches the platform values actually in use in the shared Social Posts dataset.
const PLATFORMS = ["Instagram", "TikTok", "X", "Facebook", "Pinterest"];

// These platforms don't have a text-only post format in real life — a feed post/pin/
// video needs an image or video attached, so "Text only" isn't a real option for them.
const PLATFORMS_REQUIRING_MEDIA = ["Instagram", "TikTok", "Pinterest"];

// Social Media Accounts only has link fields for some of the platforms above —
// the rest (Facebook, Pinterest) simply won't get a "view on" link in history yet.
const PLATFORM_LINK_FIELDS = [
  { field: "instagram_link", label: "Instagram" },
  { field: "tiktok_link", label: "TikTok" },
  { field: "x_link", label: "X" },
];

const PLATFORM_PREVIEW = {
  Instagram: { handle: "riversidebooks", avatarBg: "#7a4a2c" },
  TikTok: { handle: "@riversidebooks", avatarBg: "#1f1f1f" },
  X: { handle: "@riversidebooks", avatarBg: "#1a1a1a" },
  Facebook: { handle: "Riverside Books", avatarBg: "#1a4d8f" },
  Pinterest: { handle: "Riverside Books", avatarBg: "#b3211e" },
};

// Each platform's real chrome is different enough (where the caption sits, what the
// action row looks like, whether there's even a header) that these are full templates
// rather than one shape with a couple of swapped-out bits.
const COMPOSER_TEMPLATES = {
  Instagram: (preview) => `
    <div class="composer-ig-topbar">
      <span class="composer-ig-wordmark">Instagram</span>
      <span class="composer-header-spacer"></span>
      <span class="composer-header-icon">&#9825;</span>
      <span class="composer-header-icon">&#9993;</span>
    </div>
    <div class="composer-header">
      <div class="composer-avatar" style="background:${preview.avatarBg}">RB</div>
      <div class="composer-account">${preview.handle}</div>
      <span class="composer-header-spacer"></span>
      <span class="composer-header-icon">&#8942;</span>
    </div>
    <div class="composer-media hidden" id="composer-media"></div>
    <div class="composer-ig-actions">
      <span class="composer-action-icon">&#9825;</span>
      <span class="composer-action-icon">&#128172;</span>
      <span class="composer-action-icon">&#10148;</span>
      <span class="composer-action-spacer"></span>
      <span class="composer-action-icon">&#128278;</span>
    </div>
    <div class="composer-ig-liked">Liked by <strong>others</strong></div>
    <div class="composer-caption-wrap">
      <strong>${preview.handle}</strong>
      <span id="composer-caption" class="composer-caption" data-placeholder="Your caption will appear here..."></span>
    </div>
    <div id="composer-hashtags" class="composer-hashtags" contenteditable="true" data-placeholder="#hashtags"></div>
    <div class="composer-ig-navbar">
      <span>&#8962;</span><span>&#128269;</span><span>&#10133;</span><span>&#9654;</span><span>&#9679;</span>
    </div>
  `,

  Facebook: (preview) => `
    <div class="composer-header">
      <div class="composer-avatar" style="background:${preview.avatarBg}">RB</div>
      <div>
        <div class="composer-account">${preview.handle}</div>
        <div class="composer-fb-meta">2h &middot; &#127760;</div>
      </div>
      <span class="composer-header-spacer"></span>
      <span class="composer-header-icon">&#8942;</span>
    </div>
    <div class="composer-caption-wrap composer-caption-wrap-plain">
      <span id="composer-caption" class="composer-caption" data-placeholder="Your caption will appear here..."></span>
    </div>
    <div id="composer-hashtags" class="composer-hashtags" contenteditable="true" data-placeholder="#hashtags"></div>
    <div class="composer-media hidden" id="composer-media"></div>
    <div class="composer-fb-reactions">
      <span>&#128077;&#10084;&#65039; 115</span>
      <span class="composer-fb-reactions-right">23 Comments &nbsp; 47 Shares</span>
    </div>
    <div class="composer-fb-actions">
      <span>&#128077; Like</span><span>&#128172; Comment</span><span>&#8635; Share</span>
    </div>
  `,

  X: (preview) => `
    <div class="composer-header">
      <div class="composer-avatar" style="background:${preview.avatarBg}">RB</div>
      <div class="composer-x-namerow">
        <span class="composer-account">Riverside Books</span>
        <span class="composer-x-handle">${preview.handle} &middot; 2h</span>
      </div>
    </div>
    <div class="composer-caption-wrap composer-caption-wrap-plain">
      <span id="composer-caption" class="composer-caption" data-placeholder="Your caption will appear here..."></span>
    </div>
    <div id="composer-hashtags" class="composer-hashtags" contenteditable="true" data-placeholder="#hashtags"></div>
    <div class="composer-media hidden" id="composer-media"></div>
    <div class="composer-x-actions">
      <span>&#128172; 12</span><span>&#8646; 8</span><span>&#9825; 64</span><span>&#128200; 1.2K</span>
    </div>
  `,

  Pinterest: (preview) => `
    <div class="composer-pin-topbar">
      <span>&#8592;</span>
      <span class="composer-pin-topbar-right">
        <span>&#8593;</span><span>&#8942;</span>
        <button type="button" class="pin-save-btn">Save</button>
      </span>
    </div>
    <div class="composer-media hidden" id="composer-media"></div>
    <div class="composer-caption-wrap composer-caption-wrap-plain composer-pin-caption">
      <span id="composer-caption" class="composer-caption" data-placeholder="Your caption will appear here..."></span>
    </div>
    <div id="composer-hashtags" class="composer-hashtags" contenteditable="true" data-placeholder="#hashtags"></div>
    <div class="composer-pin-footer">
      <div class="composer-avatar" style="background:${preview.avatarBg}">RB</div>
      <div class="composer-pin-footer-text">
        <div class="composer-account">${preview.handle}</div>
        <div class="composer-pin-followers">1.2k followers</div>
      </div>
      <button type="button" class="pin-follow-btn">Follow</button>
    </div>
  `,

  TikTok: (preview) => `
    <div class="composer-tiktok-topbar">
      <span class="dim">Following</span><span class="active">For You</span>
      <span class="composer-tiktok-search">&#128269;</span>
    </div>
    <div class="composer-tiktok-stage">
      <div class="composer-media hidden" id="composer-media"></div>
      <div class="composer-tiktok-rail">
        <div class="composer-tiktok-avatar-wrap">
          <div class="composer-avatar" style="background:${preview.avatarBg}">RB</div>
          <span class="composer-tiktok-plus">&#43;</span>
        </div>
        <div class="composer-tiktok-rail-item">&#9825;<small>1.2K</small></div>
        <div class="composer-tiktok-rail-item">&#128172;<small>128</small></div>
        <div class="composer-tiktok-rail-item">&#128278;<small>256</small></div>
        <div class="composer-tiktok-rail-item">&#10132;<small>64</small></div>
      </div>
      <div class="composer-tiktok-caption-overlay">
        <div class="composer-account">${preview.handle}</div>
        <span id="composer-caption" class="composer-caption" data-placeholder="Your caption will appear here..."></span>
        <div id="composer-hashtags" class="composer-hashtags" contenteditable="true" data-placeholder="#hashtags"></div>
      </div>
    </div>
    <div class="composer-tiktok-navbar">
      <span>&#8962;</span><span>&#128101;</span>
      <span class="composer-tiktok-create">&#43;</span>
      <span>&#128172;</span><span>&#128100;</span>
    </div>
  `,
};

const CAPTION_TEMPLATES = {
  Book: {
    Cozy: [
      ({ title }) => `Curling up with ${title} this weekend. What are you reading?`,
      ({ title }) => `Some stories stay with you. Meet ${title}, on our shelves now.`,
    ],
    Hype: [
      ({ title }) => `IT'S HERE: ${title} just landed at Riverside Books — get in before it's gone!`,
      ({ title }) => `Don't sleep on this one. ${title} is flying off our shelves right now.`,
    ],
    Playful: [
      ({ title }) => `Warning: reading ${title} may cause you to cancel your weekend plans. Ask us how we know.`,
      ({ title }) => `${title} walked into the store and we simply had to keep it.`,
    ],
    "Staff Pick": [
      ({ title }) => `Staff pick of the week: ${title}. Come see why we can't stop recommending it.`,
      ({ title }) => `A quiet favorite: ${title}. Now in stock at Riverside Books.`,
    ],
  },
  Event: {
    Cozy: [
      ({ event_name, event_date }) => `Mark your calendar for ${event_name} on ${formatDate(event_date)}. See you there!`,
    ],
    Hype: [
      ({ event_name, event_date }) => `Tickets are moving for ${event_name} — don't miss it on ${formatDate(event_date)}!`,
      ({ event_name, event_date }) => `Last call: ${event_name} is on ${formatDate(event_date)}. Save your spot now.`,
    ],
    Playful: [
      ({ event_name, event_date }) => `Clear your calendar — ${event_name} is happening ${formatDate(event_date)} and it's going to be a good one.`,
    ],
    "Staff Pick": [
      ({ event_name, event_date }) => `We're personally excited for ${event_name} on ${formatDate(event_date)}. Come say hi!`,
    ],
  },
};

const HASHTAG_BASE = {
  Book: ["#RiversideBooks", "#Bookstagram", "#LocalBookstore"],
  Event: ["#RiversideBooks", "#ShopLocal", "#BookEvents"],
};

function genreHashtag(genre) {
  if (!genre) return null;
  const slug = genre
    .replace(/'/g, "")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join("");
  return slug ? `#${slug}Reads` : null;
}

function hashtagsFor(type, item) {
  const tags = [...HASHTAG_BASE[type]];
  const genreTag = type === "Book" ? genreHashtag(item.genre) : null;
  if (genreTag) tags.push(genreTag);
  return tags;
}

function genreColor(seed) {
  let hash = 0;
  for (const char of seed || "default") hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const hue = hash % 360;
  return `linear-gradient(135deg, hsl(${hue}, 55%, 42%), hsl(${(hue + 40) % 360}, 55%, 30%))`;
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function ordinalSuffix(day) {
  const j = day % 10;
  const k = day % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

// Turns "2027-01-31" into "Sunday, January 31st" — nobody posts raw ISO dates on social.
function formatDate(isoDateStr) {
  if (!isoDateStr) return "";
  const [year, month, day] = isoDateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const monthName = date.toLocaleDateString("en-US", { month: "long" });
  return `${weekday}, ${monthName} ${day}${ordinalSuffix(day)}`;
}

// --- pill groups --------------------------------------------------------

function setupPillGroup(container, onSelect) {
  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".pill");
    if (!btn || btn.disabled) return;
    for (const sibling of container.querySelectorAll(".pill")) {
      sibling.classList.remove("selected");
    }
    btn.classList.add("selected");
    onSelect(btn.dataset.value);
  });
}

function selectedPillValue(container) {
  const selected = container.querySelector(".pill.selected");
  return selected ? selected.dataset.value : null;
}

function selectPill(container, value) {
  for (const btn of container.querySelectorAll(".pill")) {
    btn.classList.toggle("selected", btn.dataset.value === value);
  }
}

// --- data loading --------------------------------------------------------

async function loadPickerData() {
  const [{ data: booksData, error: booksErr }, { data: eventsData, error: eventsErr }] =
    await Promise.all([
      supabase.from("Books").select("book_id, title, author, blurb, genre").order("title"),
      supabase.from("Events").select("event_id, event_name, event_date, event_description").order("event_date"),
    ]);

  if (booksErr) console.error("Failed to load Books", booksErr);
  if (eventsErr) console.error("Failed to load Events", eventsErr);

  books = booksData || [];
  events = eventsData || [];

  populateItemSelect();
}

async function loadPlatforms() {
  const { data, error } = await supabase.from("Social Media Accounts").select("*").limit(1);
  if (error) {
    console.error("Failed to load Social Media Accounts", error);
  }
  const account = data && data[0];

  platformLinks = {};
  for (const p of PLATFORM_LINK_FIELDS) {
    if (account && account[p.field]) platformLinks[p.label] = account[p.field];
  }

  platformPills.innerHTML = "";
  PLATFORMS.forEach((label) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pill";
    btn.dataset.value = label;
    btn.textContent = label;
    platformPills.appendChild(btn);
  });

  renderComposerShell();
}

// --- item picking --------------------------------------------------------

function itemLabel(type, item) {
  return type === "Book" ? `${item.title} — ${item.author}` : item.event_name;
}

function itemId(type, item) {
  return type === "Book" ? item.book_id : item.event_id;
}

function clearItemSelection() {
  selectedItem = null;
  detailsBox.textContent = "";
  resetComposer();
}

function populateItemSelect() {
  const type = selectedPillValue(typePills);
  itemSearchInput.value = "";
  closeItemList();
  clearItemSelection();

  if (!type) {
    itemSearchInput.disabled = true;
    itemSearchInput.placeholder = "Choose Book or Event first";
    return;
  }
  itemSearchInput.disabled = false;
  itemSearchInput.placeholder = type === "Book" ? "Search books..." : "Search events...";
}

function renderItemList(query) {
  const type = selectedPillValue(typePills) || "Book";
  const list = type === "Book" ? books : events;
  const q = query.trim().toLowerCase();

  itemListOptions = q ? list.filter((item) => itemLabel(type, item).toLowerCase().includes(q)) : list;
  itemListActiveIndex = -1;

  if (itemListOptions.length === 0) {
    itemList.innerHTML = '<li class="combobox-empty">No matches</li>';
  } else {
    itemList.innerHTML = itemListOptions
      .map(
        (item, i) =>
          `<li class="combobox-option" role="option" id="item-option-${i}" data-index="${i}">${itemLabel(type, item)}</li>`
      )
      .join("");
  }

  openItemList();
}

function openItemList() {
  itemList.classList.remove("hidden");
  itemSearchInput.setAttribute("aria-expanded", "true");
}

function closeItemList() {
  itemList.classList.add("hidden");
  itemSearchInput.setAttribute("aria-expanded", "false");
  itemListActiveIndex = -1;
}

function setActiveOption(index) {
  const options = itemList.querySelectorAll(".combobox-option");
  options.forEach((el) => el.classList.remove("active"));
  if (index >= 0 && options[index]) {
    options[index].classList.add("active");
    options[index].scrollIntoView({ block: "nearest" });
    itemSearchInput.setAttribute("aria-activedescendant", options[index].id);
  } else {
    itemSearchInput.removeAttribute("aria-activedescendant");
  }
  itemListActiveIndex = index;
}

function chooseItem(item) {
  const type = selectedPillValue(typePills) || "Book";
  selectedItem = item;
  itemSearchInput.value = itemLabel(type, item);
  closeItemList();

  detailsBox.textContent =
    type === "Book"
      ? `${selectedItem.title} by ${selectedItem.author}\n\n${selectedItem.blurb}`
      : `${selectedItem.event_name} — ${formatDate(selectedItem.event_date)}\n\n${selectedItem.event_description}`;

  enableComposer();
}

// --- composer --------------------------------------------------------

function syncCaptionPreview() {
  composerCaption.textContent = captionInput.value;
}

function resetToneSelection() {
  selectedTone = null;
  selectPill(tonePills, null);
}

function updateGenerateButtonState() {
  aiGenerateBtn.disabled = !(selectedItem && selectedTone);
}

function resetComposer() {
  composer.classList.add("composer-disabled");
  postNowBtn.disabled = true;
  scheduleToggleBtn.disabled = true;
  schedulePanel.classList.add("hidden");
  resetToneSelection();
  setTonePillsDisabled(true);
  updateGenerateButtonState();
  captionInput.value = "";
  syncCaptionPreview();
  currentHashtags = "";
  composerHashtags.textContent = "";
  clearUpload();
  renderComposerMedia();
}

function enableComposer() {
  composer.classList.remove("composer-disabled");
  postNowBtn.disabled = false;
  scheduleToggleBtn.disabled = false;
  resetToneSelection();
  setTonePillsDisabled(false);
  updateGenerateButtonState();
  captionInput.value = "";
  syncCaptionPreview();
  currentHashtags = "";
  composerHashtags.textContent = "";
  clearUpload();
  renderComposerMedia();
}

function bindComposerRefs() {
  composerMedia = document.getElementById("composer-media");
  composerCaption = document.getElementById("composer-caption");
  composerHashtags = document.getElementById("composer-hashtags");
  composerHashtags.textContent = currentHashtags;
  composerHashtags.addEventListener("input", () => {
    currentHashtags = composerHashtags.textContent;
  });
}

function updateAssetPillAvailability(platform) {
  const textOnlyPill = assetPills.querySelector('[data-value="Text"]');
  const requiresMedia = PLATFORMS_REQUIRING_MEDIA.includes(platform);

  textOnlyPill.classList.toggle("hidden", requiresMedia);

  if (requiresMedia && selectedPillValue(assetPills) === "Text") {
    selectPill(assetPills, "Photo");
    clearUpload();
  }
}

function renderComposerShell() {
  const rawPlatform = selectedPillValue(platformPills);
  const platform = rawPlatform || "Instagram";
  const preview = PLATFORM_PREVIEW[platform] || PLATFORM_PREVIEW.Instagram;
  const template = COMPOSER_TEMPLATES[platform] || COMPOSER_TEMPLATES.Instagram;

  composer.dataset.platform = platform;
  composer.innerHTML = template(preview);
  bindComposerRefs();
  syncCaptionPreview();
  // Only actually hide Text-only once a platform is really selected — before that,
  // nothing is chosen yet, so there's nothing to restrict against.
  updateAssetPillAvailability(rawPlatform);
  renderComposerMedia();
}

const PLACEHOLDER_ASSETS = {
  Photo: "assets/placeholder-photo.png",
  Video: "assets/placeholder-video.webm",
};

const MAX_VIDEO_SECONDS = 8;

function clearUpload() {
  if (uploadedMediaUrl) URL.revokeObjectURL(uploadedMediaUrl);
  uploadedMediaUrl = null;
  uploadInput.value = "";
  clearUploadBtn.classList.add("hidden");
  uploadError.textContent = "";
}

// Longer uploads aren't trimmed on disk — just looped to their first MAX_VIDEO_SECONDS in the preview.
function clampVideoTo8Seconds(video) {
  if (!video) return;
  video.addEventListener("timeupdate", () => {
    if (video.currentTime > MAX_VIDEO_SECONDS) {
      video.currentTime = 0;
    }
  });
}

function updateUploadField() {
  const asset = selectedPillValue(assetPills) || "Text";
  if (asset === "Text") {
    uploadField.classList.add("hidden");
    return;
  }
  uploadField.classList.remove("hidden");
  uploadInput.accept = asset === "Photo" ? "image/*" : "video/*";
  uploadLabelText.textContent = uploadedMediaUrl ? `Change ${asset.toLowerCase()}` : `Upload ${asset.toLowerCase()}`;
  clearUploadBtn.classList.toggle("hidden", !uploadedMediaUrl);
}

// --- fake file-picker modal (bundled demo media) --------------------------

let finderSelectedPath = null;

function openFinder() {
  const asset = selectedPillValue(assetPills) || "Photo";
  const kind = asset === "Video" ? "Video" : "Photo";
  const items = DEMO_UPLOADS[kind] || [];

  finderTitle.textContent = `Select a ${kind}`;
  finderSelectedPath = null;
  finderOpenBtn.disabled = true;

  finderGrid.innerHTML = items
    .map(
      (item, i) => `
        <button type="button" class="finder-item" data-index="${i}">
          ${kind === "Video" ? `<video src="${item.path}" muted></video>` : `<img src="${item.path}" alt="" />`}
          <span class="finder-item-name">${item.name}</span>
        </button>
      `
    )
    .join("");

  finderOverlay.classList.remove("hidden");
}

function closeFinder() {
  finderOverlay.classList.add("hidden");
}

function chooseFinderFile() {
  if (!finderSelectedPath) return;
  if (uploadedMediaUrl) URL.revokeObjectURL(uploadedMediaUrl);
  uploadedMediaUrl = finderSelectedPath;
  uploadError.textContent = "";
  renderComposerMedia();
  closeFinder();
}

function renderComposerMedia() {
  const asset = selectedPillValue(assetPills) || "Text";
  updateUploadField();

  if (asset === "Text" || !selectedItem) {
    composerMedia.classList.add("hidden");
    composerMedia.innerHTML = "";
    composerMedia.style.background = "";
    return;
  }

  composerMedia.classList.remove("hidden");
  composerMedia.style.background = "";

  const type = selectedPillValue(typePills) || "Book";
  const label = type === "Book" ? selectedItem.title : selectedItem.event_name;

  if (uploadedMediaUrl) {
    if (asset === "Photo") {
      composerMedia.innerHTML = `<img src="${uploadedMediaUrl}" alt="" class="composer-media-file" />`;
    } else {
      composerMedia.innerHTML = `<video src="${uploadedMediaUrl}" class="composer-media-file" controls muted autoplay loop playsinline></video>`;
      clampVideoTo8Seconds(composerMedia.querySelector("video"));
    }
    return;
  }

  // No upload yet — show a bundled sample asset so the mock post still looks like a real post.
  const placeholderTag =
    asset === "Photo"
      ? `<img src="${PLACEHOLDER_ASSETS.Photo}" alt="" class="composer-media-file" />`
      : `<video src="${PLACEHOLDER_ASSETS.Video}" class="composer-media-file" muted autoplay loop playsinline></video>`;
  composerMedia.innerHTML = `${placeholderTag}<span class="composer-media-overlay-label">${label}</span>`;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setTonePillsDisabled(disabled) {
  for (const btn of tonePills.querySelectorAll(".pill")) {
    btn.disabled = disabled;
  }
}

async function generateWithTone(tone) {
  if (!selectedItem) return;

  composerCaption.classList.add("thinking");
  composerCaption.textContent = "Thinking...";
  currentHashtags = "";
  composerHashtags.textContent = "";
  setTonePillsDisabled(true);
  aiGenerateBtn.disabled = true;

  await wait(650);

  const type = selectedPillValue(typePills) || "Book";
  const template = pickRandom(CAPTION_TEMPLATES[type][tone]);
  const caption = template(selectedItem);
  const hashtags = hashtagsFor(type, selectedItem);

  composerCaption.classList.remove("thinking");
  captionInput.value = caption;
  syncCaptionPreview();
  currentHashtags = hashtags.join(" ");
  composerHashtags.textContent = currentHashtags;
  setTonePillsDisabled(false);
  updateGenerateButtonState();
}

// --- scheduling / history --------------------------------------------------------

function generatePostId() {
  return `POST-${crypto.randomUUID()}`;
}

async function publishPost(mode) {
  if (!selectedItem) return;
  const type = selectedPillValue(typePills) || "Book";
  const caption = captionInput.value.trim();
  if (!caption) {
    saveStatus.textContent = "Write or generate a caption first.";
    return;
  }

  const hashtags = composerHashtags.textContent.trim();
  const captionWithTags = hashtags ? `${caption}\n\n${hashtags}` : caption;
  const platform = selectedPillValue(platformPills) || "Instagram";
  const postDate = mode === "now" ? todayStr() : postDateInput.value || todayStr();

  postNowBtn.disabled = true;
  scheduleToggleBtn.disabled = true;
  confirmScheduleBtn.disabled = true;
  saveStatus.textContent = mode === "now" ? "Posting..." : "Scheduling...";

  const row = {
    post_id: generatePostId(),
    post_date: postDate,
    platform,
    related_type: type,
    book_id: type === "Book" ? selectedItem.book_id : null,
    event_id: type === "Event" ? selectedItem.event_id : null,
    caption_text: captionWithTags,
  };

  const { error } = await supabase.from("Social Posts").insert(row);

  if (error) {
    console.error("Failed to save post", error);
    saveStatus.textContent = `Error ${mode === "now" ? "posting" : "scheduling"} post: ${error.message}`;
  } else {
    saveStatus.textContent = mode === "now" ? "Posted!" : "Scheduled!";
    captionInput.value = "";
    syncCaptionPreview();
    currentHashtags = "";
    composerHashtags.textContent = "";
      schedulePanel.classList.add("hidden");
    await loadHistory();
  }

  postNowBtn.disabled = false;
  scheduleToggleBtn.disabled = false;
  confirmScheduleBtn.disabled = false;
}

function itemLabelFor(post) {
  if (post.related_type === "Book") {
    const book = books.find((b) => b.book_id === post.book_id);
    return book ? book.title : post.book_id || "";
  }
  const event = events.find((e) => e.event_id === post.event_id);
  return event ? event.event_name : post.event_id || "";
}

function buildRow(post, cells) {
  const tr = document.createElement("tr");
  tr.innerHTML = cells.join("");
  return tr;
}

function postMetaCell(post) {
  return `<td class="post-meta-cell"><span class="meta-date">${formatDate(post.post_date)}</span><span class="platform-badge">${post.platform}</span></td>`;
}

function captionCell(caption) {
  return `<td class="caption-cell"><span class="caption-text">${caption}</span><button type="button" class="caption-toggle">Show more</button></td>`;
}

function handleCaptionToggleClick(e) {
  const btn = e.target.closest(".caption-toggle");
  if (!btn) return;
  const cell = btn.closest(".caption-cell");
  const expanded = cell.classList.toggle("expanded");
  btn.textContent = expanded ? "Show less" : "Show more";
}

async function loadHistory() {
  const { data, error } = await supabase
    .from("Social Posts")
    .select("post_id, post_date, platform, related_type, book_id, event_id, caption_text")
    .order("post_date", { ascending: false })
    .order("post_id", { ascending: false });

  if (error) {
    console.error("Failed to load Social Posts", error);
    upcomingBody.innerHTML = `<tr class="empty-row"><td colspan="3">Error loading history: ${error.message}</td></tr>`;
    publishedBody.innerHTML = "";
    return;
  }

  const today = todayStr();
  const upcomingAll = data.filter((p) => p.post_date >= today).sort((a, b) => a.post_date.localeCompare(b.post_date));
  const upcoming = upcomingAll.slice(0, 5);
  const published = data.filter((p) => p.post_date < today).sort((a, b) => b.post_date.localeCompare(a.post_date));

  upcomingCount.textContent = `(${upcomingAll.length})`;
  publishedCount.textContent = `(${published.length})`;

  upcomingBody.innerHTML = "";
  if (upcoming.length === 0) {
    upcomingBody.innerHTML = '<tr class="empty-row"><td colspan="3">Nothing scheduled yet.</td></tr>';
  } else {
    for (const post of upcoming) {
      upcomingBody.appendChild(
        buildRow(post, [postMetaCell(post), `<td>${itemLabelFor(post)}</td>`, captionCell(post.caption_text)])
      );
    }
  }

  publishedBody.innerHTML = "";
  if (published.length === 0) {
    publishedBody.innerHTML = '<tr class="empty-row"><td colspan="4">Nothing published yet.</td></tr>';
  } else {
    for (const post of published) {
      const link = platformLinks[post.platform];
      const linkCell = link
        ? `<td><a class="link-chip" href="${link}" target="_blank" rel="noopener" title="View on ${post.platform}" aria-label="View on ${post.platform}">&#8599;</a></td>`
        : `<td>&mdash;</td>`;
      publishedBody.appendChild(
        buildRow(post, [
          postMetaCell(post),
          `<td>${itemLabelFor(post)}</td>`,
          captionCell(post.caption_text),
          linkCell,
        ])
      );
    }
  }
}

// --- wiring --------------------------------------------------------

setupPillGroup(typePills, populateItemSelect);

itemSearchInput.addEventListener("input", () => {
  if (selectedItem) clearItemSelection();
  renderItemList(itemSearchInput.value);
});

itemSearchInput.addEventListener("focus", () => {
  renderItemList(itemSearchInput.value);
});

itemSearchInput.addEventListener("keydown", (e) => {
  if (itemList.classList.contains("hidden") && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
    renderItemList(itemSearchInput.value);
    return;
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    setActiveOption(Math.min(itemListActiveIndex + 1, itemListOptions.length - 1));
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setActiveOption(Math.max(itemListActiveIndex - 1, 0));
  } else if (e.key === "Enter") {
    if (itemListActiveIndex >= 0 && itemListOptions[itemListActiveIndex]) {
      e.preventDefault();
      chooseItem(itemListOptions[itemListActiveIndex]);
    }
  } else if (e.key === "Escape") {
    closeItemList();
  }
});

itemList.addEventListener("mousedown", (e) => {
  // mousedown (not click) fires before the input's blur, so the list is still in the DOM when we read it.
  const option = e.target.closest(".combobox-option");
  if (!option) return;
  e.preventDefault();
  chooseItem(itemListOptions[Number(option.dataset.index)]);
});

itemSearchInput.addEventListener("blur", () => {
  closeItemList();
  if (!selectedItem) itemSearchInput.value = "";
});

setupPillGroup(platformPills, renderComposerShell);
setupPillGroup(assetPills, () => {
  clearUpload();
  renderComposerMedia();
});
setupPillGroup(tonePills, (tone) => {
  selectedTone = tone;
  updateGenerateButtonState();
});

captionInput.addEventListener("input", syncCaptionPreview);

aiGenerateBtn.addEventListener("click", () => {
  if (!selectedItem || !selectedTone) return;
  generateWithTone(selectedTone);
});

uploadInput.addEventListener("change", () => {
  const file = uploadInput.files[0];
  if (!file) return;
  uploadError.textContent = "";

  if (uploadedMediaUrl) URL.revokeObjectURL(uploadedMediaUrl);
  uploadedMediaUrl = URL.createObjectURL(file);
  renderComposerMedia();
});

clearUploadBtn.addEventListener("click", () => {
  clearUpload();
  renderComposerMedia();
});

openFinderBtn.addEventListener("click", openFinder);

finderGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".finder-item");
  if (!btn) return;
  for (const el of finderGrid.querySelectorAll(".finder-item")) el.classList.remove("selected");
  btn.classList.add("selected");

  const asset = selectedPillValue(assetPills) || "Photo";
  const kind = asset === "Video" ? "Video" : "Photo";
  finderSelectedPath = DEMO_UPLOADS[kind][Number(btn.dataset.index)].path;
  finderOpenBtn.disabled = false;
});

finderGrid.addEventListener("dblclick", (e) => {
  if (e.target.closest(".finder-item")) chooseFinderFile();
});

finderOpenBtn.addEventListener("click", chooseFinderFile);
finderCancelBtn.addEventListener("click", closeFinder);

finderDeviceBtn.addEventListener("click", () => {
  closeFinder();
  uploadInput.click();
});

finderOverlay.addEventListener("click", (e) => {
  if (e.target === finderOverlay) closeFinder();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !finderOverlay.classList.contains("hidden")) closeFinder();
});

postNowBtn.addEventListener("click", () => publishPost("now"));

scheduleToggleBtn.addEventListener("click", () => {
  schedulePanel.classList.toggle("hidden");
});

confirmScheduleBtn.addEventListener("click", () => publishPost("schedule"));

refreshHistoryBtn.addEventListener("click", loadHistory);
upcomingBody.addEventListener("click", handleCaptionToggleClick);
publishedBody.addEventListener("click", handleCaptionToggleClick);

setupPillGroup(historyTabs, (tab) => {
  upcomingPanel.classList.toggle("hidden", tab !== "upcoming");
  publishedPanel.classList.toggle("hidden", tab !== "published");
});

postDateInput.value = todayStr();
postDateInput.min = todayStr();

// Bind composer refs synchronously so resetComposer()/enableComposer() never race
// against the async loadPlatforms() call that would otherwise bind them first.
renderComposerShell();

async function init() {
  // loadHistory needs books/events loaded first to resolve item titles for the table.
  await Promise.all([loadPickerData(), loadPlatforms()]);
  await loadHistory();
}
init();
