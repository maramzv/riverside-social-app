// Lists the files that live in assets/demo-uploads/images and .../videos, for the
// in-app "choose a file" dialog. This app is a static site with no server, so it can't
// list a folder's contents at runtime — add an entry here whenever you drop in a new
// file, or it won't show up in the picker.
export const DEMO_UPLOADS = {
  Photo: [
    { name: "shelf-flatlay.png", path: "assets/demo-uploads/images/shelf-flatlay.png" },
    { name: "cafe-corner.png", path: "assets/demo-uploads/images/cafe-corner.png" },
    { name: "event-space.png", path: "assets/demo-uploads/images/event-space.png" },
    { name: "window-display.png", path: "assets/demo-uploads/images/window-display.png" },
  ],
  Video: [
    { name: "staff-pick-loop.webm", path: "assets/demo-uploads/videos/staff-pick-loop.webm" },
    { name: "countdown-loop.webm", path: "assets/demo-uploads/videos/countdown-loop.webm" },
  ],
};
