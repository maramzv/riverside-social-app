import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
import { DEMO_UPLOADS } from "./assets/demo-uploads/manifest.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const typePills = document.getElementById("type-pills");
const bookCountEl = document.getElementById("book-count");
const eventCountEl = document.getElementById("event-count");
const itemSearchInput = document.getElementById("item-search");
const itemGrid = document.getElementById("item-grid");
const detailsBox = document.getElementById("item-details");

const platformPills = document.getElementById("platform-pills");
const assetPills = document.getElementById("asset-pills");
const tonePills = document.getElementById("tone-pills");

const captionInput = document.getElementById("caption-input");
const hashtagInput = document.getElementById("hashtag-input");

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
const toast = document.getElementById("toast");

const refreshHistoryBtn = document.getElementById("refresh-history-btn");
const historyViewPills = document.getElementById("history-view-pills");
const historyListView = document.getElementById("history-list-view");
const historyCalendarView = document.getElementById("history-calendar-view");
const historyTabs = document.getElementById("history-tabs");
const upcomingPanel = document.getElementById("upcoming-panel");
const publishedPanel = document.getElementById("published-panel");
const upcomingBody = document.getElementById("upcoming-body");
const publishedBody = document.getElementById("published-body");
const upcomingCount = document.getElementById("upcoming-count");
const publishedCount = document.getElementById("published-count");

const calendarPrevBtn = document.getElementById("calendar-prev-btn");
const calendarNextBtn = document.getElementById("calendar-next-btn");
const calendarMonthLabel = document.getElementById("calendar-month-label");
const calendarGrid = document.getElementById("calendar-grid");

let books = [];
let events = [];
let selectedItem = null;
let selectedItemType = "Book";
let platformLinks = {};
let uploadedMediaUrl = null;
let allPosts = [];
let calendarViewDate = new Date();

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
    <div id="composer-hashtags" class="composer-hashtags"></div>
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
    <div id="composer-hashtags" class="composer-hashtags"></div>
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
    <div id="composer-hashtags" class="composer-hashtags"></div>
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
    <div id="composer-hashtags" class="composer-hashtags"></div>
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
    <div class="composer-tiktok-stage">
      <div class="composer-media hidden" id="composer-media"></div>
      <div class="composer-tiktok-topbar-overlay">
        <span class="dim">Following</span><span class="active">For You</span>
        <span class="composer-tiktok-search">&#128269;</span>
      </div>
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
        <div id="composer-hashtags" class="composer-hashtags"></div>
      </div>
      <div class="composer-tiktok-navbar-overlay">
        <span>&#8962;</span><span>&#128101;</span>
        <span class="composer-tiktok-create">&#43;</span>
        <span>&#128172;</span><span>&#128100;</span>
      </div>
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

const STORE_HASHTAG = "#RiversideBooks";

// X's tight character budget can't absorb a full 3-5 tag block, so it gets
// capped hard; other platforms comfortably fit the full curated set.
const HASHTAG_LIMITS = { X: 2 };

function hashtagLimitFor(platform) {
  return HASHTAG_LIMITS[platform] ?? 5;
}

