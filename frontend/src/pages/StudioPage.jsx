import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";

import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useMode } from "../context/ModeContext";
import { Container } from "../layouts/Container";
import { useLearningStore } from "../store/useLearningStore";
import { deleteAssetBlob, getAssetBlob, readProjectMeta, saveAssetBlob, writeProjectMeta } from "../utils/studioStorage";

const VIDEO_FILTERS = {
  mature: [
    { name: "Cinematic", value: "contrast(1.1) saturate(1.05)" },
    { name: "Golden Hour", value: "sepia(0.28) saturate(1.2) brightness(1.06)" },
    { name: "Soft Matte", value: "contrast(0.92) brightness(1.08) saturate(0.9)" },
    { name: "Frosted Blue", value: "hue-rotate(16deg) saturate(1.05) brightness(1.04)" },
    { name: "Film Grain", value: "contrast(1.15) saturate(0.92)" },
    { name: "Neon Pop", value: "saturate(1.5) contrast(1.14)" },
    { name: "Desaturated Drama", value: "saturate(0.65) contrast(1.22)" },
    { name: "Sepia Fade", value: "sepia(0.45) saturate(0.86)" },
    { name: "Travis", value: "hue-rotate(-12deg) saturate(1.35) contrast(1.14)" },
    { name: "Weeknd", value: "contrast(1.2) saturate(1.2) brightness(0.95)" },
    { name: "Billie", value: "hue-rotate(35deg) saturate(0.95) brightness(0.98)" },
    { name: "Dua Pop", value: "saturate(1.42) brightness(1.08)" },
    { name: "Drake Warm", value: "sepia(0.2) saturate(1.22) hue-rotate(-6deg)" },
    { name: "Kanye Contrast", value: "contrast(1.35) saturate(1.05)" },
    { name: "Indie Ocean", value: "hue-rotate(28deg) saturate(1.06) brightness(1.02)" },
    { name: "Retro Album", value: "sepia(0.35) contrast(0.94) saturate(0.82)" }
  ],
  kids: [
    { name: "Comic Book", value: "contrast(1.35) saturate(1.4) brightness(1.06)" },
    { name: "Flat Cartoon", value: "contrast(1.22) saturate(1.18)" },
    { name: "Anime Soft", value: "brightness(1.1) saturate(1.22)" },
    { name: "Anime Neon", value: "hue-rotate(-12deg) saturate(1.62) contrast(1.16)" },
    { name: "Sketch", value: "grayscale(1) contrast(1.24)" },
    { name: "Manga", value: "grayscale(0.85) contrast(1.34)" },
    { name: "Chibi Tone", value: "saturate(1.4) brightness(1.12) hue-rotate(10deg)" }
  ]
};

const AUDIO_EFFECTS = {
  mature: [
    "Trap Reverb",
    "Ocean Delay",
    "Vinyl Warmth",
    "Hyper Pop",
    "Lo-Fi Chill",
    "Studio Clarity",
    "Space Echo",
    "Bass Punch"
  ],
  kids: [
    "Chipmunk",
    "Monster",
    "Walkie-Talkie",
    "Robot",
    "Auto-Tune Fail",
    "Echo Spam",
    "Baby Voice",
    "Toilet Reverb",
    "8-Bit"
  ]
};

const EXPORT_PRESETS = ["YouTube", "Reels", "Podcast"];

const DAW_LIBRARY = [
  { id: "drum-loop-1", category: "Drum Loops", label: "Drum Loop A", pitch: 160, color: "#f59e0b" },
  { id: "drum-loop-2", category: "Drum Loops", label: "Drum Loop B", pitch: 220, color: "#facc15" },
  { id: "chord-loop-1", category: "Chord Loops", label: "Chord Loop Cmaj", pitch: 262, color: "#fb923c" },
  { id: "chord-loop-2", category: "Chord Loops", label: "Chord Loop Gmaj", pitch: 196, color: "#fdba74" },
  { id: "bass-loop-1", category: "Bass Loops", label: "Bass Pulse", pitch: 110, color: "#fbbf24" },
  { id: "bass-loop-2", category: "Bass Loops", label: "Bass Glide", pitch: 98, color: "#f59e0b" },
  { id: "ambient-loop-1", category: "Ambient Sounds", label: "Ambient Air", pitch: 320, color: "#94a3b8" },
  { id: "ambient-loop-2", category: "Ambient Sounds", label: "Ambient Wave", pitch: 360, color: "#cbd5e1" }
];

const DAW_BEAT_WIDTH = 26;
const DAW_MAX_SECONDS = 180;
const DAW_STORAGE_KEY = "strumify_daw_state_v1";

const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const readDawState = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DAW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const persistDawState = (state) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DAW_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Unable to persist DAW state", error);
  }
};

const getAudioContextClass = () => {
  if (typeof window === "undefined") return null;
  return window.AudioContext || window.webkitAudioContext || null;
};

const hasMediaSupport = () => typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);

const isSecureMediaContext = () => {
  if (typeof window === "undefined") return true;
  if (window.isSecureContext) return true;
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
};

const pickRecorderMime = (kind = "audio") => {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") return "";

  const candidates =
    kind === "video"
      ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]
      : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

  return candidates.find((item) => MediaRecorder.isTypeSupported(item)) || "";
};

