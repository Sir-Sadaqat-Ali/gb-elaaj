import type { VideoProvider, VideoToken, GenerateTokenInput } from "../types";

export const mockVideo: VideoProvider = {
  name: "mock",

  async generateToken({ channel, userId, role, expiresAt }: GenerateTokenInput): Promise<VideoToken> {
    return {
      token: `mock_${role}_${userId}_${channel}`,
      channel,
      appId: "mock-app-id",
      uid: `${role}-${userId}`,
      expiresAt,
    };
  },
};
