import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";

import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useMode } from "../context/ModeContext";
import { Container } from "../layouts/Container";
import { useLearningStore } from "../store/useLearningStore";

const strings = [
  { note: "E", full: "E2", frequency: 82.41 },
  { note: "A", full: "A2", frequency: 110.0 },
  { note: "D", full: "D3", frequency: 146.83 },
  { note: "G", full: "G3", frequency: 196.0 },
  { note: "B", full: "B3", frequency: 246.94 },
  { note: "e", full: "E4", frequency: 329.63 }
];

const chordTargets = {
  "C major": ["C", "E", "G"],
  "G major": ["G", "B", "D"],
  "D major": ["D", "F#", "A"],
  "E minor": ["E", "G", "B"],
  "A minor": ["A", "C", "E"],
  "F major": ["F", "A", "C"]
};

const chordLoops = [
  { id: "loop-1", label: "G → C → D", chords: ["G major", "C major", "D major"] },
  { id: "loop-2", label: "Em → D → C → D", chords: ["E minor", "D major", "C major", "D major"] },
  { id: "loop-3", label: "C → G → Am → F", chords: ["C major", "G major", "A minor", "F major"] }
];

const hasMediaSupport = () => typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);

const getAudioContextClass = () => {
  if (typeof window === "undefined") return null;
  return window.AudioContext || window.webkitAudioContext || null;
};

const autoCorrelate = (buffer, sampleRate) => {
  let rms = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    rms += buffer[i] * buffer[i];
  }

  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.01) return -1;

  let r1 = 0;
  let r2 = buffer.length - 1;
  const threshold = 0.2;

  for (let i = 0; i < buffer.length / 2; i += 1) {
    if (Math.abs(buffer[i]) < threshold) {
      r1 = i;
      break;
    }
  }

  for (let i = 1; i < buffer.length / 2; i += 1) {
    if (Math.abs(buffer[buffer.length - i]) < threshold) {
      r2 = buffer.length - i;
      break;
    }
  }

  const trimmed = buffer.slice(r1, r2);
  const correlations = new Array(trimmed.length).fill(0);

  for (let offset = 0; offset < trimmed.length; offset += 1) {
    for (let i = 0; i < trimmed.length - offset; i += 1) {
      correlations[offset] += trimmed[i] * trimmed[i + offset];
    }
  }

  let dip = 0;
  while (dip < correlations.length - 1 && correlations[dip] > correlations[dip + 1]) {
    dip += 1;
  }

  let maxValue = -1;
  let maxIndex = -1;
  for (let i = dip; i < correlations.length; i += 1) {
    if (correlations[i] > maxValue) {
      maxValue = correlations[i];
      maxIndex = i;
    }
  }

  if (maxIndex <= 0) return -1;
  return sampleRate / maxIndex;
};

const closestString = (frequency) => {
  let nearest = strings[0];
  let diff = Math.abs(frequency - nearest.frequency);

  for (const item of strings) {
    const currentDiff = Math.abs(frequency - item.frequency);
    if (currentDiff < diff) {
      nearest = item;
      diff = currentDiff;
    }
  }

  const cents = Math.round(1200 * Math.log2(frequency / nearest.frequency));
  return { ...nearest, cents };
};