const formatTime = (seconds = 0) => {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${mins}:${secs}`;
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};

const createDistortionCurve = (amount = 24) => {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const degree = Math.PI / 180;

  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * degree) / (Math.PI + amount * Math.abs(x));
  }

  return curve;
};

const audioBufferToWavBlob = (audioBuffer) => {
  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  const bytesPerSample = 2;
  const dataSize = length * bytesPerSample;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i += 1) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  const channelsData = Array.from({ length: channels }, (_, index) => audioBuffer.getChannelData(index));
  let offset = 44;

  for (let i = 0; i < length; i += 1) {
    let sample = 0;
    for (let channel = 0; channel < channels; channel += 1) {
      sample += channelsData[channel][i] || 0;
    }
    sample /= channels || 1;
    sample = Math.max(-1, Math.min(1, sample));

    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
};

const trimSilenceFromBlob = async (blob, threshold = 0.02) => {
  const AudioContextClass = getAudioContextClass();
  if (!AudioContextClass) return blob;

  const context = new AudioContextClass();
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const decoded = await context.decodeAudioData(arrayBuffer.slice(0));

    const channel = decoded.getChannelData(0);
    let start = 0;
    let end = channel.length - 1;

    while (start < channel.length && Math.abs(channel[start]) < threshold) start += 1;
    while (end > start && Math.abs(channel[end]) < threshold) end -= 1;

    const length = Math.max(1, end - start + 1);
    const trimmed = context.createBuffer(decoded.numberOfChannels, length, decoded.sampleRate);

    for (let c = 0; c < decoded.numberOfChannels; c += 1) {
      const source = decoded.getChannelData(c);
      const target = trimmed.getChannelData(c);
      target.set(source.slice(start, end + 1));
    }

    return audioBufferToWavBlob(trimmed);
  } catch (error) {
    console.error("Silence removal failed", error);
    return blob;
  } finally {
    context.close().catch(() => {});
  }
};

const enhanceVoiceBlob = async (blob) => {
  const AudioContextClass = getAudioContextClass();
  if (!AudioContextClass) return blob;

  const sourceContext = new AudioContextClass();
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const decoded = await sourceContext.decodeAudioData(arrayBuffer.slice(0));

    const offline = new OfflineAudioContext(decoded.numberOfChannels, decoded.length, decoded.sampleRate);
    const source = offline.createBufferSource();
    source.buffer = decoded;

    const highPass = offline.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.value = 90;

    const compressor = offline.createDynamicsCompressor();
    compressor.threshold.value = -22;
    compressor.knee.value = 18;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.008;
    compressor.release.value = 0.22;

    const presence = offline.createBiquadFilter();
    presence.type = "peaking";
    presence.frequency.value = 3200;
    presence.gain.value = 3;

    source.connect(highPass);
    highPass.connect(compressor);
    compressor.connect(presence);
    presence.connect(offline.destination);
    source.start();

    const rendered = await offline.startRendering();
    return audioBufferToWavBlob(rendered);
  } catch (error) {
    console.error("Voice enhancement failed", error);
    return blob;
  } finally {
    sourceContext.close().catch(() => {});
  }
};

const applyAudioPlaybackEffect = ({ context, source, effectName, mode, reverbAmount, delayAmount, gainAmount, trimAmount }) => {
  const gainNode = context.createGain();
  gainNode.gain.value = Math.max(0, gainAmount + trimAmount);

  const delayNode = context.createDelay();
  delayNode.delayTime.value = Math.max(0, delayAmount * 0.45);
  const delayFeedback = context.createGain();
  delayFeedback.gain.value = Math.min(0.7, delayAmount * 0.65);

  delayNode.connect(delayFeedback);
  delayFeedback.connect(delayNode);

  const reverbDelay = context.createDelay();
  reverbDelay.delayTime.value = Math.max(0.03, reverbAmount * 0.16);
  const reverbGain = context.createGain();
  reverbGain.gain.value = Math.min(0.55, reverbAmount * 0.5);
  reverbDelay.connect(reverbGain);
  reverbGain.connect(reverbDelay);

  const directOut = context.createGain();
  directOut.gain.value = 1;

  source.connect(gainNode);
  gainNode.connect(directOut);

  const shaper = context.createWaveShaper();
  shaper.curve = createDistortionCurve(24);
  shaper.oversample = "4x";

  const highPass = context.createBiquadFilter();
  highPass.type = "highpass";
  highPass.frequency.value = 260;

  const lowPass = context.createBiquadFilter();
  lowPass.type = "lowpass";
  lowPass.frequency.value = 2500;

  switch (effectName) {
    case "Trap Reverb":
    case "Toilet Reverb":
      gainNode.connect(reverbDelay);
      reverbDelay.connect(directOut);
      break;
    case "Ocean Delay":
    case "Echo Spam":
      gainNode.connect(delayNode);
      delayNode.connect(directOut);
      break;
    case "Space Echo":
      gainNode.connect(delayNode);
      delayNode.connect(reverbDelay);
      reverbDelay.connect(directOut);
      break;
    case "Vinyl Warmth":
    case "Lo-Fi Chill": {
      const lp = context.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1400;
      gainNode.connect(lp);
      lp.connect(directOut);
      break;
    }
    case "Studio Clarity":
    case "Walkie-Talkie":
      gainNode.connect(highPass);
      highPass.connect(lowPass);
      lowPass.connect(directOut);
      break;
    case "Hyper Pop":
    case "Chipmunk":
    case "Baby Voice":
      source.playbackRate.value = mode === "kids" ? 1.45 : 1.2;
      break;
    case "Bass Punch": {
      const shelf = context.createBiquadFilter();
      shelf.type = "lowshelf";
      shelf.frequency.value = 220;
      shelf.gain.value = 8;
      gainNode.connect(shelf);
      shelf.connect(directOut);
      break;
    }
    case "Monster":
      source.playbackRate.value = 0.72;
      gainNode.connect(shaper);
      shaper.connect(directOut);
      break;
    case "Robot":
    case "8-Bit":
      gainNode.connect(shaper);
      shaper.connect(lowPass);
      lowPass.connect(directOut);
      break;
    case "Auto-Tune Fail":
      source.playbackRate.value = 1.16;
      gainNode.connect(delayNode);
      delayNode.connect(directOut);
      break;
    default:
      break;
  }

  directOut.connect(context.destination);
};

const createThumbnailFromCanvas = (canvas) => {
  try {
    return canvas.toDataURL("image/jpeg", 0.8);
  } catch {
    return "";
  }
};

const TransportButton = ({ onClick, children, active = false, tone = "mature" }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-lg px-3 py-2 text-xs font-semibold transition hover:scale-[1.03] ${
      active
        ? tone === "kids"
          ? "bg-[#65b7c8] text-[#082027]"
          : "bg-[#f59e0b] text-[#1a1206]"
        : "border border-white/15 bg-[#111111] text-gray-200 hover:border-white/30"
    }`}
  >
    {children}
  </button>
);

const DEFAULT_DAW_TRACKS = [
  {
    id: "track-rhythm",
    name: "Rhythm",
    clips: [
      { id: "clip-r1", label: "Loop A", start: 0, duration: 4, color: "#f59e0b", pitch: 180 },
      { id: "clip-r2", label: "Loop B", start: 8, duration: 4, color: "#facc15", pitch: 220 }
    ],
    volume: 0.8,
    pan: 0
  },
  {
    id: "track-lead",
    name: "Lead",
    clips: [{ id: "clip-l1", label: "Lead", start: 4, duration: 4, color: "#fb923c", pitch: 280 }],
    volume: 0.7,
    pan: 0
  },
  { id: "track-fx", name: "FX", clips: [], volume: 0.65, pan: 0 }
];

const sanitizeStoredDawTracks = (value) => {
  if (!Array.isArray(value) || value.length === 0) return DEFAULT_DAW_TRACKS;

  return value.map((track, index) => ({
    id: typeof track?.id === "string" ? track.id : `track-${index + 1}`,
    name: typeof track?.name === "string" ? track.name : `Track ${index + 1}`,
    clips: Array.isArray(track?.clips)
      ? track.clips.map((clip, clipIndex) => ({
          id: typeof clip?.id === "string" ? clip.id : `clip-${index + 1}-${clipIndex + 1}`,
          label: typeof clip?.label === "string" ? clip.label : "Clip",
          start: Number.isFinite(clip?.start) ? clip.start : 0,
          duration: Number.isFinite(clip?.duration) ? clip.duration : 1,
          color: typeof clip?.color === "string" ? clip.color : "#f59e0b",
          pitch: Number.isFinite(clip?.pitch) ? clip.pitch : 220,
          type: clip?.type === "audio" ? "audio" : "tone",
          assetId: typeof clip?.assetId === "string" ? clip.assetId : "",
          buffer: clip?.buffer || null
        }))
      : [],
    volume: Number.isFinite(track?.volume) ? track.volume : 0.7,
    pan: Number.isFinite(track?.pan) ? track.pan : 0
  }));
};

