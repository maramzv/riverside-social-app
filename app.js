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

// Each platform's current brand mark, so the picker pills read at a glance
// instead of relying on the label alone.
const PLATFORM_ICONS = {
  Instagram: `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
  TikTok: `<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M16.6 5.82A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"/></svg>`,
  X: `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  Facebook: `<svg viewBox="0 0 320 512" width="15" height="15" fill="currentColor"><path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/></svg>`,
  Pinterest: `<svg viewBox="0 0 384 512" width="15" height="15" fill="currentColor"><path d="M204 6.5C101.4 6.5 0 74.9 0 185.6 0 256 39.6 296 63.6 296c9.9 0 15.6-27.6 15.6-35.4 0-9.3-23.7-29.1-23.7-67.8 0-80.4 61.2-137.4 140.4-137.4 68.1 0 118.5 38.7 118.5 109.8 0 53.1-21.3 152.7-90.3 152.7-24.9 0-46.2-18-46.2-43.8 0-37.8 26.4-74.4 26.4-113.4 0-66.2-93.9-54.2-93.9 25.8 0 16.8 2.1 35.4 9.6 50.7-13.8 59.4-42 148.2-42 209.4 0 18.9 2.7 37.5 4.5 56.4 3.4 3.8 1.7 3.4 6.9 1.5 50.4-69 48.6-82.5 71.4-172.8 12.3 23.4 44.1 36 69.3 36 106.2 0 153.9-103.5 153.9-197.1 0-90.9-76.8-158.7-165.9-158.7z"/></svg>`,
};

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
      <span class="composer-header-icon composer-ig-topbar-icon">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.152 14.081 2.5 12.194 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938Z"/></svg>
      </span>
      <span class="composer-header-icon composer-ig-topbar-icon">
        <svg viewBox="0 0 512 512" width="20" height="20" fill="currentColor"><path d="M256.55 8C116.52 8 8 110.34 8 248.57c0 72.3 29.71 134.78 78.07 177.94 8.35 7.51 6.63 11.86 8.05 58.23A19.92 19.92 0 0 0 122 502.31c52.91-23.3 53.59-25.14 62.56-22.7C337.85 521.8 504 423.7 504 248.57 504 110.34 396.59 8 256.55 8zm149.24 185.13-73 115.57a37.37 37.37 0 0 1-53.91 9.93l-58.08-43.47a15 15 0 0 0-18 0l-78.37 59.44c-10.46 7.93-24.16-4.6-17.11-15.67l73-115.57a37.36 37.36 0 0 1 53.91-9.93l58.06 43.46a15 15 0 0 0 18 0l78.41-59.38c10.44-7.94 24.14 4.6 17.09 15.62z"/></svg>
      </span>
    </div>
    <div class="composer-header">
      <div class="composer-avatar" style="background:${preview.avatarBg}">RB</div>
      <div class="composer-account">${preview.handle}</div>
      <span class="composer-header-spacer"></span>
      <span class="composer-header-icon">&#8942;</span>
    </div>
    <div class="composer-media hidden" id="composer-media"></div>
    <div class="composer-ig-actions">
      <span class="composer-action-icon composer-action-icon-liked">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="#ed4956" stroke="#ed4956" stroke-width="1.7"><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.152 14.081 2.5 12.194 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938Z"/></svg>
      </span>
      <span class="composer-action-icon">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"/></svg>
      </span>
      <span class="composer-action-icon">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="3" x2="9.218" y2="10.083"/><polygon points="11.698 20.334 22 3.001 2 3.001 9.218 10.083 11.698 20.334"/></svg>
      </span>
      <span class="composer-action-spacer"></span>
      <span class="composer-action-icon">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><polygon points="20 21 12 13.44 4 21 4 3 20 3 20 21"/></svg>
      </span>
    </div>
    <div class="composer-ig-liked">Liked by <strong>others</strong></div>
    <div class="composer-caption-wrap">
      <strong>${preview.handle}</strong>
      <span id="composer-caption" class="composer-caption" data-placeholder="Your caption will appear here..."></span>
    </div>
    <div id="composer-hashtags" class="composer-hashtags"></div>
    <div class="composer-ig-navbar">
      <span class="composer-nav-icon">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M22 23h-6.001a1 1 0 0 1-1-1v-5.455a2.997 2.997 0 1 0-5.993 0V22a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V11.543a1.002 1.002 0 0 1 .31-.724l9.988-9.558a1 1 0 0 1 1.383 0l9.988 9.558a1.002 1.002 0 0 1 .31.724V22a1 1 0 0 1-1 1Z"/></svg>
      </span>
      <span class="composer-nav-icon">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </span>
      <span class="composer-nav-icon">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
      </span>
      <span class="composer-nav-icon">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="2.5" width="17" height="19" rx="4"/><polygon points="10.5 8.5 16 12 10.5 15.5 10.5 8.5"/></svg>
      </span>
      <span class="composer-nav-icon">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="10" r="3.2"/><path d="M6.2 18c1.4-2.8 3.7-3.8 5.8-3.8s4.4 1 5.8 3.8"/></svg>
      </span>
    </div>
  `,

  Facebook: (preview) => `
    <div class="composer-header">
      <div class="composer-avatar" style="background:${preview.avatarBg}">RB</div>
      <div>
        <div class="composer-account composer-fb-account">
          ${preview.handle}
          <svg viewBox="0 0 24 24" width="14" height="14" fill="#1877f2"><circle cx="12" cy="12" r="11"/><path fill="white" d="m10.5 15.3-3-3 1.4-1.4 1.6 1.6 4.6-4.6 1.4 1.4z"/></svg>
        </div>
        <div class="composer-fb-meta">
          2h &middot;
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9.5"/><ellipse cx="12" cy="12" rx="4.2" ry="9.5"/><line x1="2.5" y1="12" x2="21.5" y2="12"/></svg>
        </div>
      </div>
      <span class="composer-header-spacer"></span>
      <span class="composer-header-icon composer-fb-header-icon">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
      </span>
      <span class="composer-header-icon composer-fb-header-icon">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>
      </span>
    </div>
    <div class="composer-caption-wrap composer-caption-wrap-plain">
      <span id="composer-caption" class="composer-caption" data-placeholder="Your caption will appear here..."></span>
    </div>
    <div id="composer-hashtags" class="composer-hashtags"></div>
    <div class="composer-media hidden" id="composer-media"></div>
    <div class="composer-fb-reactions">
      <span class="composer-fb-reaction-summary">
        <span class="composer-fb-reaction-icons">
          <svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="11" fill="#1877f2"/><path fill="white" d="M9 21H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3v10Zm2 0h6.5a2 2 0 0 0 1.9-1.4l2-6A2 2 0 0 0 19.5 11H15V6a2 2 0 0 0-2-2h-.5L11 9v12Z"/></svg>
          <svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="11" fill="#f33e58"/><path fill="white" d="M12 19s-6.5-4.35-6.5-9A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 6.5 2c0 4.65-6.5 9-6.5 9Z"/></svg>
          <svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="11" fill="#f7b125"/><path fill="none" stroke="#7a5b12" stroke-width="1.3" stroke-linecap="round" d="M8 10c.3-1 1-1.5 1.6-1.5M16 10c-.3-1-1-1.5-1.6-1.5M8 14c1 1.8 2.6 2.8 4 2.8s3-1 4-2.8"/></svg>
        </span>
        62
      </span>
      <span class="composer-fb-reactions-right">2 Comments &nbsp; 10 Shares</span>
    </div>
    <div class="composer-fb-actions">
      <span class="composer-fb-action">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3v10Zm2 0h6.5a2 2 0 0 0 1.9-1.4l2-6A2 2 0 0 0 19.5 11H15V6a2 2 0 0 0-2-2h-.5L11 9v12Z"/></svg>
        Like
      </span>
      <span class="composer-fb-action">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10l-4.5 4v-4H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z"/></svg>
        Comment
      </span>
      <span class="composer-fb-action">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15v-2a6 6 0 0 1 6-6h7"/><polyline points="13 3 18 7 13 11"/></svg>
        Share
      </span>
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
    <div class="composer-x-meta">12:00 PM &middot; Oct 14, 2023 &middot; 200.1K Views</div>
    <div class="composer-x-actions">
      <span class="composer-x-action">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10l-4.5 4v-4H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z"/></svg>
        991
      </span>
      <span class="composer-x-action">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.65 6.35 14 2.7v2.55H7a4.75 4.75 0 0 0-4.75 4.75v2h1.5v-2A3.25 3.25 0 0 1 7 6.75h7v2.55l3.65-3.65Zm-11.3 11.3L10 21.3v-2.55h7A4.75 4.75 0 0 0 21.75 14v-2h-1.5v2A3.25 3.25 0 0 1 17 17.25h-7v-2.55l-3.65 3.65Z"/></svg>
        1,581
      </span>
      <span class="composer-x-action">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.152 14.081 2.5 12.194 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938Z"/></svg>
        9,867
      </span>
      <span class="composer-x-action">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><polygon points="20 21 12 13.44 4 21 4 3 20 3 20 21"/></svg>
        90
      </span>
      <span class="composer-x-action">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="15"/><polyline points="7.5 7.5 12 3 16.5 7.5"/><path d="M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/></svg>
      </span>
    </div>
  `,

  Pinterest: (preview) => `
    <div class="composer-pin-topbar">
      <span class="composer-pin-icon">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 4 7 12 15 20"/></svg>
      </span>
      <span class="composer-pin-topbar-right">
        <span class="composer-pin-icon">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="15"/><polyline points="7.5 7.5 12 3 16.5 7.5"/><path d="M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/></svg>
        </span>
        <span class="composer-pin-icon">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
        </span>
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
        <span class="composer-tiktok-live">
          <svg viewBox="0 0 24 18" width="21" height="16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <line x1="7" y1="4" x2="4" y2="0.5"/>
            <line x1="17" y1="4" x2="20" y2="0.5"/>
            <rect x="2" y="4" width="20" height="13" rx="2.5"/>
            <text x="12" y="13.3" text-anchor="middle" font-size="6.3" font-weight="700" font-family="Arial, sans-serif" stroke="none" fill="currentColor">LIVE</text>
          </svg>
        </span>
        <div class="composer-tiktok-tabs">
          <span class="dim">Following</span><span class="active">For You</span>
        </div>
        <span class="composer-tiktok-search">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16" y2="16"/></svg>
        </span>
      </div>
      <div class="composer-tiktok-rail">
        <div class="composer-tiktok-avatar-wrap">
          <div class="composer-avatar" style="background:${preview.avatarBg}">RB</div>
          <span class="composer-tiktok-plus">&#43;</span>
        </div>
        <div class="composer-tiktok-rail-item">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.152 14.081 2.5 12.194 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938Z"/></svg>
          <small>1.2K</small>
        </div>
        <div class="composer-tiktok-rail-item">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" fill-rule="evenodd"><path d="M4 3.5h16A2.5 2.5 0 0 1 22.5 6v9a2.5 2.5 0 0 1-2.5 2.5h-9.6l-4.9 4V17.5H4A2.5 2.5 0 0 1 1.5 15V6A2.5 2.5 0 0 1 4 3.5Z M8.3 9.3a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6Z M12 9.3a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6Z M15.7 9.3a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6Z"/></svg>
          <small>128</small>
        </div>
        <div class="composer-tiktok-rail-item">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><polygon points="20 21 12 13.44 4 21 4 3 20 3 20 21"/></svg>
          <small>256</small>
        </div>
        <div class="composer-tiktok-rail-item">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15v-2a6 6 0 0 1 6-6h7"/><polyline points="13 3 18 7 13 11"/></svg>
          <small>64</small>
        </div>
      </div>
      <div class="composer-tiktok-caption-overlay">
        <div class="composer-account">${preview.handle}</div>
        <span id="composer-caption" class="composer-caption" data-placeholder="Your caption will appear here..."></span>
        <div id="composer-hashtags" class="composer-hashtags"></div>
      </div>
      <div class="composer-tiktok-navbar-overlay">
        <span class="composer-tiktok-nav-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M22 23h-6.001a1 1 0 0 1-1-1v-5.455a2.997 2.997 0 1 0-5.993 0V22a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V11.543a1.002 1.002 0 0 1 .31-.724l9.988-9.558a1 1 0 0 1 1.383 0l9.988 9.558a1.002 1.002 0 0 1 .31.724V22a1 1 0 0 1-1 1Z"/></svg>
        </span>
        <span class="composer-tiktok-nav-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M15.5 13.3c2.5.3 4.5 2.2 4.5 5"/></svg>
        </span>
        <span class="composer-tiktok-create">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </span>
        <span class="composer-tiktok-nav-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10l-4.5 4v-4H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z"/></svg>
        </span>
        <span class="composer-tiktok-nav-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 20c0-4 3.5-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/></svg>
        </span>
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
    btn.className = "pill pill-platform";
    btn.dataset.value = label;
    btn.innerHTML = `${PLATFORM_ICONS[label] || ""}<span>${label}</span>`;
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
  const upcoming = data.filter((p) => p.post_date >= today).sort((a, b) => a.post_date.localeCompare(b.post_date));
  const published = data.filter((p) => p.post_date < today).sort((a, b) => b.post_date.localeCompare(a.post_date));

  upcomingCount.textContent = `(${upcoming.length})`;
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
