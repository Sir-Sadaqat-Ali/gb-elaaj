// Video provider contract — same shape for Agora, Daily, mock.

export type VideoToken = {
  token: string;
  /** Channel / room identifier (Agora "channel name", Daily "room URL"). */
  channel: string;
  /**
   * Provider-specific app id the client needs to join. Public-safe.
   * For Agora, this is the App ID. For Daily, the URL contains it.
   */
  appId: string;
  /** Stable per-user identifier inside the channel. Used by client to label tiles. */
  uid: string;
  expiresAt: Date;
};

export type GenerateTokenInput = {
  /** Channel name to join. Convention: `appt-${appointmentId}` */
  channel: string;
  /** Caller's userId — server-side, for the user-account claim. */
  userId: string;
  /**
   * `host` = doctor (publisher with mute/kick rights, if provider supports)
   * `participant` = patient (publisher in 1:1 telemed, but no admin rights)
   */
  role: "host" | "participant";
  /** Token expiry — usually end of appointment window. */
  expiresAt: Date;
};

export interface VideoProvider {
  readonly name: string;
  generateToken(input: GenerateTokenInput): Promise<VideoToken>;
}