const formatDuration = (seconds = 0) => {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${mins}:${secs}`;
};

const evaluateFeedback = ({ cents, timingDiff }) => {
  if (Math.abs(cents) <= 9 && timingDiff <= 40) return "correct";
  if (Math.abs(cents) <= 24 && timingDiff <= 90) return "close";
  return "wrong";
};

const colorForFeedback = (state) => {
  if (state === "correct") return "bg-emerald-500";
  if (state === "close") return "bg-yellow-400";
  return "bg-red-500";
};

const timingState = (timingMs) => {
  const abs = Math.abs(Math.round(timingMs));
  if (abs <= 25) return "Perfect";
  if (abs <= 60) return "Good";
  return timingMs < 0 ? "Early" : "Late";
};

export const ToolsPage = () => {
  const user = useLearningStore((state) => state.user);
  const { mode } = useMode();

  const [targetLoopId, setTargetLoopId] = useState(chordLoops[0].id);
  const [targetChord, setTargetChord] = useState(chordLoops[0].chords[0]);
  const [tunerEnabled, setTunerEnabled] = useState(false);

  const [bpm, setBpm] = useState(80);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(0);

  const [sessionActive, setSessionActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState("");

  const [pitchFrequency, setPitchFrequency] = useState(null);
  const [timingDiffMs, setTimingDiffMs] = useState(0);
  const [feedbackState, setFeedbackState] = useState("close");
  const [pitchHistory, setPitchHistory] = useState([]);

  const [metrics, setMetrics] = useState({
    pitchHits: 0,
    timingHits: 0,
    chordHits: 0,
    samples: 0
  });

  const tapRef = useRef([]);
  const beatRef = useRef(0);
  const expectedBeatTimeRef = useRef(performance.now());
  const lastOnsetRef = useRef(0);
  const metronomeAudioRef = useRef(null);

  const streamRef = useRef(null);
  const contextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataRef = useRef(null);
  const frameRef = useRef(null);
  const waveformRef = useRef(null);
  const waveformFrameRef = useRef(null);
  const sessionTimerRef = useRef(null);

  if (!user) return <Navigate to="/login" replace />;

  const activeLoop = chordLoops.find((loop) => loop.id === targetLoopId) || chordLoops[0];
  const notesForChord = chordTargets[targetChord] || [];

  const pitchString = useMemo(() => (pitchFrequency ? closestString(pitchFrequency) : null), [pitchFrequency]);

  const pitchStability = useMemo(() => {
    if (pitchHistory.length < 2) return 100;
    const avg = pitchHistory.reduce((sum, value) => sum + value, 0) / pitchHistory.length;
    const variance = pitchHistory.reduce((sum, value) => sum + (value - avg) ** 2, 0) / pitchHistory.length;
    const stdDev = Math.sqrt(variance);
    return Math.max(0, Math.round(100 - stdDev / 2));
  }, [pitchHistory]);

  const pitchGraphPoints = useMemo(() => {
    if (pitchHistory.length === 0) return "";

    const max = Math.max(...pitchHistory);
    const min = Math.min(...pitchHistory);
    const spread = Math.max(1, max - min);

    return pitchHistory
      .map((value, index) => {
        const x = (index / Math.max(1, pitchHistory.length - 1)) * 100;
        const y = 100 - ((value - min) / spread) * 100;
        return `${x},${y}`;
      })
      .join(" ");
  }, [pitchHistory]);

  const pitchAccuracyPercent = useMemo(() => {
    if (metrics.samples === 0) return 0;
    return Math.round((metrics.pitchHits / metrics.samples) * 100);
  }, [metrics]);

  const chordAccuracyPercent = useMemo(() => {
    if (metrics.samples === 0) return 0;
    return Math.round((metrics.chordHits / metrics.samples) * 100);
  }, [metrics]);

  const msTimingDiff = Math.round(Math.abs(timingDiffMs));
  const timingLabel = timingState(timingDiffMs);

  const stopAudio = () => {
    if (frameRef.current && typeof window !== "undefined") {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (waveformFrameRef.current && typeof window !== "undefined") {
      window.cancelAnimationFrame(waveformFrameRef.current);
      waveformFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (contextRef.current) {
      contextRef.current.close().catch(() => {});
      contextRef.current = null;
    }

    analyserRef.current = null;
    dataRef.current = null;
  };

  const stopMetronome = () => {
    setRunning(false);
    setBeat(0);
    beatRef.current = 0;

    if (metronomeAudioRef.current) {
      metronomeAudioRef.current.close().catch(() => {});
      metronomeAudioRef.current = null;
    }
  };

  const stopSessionTimer = () => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  };

  const drawWaveform = () => {
    const canvas = waveformRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const waveform = new Uint8Array(analyser.fftSize);

    const render = () => {
      analyser.getByteTimeDomainData(waveform);

      context.fillStyle = "#0d0d0d";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.lineWidth = 2;
      context.strokeStyle = mode === "kids" ? "#65b7c8" : "#f59e0b";
      context.beginPath();

      const slice = canvas.width / waveform.length;
      let x = 0;
      for (let i = 0; i < waveform.length; i += 1) {
        const value = waveform[i] / 128.0;
        const y = (value * canvas.height) / 2;

        if (i === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
        x += slice;
      }
      context.lineTo(canvas.width, canvas.height / 2);
      context.stroke();

      waveformFrameRef.current = window.requestAnimationFrame(render);
    };

    render();
  };

  const analyzePitch = () => {
    if (!analyserRef.current || !dataRef.current || !contextRef.current || typeof window === "undefined") return;

    analyserRef.current.getFloatTimeDomainData(dataRef.current);
    const pitch = autoCorrelate(dataRef.current, contextRef.current.sampleRate);

    if (pitch > 0 && Number.isFinite(pitch)) {
      setPitchFrequency(pitch);
      setPitchHistory((current) => [...current.slice(-79), pitch]);

      const nearest = closestString(pitch);
      const now = performance.now();
      const onsetThreshold = 0.04;

      let rms = 0;
      for (let i = 0; i < dataRef.current.length; i += 1) {
        rms += dataRef.current[i] * dataRef.current[i];
      }
      rms = Math.sqrt(rms / dataRef.current.length);

      if (rms > onsetThreshold && now - lastOnsetRef.current > 120) {
        lastOnsetRef.current = now;
        const signedDiff = now - expectedBeatTimeRef.current;
        const timingDistance = Math.abs(signedDiff);
        setTimingDiffMs(signedDiff);

        const chordHit = notesForChord.includes(nearest.note.toUpperCase()) || notesForChord.includes(nearest.full[0]);
        const feedback = evaluateFeedback({ cents: nearest.cents, timingDiff: timingDistance });
        setFeedbackState(feedback);

        setMetrics((current) => ({
          pitchHits: current.pitchHits + (Math.abs(nearest.cents) <= 12 ? 1 : 0),
          timingHits: current.timingHits + (timingDistance <= 70 ? 1 : 0),
          chordHits: current.chordHits + (chordHit ? 1 : 0),
          samples: current.samples + 1
        }));
      }
    }

    frameRef.current = window.requestAnimationFrame(analyzePitch);
  };

  const startAudioAnalysis = async () => {
    if (!hasMediaSupport()) {
      setStatus("Microphone is not supported in this browser.");
      return;
    }

    const AudioContextClass = getAudioContextClass();
    if (!AudioContextClass) {
      setStatus("Audio context is unavailable.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new AudioContextClass();
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;

      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);

      streamRef.current = stream;
      contextRef.current = context;
      analyserRef.current = analyser;
      dataRef.current = new Float32Array(analyser.fftSize);

      drawWaveform();
      analyzePitch();
    } catch (error) {
      console.error("Unable to start audio analysis", error);
      setStatus("Unable to access microphone.");
      stopAudio();
    }
  };

  const startMetronome = () => {
    const AudioContextClass = getAudioContextClass();
    if (!AudioContextClass) {
      setStatus("Metronome audio is unavailable.");
      return;
    }

    if (!metronomeAudioRef.current) {
      try {
        metronomeAudioRef.current = new AudioContextClass();
      } catch (error) {
        console.error("Unable to initialize metronome", error);
        setStatus("Unable to initialize metronome.");
        return;
      }
    }

    setRunning(true);
  };

  useEffect(() => {
    if (!running) return undefined;

    const interval = Math.max(120, Math.round(60000 / bpm));

    const timer = setInterval(() => {
      const currentBeat = beatRef.current;
      const nextBeat = (currentBeat + 1) % 4;
      beatRef.current = nextBeat;
      setBeat(nextBeat);
      expectedBeatTimeRef.current = performance.now();

      const context = metronomeAudioRef.current;
      if (!context) return;

      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.frequency.value = nextBeat === 0 ? 1200 : 880;
      gain.gain.value = 0.045;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.05);
    }, interval);

    return () => clearInterval(timer);
  }, [running, bpm]);

  const startSession = async () => {
    setStatus("");
    setMetrics({ pitchHits: 0, timingHits: 0, chordHits: 0, samples: 0 });
    setPitchHistory([]);
    setElapsed(0);

    if (tunerEnabled) {
      await startAudioAnalysis();
    } else {
      setStatus("Tuner is OFF. Enable tuner for pitch and chord tracking.");
    }

    startMetronome();

    setSessionActive(true);
    sessionTimerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
  };

  const stopSession = () => {
    stopAudio();
    stopMetronome();
    stopSessionTimer();
    setSessionActive(false);
  };

  const tapTempo = () => {
    const now = Date.now();
    tapRef.current.push(now);
    if (tapRef.current.length > 5) tapRef.current.shift();

    if (tapRef.current.length < 2) return;

    const intervals = [];
    for (let i = 1; i < tapRef.current.length; i += 1) {
      intervals.push(tapRef.current[i] - tapRef.current[i - 1]);
    }

    const avg = intervals.reduce((sum, item) => sum + item, 0) / intervals.length;
    const nextBpm = Math.round(60000 / avg);
    setBpm(Math.max(40, Math.min(200, nextBpm)));
  };

  useEffect(() => {
    return () => {
      stopAudio();
      stopMetronome();
      stopSessionTimer();
    };
  }, []);

  const needleRotate = pitchString ? Math.max(-45, Math.min(45, pitchString.cents * 1.6)) : 0;

  return (
    <Container className="space-y-8 py-20">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.18em] text-gray-400">Tools</p>
        <h1 className="text-4xl font-bold text-white">Metronome, Guitar Tuner, Live Feedback, Chord Loops</h1>
        <p className="max-w-3xl text-gray-300">Use focused tools to lock rhythm, tune accurately, and track chord precision in real time.</p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#141414] p-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#101010] p-4">
            <h2 className="text-lg font-semibold text-white">Chord Loops</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {chordLoops.map((loop) => (
                <button
                  key={loop.id}
                  type="button"
                  onClick={() => {
                    setTargetLoopId(loop.id);
                    setTargetChord(loop.chords[0]);
                  }}
                  className={`rounded-lg border px-3 py-2 text-xs transition hover:scale-[1.03] ${
                    targetLoopId === loop.id
                      ? "border-[#67bce7] bg-[#38bdf8]/20 text-[#d7f1ff]"
                      : "border-white/15 bg-[#0f0f0f] text-gray-300"
                  }`}
                >
                  {loop.label}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {activeLoop.chords.map((chord) => (
                <span key={chord} className="rounded-full border border-white/15 bg-[#0f0f0f] px-3 py-1 text-xs text-gray-300">
                  {chord}
                </span>
              ))}
            </div>

            <label className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#0f0f0f] px-3 py-2 text-sm">
              Target Chord
              <select value={targetChord} onChange={(event) => setTargetChord(event.target.value)} className="rounded bg-[#0a0a0a] px-2 py-1">
                {Object.keys(chordTargets).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#101010] p-4">
            <h2 className="text-lg font-semibold text-white">Metronome</h2>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#0f0f0f] px-3 py-2 text-sm">
                BPM
                <input
                  type="number"
                  min={40}
                  max={200}
                  value={bpm}
                  onChange={(event) => setBpm(Math.max(40, Math.min(200, Number(event.target.value) || 40)))}
                  className="w-16 rounded bg-[#0a0a0a] px-2 py-1"
                />
              </label>

              <Button mode={mode} variant="secondary" onClick={tapTempo}>
                Tap Tempo
              </Button>

              {running ? (
                <Button mode={mode} variant="secondary" onClick={stopMetronome}>
                  Stop Metronome
                </Button>
              ) : (
                <Button mode={mode} variant="secondary" onClick={startMetronome}>
                  Start Metronome
                </Button>
              )}
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <span
                  key={index}
                  className={`h-7 rounded border ${running && index === beat ? "border-[#f0b64f] bg-[#f59e0b]/35" : "border-white/10 bg-[#0f0f0f]"}`}
                />
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#0f0f0f] px-3 py-2 text-xs text-gray-300">
                <input type="checkbox" checked={tunerEnabled} onChange={(event) => setTunerEnabled(event.target.checked)} />
                Tuner ON
              </label>

              {!sessionActive ? (
                <Button mode={mode} onClick={startSession}>
                  Start Live Feedback
                </Button>
              ) : (
                <Button mode={mode} onClick={stopSession}>
                  Stop Live Feedback
                </Button>
              )}

              <span className="ml-auto text-sm text-gray-300">Session: {formatDuration(elapsed)}</span>
            </div>

            {status ? <p className="mt-3 text-sm text-gray-300">{status}</p> : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card mode={mode}>
          <h2 className="text-2xl font-semibold text-white">Live Feedback</h2>

          <div className="mt-4 rounded-xl border border-white/10 bg-[#101010] p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className={`h-4 w-4 rounded-full ${colorForFeedback(feedbackState)} shadow-[0_0_10px_rgba(255,255,255,0.3)]`} />
              <p className="text-sm text-gray-200">
                {feedbackState === "correct" ? "green = correct" : feedbackState === "close" ? "yellow = close" : "red = wrong"}
              </p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-[#0d0d0d] p-3">
                <p className="text-xs text-gray-400">Pitch Accuracy</p>
                <p className="mt-1 text-2xl font-bold text-white">{pitchAccuracyPercent}%</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#0d0d0d] p-3">
                <p className="text-xs text-gray-400">Timing</p>
                <p className="mt-1 text-2xl font-bold text-white">{msTimingDiff}ms</p>
                <p className="mt-1 text-xs text-gray-400">{timingLabel}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#0d0d0d] p-3">
                <p className="text-xs text-gray-400">Chord Accuracy</p>
                <p className="mt-1 text-2xl font-bold text-white">{chordAccuracyPercent}%</p>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-black">
              <canvas ref={waveformRef} width={900} height={180} className="h-44 w-full" />
            </div>
          </div>
        </Card>

        <Card mode={mode}>
          <h2 className="text-2xl font-semibold text-white">Guitar Tuner</h2>
          <div className="mt-4 rounded-xl border border-white/10 bg-[#101010] p-4">
            <p className="text-6xl font-bold text-[#f7d79c]">{tunerEnabled ? (pitchString ? pitchString.note : "--") : "OFF"}</p>
            <p className="mt-1 text-sm text-gray-300">
              {tunerEnabled ? `Auto string detect: ${pitchString ? pitchString.full : "Listening..."}` : "Enable tuner to detect notes and string pitch."}
            </p>

            <div className="relative mt-6 h-16">
              <div className="absolute left-1/2 top-8 h-1 w-56 -translate-x-1/2 rounded-full bg-white/15" />
              <div
                className="absolute left-1/2 top-2 h-10 w-1 -translate-x-1/2 origin-bottom rounded-full bg-[#f59e0b] transition-transform duration-200"
                style={{ transform: `translateX(-50%) rotate(${tunerEnabled ? needleRotate : 0}deg)` }}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {strings.map((item) => (
                <span
                  key={item.full}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm ${
                    pitchString?.full === item.full
                      ? "border-[#f0b64f] bg-[#f59e0b]/20 text-[#f7d79c]"
                      : "border-white/20 bg-[#111111] text-gray-300"
                  }`}
                >
                  {item.note}
                </span>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-[#0d0d0d] p-3">
              <p className="text-xs text-gray-400">Pitch Stability</p>
              <p className="mt-1 text-2xl font-bold text-white">{pitchStability}%</p>
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-[#0d0d0d] p-3">
              <p className="text-xs text-gray-400">Pitch Graph</p>
              <svg viewBox="0 0 100 100" className="mt-2 h-24 w-full rounded bg-black/40">
                <polyline points={pitchGraphPoints} fill="none" stroke="#f59e0b" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </Card>
      </section>
    </Container>
  );
};
