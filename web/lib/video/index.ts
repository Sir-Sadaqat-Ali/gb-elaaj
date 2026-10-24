import type { VideoProvider } from "./types";
import { mockVideo } from "./providers/mock";
import { dailyVideo } from "./providers/daily";
import { agoraVideo } from "./providers/agora";

export type { VideoProvider, VideoToken, GenerateTokenInput } from "./types";

export function getVideoProvider(): VideoProvider {
  switch (process.env.VIDEO_PROVIDER) {
    case "agora": return agoraVideo;
    case "daily": return dailyVideo;
    case "mock":
    default:      return mockVideo;
  }
}
