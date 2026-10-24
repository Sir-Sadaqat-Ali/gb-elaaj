// Daily.co video adapter — placeholder for future swap.
// To activate: set VIDEO_PROVIDER=daily, DAILY_API_KEY, DAILY_DOMAIN.

import type { VideoProvider, VideoToken, GenerateTokenInput } from "../types";

export const dailyVideo: VideoProvider = {
  name: "daily",
  async generateToken(_: GenerateTokenInput): Promise<VideoToken> {
    throw new Error("Daily adapter not yet implemented. Use VIDEO_PROVIDER=agora or mock.");
  },
};
