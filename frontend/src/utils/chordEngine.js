export const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const chordTemplates = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  major7: [0, 4, 7, 11],
  minor7: [0, 3, 7, 10],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  power: [0, 7]
};

const standardTuning = ["E", "A", "D", "G", "B", "E"];

const overrides = {
  F_major: {
    root: "F",
    quality: "major",
    displayName: "F major",
    positions: [1, 3, 3, 2, 1, 1],
    barre: "Barre at fret 1",
    source: "override"
  },
  Bm_minor: {
    root: "B",
    quality: "minor",
    displayName: "B minor",
    positions: [-1, 2, 4, 4, 3, 2],
    barre: "Barre from string 5 at fret 2",
    source: "override"
  }
};

const findNoteIndex = (note) => notes.indexOf(note);

const normalizeQuality = (quality) => (quality in chordTemplates ? quality : "major");

const findBestFret = (openStringNote, chordNoteSet) => {
  const openIndex = findNoteIndex(openStringNote);
  if (openIndex < 0) return -1;

  let best = -1;
  for (let fret = 0; fret <= 12; fret += 1) {
    const playedNote = notes[(openIndex + fret) % notes.length];
    if (chordNoteSet.has(playedNote)) {
      best = fret;
      break;
    }
  }
  return best;
};

export const generateChords = (root, quality = "major") => {
  const normalizedRoot = notes.includes(root) ? root : "C";
  const normalizedQuality = normalizeQuality(quality);

  const overrideKey = `${normalizedRoot}_${normalizedQuality}`;
  if (overrides[overrideKey]) {
    return overrides[overrideKey];
  }

  const rootIndex = findNoteIndex(normalizedRoot);
  const intervals = chordTemplates[normalizedQuality];
  const chordNoteSet = new Set(intervals.map((interval) => notes[(rootIndex + interval) % notes.length]));

  const positions = standardTuning.map((openStringNote) => findBestFret(openStringNote, chordNoteSet));

  return {
    root: normalizedRoot,
    quality: normalizedQuality,
    displayName: `${normalizedRoot} ${normalizedQuality}`,
    notes: Array.from(chordNoteSet),
    positions,
    source: "generated"
  };
};
