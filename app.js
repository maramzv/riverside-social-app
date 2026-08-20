import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const typeSelect = document.getElementById("type-select");
const itemSelect = document.getElementById("item-select");
const detailsBox = document.getElementById("item-details");

const platformPills = document.getElementById("platform-pills");
const assetPills = document.getElementById("asset-pills");
const toneField = document.getElementById("tone-field");
const tonePills = document.getElementById("tone-pills");
const aiGenerateBtn = document.getElementById("ai-generate-btn");

const uploadField = document.getElementById("upload-field");
const uploadInput = document.getElementById("media-upload");
const uploadLabelText = document.getElementById("upload-label-text");
const clearUploadBtn = document.getElementById("clear-upload-btn");

const composer = document.getElementById("composer");
const composerPlatformLabel = document.getElementById("composer-platform-label");
const composerMedia = document.getElementById("composer-media");
const composerCaption = document.getElementById("composer-caption");
const composerHashtags = document.getElementById("composer-hashtags");
const imageIdeaLine = document.getElementById("image-idea-line");

const postDateInput = document.getElementById("post-date");
const scheduleBtn = document.getElementById("schedule-btn");
const saveStatus = document.getElementById("save-status");

const refreshHistoryBtn = document.getElementById("refresh-history-btn");
const upcomingBody = document.getElementById("upcoming-body");
const publishedBody = document.getElementById("published-body");

let books = [];
let events = [];
let selectedItem = null;
let platformLinks = {};
let uploadedMediaUrl = null;

const PLATFORM_LINK_FIELDS = [
  { field: "instagram_link", label: "Instagram", icon: "\u{1F4F7}" },
  { field: "tiktok_link", label: "TikTok", icon: "\u{1F3B5}" },
  { field: "x_link", label: "X", icon: "✕" },
  { field: "website_link", label: "Website", icon: "\u{1F310}" },
];

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
      ({ event_name, event_date }) => `Mark your calendar for ${event_name} on ${event_date}. See you there!`,
    ],
    Hype: [
      ({ event_name, event_date }) => `Tickets are moving for ${event_name} — don't miss it on ${event_date}!`,
      ({ event_name, event_date }) => `Last call: ${event_name} is on ${event_date}. Save your spot now.`,
    ],
    Playful: [
      ({ event_name, event_date }) => `Clear your calendar — ${event_name} is happening ${event_date} and it's going to be a good one.`,
    ],
    "Staff Pick": [
      ({ event_name, event_date }) => `We're personally excited for ${event_name} on ${event_date}. Come say hi!`,
    ],
  },
};

const HASHTAG_BASE = {
  Book: ["#RiversideBooks", "#Bookstagram", "#LocalBookstore"],
  Event: ["#RiversideBooks", "#ShopLocal", "#BookEvents"],
};

const IMAGE_IDEAS = {
  Book: {
    Cozy: "Flatlay of the book with a warm drink and a soft blanket, natural window light.",
    Hype: "Bold close-up of the cover with a 'JUST IN' sticker overlay, high-contrast lighting.",
    Playful: "Candid shot of a staffer mid-laugh holding the book, colorful background.",
    "Staff Pick": "Shelf photo with a handwritten 'staff pick' card tucked next to the book.",
  },
  Event: {
    Cozy: "Soft-focus photo of the event space being set up, string lights in the background.",
    Hype: "Countdown graphic with the event date in bold type over a photo of last year's crowd.",
    Playful: "Short clip of staff prepping decorations, sped up and set to music.",
    "Staff Pick": "Portrait of the host/author with a quote pulled from the event description.",
  },
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

function imageIdeaFor(type, tone) {
  return IMAGE_IDEAS[type][tone];
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
    return;
  }
  const account = data && data[0];
  const available = PLATFORM_LINK_FIELDS.filter((p) => account && account[p.field]);
  const platforms = available.length ? available : PLATFORM_LINK_FIELDS;

  platformLinks = {};
  for (const p of platforms) {
    if (account && account[p.field]) platformLinks[p.label] = account[p.field];
  }

  platformPills.innerHTML = "";
  platforms.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pill" + (i === 0 ? " selected" : "");
    btn.dataset.value = p.label;
    btn.textContent = `${p.icon} ${p.label}`;
    platformPills.appendChild(btn);
  });

  updateComposerPlatform();
}