function toHashtagWord(text) {
  if (!text) return null;
  return text
    .replace(/'/g, "")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function genreHashtag(genre) {
  const word = toHashtagWord(genre);
  return word ? `#${word}Reads` : null;
}

function bookTitleHashtag(title) {
  const word = toHashtagWord(title);
  return word ? `#${word}` : null;
}

// Events don't have a genre field like Books do, so instead of one clean
// category tag, this scans the event's own name/description for known
// keywords (book club, story hour, cookbook, etc.) and tags whichever hit.
const EVENT_KEYWORD_HASHTAGS = [
  { pattern: /book\s*clubs?/i, tag: "#BookClub" },
  { pattern: /story\s*time|story\s*hour/i, tag: "#StoryHour" },
  { pattern: /signing/i, tag: "#BookSigning" },
  { pattern: /author\s*(talk|visit|event|q&a)/i, tag: "#AuthorEvent" },
  { pattern: /poetry/i, tag: "#PoetryNight" },
  { pattern: /cookbook|cooking|recipe/i, tag: "#Cookbooks" },
  { pattern: /histor(y|ical)/i, tag: "#History" },
  { pattern: /kids|children|toddler/i, tag: "#KidsEvents" },
  { pattern: /workshop|class/i, tag: "#Workshop" },
  { pattern: /open\s*mic/i, tag: "#OpenMic" },
  { pattern: /reading\s*group|discussion/i, tag: "#ReadingGroup" },
  { pattern: /mystery|thriller/i, tag: "#MysteryReads" },
  { pattern: /romance/i, tag: "#RomanceReads" },
  { pattern: /sci-?fi|science\s*fiction|fantasy/i, tag: "#SciFiFantasy" },
  { pattern: /holiday|christmas|halloween/i, tag: "#HolidayEvent" },
  { pattern: /launch|release/i, tag: "#BookLaunch" },
  { pattern: /book\s*sale|clearance/i, tag: "#BookSale" },
];

function eventKeywordHashtags(item) {
  const text = `${item.event_name || ""} ${item.event_description || ""}`;
  const tags = [];
  for (const { pattern, tag } of EVENT_KEYWORD_HASHTAGS) {
    if (tags.length >= 2) break;
    if (pattern.test(text) && !tags.includes(tag)) tags.push(tag);
  }
  return tags;
}

function hashtagsFor(type, item) {
  const tags = [...HASHTAG_BASE[type]];
  if (type === "Book") {
    const genreTag = genreHashtag(item.genre);
    if (genreTag) tags.push(genreTag);
    const nameTag = bookTitleHashtag(item.title);
    if (nameTag) tags.push(nameTag);
  } else {
    // Event names are full phrases ("Cookbook Tasting: The Hidden River"), so
    // squashing the whole thing into one hashtag reads as noise, not a tag —
    // the keyword tags above are the ones actually worth surfacing.
    tags.push(...eventKeywordHashtags(item));
  }
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
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
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

  updateTypeCounts();
  selectPill(typePills, selectedItemType);
  renderItemGrid();
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
  return type === "Book" ? item.title : item.event_name;
}

// Short "Jan 31" form for card meta tags — the full weekday/month spelling from
// formatDate() is too wide to fit in a card.
function shortDate(isoDateStr) {
  const [year, month, day] = isoDateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function itemIdField(type) {
  return type === "Book" ? "book_id" : "event_id";
}

// The tiny secondary tag on each card: author for books, date for events.
function itemMeta(type, item) {
  return type === "Book" ? item.author : shortDate(item.event_date);
}

function updateTypeCounts() {
  bookCountEl.textContent = `(${books.length})`;
  eventCountEl.textContent = `(${events.length})`;
}

// Events sort soonest-first (see the Events query's order("event_date")); books
// stay alphabetical (see the Books query's order("title")).
function renderItemGrid() {
  const type = selectedItemType;
  const idField = itemIdField(type);
  const list = type === "Book" ? books : events;
  const query = itemSearchInput.value.trim().toLowerCase();
  const filtered = query ? list.filter((item) => itemLabel(type, item).toLowerCase().includes(query)) : list;

  if (filtered.length === 0) {
    itemGrid.innerHTML = '<p class="item-grid-empty">No matches</p>';
    return;
  }

  itemGrid.innerHTML = filtered
    .map((item) => {
      const id = item[idField];
      const selected = selectedItem && item[idField] === selectedItem[idField] ? " selected" : "";
      return `
        <button type="button" class="item-card${selected}" data-id="${id}">
          <span class="item-card-title">${itemLabel(type, item)}</span>
          <span class="item-card-meta">${itemMeta(type, item)}</span>
        </button>
      `;
    })
    .join("");
}

function selectType(type) {
  selectedItemType = type;
  selectedItem = null;
  detailsBox.textContent = "";
  resetComposer();

  itemSearchInput.value = "";
  renderItemGrid();
}

function chooseGridItem(item) {
  selectedItem = item;

  detailsBox.textContent =
    selectedItemType === "Book"
      ? `${item.title} by ${item.author}\n\n${item.blurb}`
      : `${item.event_name} — ${formatDate(item.event_date)}\n\n${item.event_description}`;

  enableComposer();
}

// --- composer --------------------------------------------------------

function syncCaptionPreview() {
  composerCaption.textContent = captionInput.value;
}

function syncHashtagPreview() {
  composerHashtags.textContent = hashtagInput.value;
}

function resetToneSelection() {
  selectPill(tonePills, null);
}

function resetComposer() {
  composer.classList.add("composer-disabled");
  postNowBtn.disabled = true;
  scheduleToggleBtn.disabled = true;
  schedulePanel.classList.add("hidden");
  resetToneSelection();
  setTonePillsDisabled(true);
  captionInput.value = "";
  syncCaptionPreview();
  hashtagInput.value = "";
  syncHashtagPreview();
  clearUpload();
  renderComposerMedia();
}

function enableComposer() {
  composer.classList.remove("composer-disabled");
  postNowBtn.disabled = false;
  scheduleToggleBtn.disabled = false;
  resetToneSelection();
  setTonePillsDisabled(false);
  captionInput.value = "";
  syncCaptionPreview();
  hashtagInput.value = STORE_HASHTAG;
  syncHashtagPreview();
  clearUpload();
  renderComposerMedia();
}

function bindComposerRefs() {
  composerMedia = document.getElementById("composer-media");
  composerCaption = document.getElementById("composer-caption");
  composerHashtags = document.getElementById("composer-hashtags");
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
  syncHashtagPreview();
  // Only actually hide Text-only once a platform is really selected — before that,
  // nothing is chosen yet, so there's nothing to restrict against.
  updateAssetPillAvailability(rawPlatform);
  renderComposerMedia();
}

function samplePlaceholderMarkup(subtitle) {
  return `
    <div class="composer-media-placeholder">
      <div class="composer-media-placeholder-circle">
        <div class="composer-media-placeholder-title">Riverside Books</div>
        <div class="composer-media-placeholder-subtitle">${subtitle}</div>
      </div>
    </div>
  `;
}

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
          ${kind === "Video" ? `<video src="${item.path}" muted preload="metadata"></video>` : `<img src="${item.path}" alt="" loading="lazy" />`}
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
  const rawAsset = selectedPillValue(assetPills);
  const asset = rawAsset || "Text";
  updateUploadField();

  // No asset type chosen yet — show a pulsing branded placeholder so the preview
  // doesn't look empty. Stays up through item selection, and only goes away once
  // the user actually picks Photo, Video, or Text themselves.
  if (!rawAsset) {
    composerMedia.classList.remove("hidden");
    composerMedia.style.background = "";
    composerMedia.innerHTML = samplePlaceholderMarkup("sample placeholder");
    return;
  }

  if (asset === "Text") {
    composerMedia.classList.add("hidden");
    composerMedia.innerHTML = "";
    composerMedia.style.background = "";
    return;
  }

  composerMedia.classList.remove("hidden");
  composerMedia.style.background = "";

  if (uploadedMediaUrl) {
    if (asset === "Photo") {
      composerMedia.innerHTML = `<img src="${uploadedMediaUrl}" alt="" class="composer-media-file" />`;
    } else {
      composerMedia.innerHTML = `<video src="${uploadedMediaUrl}" class="composer-media-file" controls muted autoplay loop playsinline></video>`;
      clampVideoTo8Seconds(composerMedia.querySelector("video"));
    }
    return;
  }

  // No upload yet — show a bundled sample placeholder so the mock post still looks like a real post.
  composerMedia.innerHTML = samplePlaceholderMarkup(asset === "Photo" ? "sample photo placeholder" : "sample video placeholder");
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let toastTimer = null;

function showToast(message, variant = "success") {
  clearTimeout(toastTimer);
  toast.className = `toast toast-${variant} visible`;
  toast.innerHTML = `<span class="toast-icon">${variant === "success" ? "&#10003;" : "&#9888;"}</span> ${message}`;
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 3000);
}

function setTonePillsDisabled(disabled) {
  for (const btn of tonePills.querySelectorAll(".pill")) {
    btn.disabled = disabled;
  }
}

async function generateWithTone(tone, pillEl) {
  if (!selectedItem) return;

  hashtagInput.value = "";
  syncHashtagPreview();
  setTonePillsDisabled(true);
  pillEl.classList.add("pill-loading");

  await wait(500);

  const type = selectedItemType || "Book";
  const template = pickRandom(CAPTION_TEMPLATES[type][tone]);
  const caption = template(selectedItem);
  const platform = selectedPillValue(platformPills) || "Instagram";
  const hashtags = hashtagsFor(type, selectedItem).slice(0, hashtagLimitFor(platform));

  captionInput.value = caption;
  syncCaptionPreview();
  hashtagInput.value = hashtags.join(" ");
  syncHashtagPreview();
  setTonePillsDisabled(false);
  pillEl.classList.remove("pill-loading");
  selectPill(tonePills, tone);
}

// --- scheduling / history --------------------------------------------------------

function generatePostId() {
  return `POST-${crypto.randomUUID()}`;
}

async function publishPost(mode) {
  if (!selectedItem) return;
  const type = selectedItemType || "Book";
  const caption = captionInput.value.trim();
  if (!caption) {
    showToast("Write or generate a caption first.", "error");
    return;
  }

  const hashtags = hashtagInput.value.trim();
  const captionWithTags = hashtags ? `${caption}\n\n${hashtags}` : caption;
  const platform = selectedPillValue(platformPills) || "Instagram";
  const postDate = mode === "now" ? todayStr() : postDateInput.value || todayStr();

  const triggerBtn = mode === "now" ? postNowBtn : confirmScheduleBtn;
  const triggerLabel = triggerBtn.textContent;

  postNowBtn.disabled = true;
  scheduleToggleBtn.disabled = true;
  confirmScheduleBtn.disabled = true;
  triggerBtn.textContent = mode === "now" ? "Posting..." : "Scheduling...";

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
    showToast(`Error ${mode === "now" ? "posting" : "scheduling"} post: ${error.message}`, "error");
  } else {
    showToast(mode === "now" ? "Posted!" : "Scheduled!");
    captionInput.value = "";
    syncCaptionPreview();
    hashtagInput.value = "";
    syncHashtagPreview();
    schedulePanel.classList.add("hidden");
    await loadHistory();
  }

  triggerBtn.textContent = triggerLabel;
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
  return `<td class="post-meta-cell"><div class="post-meta-inner"><span class="meta-date">${formatDate(post.post_date)}</span><span class="platform-badge">${post.platform}</span></div></td>`;
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

const MAX_CHIPS_PER_DAY = 3;

function renderCalendar() {
  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();
  const today = todayStr();

  calendarMonthLabel.textContent = calendarViewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const postsByDay = {};
  for (const post of allPosts) {
    (postsByDay[post.post_date] ||= []).push(post);
  }

  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();
  const totalCells = Math.ceil((leadingBlanks + daysInMonth) / 7) * 7;

  let html = "";
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - leadingBlanks + 1;
    if (dayNum < 1 || dayNum > daysInMonth) {
      html += `<div class="calendar-cell calendar-cell-empty"></div>`;
      continue;
    }

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    const posts = postsByDay[dateStr] || [];
    const isToday = dateStr === today;

    const chips = posts
      .slice(0, MAX_CHIPS_PER_DAY)
      .map(
        (post) =>
          `<div class="calendar-chip" title="${post.platform}: ${itemLabelFor(post)}">
            <span class="platform-badge">${post.platform}</span> ${itemLabelFor(post)}
          </div>`
      )
      .join("");
    const overflow =
      posts.length > MAX_CHIPS_PER_DAY ? `<div class="calendar-more">+${posts.length - MAX_CHIPS_PER_DAY} more</div>` : "";

    html += `
      <div class="calendar-cell${isToday ? " calendar-cell-today" : ""}">
        <span class="calendar-daynum">${dayNum}</span>
        <div class="calendar-chips">${chips}${overflow}</div>
      </div>
    `;
  }

  calendarGrid.innerHTML = html;
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

  allPosts = data;
  renderCalendar();

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

setupPillGroup(typePills, selectType);

itemSearchInput.addEventListener("input", renderItemGrid);

itemGrid.addEventListener("click", (e) => {
  const card = e.target.closest(".item-card");
  if (!card) return;
  const list = selectedItemType === "Book" ? books : events;
  const idField = itemIdField(selectedItemType);
  const item = list.find((entry) => entry[idField] === card.dataset.id);
  if (!item) return;

  for (const sibling of itemGrid.querySelectorAll(".item-card")) sibling.classList.remove("selected");
  card.classList.add("selected");
  chooseGridItem(item);
});

setupPillGroup(platformPills, renderComposerShell);
setupPillGroup(assetPills, () => {
  clearUpload();
  renderComposerMedia();
});
tonePills.addEventListener("click", (e) => {
  const btn = e.target.closest(".pill");
  if (!btn || btn.disabled || !selectedItem) return;
  generateWithTone(btn.dataset.value, btn);
});

captionInput.addEventListener("input", syncCaptionPreview);
hashtagInput.addEventListener("input", syncHashtagPreview);

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

setupPillGroup(historyViewPills, (view) => {
  historyListView.classList.toggle("hidden", view !== "list");
  historyCalendarView.classList.toggle("hidden", view !== "calendar");
  historyTabs.classList.toggle("hidden", view !== "list");
  if (view === "calendar") renderCalendar();
});

calendarPrevBtn.addEventListener("click", () => {
  calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1);
  renderCalendar();
});

calendarNextBtn.addEventListener("click", () => {
  calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1);
  renderCalendar();
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