const ComposerDaw = ({ mode }) => {
  const storedDaw = useMemo(() => readDawState(), []);

  const [tracks, setTracks] = useState(() => sanitizeStoredDawTracks(storedDaw?.tracks));
  const [selectedTrackId, setSelectedTrackId] = useState(() =>
    typeof storedDaw?.selectedTrackId === "string" ? storedDaw.selectedTrackId : "track-rhythm"
  );
  const [bpm, setBpm] = useState(() => (Number.isFinite(storedDaw?.bpm) ? storedDaw.bpm : 96));
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadBeat, setPlayheadBeat] = useState(() => (Number.isFinite(storedDaw?.playheadBeat) ? storedDaw.playheadBeat : 0));
  const [loopEnabled, setLoopEnabled] = useState(() => Boolean(storedDaw?.loopEnabled));
  const [loopStart, setLoopStart] = useState(() => (Number.isFinite(storedDaw?.loopStart) ? storedDaw.loopStart : 0));
  const [loopEnd, setLoopEnd] = useState(() => (Number.isFinite(storedDaw?.loopEnd) ? storedDaw.loopEnd : 16));
  const [snapToGrid, setSnapToGrid] = useState(() => (typeof storedDaw?.snapToGrid === "boolean" ? storedDaw.snapToGrid : true));

  const [effects, setEffects] = useState(() =>
    storedDaw?.effects && typeof storedDaw.effects === "object"
      ? storedDaw.effects
      : { reverb: 20, delay: 18, eq: 50, compressor: 35 }
  );
  const [recordArmed, setRecordArmed] = useState(false);
  const [recordingTake, setRecordingTake] = useState(false);
  const [recordError, setRecordError] = useState("");

  const timelineRef = useRef(null);
  const dragState = useRef(null);
  const startPerfRef = useRef(0);
  const startBeatRef = useRef(0);
  const prevBeatRef = useRef(0);
  const playedSetRef = useRef(new Set());
  const rafRef = useRef(null);

  const audioContextRef = useRef(null);
  const inputNodeRef = useRef(null);
  const eqNodeRef = useRef(null);
  const compNodeRef = useRef(null);
  const delayNodeRef = useRef(null);
  const delayFeedbackRef = useRef(null);
  const reverbNodeRef = useRef(null);
  const reverbFeedbackRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const recordingRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingStartedAtBeatRef = useRef(0);
  const loadingAssetsRef = useRef(new Set());

  const selectedTrack = tracks.find((track) => track.id === selectedTrackId) || tracks[0];
  const maxBeats = Math.max(16, Math.round((DAW_MAX_SECONDS * bpm) / 60));
  const libraryByCategory = useMemo(() => {
    return DAW_LIBRARY.reduce((acc, item) => {
      const key = item.category || "Library";
      acc[key] = [...(acc[key] || []), item];
      return acc;
    }, {});
  }, []);

  const setupAudioEngine = () => {
    if (audioContextRef.current) return;

    const AudioContextClass = getAudioContextClass();
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const input = context.createGain();
    const eq = context.createBiquadFilter();
    eq.type = "peaking";
    eq.frequency.value = 1000;
    eq.Q.value = 1;

    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.ratio.value = 3;

    const delay = context.createDelay();
    const feedback = context.createGain();

    const reverbDelay = context.createDelay();
    const reverbFeedback = context.createGain();

    input.connect(eq);
    eq.connect(compressor);
    compressor.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);

    compressor.connect(reverbDelay);
    reverbDelay.connect(reverbFeedback);
    reverbFeedback.connect(reverbDelay);

    delay.connect(context.destination);
    reverbDelay.connect(context.destination);
    compressor.connect(context.destination);

    audioContextRef.current = context;
    inputNodeRef.current = input;
    eqNodeRef.current = eq;
    compNodeRef.current = compressor;
    delayNodeRef.current = delay;
    delayFeedbackRef.current = feedback;
    reverbNodeRef.current = reverbDelay;
    reverbFeedbackRef.current = reverbFeedback;
  };

  useEffect(() => {
    setupAudioEngine();

    return () => {
      stopTrackRecording();
      if (rafRef.current && typeof window !== "undefined") {
        window.cancelAnimationFrame(rafRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (!eqNodeRef.current || !compNodeRef.current || !delayNodeRef.current || !delayFeedbackRef.current || !reverbNodeRef.current || !reverbFeedbackRef.current) return;

    eqNodeRef.current.gain.value = (effects.eq - 50) * 0.18;

    compNodeRef.current.threshold.value = -30 + effects.compressor * 0.2;
    compNodeRef.current.ratio.value = 2 + effects.compressor * 0.05;

    delayNodeRef.current.delayTime.value = effects.delay / 100;
    delayFeedbackRef.current.gain.value = Math.min(0.65, effects.delay / 120);

    reverbNodeRef.current.delayTime.value = 0.03 + effects.reverb / 220;
    reverbFeedbackRef.current.gain.value = Math.min(0.52, effects.reverb / 150);
  }, [effects]);

  useEffect(() => {
    setLoopStart((current) => Math.max(0, Math.min(current, maxBeats - 1)));
    setLoopEnd((current) => Math.max(1, Math.min(current, maxBeats)));
    setPlayheadBeat((current) => Math.max(0, Math.min(current, maxBeats)));
  }, [maxBeats]);

  useEffect(() => {
    const serializableTracks = tracks.map((track) => ({
      ...track,
      clips: Array.isArray(track.clips)
        ? track.clips.map((clip) => ({
            ...clip,
            buffer: null
          }))
        : []
    }));

    persistDawState({
      tracks: serializableTracks,
      selectedTrackId,
      bpm,
      playheadBeat,
      loopEnabled,
      loopStart,
      loopEnd,
      snapToGrid,
      effects
    });
  }, [tracks, selectedTrackId, bpm, playheadBeat, loopEnabled, loopStart, loopEnd, snapToGrid, effects]);

  useEffect(() => {
    let cancelled = false;

    const clipsToHydrate = [];
    tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        if (clip.type !== "audio" || clip.buffer || !clip.assetId) return;
        if (loadingAssetsRef.current.has(clip.assetId)) return;
        clipsToHydrate.push({ trackId: track.id, clipId: clip.id, assetId: clip.assetId });
      });
    });

    if (clipsToHydrate.length === 0) return undefined;

    const loadBuffers = async () => {
      const AudioContextClass = getAudioContextClass();
      if (!AudioContextClass) return;

      const tempContext = !audioContextRef.current;
      const context = audioContextRef.current || new AudioContextClass();
      const decodedMap = new Map();

      try {
        await Promise.all(
          clipsToHydrate.map(async (item) => {
            loadingAssetsRef.current.add(item.assetId);
            try {
              const blob = await getAssetBlob(item.assetId);
              if (!blob) return;
              const buffer = await context.decodeAudioData((await blob.arrayBuffer()).slice(0));
              decodedMap.set(item.assetId, buffer);
            } catch (error) {
              console.error("Unable to hydrate DAW clip", error);
            } finally {
              loadingAssetsRef.current.delete(item.assetId);
            }
          })
        );
      } finally {
        if (tempContext) {
          context.close().catch(() => {});
        }
      }

      if (cancelled || decodedMap.size === 0) return;

      setTracks((current) =>
        current.map((track) => ({
          ...track,
          clips: track.clips.map((clip) =>
            clip.type === "audio" && !clip.buffer && clip.assetId && decodedMap.has(clip.assetId)
              ? { ...clip, buffer: decodedMap.get(clip.assetId) }
              : clip
          )
        }))
      );
    };

    loadBuffers();

    return () => {
      cancelled = true;
    };
  }, [tracks]);

  const snap = (value) => {
    if (!snapToGrid) return Math.max(0, value);
    return Math.max(0, Math.round(value * 4) / 4);
  };

  const triggerClip = (track, clip) => {
    if (!audioContextRef.current || !inputNodeRef.current) return;

    const context = audioContextRef.current;
    const gain = context.createGain();
    const panner = typeof context.createStereoPanner === "function" ? context.createStereoPanner() : null;
    gain.gain.value = Math.max(0.02, track.volume * 0.08);

    if (panner) {
      panner.pan.value = track.pan;
      gain.connect(panner);
      panner.connect(inputNodeRef.current);
    } else {
      gain.connect(inputNodeRef.current);
    }

    if (clip.type === "audio" && clip.buffer) {
      const source = context.createBufferSource();
      source.buffer = clip.buffer;
      source.connect(gain);
      source.start();
      return;
    }

    const oscillator = context.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.value = clip.pitch;

    const durationSeconds = (clip.duration * 60) / bpm;
    oscillator.connect(gain);
    oscillator.start();
    oscillator.stop(context.currentTime + durationSeconds);
  };

  const animationLoop = (now) => {
    const elapsedSeconds = (now - startPerfRef.current) / 1000;
    let nextBeat = startBeatRef.current + (elapsedSeconds * bpm) / 60;

    if (loopEnabled && nextBeat >= loopEnd) {
      nextBeat = loopStart;
      startPerfRef.current = now;
      startBeatRef.current = loopStart;
      playedSetRef.current = new Set();
    }

    if (!loopEnabled && nextBeat >= maxBeats) {
      setIsPlaying(false);
      setPlayheadBeat(maxBeats);
      stopTrackRecording();
      return;
    }

    if (nextBeat < prevBeatRef.current) {
      playedSetRef.current = new Set();
    }

    tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        const key = `${track.id}-${clip.id}-${Math.floor(nextBeat * 4)}`;
        if (nextBeat >= clip.start && !playedSetRef.current.has(key) && nextBeat < clip.start + 0.25) {
          triggerClip(track, clip);
          playedSetRef.current.add(key);
        }
      });
    });

    prevBeatRef.current = nextBeat;
    setPlayheadBeat(nextBeat);
    rafRef.current = window.requestAnimationFrame(animationLoop);
  };

  const play = () => {
    setupAudioEngine();
    setIsPlaying(true);
    startPerfRef.current = performance.now();
    startBeatRef.current = playheadBeat;
    prevBeatRef.current = playheadBeat;
    playedSetRef.current = new Set();
    rafRef.current = window.requestAnimationFrame(animationLoop);
    if (recordArmed) {
      startTrackRecording();
    }
  };

  const stop = () => {
    setIsPlaying(false);
    if (rafRef.current && typeof window !== "undefined") {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    stopTrackRecording();
  };

  useEffect(() => {
    if (!isPlaying) return;
    return () => {
      if (rafRef.current && typeof window !== "undefined") {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    const onMouseMove = (event) => {
      if (!dragState.current) return;

      const dx = event.clientX - dragState.current.startX;
      const deltaBeat = dx / DAW_BEAT_WIDTH;

      setTracks((current) =>
        current.map((track) => {
          if (track.id !== dragState.current.trackId) return track;

          const clips = track.clips.map((clip) => {
            if (clip.id !== dragState.current.clipId) return clip;

            if (dragState.current.type === "move") {
              return {
                ...clip,
                start: snap(Math.min(maxBeats - clip.duration, dragState.current.originStart + deltaBeat))
              };
            }

            const nextDuration = Math.max(0.25, snap(dragState.current.originDuration + deltaBeat));
            return {
              ...clip,
              duration: Math.min(Math.max(0.25, maxBeats - clip.start), nextDuration)
            };
          });

          return { ...track, clips };
        })
      );
    };

    const onMouseUp = () => {
      dragState.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [snapToGrid, maxBeats]);

  const addTrack = () => {
    const id = `track-${createId()}`;
    setTracks((current) => [...current, { id, name: `Track ${current.length + 1}`, clips: [], volume: 0.7, pan: 0 }]);
    setSelectedTrackId(id);
  };

  const addClipFromLibrary = (asset) => {
    if (!selectedTrack) return;
    const id = `clip-${createId()}`;
    const start = snap(Math.min(playheadBeat, maxBeats - 0.5));
    const duration = Math.max(0.5, Math.min(4, maxBeats - start));

    setTracks((current) =>
      current.map((track) => {
        if (track.id !== selectedTrack.id) return track;

        return {
          ...track,
          clips: [
            ...track.clips,
            {
              id,
              label: asset.label,
              start,
              duration,
              color: asset.color,
              pitch: asset.pitch,
              type: "tone",
              assetId: "",
              buffer: null
            }
          ]
        };
      })
    );
  };

  const updateMixer = (trackId, field, value) => {
    setTracks((current) =>
      current.map((track) =>
        track.id === trackId
          ? {
              ...track,
              [field]: value
            }
          : track
      )
    );
  };

  const stopTrackRecording = () => {
    if (recordingRecorderRef.current && recordingRecorderRef.current.state !== "inactive") {
      recordingRecorderRef.current.stop();
    }
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
    }
    setRecordingTake(false);
  };

  const armTrackRecording = () => {
    setRecordArmed((prev) => !prev);
    setRecordError("");
  };

  const startTrackRecording = async () => {
    if (!recordArmed || !isPlaying) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setRecordError("Microphone capture is not available in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      recordingStreamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recordingRecorderRef.current = recorder;
      recordingChunksRef.current = [];
      recordingStartedAtBeatRef.current = playheadBeat;
      setRecordingTake(true);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        try {
          const blob = new Blob(recordingChunksRef.current, { type: "audio/webm" });
          const AudioContextClass = getAudioContextClass();
          if (!AudioContextClass) return;
          const clipAssetId = `daw-asset-${createId()}`;
          await saveAssetBlob(clipAssetId, blob);

          const tempContext = !audioContextRef.current;
          const context = audioContextRef.current || new AudioContextClass();
          const decoded = await context.decodeAudioData((await blob.arrayBuffer()).slice(0));
          const durationBeats = Math.max(0.5, (decoded.duration * bpm) / 60);
          const trackId = selectedTrack?.id || tracks[0]?.id;

          if (!trackId) return;

          setTracks((current) =>
            current.map((track) => {
              if (track.id !== trackId) return track;
              return {
                ...track,
                clips: [
                  ...track.clips,
                  {
                    id: `clip-${createId()}`,
                    label: "Mic Take",
                    start: snap(recordingStartedAtBeatRef.current),
                    duration: durationBeats,
                    color: "#60a5fa",
                    pitch: 220,
                    type: "audio",
                    assetId: clipAssetId,
                    buffer: decoded
                  }
                ]
              };
            })
          );
          if (tempContext) {
            context.close().catch(() => {});
          }
        } catch (error) {
          console.error("Unable to create recorded clip", error);
          setRecordError("Unable to add recorded clip to timeline.");
        }
      };

      recorder.start();
    } catch (error) {
      console.error("Unable to start track recording", error);
      setRecordError("Microphone permission denied. Cannot record over tracks.");
      stopTrackRecording();
    }
  };

  return (
    <Card mode={mode} className="p-0">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <TransportButton onClick={play} active={isPlaying} tone={mode}>Play</TransportButton>
          <TransportButton onClick={stop} tone={mode}>Stop</TransportButton>
          <TransportButton onClick={armTrackRecording} tone={mode} active={recordArmed}>
            Arm Record
          </TransportButton>

          <label className="ml-2 inline-flex items-center gap-2 text-xs text-gray-300">
            BPM
            <input
              type="number"
              min={50}
              max={200}
              value={bpm}
              onChange={(event) => setBpm(Math.max(50, Math.min(200, Number(event.target.value) || 50)))}
              className="w-16 rounded border border-white/20 bg-[#0f0f0f] px-2 py-1 text-xs"
            />
          </label>

          <label className="inline-flex items-center gap-2 text-xs text-gray-300">
            <input type="checkbox" checked={loopEnabled} onChange={(event) => setLoopEnabled(event.target.checked)} />
            Loop
          </label>

          <label className="inline-flex items-center gap-1 text-xs text-gray-300">
            Start
            <input
              type="number"
              min={0}
              max={maxBeats - 1}
              value={loopStart}
              onChange={(event) => setLoopStart(Math.max(0, Math.min(maxBeats - 1, Number(event.target.value) || 0)))}
              className="w-14 rounded border border-white/20 bg-[#0f0f0f] px-2 py-1 text-xs"
            />
          </label>

          <label className="inline-flex items-center gap-1 text-xs text-gray-300">
            End
            <input
              type="number"
              min={1}
              max={maxBeats}
              value={loopEnd}
              onChange={(event) => setLoopEnd(Math.max(1, Math.min(maxBeats, Number(event.target.value) || 1)))}
              className="w-14 rounded border border-white/20 bg-[#0f0f0f] px-2 py-1 text-xs"
            />
          </label>

          <label className="inline-flex items-center gap-2 text-xs text-gray-300">
            <input type="checkbox" checked={snapToGrid} onChange={(event) => setSnapToGrid(event.target.checked)} />
            Snap
          </label>

          <span className="ml-auto text-xs text-gray-300">Playhead: {playheadBeat.toFixed(2)} / {maxBeats} beats</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
          <span>Composition limit: 3 minutes</span>
          {recordArmed ? <span className="rounded bg-[#0ea5e9]/20 px-2 py-1 text-[#bae8ff]">Record armed</span> : null}
          {recordingTake ? <span className="rounded bg-red-500/20 px-2 py-1 text-red-200">Recording into track...</span> : null}
          {recordError ? <span className="rounded bg-red-500/20 px-2 py-1 text-red-200">{recordError}</span> : null}
        </div>
      </div>

      <div className="grid min-h-[460px] grid-cols-[180px_1fr_260px]">
        <aside className="border-r border-white/10 p-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Tracks</h3>
            <button type="button" onClick={addTrack} className="rounded border border-white/20 px-2 py-1 text-xs text-gray-200">
              +
            </button>
          </div>

          <div className="space-y-2">
            {tracks.map((track) => (
              <button
                key={track.id}
                type="button"
                onClick={() => setSelectedTrackId(track.id)}
                className={`w-full rounded px-2 py-2 text-left text-xs ${
                  selectedTrackId === track.id ? "bg-[#f59e0b]/20 text-[#f7d79c]" : "bg-[#111111] text-gray-300"
                }`}
              >
                {track.name}
              </button>
            ))}
          </div>
        </aside>

        <section className="relative overflow-x-auto" ref={timelineRef}>
          <div className="relative" style={{ width: maxBeats * DAW_BEAT_WIDTH }}>
            <div className="sticky top-0 z-20 flex h-8 border-b border-white/10 bg-[#111111] text-[10px] text-gray-400">
              {Array.from({ length: maxBeats }).map((_, index) => (
                <div key={index} className="flex shrink-0 items-center justify-center border-r border-white/10" style={{ width: DAW_BEAT_WIDTH }}>
                  {index + 1}
                </div>
              ))}
            </div>

            <div className="relative">
              {tracks.map((track) => (
                <div key={track.id} className="relative h-16 border-b border-white/10">
                  {Array.from({ length: maxBeats }).map((_, index) => (
                    <span
                      key={index}
                      className={`absolute top-0 h-full border-r ${index % 4 === 0 ? "border-white/20" : "border-white/8"}`}
                      style={{ left: index * DAW_BEAT_WIDTH }}
                    />
                  ))}

                  {track.clips.map((clip) => (
                    <button
                      key={clip.id}
                      type="button"
                      onMouseDown={(event) => {
                        const rect = event.currentTarget.getBoundingClientRect();
                        const isResize = event.clientX > rect.right - 10;
                        dragState.current = {
                          type: isResize ? "resize" : "move",
                          trackId: track.id,
                          clipId: clip.id,
                          startX: event.clientX,
                          originStart: clip.start,
                          originDuration: clip.duration
                        };
                      }}
                      className="absolute top-2 h-12 rounded px-2 text-left text-[11px] font-semibold text-black"
                      style={{
                        left: clip.start * DAW_BEAT_WIDTH,
                        width: clip.duration * DAW_BEAT_WIDTH,
                        background: clip.color,
                        minWidth: 18
                      }}
                    >
                      {clip.label}
                    </button>
                  ))}
                </div>
              ))}

              <span className="pointer-events-none absolute top-0 h-full w-0.5 bg-[#f59e0b]" style={{ left: playheadBeat * DAW_BEAT_WIDTH }} />
            </div>
          </div>
        </section>

        <aside className="border-l border-white/10 p-3">
          <h3 className="text-sm font-semibold text-white">Effects</h3>

          <div className="mt-3 space-y-3">
            {[
              { key: "reverb", label: "Reverb" },
              { key: "delay", label: "Delay" },
              { key: "eq", label: "EQ" },
              { key: "compressor", label: "Compressor" }
            ].map((item) => (
              <label key={item.key} className="block text-xs text-gray-300">
                {item.label}
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={effects[item.key]}
                  onChange={(event) => setEffects((current) => ({ ...current, [item.key]: Number(event.target.value) }))}
                  className="mt-1 w-full accent-[#f59e0b]"
                />
              </label>
            ))}
          </div>

          <h4 className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Sound Library</h4>
          <div className="mt-2 space-y-3">
            {Object.entries(libraryByCategory).map(([category, assets]) => (
              <div key={category}>
                <p className="text-[10px] uppercase tracking-[0.1em] text-gray-500">{category}</p>
                <div className="mt-1 space-y-2">
                  {assets.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => addClipFromLibrary(asset)}
                      className="w-full rounded border border-white/15 bg-[#111111] px-2 py-2 text-left text-xs text-gray-200 transition hover:scale-[1.03]"
                    >
                      {asset.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="border-t border-white/10 p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Mixer</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {tracks.map((track) => (
            <div key={track.id} className="rounded-lg border border-white/10 bg-[#101010] p-2">
              <p className="text-xs text-gray-300">{track.name}</p>

              <label className="mt-2 block text-[10px] text-gray-400">
                Volume
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={track.volume}
                  onChange={(event) => updateMixer(track.id, "volume", Number(event.target.value))}
                  className="mt-1 w-full accent-[#f59e0b]"
                />
              </label>

              <label className="mt-2 block text-[10px] text-gray-400">
                Pan
                <input
                  type="range"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={track.pan}
                  onChange={(event) => updateMixer(track.id, "pan", Number(event.target.value))}
                  className="mt-1 w-full accent-[#f59e0b]"
                />
              </label>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export const StudioPage = () => {
  const user = useLearningStore((state) => state.user);
  const { mode } = useMode();

  const filters = VIDEO_FILTERS[mode] || VIDEO_FILTERS.mature;
  const audioEffects = AUDIO_EFFECTS[mode] || AUDIO_EFFECTS.mature;

  const [tab, setTab] = useState("video");
  const [selectedVideoFilter, setSelectedVideoFilter] = useState(filters[0]);
  const [selectedAudioEffect, setSelectedAudioEffect] = useState(audioEffects[0]);

  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [gain, setGain] = useState(1);
  const [trim, setTrim] = useState(0);
  const [reverb, setReverb] = useState(0.2);
  const [delay, setDelay] = useState(0.12);

  const [status, setStatus] = useState("");
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [micLevel, setMicLevel] = useState(0);

  const [currentTake, setCurrentTake] = useState(null);
  const [projects, setProjects] = useState(() => readProjectMeta());
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loadedProject, setLoadedProject] = useState(null);
  const [projectName, setProjectName] = useState("");

  const [transcriptSupported, setTranscriptSupported] = useState(false);
  const [transcript, setTranscript] = useState("");

  const [shortcutsEnabled, setShortcutsEnabled] = useState(true);
  const [diagnostics, setDiagnostics] = useState({
    secureContext: isSecureMediaContext(),
    mediaDevices: hasMediaSupport(),
    mediaRecorder: typeof MediaRecorder !== "undefined",
    audioMime: pickRecorderMime("audio") || "not supported",
    videoMime: pickRecorderMime("video") || "not supported",
    microphonePermission: "unknown",
    cameraPermission: "unknown"
  });

  const videoInputRef = useRef(null);
  const canvasRef = useRef(null);
  const videoPreviewPlayerRef = useRef(null);
  const audioPreviewPlayerRef = useRef(null);
  const audioCanvasRef = useRef(null);

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const urlsRef = useRef([]);
  const recordKindRef = useRef("audio");
  const recordMimeRef = useRef("");
  const drawFrameRef = useRef(null);
  const timerRef = useRef(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioFrameRef = useRef(null);

  const recognitionRef = useRef(null);

  if (!user) return <Navigate to="/login" replace />;

  useEffect(() => {
    setSelectedVideoFilter(filters[0]);
    setSelectedAudioEffect(audioEffects[0]);
  }, [mode]);

  useEffect(() => {
    const SpeechRecognitionClass = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
    setTranscriptSupported(Boolean(SpeechRecognitionClass));
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) return undefined;

    let cancelled = false;
    const watchers = [];

    const updatePermissionState = (key, state) => {
      if (cancelled) return;
      setDiagnostics((current) => ({
        ...current,
        [key]: state || "unknown"
      }));
    };

    const bindPermission = async (permissionName, key) => {
      try {
        const status = await navigator.permissions.query({ name: permissionName });
        updatePermissionState(key, status.state);

        status.onchange = () => updatePermissionState(key, status.state);
        watchers.push(status);
      } catch {
        updatePermissionState(key, "unknown");
      }
    };

    bindPermission("microphone", "microphonePermission");
    bindPermission("camera", "cameraPermission");

    return () => {
      cancelled = true;
      watchers.forEach((status) => {
        status.onchange = null;
      });
    };
  }, []);

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const cleanupAudioGraph = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const stopDrawLoop = () => {
    if (drawFrameRef.current && typeof window !== "undefined") {
      window.cancelAnimationFrame(drawFrameRef.current);
      drawFrameRef.current = null;
    }
  };

  const stopAudioLoop = () => {
    if (audioFrameRef.current && typeof window !== "undefined") {
      window.cancelAnimationFrame(audioFrameRef.current);
      audioFrameRef.current = null;
    }
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopTranscriptCapture = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
  };

  const drawVideoToCanvas = () => {
    const canvas = canvasRef.current;
    const inputVideo = videoInputRef.current;
    if (!canvas || !inputVideo) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const render = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.filter = selectedVideoFilter?.value || "none";
      context.drawImage(inputVideo, 0, 0, canvas.width, canvas.height);
      if (mode === "kids") {
        context.filter = "none";
        context.font = "20px sans-serif";
        context.fillText("🎸", canvas.width - 34, 28);
      }

      drawFrameRef.current = window.requestAnimationFrame(render);
    };

    render();
  };

  const drawAudioWave = () => {
    const canvas = audioCanvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const dataArray = new Uint8Array(analyser.fftSize);

    const render = () => {
      analyser.getByteTimeDomainData(dataArray);

      context.fillStyle = "#0d0d0d";
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.strokeStyle = mode === "kids" ? "#65b7c8" : "#f59e0b";
      context.lineWidth = 2;
      context.beginPath();

      const sliceWidth = canvas.width / dataArray.length;
      let x = 0;
      let rms = 0;

      for (let i = 0; i < dataArray.length; i += 1) {
        const value = dataArray[i] / 128.0;
        const y = (value * canvas.height) / 2;

        const centered = value - 1;
        rms += centered * centered;

        if (i === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
        x += sliceWidth;
      }
      context.lineTo(canvas.width, canvas.height / 2);
      context.stroke();

      setMicLevel(Math.min(1, Math.sqrt(rms / dataArray.length) * 3));
      audioFrameRef.current = window.requestAnimationFrame(render);
    };

    render();
  };

  const createRecordingEffectChain = (context, source) => {
    const destination = context.createMediaStreamDestination();
    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;

    const inputGain = context.createGain();
    inputGain.gain.value = Math.max(0.05, gain + trim);

    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -22;
    compressor.knee.value = 18;
    compressor.ratio.value = 3.2;
    compressor.attack.value = 0.009;
    compressor.release.value = 0.2;

    const outputGain = context.createGain();
    outputGain.gain.value = 1;
    const previewGain = context.createGain();
    previewGain.gain.value = 0.45;

    source.connect(inputGain);
    inputGain.connect(compressor);

    let effectInput = compressor;
    if (selectedAudioEffect === "Studio Clarity" || selectedAudioEffect === "Walkie-Talkie") {
      const hp = context.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = selectedAudioEffect === "Walkie-Talkie" ? 500 : 110;

      const lp = context.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = selectedAudioEffect === "Walkie-Talkie" ? 2400 : 8200;

      effectInput.connect(hp);
      hp.connect(lp);
      effectInput = lp;
    }

    if (selectedAudioEffect === "Bass Punch") {
      const bass = context.createBiquadFilter();
      bass.type = "lowshelf";
      bass.frequency.value = 220;
      bass.gain.value = 7;
      effectInput.connect(bass);
      effectInput = bass;
    }

    if (selectedAudioEffect === "Hyper Pop" || selectedAudioEffect === "Neon Pop") {
      const presence = context.createBiquadFilter();
      presence.type = "peaking";
      presence.frequency.value = 3200;
      presence.Q.value = 1.2;
      presence.gain.value = 4;
      effectInput.connect(presence);
      effectInput = presence;
    }

    const delayNode = context.createDelay(1.2);
    delayNode.delayTime.value = Math.max(0.02, delay * 0.8);
    const delayFeedback = context.createGain();
    delayFeedback.gain.value = Math.min(0.8, 0.2 + delay * 0.55);
    delayNode.connect(delayFeedback);
    delayFeedback.connect(delayNode);

    const reverbNode = context.createDelay(0.6);
    reverbNode.delayTime.value = Math.max(0.03, reverb * 0.2);
    const reverbFeedback = context.createGain();
    reverbFeedback.gain.value = Math.min(0.75, 0.2 + reverb * 0.45);
    reverbNode.connect(reverbFeedback);
    reverbFeedback.connect(reverbNode);

    const dryMix = context.createGain();
    const wetMix = context.createGain();
    dryMix.gain.value = 0.82;
    wetMix.gain.value = 0.38;

    effectInput.connect(dryMix);
    effectInput.connect(delayNode);
    delayNode.connect(wetMix);
    effectInput.connect(reverbNode);
    reverbNode.connect(wetMix);

    if (selectedAudioEffect === "Ocean Delay" || selectedAudioEffect === "Space Echo" || selectedAudioEffect === "Echo Spam") {
      delayNode.delayTime.value = Math.max(0.16, delay * 1.05);
      delayFeedback.gain.value = Math.min(0.86, 0.36 + delay * 0.55);
      wetMix.gain.value = 0.6;
    }

    if (selectedAudioEffect === "Trap Reverb" || selectedAudioEffect === "Toilet Reverb") {
      reverbNode.delayTime.value = Math.max(0.08, reverb * 0.28);
      reverbFeedback.gain.value = Math.min(0.84, 0.4 + reverb * 0.4);
      wetMix.gain.value = 0.62;
    }

    if (selectedAudioEffect === "Robot" || selectedAudioEffect === "8-Bit" || selectedAudioEffect === "Monster") {
      const shaper = context.createWaveShaper();
      shaper.curve = createDistortionCurve(selectedAudioEffect === "Monster" ? 80 : 42);
      shaper.oversample = "4x";
      effectInput.connect(shaper);
      shaper.connect(wetMix);
      wetMix.gain.value = 0.55;
    }

    dryMix.connect(outputGain);
    wetMix.connect(outputGain);
    outputGain.connect(analyser);
    outputGain.connect(destination);
    outputGain.connect(previewGain);
    previewGain.connect(context.destination);

    return { destination, analyser };
  };

  const startTranscriptCapture = () => {
    const SpeechRecognitionClass = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i += 1) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text.trim());
    };

    recognition.onerror = (event) => {
      console.error("Transcript capture error", event.error);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const startRecording = async () => {
    setStatus("");
    setTranscript("");

    if (!hasMediaSupport()) {
      setStatus("Media devices are not supported in this browser.");
      return;
    }
    if (!isSecureMediaContext()) {
      setStatus("Camera and microphone require HTTPS (or localhost).");
      return;
    }

    try {
      if (tab === "video") {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;

        if (videoInputRef.current) {
          videoInputRef.current.srcObject = stream;
          await videoInputRef.current.play().catch(() => {});
        }

        drawVideoToCanvas();

        const canvasStream = canvasRef.current.captureStream(30);
        const audioTracks = stream.getAudioTracks();
        if (audioTracks[0]) {
          canvasStream.addTrack(audioTracks[0]);
        }

        const videoMime = pickRecorderMime("video");
        recorderRef.current = videoMime ? new MediaRecorder(canvasStream, { mimeType: videoMime }) : new MediaRecorder(canvasStream);
        recordKindRef.current = "video";
        recordMimeRef.current = videoMime || recorderRef.current.mimeType || "video/webm";
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression,
            autoGainControl: true
          }
        });

        streamRef.current = stream;

        const AudioContextClass = getAudioContextClass();
        if (AudioContextClass) {
          const context = new AudioContextClass();
          if (context.state === "suspended") {
            await context.resume().catch(() => {});
          }
          const source = context.createMediaStreamSource(stream);
          const { destination, analyser } = createRecordingEffectChain(context, source);

          const audioMime = pickRecorderMime("audio");
          recorderRef.current = audioMime ? new MediaRecorder(destination.stream, { mimeType: audioMime }) : new MediaRecorder(destination.stream);
          recordMimeRef.current = audioMime || recorderRef.current.mimeType || "audio/webm";

          audioContextRef.current = context;
          analyserRef.current = analyser;
          drawAudioWave();
        } else {
          const audioMime = pickRecorderMime("audio");
          recorderRef.current = audioMime ? new MediaRecorder(stream, { mimeType: audioMime }) : new MediaRecorder(stream);
          recordMimeRef.current = audioMime || recorderRef.current.mimeType || "audio/webm";
        }
        recordKindRef.current = "audio";
      }

      if (!recorderRef.current) {
        setStatus("Recording is not supported in this browser.");
        cleanupStream();
        cleanupAudioGraph();
        stopDrawLoop();
        stopAudioLoop();
        stopTimer();
        return;
      }

      chunksRef.current = [];
      recorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorderRef.current.onstop = () => {
        const kind = recordKindRef.current || tab;
        const mime = recordMimeRef.current || (kind === "video" ? "video/webm" : "audio/webm");
        const blob = new Blob(chunksRef.current, { type: mime });
        const url = URL.createObjectURL(blob);
        urlsRef.current.push(url);

        const take = {
          id: createId(),
          type: kind,
          blob,
          url,
          duration: durationSeconds,
          filter: selectedVideoFilter?.name || "",
          effect: selectedAudioEffect,
          transcript: transcript.trim(),
          thumbnail:
            tab === "video" && canvasRef.current
              ? createThumbnailFromCanvas(canvasRef.current)
              : "/logo.png",
          createdAt: new Date().toISOString()
        };

        setCurrentTake(take);
        setRecording(false);
        setPaused(false);

        stopTimer();
        stopDrawLoop();
        stopAudioLoop();
        cleanupStream();
        cleanupAudioGraph();
        stopTranscriptCapture();
      };

      recorderRef.current.start();
      setRecording(true);
      setPaused(false);
      setDurationSeconds(0);
      timerRef.current = setInterval(() => setDurationSeconds((prev) => prev + 1), 1000);

      if (transcriptSupported) {
        startTranscriptCapture();
      }
    } catch (error) {
      console.error("Unable to start recording", error);
      setStatus("Unable to start recording. Please grant camera/microphone permissions.");
      cleanupStream();
      cleanupAudioGraph();
      stopDrawLoop();
      stopAudioLoop();
      stopTimer();
      stopTranscriptCapture();
    }
  };

  const pauseRecording = () => {
    if (!recorderRef.current || typeof recorderRef.current.pause !== "function" || recorderRef.current.state !== "recording") return;
    recorderRef.current.pause();
    setPaused(true);
    stopTimer();
  };

  const resumeRecording = () => {
    if (!recorderRef.current || typeof recorderRef.current.resume !== "function" || recorderRef.current.state !== "paused") return;
    recorderRef.current.resume();
    setPaused(false);
    timerRef.current = setInterval(() => setDurationSeconds((prev) => prev + 1), 1000);
  };

  const stopRecording = () => {
    if (!recorderRef.current || recorderRef.current.state === "inactive") return;
    recorderRef.current.stop();
  };

  const retake = () => {
    if (currentTake?.url) {
      URL.revokeObjectURL(currentTake.url);
    }
    setCurrentTake(null);
    setDurationSeconds(0);
    setTranscript("");
  };

  const removeCurrentTake = () => {
    if (currentTake?.url) URL.revokeObjectURL(currentTake.url);
    setCurrentTake(null);
    setStatus("Current take deleted.");
  };

  const saveCurrentTake = async () => {
    if (!currentTake?.blob) {
      setStatus("Record a take before saving.");
      return;
    }

    const id = createId();
    const assetId = `asset-${id}`;

    try {
      await saveAssetBlob(assetId, currentTake.blob);

      const metaItem = {
        id,
        assetId,
        name: projectName.trim() || `${currentTake.type.toUpperCase()} Session ${projects.length + 1}`,
        type: currentTake.type,
        duration: currentTake.duration,
        createdAt: new Date().toISOString(),
        thumbnail: currentTake.thumbnail || "/logo.png",
        filter: currentTake.filter,
        effect: currentTake.effect,
        transcript: currentTake.transcript
      };

      const next = [metaItem, ...projects];
      setProjects(next);
      writeProjectMeta(next);
      setProjectName("");
      setStatus("Take saved to album.");
    } catch (error) {
      console.error("Unable to save project", error);
      setStatus("Unable to save project.");
    }
  };

  const openProject = async (project) => {
    if (!project?.assetId) return;

    try {
      const blob = await getAssetBlob(project.assetId);
      if (!blob) {
        setStatus("Project asset missing.");
        return;
      }

      if (loadedProject?.url) URL.revokeObjectURL(loadedProject.url);

      const url = URL.createObjectURL(blob);
      urlsRef.current.push(url);
      setLoadedProject({ ...project, blob, url });
      setSelectedProjectId(project.id);
      setStatus(`Loaded ${project.name}`);
    } catch (error) {
      console.error("Unable to load project", error);
      setStatus("Unable to load project.");
    }
  };

  const deleteProject = async (project) => {
    try {
      await deleteAssetBlob(project.assetId);
      const next = projects.filter((item) => item.id !== project.id);
      setProjects(next);
      writeProjectMeta(next);

      if (selectedProjectId === project.id) {
        if (loadedProject?.url) URL.revokeObjectURL(loadedProject.url);
        setLoadedProject(null);
        setSelectedProjectId("");
      }

      setStatus("Project deleted.");
    } catch (error) {
      console.error("Unable to delete project", error);
      setStatus("Unable to delete project.");
    }
  };

  const exportWithPreset = (preset, source) => {
    if (!source?.blob) {
      setStatus("No media selected for export.");
      return;
    }

    const blobType = String(source?.blob?.type || "").toLowerCase();
    const extension = source.type === "video" ? "webm" : blobType.includes("wav") ? "wav" : "webm";
    const safeName = (source.name || source.id || "strumify-session").replace(/\s+/g, "-").toLowerCase();
    const fileName = `${safeName}-${preset.toLowerCase()}.${extension}`;
    downloadBlob(source.blob, fileName);
    setStatus(`Exported with ${preset} preset.`);
  };

  const processLoadedAudio = async (type) => {
    if (!loadedProject || loadedProject.type !== "audio") {
      setStatus("Load an audio project first.");
      return;
    }

    setStatus(type === "trim" ? "Removing silence..." : "Enhancing voice...");

    const processed = type === "trim" ? await trimSilenceFromBlob(loadedProject.blob) : await enhanceVoiceBlob(loadedProject.blob);

    const id = createId();
    const assetId = `asset-${id}`;
    await saveAssetBlob(assetId, processed);

    const metaItem = {
      id,
      assetId,
      name: `${loadedProject.name} (${type === "trim" ? "silence-trim" : "enhanced"})`,
      type: "audio",
      duration: loadedProject.duration,
      createdAt: new Date().toISOString(),
      thumbnail: loadedProject.thumbnail || "/logo.png",
      filter: loadedProject.filter || "",
      effect: loadedProject.effect || selectedAudioEffect,
      transcript: loadedProject.transcript || ""
    };

    const next = [metaItem, ...projects];
    setProjects(next);
    writeProjectMeta(next);
    setStatus("Edited copy saved to album.");
  };

  const playActivePreview = () => {
    if (tab === "video") {
      const player = videoPreviewPlayerRef.current;
      if (player) player.play().catch(() => {});
    } else {
      const player = audioPreviewPlayerRef.current;
      if (player) player.play().catch(() => {});
    }
  };

  const pauseActivePreview = () => {
    if (tab === "video") {
      const player = videoPreviewPlayerRef.current;
      if (player) player.pause();
    } else {
      const player = audioPreviewPlayerRef.current;
      if (player) player.pause();
    }
  };

  const stopActivePreview = () => {
    if (tab === "video") {
      const player = videoPreviewPlayerRef.current;
      if (player) {
        player.pause();
        player.currentTime = 0;
      }
    } else {
      const player = audioPreviewPlayerRef.current;
      if (player) {
        player.pause();
        player.currentTime = 0;
      }
    }
  };

  const playWithEffect = async (sourceBlob, effectName) => {
    if (!sourceBlob) return;

    const AudioContextClass = getAudioContextClass();
    if (!AudioContextClass) return;

    try {
      const context = new AudioContextClass();
      const arrayBuffer = await sourceBlob.arrayBuffer();
      const decoded = await context.decodeAudioData(arrayBuffer.slice(0));
      const source = context.createBufferSource();
      source.buffer = decoded;

      applyAudioPlaybackEffect({
        context,
        source,
        effectName,
        mode,
        reverbAmount: reverb,
        delayAmount: delay,
        gainAmount: gain,
        trimAmount: trim
      });

      source.onended = () => {
        context.close().catch(() => {});
      };
      source.start();
    } catch (error) {
      console.error("Unable to play effect preview", error);
    }
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!shortcutsEnabled) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) {
        return;
      }

      if (event.key.toLowerCase() === "r") {
        if (recording) {
          stopRecording();
        } else {
          startRecording();
        }
      }

      if (event.key === " ") {
        event.preventDefault();
        const activePlayer = tab === "video" ? videoPreviewPlayerRef.current : audioPreviewPlayerRef.current;
        if (!activePlayer) return;
        if (activePlayer.paused) {
          activePlayer.play().catch(() => {});
        } else {
          activePlayer.pause();
        }
      }

      if (event.key.toLowerCase() === "s") {
        stopActivePreview();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [recording, tab, shortcutsEnabled]);

  useEffect(() => {
    return () => {
      cleanupStream();
      cleanupAudioGraph();
      stopDrawLoop();
      stopAudioLoop();
      stopTimer();
      stopTranscriptCapture();

      if (loadedProject?.url) URL.revokeObjectURL(loadedProject.url);
      if (currentTake?.url) URL.revokeObjectURL(currentTake.url);
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlsRef.current = [];
    };
  }, []);

  const activeExportSource = loadedProject || currentTake;

  const albumByType = useMemo(
    () => ({
      video: projects.filter((item) => item.type === "video"),
      audio: projects.filter((item) => item.type === "audio")
    }),
    [projects]
  );

  return (
    <Container className="space-y-8 py-20">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.18em] text-gray-400">Studio</p>
        <h1 className="text-4xl font-bold text-white">Record and Create Your Sound</h1>
        <p className="max-w-3xl text-gray-300">
          Capture your playing, shape the vibe, and build songs you can keep refining over time.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#141414] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-white">Recording Diagnostics</h2>
          <span className={`rounded-full px-2.5 py-1 text-[11px] ${diagnostics.secureContext ? "bg-emerald-500/20 text-emerald-200" : "bg-red-500/20 text-red-200"}`}>
            {diagnostics.secureContext ? "Secure Context" : "HTTPS Required"}
          </span>
        </div>
        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-gray-300">MediaDevices: {diagnostics.mediaDevices ? "available" : "missing"}</div>
          <div className="rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-gray-300">MediaRecorder: {diagnostics.mediaRecorder ? "available" : "missing"}</div>
          <div className="rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-gray-300">Audio MIME: {diagnostics.audioMime}</div>
          <div className="rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-gray-300">Video MIME: {diagnostics.videoMime}</div>
          <div className="rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-gray-300">Microphone: {diagnostics.microphonePermission}</div>
          <div className="rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-gray-300">Camera: {diagnostics.cameraPermission}</div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#141414] p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("video")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === "video" ? "bg-[#f59e0b] text-[#1a1206]" : "bg-[#101010] text-gray-300"}`}
          >
            Video
          </button>
          <button
            type="button"
            onClick={() => setTab("audio")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === "audio" ? "bg-[#f59e0b] text-[#1a1206]" : "bg-[#101010] text-gray-300"}`}
          >
            Audio
          </button>

          <label className="ml-auto inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#101010] px-3 py-2 text-xs text-gray-300">
            <input type="checkbox" checked={shortcutsEnabled} onChange={(event) => setShortcutsEnabled(event.target.checked)} />
            Keyboard Shortcuts (R / Space / S)
          </label>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            {tab === "video" ? (
              <>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                  <video ref={videoInputRef} className="hidden" muted playsInline autoPlay />
                  <canvas ref={canvasRef} width={1280} height={720} className="h-[52vh] min-h-[300px] w-full object-cover" />
                </div>

                <div className="flex flex-wrap gap-2">
                  {filters.map((filter) => (
                    <button
                      key={filter.name}
                      type="button"
                      onClick={() => setSelectedVideoFilter(filter)}
                      className={`rounded-lg border px-3 py-2 text-xs transition hover:scale-[1.03] ${
                        selectedVideoFilter.name === filter.name
                          ? "border-[#f0b64f] bg-[#f59e0b]/20 text-[#f7d79c]"
                          : "border-white/15 bg-[#101010] text-gray-300"
                      }`}
                    >
                      {filter.name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                  <canvas ref={audioCanvasRef} width={1280} height={220} className="h-56 w-full" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs text-gray-300">
                    Gain
                    <input
                      type="range"
                      min={0}
                      max={2}
                      step={0.01}
                      value={gain}
                      onChange={(event) => setGain(Number(event.target.value))}
                      className="mt-1 w-full accent-[#f59e0b]"
                    />
                  </label>
                  <label className="block text-xs text-gray-300">
                    Trim
                    <input
                      type="range"
                      min={-0.6}
                      max={0.6}
                      step={0.01}
                      value={trim}
                      onChange={(event) => setTrim(Number(event.target.value))}
                      className="mt-1 w-full accent-[#f59e0b]"
                    />
                  </label>
                  <label className="block text-xs text-gray-300">
                    Reverb
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={reverb}
                      onChange={(event) => setReverb(Number(event.target.value))}
                      className="mt-1 w-full accent-[#f59e0b]"
                    />
                  </label>
                  <label className="block text-xs text-gray-300">
                    Delay
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={delay}
                      onChange={(event) => setDelay(Number(event.target.value))}
                      className="mt-1 w-full accent-[#f59e0b]"
                    />
                  </label>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#101010] px-3 py-2 text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={noiseSuppression}
                      onChange={(event) => setNoiseSuppression(event.target.checked)}
                    />
                    Noise Suppression
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#101010] px-3 py-2 text-xs text-gray-300">
                    Mic Meter
                    <span className="h-2 w-full rounded bg-[#1f1f1f]">
                      <span className="block h-2 rounded bg-[#f59e0b]" style={{ width: `${Math.round(micLevel * 100)}%` }} />
                    </span>
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  {audioEffects.map((effect) => (
                    <button
                      key={effect}
                      type="button"
                      onClick={() => setSelectedAudioEffect(effect)}
                      className={`rounded-lg border px-3 py-2 text-xs transition hover:scale-[1.03] ${
                        selectedAudioEffect === effect
                          ? "border-[#f0b64f] bg-[#f59e0b]/20 text-[#f7d79c]"
                          : "border-white/15 bg-[#101010] text-gray-300"
                      }`}
                    >
                      {effect}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <aside className="space-y-4 rounded-xl border border-white/10 bg-[#101010] p-4">
            <h2 className="text-lg font-semibold text-white">Record Controls</h2>

            <p className="text-sm text-gray-300">Timer: {formatTime(durationSeconds)}</p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={startRecording}
                disabled={recording}
                className="rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white shadow-[0_0_14px_rgba(239,68,68,0.65)] disabled:opacity-50"
              >
                Record
              </button>
              <TransportButton onClick={pauseRecording} tone={mode}>Pause</TransportButton>
              <TransportButton onClick={resumeRecording} tone={mode}>Play</TransportButton>
              <TransportButton onClick={stopRecording} tone={mode}>Stop</TransportButton>
              <TransportButton onClick={retake} tone={mode}>Retake</TransportButton>
              <TransportButton onClick={removeCurrentTake} tone={mode}>Delete</TransportButton>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Project name"
                className="w-full rounded-lg border border-white/15 bg-[#0f0f0f] px-3 py-2 text-sm"
              />
              <Button mode={mode} onClick={saveCurrentTake} className="w-full">
                Save
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {EXPORT_PRESETS.map((preset) => (
                <TransportButton key={preset} onClick={() => exportWithPreset(preset, activeExportSource)} tone={mode}>
                  {preset}
                </TransportButton>
              ))}
            </div>

            <div className="space-y-2 rounded-lg border border-white/10 bg-[#0d0d0d] p-3 text-xs text-gray-300">
              <p>Smart Features</p>
              <div className="flex flex-wrap gap-2">
                <TransportButton onClick={() => processLoadedAudio("trim")} tone={mode}>Silence Removal</TransportButton>
                <TransportButton onClick={() => processLoadedAudio("enhance")} tone={mode}>AI Voice Enhancement</TransportButton>
              </div>
              <p>Auto Subtitles: {transcriptSupported ? "available" : "not supported by this browser"}</p>
            </div>
          </aside>
        </div>

        {status ? <p className="mt-4 text-sm text-gray-300">{status}</p> : null}

        {recording ? <p className="mt-2 text-xs text-[#f7c16f]">Recording {paused ? "paused" : "in progress"}...</p> : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Card mode={mode}>
          <h2 className="text-xl font-semibold text-white">Current / Loaded Preview</h2>

          <div className="mt-3 space-y-3">
            {tab === "video" ? (
              activeExportSource?.type === "video" ? (
                <video ref={videoPreviewPlayerRef} controls src={activeExportSource.url} className="w-full rounded-lg" />
              ) : (
                <p className="text-sm text-gray-400">No video selected.</p>
              )
            ) : activeExportSource?.type === "audio" ? (
              <audio ref={audioPreviewPlayerRef} controls src={activeExportSource.url} className="w-full" />
            ) : (
              <p className="text-sm text-gray-400">No audio selected.</p>
            )}

            {activeExportSource?.type === "audio" ? (
              <button
                type="button"
                onClick={() => playWithEffect(activeExportSource.blob, selectedAudioEffect)}
                className="rounded-lg border border-[#d59d38]/60 px-3 py-2 text-xs text-[#f7d79c] transition hover:scale-[1.03]"
              >
                Preview Effect: {selectedAudioEffect}
              </button>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <TransportButton onClick={playActivePreview} tone={mode}>Play</TransportButton>
              <TransportButton onClick={pauseActivePreview} tone={mode}>Pause</TransportButton>
              <TransportButton onClick={stopActivePreview} tone={mode}>Stop</TransportButton>
            </div>

            {activeExportSource?.transcript ? (
              <div className="rounded-lg border border-white/10 bg-[#0d0d0d] p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-400">Auto Subtitles</p>
                <p className="mt-2 text-sm text-gray-300">{activeExportSource.transcript}</p>
              </div>
            ) : null}
          </div>
        </Card>

        <Card mode={mode}>
          <h2 className="text-xl font-semibold text-white">Album</h2>
          <p className="mt-1 text-sm text-gray-300">Your saved takes stay ready so you can reopen and continue anytime.</p>

          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-gray-400">Videos ({albumByType.video.length})</p>
              <ul className="mt-2 space-y-2">
                {albumByType.video.map((project) => (
                  <li key={project.id} className="rounded-lg border border-white/10 bg-[#101010] p-2">
                    <div className="flex items-center gap-3">
                      <img src={project.thumbnail || "/logo.png"} alt={project.name} className="h-10 w-14 rounded object-cover" />
                      <div className="flex-1">
                        <p className="text-sm text-white">{project.name}</p>
                        <p className="text-xs text-gray-400">{formatTime(project.duration)}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <TransportButton onClick={() => openProject(project)} tone={mode} active={selectedProjectId === project.id}>Open</TransportButton>
                      <TransportButton onClick={() => deleteProject(project)} tone={mode}>Delete</TransportButton>
                    </div>
                  </li>
                ))}
                {albumByType.video.length === 0 ? <p className="text-xs text-gray-500">No saved videos.</p> : null}
              </ul>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-gray-400">Audio ({albumByType.audio.length})</p>
              <ul className="mt-2 space-y-2">
                {albumByType.audio.map((project) => (
                  <li key={project.id} className="rounded-lg border border-white/10 bg-[#101010] p-2">
                    <div className="flex items-center gap-3">
                      <img src={project.thumbnail || "/logo.png"} alt={project.name} className="h-10 w-14 rounded object-cover" />
                      <div className="flex-1">
                        <p className="text-sm text-white">{project.name}</p>
                        <p className="text-xs text-gray-400">{formatTime(project.duration)}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <TransportButton onClick={() => openProject(project)} tone={mode} active={selectedProjectId === project.id}>Open</TransportButton>
                      <TransportButton onClick={() => deleteProject(project)} tone={mode}>Delete</TransportButton>
                    </div>
                  </li>
                ))}
                {albumByType.audio.length === 0 ? <p className="text-xs text-gray-500">No saved audio.</p> : null}
              </ul>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold text-white">Music Composer</h2>
        <ComposerDaw mode={mode} />
      </section>
    </Container>
  );
};