// --- item picking --------------------------------------------------------

function populateItemSelect() {
  const type = typeSelect.value;
  const list = type === "Book" ? books : events;

  itemSelect.innerHTML = '<option value="">-- choose --</option>';
  for (const item of list) {
    const opt = document.createElement("option");
    opt.value = type === "Book" ? item.book_id : item.event_id;
    opt.textContent = type === "Book" ? `${item.title} — ${item.author}` : item.event_name;
    itemSelect.appendChild(opt);
  }

  selectedItem = null;
  detailsBox.textContent = "";
  resetComposer();
}

function onItemChosen() {
  const type = typeSelect.value;
  const id = itemSelect.value;
  const list = type === "Book" ? books : events;
  selectedItem =
    list.find((i) => (type === "Book" ? i.book_id : i.event_id) === id) || null;

  if (!selectedItem) {
    detailsBox.textContent = "";
    resetComposer();
    return;
  }

  detailsBox.textContent =
    type === "Book"
      ? `${selectedItem.title} by ${selectedItem.author}\n\n${selectedItem.blurb}`
      : `${selectedItem.event_name} — ${selectedItem.event_date}\n\n${selectedItem.event_description}`;

  enableComposer();
}

// --- composer --------------------------------------------------------

function resetComposer() {
  composer.classList.add("composer-disabled");
  aiGenerateBtn.disabled = true;
  scheduleBtn.disabled = true;
  toneField.classList.add("hidden");
  composerCaption.textContent = "";
  composerHashtags.textContent = "";
  imageIdeaLine.textContent = "";
  clearUpload();
  renderComposerMedia();
}

function enableComposer() {
  composer.classList.remove("composer-disabled");
  aiGenerateBtn.disabled = false;
  scheduleBtn.disabled = false;
  composerCaption.textContent = "";
  composerHashtags.textContent = "";
  imageIdeaLine.textContent = "";
  clearUpload();
  renderComposerMedia();
}

function updateComposerPlatform() {
  const platform = selectedPillValue(platformPills) || "Instagram";
  composerPlatformLabel.textContent = platform;
}

const MEDIA_ICONS = { Photo: "\u{1F5BC}️", Video: "▶️" };

function clearUpload() {
  if (uploadedMediaUrl) URL.revokeObjectURL(uploadedMediaUrl);
  uploadedMediaUrl = null;
  uploadInput.value = "";
  clearUploadBtn.classList.add("hidden");
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

  if (uploadedMediaUrl) {
    composerMedia.style.background = "";
    composerMedia.innerHTML =
      asset === "Photo"
        ? `<img src="${uploadedMediaUrl}" alt="" class="composer-media-file" />`
        : `<video src="${uploadedMediaUrl}" class="composer-media-file" controls muted></video>`;
    return;
  }

  const type = typeSelect.value;
  const label = type === "Book" ? selectedItem.title : selectedItem.event_name;
  composerMedia.style.background = genreColor(type === "Book" ? selectedItem.genre : selectedItem.event_name);
  composerMedia.innerHTML = `
    <span class="composer-media-icon">${MEDIA_ICONS[asset]}</span>
    <span class="composer-media-placeholder-label">${label}</span>
  `;
}

function generateWithTone(tone) {
  if (!selectedItem) return;
  const type = typeSelect.value;
  const template = pickRandom(CAPTION_TEMPLATES[type][tone]);
  const caption = template(selectedItem);
  const hashtags = hashtagsFor(type, selectedItem);
  const imageIdea = imageIdeaFor(type, tone);

  composerCaption.textContent = caption;
  composerHashtags.textContent = hashtags.join(" ");
  imageIdeaLine.textContent = `Visual idea: ${imageIdea}`;
}

// --- scheduling / history --------------------------------------------------------

function generatePostId() {
  return `POST-${crypto.randomUUID()}`;
}

