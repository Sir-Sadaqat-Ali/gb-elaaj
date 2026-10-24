"use client";

import * as React from "react";
import { Mic, MicOff, Phone, Video, VideoOff, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

// Lazy-loaded only when the user actually opens the video page.
type AgoraRtc = typeof import("agora-rtc-sdk-ng").default;
type IAgoraRTCClient = import("agora-rtc-sdk-ng").IAgoraRTCClient;
type IMicrophoneAudioTrack = import("agora-rtc-sdk-ng").IMicrophoneAudioTrack;
type ICameraVideoTrack = import("agora-rtc-sdk-ng").ICameraVideoTrack;
type IRemoteVideoTrack = import("agora-rtc-sdk-ng").IRemoteVideoTrack;
type IRemoteAudioTrack = import("agora-rtc-sdk-ng").IRemoteAudioTrack;

type Props = {
  appointmentId: string;
  fallbackPeerName?: string;
  fallbackPeerImage?: string | null;
};

type Phase =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; appId: string; channel: string; token: string; uid: string; remoteName: string }
  | { kind: "joining" }
  | { kind: "in-call"; remoteJoined: boolean; remoteName: string };

export function VideoRoom({ appointmentId, fallbackPeerName, fallbackPeerImage }: Props) {
  const [phase, setPhase] = React.useState<Phase>({ kind: "idle" });
  const [micOn, setMicOn] = React.useState(true);
  const [camOn, setCamOn] = React.useState(true);
  const localVideoRef = React.useRef<HTMLDivElement | null>(null);
  const remoteVideoRef = React.useRef<HTMLDivElement | null>(null);
  const clientRef = React.useRef<IAgoraRTCClient | null>(null);
  const localAudioRef = React.useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = React.useRef<ICameraVideoTrack | null>(null);
  const agoraRef = React.useRef<AgoraRtc | null>(null);

  // ── Step 1: fetch token ─────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;
    async function fetchToken() {
      setPhase({ kind: "loading" });
      try {
        const resp = await fetch("/api/video/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointmentId }),
        });
        const json = await resp.json();
        if (cancelled) return;
        if (!resp.ok || !json.ok) {
          setPhase({ kind: "error", message: json.error ?? "Couldn't get a token for this consultation." });
          return;
        }
        setPhase({
          kind: "ready",
          appId: json.data.appId,
          channel: json.data.channel,
          token: json.data.token,
          uid: json.data.uid,
          remoteName: json.data.remoteName ?? fallbackPeerName ?? "Participant",
        });
      } catch (e) {
        if (cancelled) return;
        setPhase({ kind: "error", message: "Network error. Please refresh." });
      }
    }
    void fetchToken();
    return () => {
      cancelled = true;
    };
  }, [appointmentId, fallbackPeerName]);

  // ── Step 2: join channel + publish ─────────────────────────
  const join = React.useCallback(async () => {
    if (phase.kind !== "ready") return;
    setPhase({ kind: "joining" });
    try {
      const Agora = (await import("agora-rtc-sdk-ng")).default;
      agoraRef.current = Agora;
      const client = Agora.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      // Subscribe to remote streams as they appear.
      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "video" && remoteVideoRef.current) {
          (user.videoTrack as IRemoteVideoTrack)?.play(remoteVideoRef.current);
        }
        if (mediaType === "audio") {
          (user.audioTrack as IRemoteAudioTrack)?.play();
        }
        setPhase((p) => (p.kind === "in-call" ? { ...p, remoteJoined: true } : p));
      });
      client.on("user-unpublished", () => {
        setPhase((p) => (p.kind === "in-call" ? { ...p, remoteJoined: false } : p));
      });
      client.on("user-left", () => {
        setPhase((p) => (p.kind === "in-call" ? { ...p, remoteJoined: false } : p));
      });

      await client.join(phase.appId, phase.channel, phase.token, phase.uid);

      const mic = await Agora.createMicrophoneAudioTrack();
      const cam = await Agora.createCameraVideoTrack();
      localAudioRef.current = mic;
      localVideoTrackRef.current = cam;
      if (localVideoRef.current) cam.play(localVideoRef.current);
      await client.publish([mic, cam]);

      setPhase({ kind: "in-call", remoteJoined: false, remoteName: phase.remoteName });
    } catch (err) {
      console.error("[video] join failed:", err);
      const msg = err instanceof Error ? err.message : "Couldn't connect.";
      setPhase({
        kind: "error",
        message: msg.includes("permission") || msg.includes("Permission")
          ? "Camera/microphone access blocked. Allow permissions in your browser and refresh."
          : `Couldn't join the call: ${msg}`,
      });
    }
  }, [phase]);

  // ── Step 3: leave + cleanup ─────────────────────────────────
  const leave = React.useCallback(async () => {
    try {
      if (localAudioRef.current) {
        localAudioRef.current.stop();
        localAudioRef.current.close();
        localAudioRef.current = null;
      }
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current.removeAllListeners();
        clientRef.current = null;
      }
    } catch (e) {
      console.error("[video] leave error:", e);
    }
    setPhase({ kind: "idle" });
  }, []);

  // Auto-cleanup on unmount
  React.useEffect(() => {
    return () => {
      void leave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Toggle mic ──────────────────────────────────────────────
  function toggleMic() {
    if (localAudioRef.current) {
      const next = !micOn;
      void localAudioRef.current.setEnabled(next);
      setMicOn(next);
    }
  }
  function toggleCam() {
    if (localVideoTrackRef.current) {
      const next = !camOn;
      void localVideoTrackRef.current.setEnabled(next);
      setCamOn(next);
    }
  }

  // ── Render ──────────────────────────────────────────────────
  if (phase.kind === "loading" || phase.kind === "idle") {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-lg bg-ge-soft-bg">
        <Loader2 className="h-6 w-6 animate-spin text-ge-primary" />
      </div>
    );
  }
  if (phase.kind === "error") {
    return (
      <div className="flex aspect-[16/9] flex-col items-center justify-center gap-3 rounded-lg border border-ge-danger/40 bg-ge-danger/5 p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-ge-danger" />
        <p className="text-[14px] font-medium text-ge-ink">{phase.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Remote video — main stage */}
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg" style={{ background: "linear-gradient(135deg,#062A4F 0%,#0B84FE 100%)" }}>
        <div ref={remoteVideoRef} className="absolute inset-0" />
        {phase.kind === "in-call" && !phase.remoteJoined && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
            <Avatar src={fallbackPeerImage ?? null} name={phase.remoteName} size={88} className="bg-white/15" />
            <div className="text-[14px] font-medium">Waiting for {phase.remoteName} to join…</div>
          </div>
        )}
        {/* Live badge */}
        <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
          <span className="mr-1 text-[color:var(--ge-success)]">●</span>
          {phase.kind === "in-call" ? (phase.remoteJoined ? "Live" : "Connected · waiting") : "Joining…"}
        </span>

        {/* Local video PiP */}
        <div className="absolute bottom-3 right-3 h-28 w-40 overflow-hidden rounded-md border-2 border-white/30 bg-black">
          <div ref={localVideoRef} className="h-full w-full" />
        </div>

        {/* Controls */}
        <div className="absolute bottom-3 left-3 flex gap-2">
          {phase.kind === "ready" ? (
            <Button onClick={join} className="bg-ge-success hover:bg-ge-success/90">
              <Phone className="h-4 w-4" /> Join now
            </Button>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleMic}
                aria-pressed={!micOn}
                aria-label={micOn ? "Mute mic" : "Unmute mic"}
                className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur ${micOn ? "bg-white/15 text-white" : "bg-ge-danger text-white"}`}
              >
                {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={toggleCam}
                aria-pressed={!camOn}
                aria-label={camOn ? "Turn off camera" : "Turn on camera"}
                className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur ${camOn ? "bg-white/15 text-white" : "bg-ge-danger text-white"}`}
              >
                {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={leave}
                aria-label="Leave call"
                className="flex h-9 items-center gap-1.5 rounded-full bg-ge-danger px-3 text-white"
              >
                <Phone className="h-4 w-4 rotate-[135deg]" /> <span className="text-[12px] font-medium">Leave</span>
              </button>
            </>
          )}
        </div>
      </div>

      <p className="text-[11.5px] text-ge-muted">
        Channel <code className="ge-mono">{phase.kind === "ready" || phase.kind === "in-call" ? "active" : "—"}</code> ·
        End-to-end via Agora · Token expires at end of appointment window.
      </p>
    </div>
  );
}
