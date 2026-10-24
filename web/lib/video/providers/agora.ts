// Agora video adapter — issues short-lived RTC tokens.
// Token TTL is the appointment window end; the channel name is set
// upstream by /api/video/token (typically `appt-${appointmentId}`).
//
// Note on roles: Agora's RTC role enum has PUBLISHER (can publish + subscribe)
// and SUBSCRIBER (subscribe only). For 1:1 telemed, BOTH parties must publish,
// so we always use PUBLISHER. The "host"/"participant" distinction in our type
// is for client-side UI labeling — Agora doesn't enforce admin rights via token.

import { RtcTokenBuilder, RtcRole } from "agora-token";
import type { VideoProvider, VideoToken, GenerateTokenInput } from "../types";
import { getAgoraEnv } from "../env";

export const agoraVideo: VideoProvider = {
  name: "agora",

  async generateToken({ channel, userId, role, expiresAt }: GenerateTokenInput): Promise<VideoToken> {
    const env = getAgoraEnv();

    // String UID (userAccount) — preserves human-readable identity.
    // Format: <role>-<userId>. Agora limits userAccount to 256 chars.
    const userAccount = `${role}-${userId}`;

    // Convert ms→s for Agora; build a token good until the appointment window ends.
    const expiresInSeconds = Math.max(60, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    const privilegeExpireTs = Math.floor(expiresAt.getTime() / 1000);

    const token = RtcTokenBuilder.buildTokenWithUserAccount(
      env.AGORA_APP_ID,
      env.AGORA_APP_CERTIFICATE,
      channel,
      userAccount,
      RtcRole.PUBLISHER,
      expiresInSeconds,
      privilegeExpireTs,
    );

    return {
      token,
      channel,
      appId: env.AGORA_APP_ID,
      uid: userAccount,
      expiresAt,
    };
  },
};
