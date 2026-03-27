const slugify = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const LESSON_VIDEO_URL = "https://www.youtube.com/watch?v=iHVpX4_i4J4";

const chordDiagrams = {
  em: {
    name: "E Minor",
    frets: 4,
    dots: [
      { string: 5, fret: 2, finger: "2" },
      { string: 4, fret: 2, finger: "3" }
    ],
    openStrings: [6, 3, 2, 1],
    mutedStrings: []
  },
  gMajor: {
    name: "G Major",
    frets: 4,
    dots: [
      { string: 6, fret: 3, finger: "2" },
      { string: 5, fret: 2, finger: "1" },
      { string: 1, fret: 3, finger: "3" }
    ],
    openStrings: [4, 3, 2],
    mutedStrings: []
  },
  cMajor: {
    name: "C Major",
    frets: 4,
    dots: [
      { string: 5, fret: 3, finger: "3" },
      { string: 4, fret: 2, finger: "2" },
      { string: 2, fret: 1, finger: "1" }
    ],
    openStrings: [3, 1],
    mutedStrings: [6]
  }
};

const strummingPatterns = {
  down: ["↓", "↓", "↓", "↓"],
  downUp: ["↓", "↑", "↓", "↑"],
  firstRhythm: ["↓", "↓", "↑", "↑", "↓"]
};

const createLesson = ({ moduleSlug, title, type, mature, kids, visual = null, instagramUrl = "" }) => ({
  id: `${moduleSlug}-${slugify(title)}`,
  slug: slugify(title),
  title,
  type,
  videoUrl: LESSON_VIDEO_URL,
  instagramUrl,
  mature,
  kids,
  visual
});

const createModule = ({ order, title, lessons }) => {
  const slug = `module-${order}`;

  return {
    id: slug,
    slug,
    order,
    title,
    lessons: lessons.map((lesson) => createLesson({ ...lesson, moduleSlug: slug }))
  };
};

