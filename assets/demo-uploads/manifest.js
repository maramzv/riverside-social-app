// Lists the files that live in assets/demo-uploads/images and .../videos, for the
// in-app "choose a file" dialog. This app is a static site with no server, so it can't
// list a folder's contents at runtime — add an entry here whenever you drop in a new
// file, or it won't show up in the picker.
export const DEMO_UPLOADS = {
  Photo: [
    { name: "shelf-flatlay.png", path: "assets/demo-uploads/images/shelf-flatlay.png" },
    {
      name: "pexels-esra-afsar-123882149-18132694.jpg",
      path: "assets/demo-uploads/images/pexels-esra-afsar-123882149-18132694.jpg",
    },
    { name: "pexels-yunustug-29589095.jpg", path: "assets/demo-uploads/images/pexels-yunustug-29589095.jpg" },
  ],
  Video: [
    { name: "staff-pick-loop.webm", path: "assets/demo-uploads/videos/staff-pick-loop.webm" },
    { name: "countdown-loop.webm", path: "assets/demo-uploads/videos/countdown-loop.webm" },
    { name: "12129507_2160_3840_30fps.mp4", path: "assets/demo-uploads/videos/12129507_2160_3840_30fps.mp4" },
    { name: "13324114-uhd_2160_3840_24fps.mp4", path: "assets/demo-uploads/videos/13324114-uhd_2160_3840_24fps.mp4" },
    { name: "13690752_1920_1080_100fps.mp4", path: "assets/demo-uploads/videos/13690752_1920_1080_100fps.mp4" },
    { name: "14762878_1080_1920_30fps.mp4", path: "assets/demo-uploads/videos/14762878_1080_1920_30fps.mp4" },
    { name: "6598853-hd_1080_1920_25fps.mp4", path: "assets/demo-uploads/videos/6598853-hd_1080_1920_25fps.mp4" },
    { name: "8419552-hd_1920_1080_30fps.mp4", path: "assets/demo-uploads/videos/8419552-hd_1920_1080_30fps.mp4" },
  ],
};