async function schedulePost() {
  if (!selectedItem) return;
  const type = typeSelect.value;
  const caption = composerCaption.textContent.trim();
  if (!caption) {
    saveStatus.textContent = "Write or generate a caption first.";
    return;
  }

  const hashtags = composerHashtags.textContent.trim();
  const captionWithTags = hashtags ? `${caption}\n\n${hashtags}` : caption;
  const platform = selectedPillValue(platformPills) || "Instagram";
  const postDate = postDateInput.value || todayStr();

  scheduleBtn.disabled = true;
  saveStatus.textContent = "Scheduling...";

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
    saveStatus.textContent = `Error scheduling post: ${error.message}`;
  } else {
    saveStatus.textContent = postDate > todayStr() ? "Scheduled!" : "Saved!";
    composerCaption.textContent = "";
    composerHashtags.textContent = "";
    imageIdeaLine.textContent = "";
    await loadHistory();
  }

  scheduleBtn.disabled = false;
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

async function loadHistory() {
  const { data, error } = await supabase
    .from("Social Posts")
    .select("post_id, post_date, platform, related_type, book_id, event_id, caption_text")
    .order("post_date", { ascending: false })
    .order("post_id", { ascending: false });

  if (error) {
    console.error("Failed to load Social Posts", error);
    upcomingBody.innerHTML = `<tr class="empty-row"><td colspan="4">Error loading history: ${error.message}</td></tr>`;
    publishedBody.innerHTML = "";
    return;
  }

  const today = todayStr();
  const upcoming = data.filter((p) => p.post_date >= today).sort((a, b) => a.post_date.localeCompare(b.post_date));
  const published = data.filter((p) => p.post_date < today).sort((a, b) => b.post_date.localeCompare(a.post_date));

  upcomingBody.innerHTML = "";
  if (upcoming.length === 0) {
    upcomingBody.innerHTML = '<tr class="empty-row"><td colspan="4">Nothing scheduled yet.</td></tr>';
  } else {
    for (const post of upcoming) {
      upcomingBody.appendChild(
        buildRow(post, [
          `<td>${post.post_date}</td>`,
          `<td><span class="platform-badge">${post.platform}</span></td>`,
          `<td>${itemLabelFor(post)}</td>`,
          `<td class="caption-cell">${post.caption_text}</td>`,
        ])
      );
    }
  }

  publishedBody.innerHTML = "";
  if (published.length === 0) {
    publishedBody.innerHTML = '<tr class="empty-row"><td colspan="5">Nothing published yet.</td></tr>';
  } else {
    for (const post of published) {
      const link = platformLinks[post.platform];
      const linkCell = link
        ? `<td><a href="${link}" target="_blank" rel="noopener">View on ${post.platform}</a></td>`
        : `<td>&mdash;</td>`;
      publishedBody.appendChild(
        buildRow(post, [
          `<td>${post.post_date}</td>`,
          `<td><span class="platform-badge">${post.platform}</span></td>`,
          `<td>${itemLabelFor(post)}</td>`,
          `<td class="caption-cell">${post.caption_text}</td>`,
          linkCell,
        ])
      );
    }
  }
}

// --- wiring --------------------------------------------------------

typeSelect.addEventListener("change", populateItemSelect);
itemSelect.addEventListener("change", onItemChosen);

setupPillGroup(platformPills, updateComposerPlatform);
setupPillGroup(assetPills, () => {
  clearUpload();
  renderComposerMedia();
});
setupPillGroup(tonePills, (tone) => generateWithTone(tone));

aiGenerateBtn.addEventListener("click", () => {
  toneField.classList.toggle("hidden");
});

uploadInput.addEventListener("change", () => {
  const file = uploadInput.files[0];
  if (!file) return;
  if (uploadedMediaUrl) URL.revokeObjectURL(uploadedMediaUrl);
  uploadedMediaUrl = URL.createObjectURL(file);
  renderComposerMedia();
});

clearUploadBtn.addEventListener("click", () => {
  clearUpload();
  renderComposerMedia();
});

scheduleBtn.addEventListener("click", schedulePost);
refreshHistoryBtn.addEventListener("click", loadHistory);

postDateInput.value = todayStr();

async function init() {
  // loadHistory needs books/events loaded first to resolve item titles for the table.
  await Promise.all([loadPickerData(), loadPlatforms()]);
  await loadHistory();
}
init();