export const modules = [
  createModule({
    order: 1,
    title: "Module 1",
    lessons: [
      {
        title: "Holding the Guitar & First Sound",
        type: "strings",
        mature: {
          warmUp:
            "Sit straight. Place the guitar on your right leg. Keep your back straight, shoulders relaxed, and neck aligned. Rest your forearm lightly on the guitar body.",
          coreLearning:
            "Learn correct posture, how to hold the pick between thumb and index finger, and understand string names (E A D G B e from thick to thin).",
          practice:
            "Pluck each string slowly using only downward motion. Focus on producing a clean, isolated sound from each string.",
          challenge:
            "Play all 6 strings one by one without touching or muting adjacent strings.",
          ending: "You produced your first controlled sound. This is your foundation.",
          coachNote: "If your strings buzz, you're careless. Fix finger placement and pressure."
        },
        kids: {
          story: "You found a magical box 🎸… each string is a different voice!",
          steps: [
            "Sit like a calm explorer and hold your guitar gently",
            "Touch each string softly with your pick",
            "Listen… deep sound → tiny sound",
            "Your mission: wake all 6 strings without hurting them"
          ],
          reward: "✨ You unlocked the sound world!"
        },
        visual: {
          strings: ["E", "A", "D", "G", "B", "E"]
        }
      },
      {
        title: "Finger Strength & Control",
        type: "theory",
        mature: {
          warmUp: "Tap fingers on a table in sequence (1–2–3–4). Keep movement controlled and even.",
          coreLearning:
            "Finger numbering (Index = 1, Middle = 2, Ring = 3, Pinky = 4). Learn how each finger works independently.",
          practice:
            "Press the 1st fret on each string using each finger. Apply enough pressure to avoid buzzing.",
          challenge: "Play each note cleanly without buzzing or muting nearby strings.",
          ending: "Finger independence has started. This is critical for all future playing.",
          coachNote: "Weak fingers = slow progress. Fix it early."
        },
        kids: {
          story: "Your fingers are sleepy soldiers 😴",
          steps: [
            "Wake them one by one",
            "Tap them on a table like a marching army",
            "Press the string like pressing a button",
            "Make each sound clean and strong"
          ],
          reward: "🏆 Your finger army is ready!"
        }
      },
      {
        title: "First Chord – Em",
        type: "chord",
        instagramUrl: "https://www.instagram.com/strumify.in/",
        mature: {
          warmUp: "Repeat finger tapping and fret pressing exercise.",
          coreLearning: "Learn E minor chord using 2 fingers. Understand finger placement and string positioning.",
          practice: "Place fingers correctly and strum all strings slowly. Ensure every string rings clearly.",
          challenge: "Switch from open strings (no chord) to Em smoothly without hesitation.",
          ending: "You played your first real chord. This is your entry into music.",
          coachNote: "If it sounds bad, you're rushing. Slow down and fix it."
        },
        kids: {
          story: "You unlocked your first magic shape!",
          steps: [
            "Place your fingers carefully like building a small structure",
            "Strum all strings gently",
            "Listen… that’s music 🎶",
            "Try switching from no shape to your magic shape"
          ],
          reward: "✨ You created your first song sound!"
        },
        visual: {
          chord: chordDiagrams.em
        }
      }
    ]
  }),
  createModule({
    order: 2,
    title: "Module 2",
    lessons: [
      {
        title: "Chord – G Major",
        type: "chord",
        instagramUrl: "https://www.instagram.com/its.atmik/",
        mature: {
          warmUp: "Practice Em chord transitions slowly.",
          coreLearning: "Learn G major chord structure and finger stretch.",
          practice: "Switch between Em → G slowly, focusing on accuracy.",
          challenge: "Transition without pausing or breaking rhythm.",
          ending: "You are building chord control.",
          coachNote: "Speed comes after accuracy. Not before."
        },
        kids: {
          story: "Big giant chord unlocked!",
          steps: [
            "Stretch your fingers wide",
            "Jump from Em → G like hopping stones",
            "Keep it clean and steady"
          ],
          reward: "🏆 Your fingers are getting smarter!"
        },
        visual: {
          chord: chordDiagrams.gMajor
        }
      },
      {
        title: "Chord – C Major",
        type: "chord",
        mature: {
          warmUp: "Practice G chord placement repeatedly.",
          coreLearning: "Learn C major chord with proper finger stretch and spacing.",
          practice: "Transition from G → C slowly. Avoid muting strings.",
          challenge: "Play C chord cleanly every time.",
          ending: "You improved finger precision.",
          coachNote: "Bad positioning = bad sound. Fix it."
        },
        kids: {
          story: "This chord is a puzzle 🧩",
          steps: [
            "Place fingers one by one carefully",
            "Check each string sound",
            "Solve the puzzle slowly"
          ],
          reward: "✨ Puzzle solved!"
        },
        visual: {
          chord: chordDiagrams.cMajor
        }
      },
      {
        title: "First Chord Progression",
        type: "chord",
        mature: {
          warmUp: "Practice Em, G, and C individually.",
          coreLearning: "Combine chords into progression (Em → G → C).",
          practice: "Play progression slowly with consistent rhythm.",
          challenge: "Maintain flow without stopping between chords.",
          ending: "You are now playing real musical sequences.",
          coachNote: "If you stop between chords, you're not practicing properly."
        },
        kids: {
          story: "Now you play a mini song!",
          steps: [
            "Change shapes slowly",
            "Keep rhythm like walking 🚶",
            "Don’t stop, keep moving"
          ],
          reward: "🎸 You made music!"
        },
        visual: {
          chord: chordDiagrams.em
        }
      }
    ]
  }),
  createModule({
    order: 3,
    title: "Module 3",
    lessons: [
      {
        title: "Basic Strumming",
        type: "strumming",
        mature: {
          warmUp: "Practice holding pick loosely.",
          coreLearning: "Learn downstroke strumming pattern.",
          practice: "Count 1-2-3-4 and strum down on each beat.",
          challenge: "Keep rhythm steady without speeding up.",
          ending: "You understand basic rhythm control.",
          coachNote: "Rhythm matters more than speed."
        },
        kids: {
          story: "Like brushing the strings!",
          steps: ["Down… down… down…", "Keep it smooth and soft", "Follow the beat"],
          reward: "🎶 You found the beat!"
        },
        visual: {
          pattern: strummingPatterns.down
        }
      },
      {
        title: "Up & Down Strumming",
        type: "strumming",
        mature: {
          warmUp: "Practice downstrokes first.",
          coreLearning: "Introduce upstroke. Pattern: Down-Up.",
          practice: "Alternate down and up strokes evenly.",
          challenge: "Keep wrist relaxed and fluid.",
          ending: "You developed strumming flexibility.",
          coachNote: "Stiff wrist = bad guitarist."
        },
        kids: {
          story: "Like swinging!",
          steps: ["Down → Up → Down → Up", "Keep it light and fun", "Move like a swing"],
          reward: "✨ You found the groove!"
        },
        visual: {
          pattern: strummingPatterns.downUp
        }
      },
      {
        title: "First Rhythm Pattern",
        type: "strumming",
        instagramUrl: "https://www.instagram.com/shubh_musico/",
        mature: {
          warmUp: "Practice Down-Up pattern slowly.",
          coreLearning: "Learn pattern: Down Down Up Up Down.",
          practice: "Apply pattern to chord progression.",
          challenge: "Maintain timing without breaking pattern.",
          ending: "You built rhythm structure.",
          coachNote: "If timing breaks, restart."
        },
        kids: {
          story: "Secret rhythm code!",
          steps: ["Follow the pattern carefully", "Don’t rush", "Keep it steady"],
          reward: "🎸 You unlocked rhythm power!"
        },
        visual: {
          pattern: strummingPatterns.firstRhythm
        }
      }
    ]
  }),
  createModule({
    order: 4,
    title: "Module 4",
    lessons: [
      {
        title: "First Song Simulation",
        type: "theory",
        mature: {
          warmUp: "Practice full chord progression.",
          coreLearning: "Combine chords and rhythm into continuous play.",
          practice: "Play without stopping.",
          challenge: "Maintain flow even if mistakes happen.",
          ending: "You are now playing like a real guitarist.",
          coachNote: "Stopping = failure. Keep going."
        },
        kids: {
          story: "You’re playing a real song now!",
          steps: ["Keep going without stopping", "Enjoy the sound"],
          reward: "🏆 You are a guitarist now!"
        }
      },
      {
        title: "Timing & Flow",
        type: "theory",
        mature: {
          warmUp: "Practice slow strumming.",
          coreLearning: "Use metronome to stay in tempo.",
          practice: "Play chords with metronome clicks.",
          challenge: "Stay perfectly in time.",
          ending: "You developed timing discipline.",
          coachNote: "Timing > everything."
        },
        kids: {
          story: "Play with a ticking clock ⏱️",
          steps: ["Follow the beat", "Don’t go too fast"],
          reward: "✨ Perfect timing unlocked!"
        }
      },
      {
        title: "Confidence Play",
        type: "theory",
        mature: {
          warmUp: "Practice chord transitions.",
          coreLearning: "Build muscle memory by not looking at hands.",
          practice: "Play progression without looking.",
          challenge: "Maintain accuracy blindly.",
          ending: "You built confidence and control.",
          coachNote: "If you keep looking, you’re dependent."
        },
        kids: {
          story: "Close your eyes challenge!",
          steps: ["Trust your fingers", "Play without looking"],
          reward: "🎸 You became confident!"
        }
      }
    ]
  }),
  createModule({
    order: 5,
    title: "Module 5",
    lessons: [
      {
        title: "Finger Exercise Advanced",
        type: "theory",
        mature: {
          warmUp: "Basic finger tapping.",
          coreLearning: "1-2-3-4 exercise across fretboard.",
          practice: "Move across strings and frets.",
          challenge: "Increase speed without losing clarity.",
          ending: "You improved finger speed and control.",
          coachNote: "Sloppy practice = wasted time."
        },
        kids: {
          story: "Finger race!",
          steps: ["Move faster", "Stay clean"],
          reward: "🏁 You leveled up!"
        }
      },
      {
        title: "Smooth Transitions",
        type: "theory",
        mature: {
          warmUp: "Practice slow chord switching.",
          coreLearning: "Reduce delay between chord changes.",
          practice: "Switch chords continuously.",
          challenge: "No pause transitions.",
          ending: "You improved fluidity.",
          coachNote: "Delay = weakness."
        },
        kids: {
          story: "Jump between shapes!",
          steps: ["Move quickly", "Stay smooth"],
          reward: "✨ Super fast fingers!"
        }
      },
      {
        title: "Mini Performance",
        type: "theory",
        mature: {
          warmUp: "Practice full progression.",
          coreLearning: "Perform complete sequence confidently.",
          practice: "Record yourself playing.",
          challenge: "Play without stopping and review mistakes.",
          ending: "You completed your first performance.",
          coachNote: "If it sounds bad, fix it."
        },
        kids: {
          story: "Perform like a star 🌟",
          steps: ["Play your full song", "Record and watch yourself"],
          reward: "🎸 You did your first show!"
        }
      }
    ]
  })
];

export const course = {
  id: "strumify-premium",
  title: "Strumify",
  modules
};

export const allLessons = modules.flatMap((moduleDoc) => (Array.isArray(moduleDoc.lessons) ? moduleDoc.lessons : []));
