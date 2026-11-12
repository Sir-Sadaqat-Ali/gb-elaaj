import type { VideoProvider } from "./types";
import { mockVideo } from "./providers/mock";
import { dailyVideo } from "./providers/daily";
import { agoraVideo } from "./providers/agora";

export type { VideoProvider, VideoToken, GenerateTokenInput } from "./types";

export function getVideoProvider(): VideoProvider {
  const provider = (process.env.VIDEO_PROVIDER || "").toLowerCase().trim();
  switch (provider) {
    case "mock":
      return mockVideo;
    case "daily":
      return dailyVideo;
    case "agora":
    default:
      return agoraVideo;
  }
}
