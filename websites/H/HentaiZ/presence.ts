const presence = new Presence({
    clientId: "826391938542207018"
  }),
  strings = presence.getStrings({
    play: "presence.playback.playing",
    pause: "presence.playback.paused"
  });

let lastPlaybackState: boolean,
  lastPath: string,
  video = {
    duration: 0,
    currentTime: 0,
    paused: true
  },
  browsingTimestamp = Math.floor(Date.now() / 1000);

presence.on(
  "iFrameData",
  (data: { duration: number; currentTime: number; paused: boolean }) => {
    video = data;
  }
);

presence.on("UpdateData", async () => {
  const curPath = document.location.pathname,
    playback =
      video !== null && !isNaN(video.duration) && curPath.includes("/xem-phim"),
    presenceData: PresenceData = {
      largeImageKey: "logo"
    },
    { search } = document.location;

  if (lastPath !== curPath || lastPlaybackState !== playback) {
    lastPath = curPath;
    lastPlaybackState = playback;
    browsingTimestamp = Math.floor(Date.now() / 1000);
  }

  if (!playback) {
    if (curPath.includes("/login")) presenceData.details = "Đang đăng nhập";
    else if (search.startsWith("?s=")) {
      presenceData.details = "Đang tìm kiếm";
      presenceData.state = `Từ khoá: ${search.split("?s=")[1]}`;
    } else if (curPath.includes("/category")) {
      const title = document.querySelector("title");
      presenceData.details = "Đang tìm phim";
      [presenceData.state] = title.textContent.split(" - ");
    } else if (curPath.includes("/hentai-uncensored"))
      presenceData.details = "Đang tìm phim Uncensored";
    else if (curPath.includes("/completed-hentai"))
      presenceData.details = "Đang tìm phim đã hoàn thành";
    else if (curPath.includes("/trailer-hentai"))
      presenceData.details = "Đang tìm trailer";
    else if (curPath.includes("/favorite-hentai"))
      presenceData.details = "Đang tìm danh đã thích";
    else if (curPath.includes("/images-gallery"))
      presenceData.details = "Đang tìm ảnh";
    else {
      const title = document.querySelector(".anime-name>h1");
      presenceData.details = title ? title.textContent : "Đang ở trang chủ";
      if (title) presenceData.state = "Đang chọn tập";
    }

    if (!search.startsWith("?s=") && !curPath.includes("/category"))
      delete presenceData.state;

    presenceData.startTimestamp = browsingTimestamp;
    presence.setActivity(presenceData, false);
    return;
  }

  if (video && !isNaN(video.duration)) {
    presenceData.smallImageKey = video.paused ? "pause" : "play";
    presenceData.smallImageText = video.paused
      ? (await strings).pause
      : (await strings).play;
    [presenceData.startTimestamp, presenceData.endTimestamp] =
      presence.getTimestamps(
        Math.floor(video.currentTime),
        Math.floor(video.duration)
      );

    presenceData.details = `Đang xem: ${
      document.querySelector("h1").textContent
    }`;
    presenceData.state = document.querySelector("#nhasx").textContent;

    if (video.paused) {
      delete presenceData.startTimestamp;
      delete presenceData.endTimestamp;
    }
    presence.setActivity(presenceData, true);
  }
});
