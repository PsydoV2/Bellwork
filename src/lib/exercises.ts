import type { Frame, V3, ViewName } from "./skeleton";

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type Category = "Ballistic" | "Strength" | "Legs" | "Upper Body" | "Full Body" | "Core";
/** How an exercise is loaded: one bell in one hand, one bell in both hands, or a bell in each hand. */
export type VariantLabel = "One arm" | "Two hands" | "Two bells";

export interface Exercise {
  id: string;
  name: string;
  subtitle: string;
  category: Category;
  muscles: string[];
  description: string;
  /** Step-by-step technique cues, in order of the movement. */
  cues: string[];
  /** Typical mistakes to avoid. */
  mistakes: string[];
  difficulty: Difficulty;
  /** Performed one side at a time. The animation shows the right side; the left side is mirrored. */
  unilateral: boolean;
  /** Duration of one animation cycle (= one repetition) in ms. */
  duration: number;
  frames: Frame[];
  /** Camera views shown. Default: front + side. */
  views?: ViewName[];
  defaultReps: number;
  /** Suggested mode when added to a plan (default: reps). */
  defaultMode?: "reps" | "time";
  /** Set automatically from VARIANT_GROUPS: the same movement loaded differently. */
  variant?: { group: string; label: VariantLabel };
}

// ---------------------------------------------------------------------------
// Authoring helpers (see skeleton.ts for the coordinate system)
// ---------------------------------------------------------------------------
const sin = (d: number) => Math.sin((d * Math.PI) / 180);
const cos = (d: number) => Math.cos((d * Math.PI) / 180);

/** Feet at ±halfWidth, toes turned out by `out` degrees. */
const stance = (halfWidth: number, out = 12, z = 0) => ({
  footR: [halfWidth, 8, z] as V3,
  footL: [-halfWidth, 8, z] as V3,
  toeR: [sin(out), -0.35, cos(out)] as V3,
  toeL: [-sin(out), -0.35, cos(out)] as V3,
});
/** Knees track over the toes. */
const knees = (out: number) => ({
  kneeR: [sin(out), 0, cos(out)] as V3,
  kneeL: [-sin(out), 0, cos(out)] as V3,
});
const elbows = (x: number, y: number, z: number) => ({
  elbowR: [x, y, z] as V3,
  elbowL: [-x, y, z] as V3,
});

const STAND: V3 = [0, 93, 0];
const STAND_TALL: V3 = [0, 94, 0];

// --- Swing family ------------------------------------------------------------
const swingBase = { ...stance(20, 15), ...knees(20) };
const swingTop: Frame = { ...swingBase, pelvis: STAND, hold: "both", bell: [0, 135, 60], bellDir: [0, 0.05, 1], ...elbows(0.4, -1, 0) };
const swingDown: Frame = { ...swingBase, pelvis: STAND, torso: { pitch: 4 }, hold: "both", bell: [0, 92, 26], bellDir: [0, -1, 0.2] };
const swingBottom: Frame = { ...swingBase, pelvis: [0, 80, -22], torso: { pitch: 58 }, hold: "both", bell: [0, 62, -17], bellDir: [0, 0.25, -1] };
const swingUp: Frame = { ...swingDown, bellDir: [0, -0.4, 1] };

// --- Single-arm positions (right hand) ----------------------------------------
const sa = { ...stance(16, 15), ...knees(15) };
const FREE_L: V3 = [-21, 84, 4];
const backswingR: Frame = {
  ...sa,
  pelvis: [0, 80, -22],
  torso: { pitch: 60 },
  hold: "R",
  handR: [1, 62, -18],
  handL: [-20, 62, 8],
  bellDir: [0, 0.2, -1],
  elbowR: [0.3, -0.2, -1],
};
const cleanDriveR: Frame = {
  ...sa,
  pelvis: STAND,
  torso: { pitch: -2 },
  hold: "R",
  handR: [6, 100, 17],
  handL: [-22, 84, 6],
  bellDir: [0, -1, 0.3],
  elbowR: [0.3, -0.3, -1],
};
const rackR: Frame = {
  ...sa,
  pelvis: STAND,
  hold: "R",
  handR: [7, 128, 17],
  handL: FREE_L,
  bellDir: [0.55, -0.6, -0.55],
  elbowR: [0.1, -1, 0.15],
};
const pressMidR: Frame = {
  ...sa,
  pelvis: STAND_TALL,
  hold: "R",
  handR: [30, 165, 6],
  handL: FREE_L,
  bellDir: [0.5, -0.6, -0.6],
  elbowR: [1, -0.6, 0.2],
};
const lockoutR: Frame = {
  ...sa,
  pelvis: STAND_TALL,
  hold: "R",
  handR: [15, 204, 0],
  handL: FREE_L,
  bellDir: [0.35, -0.45, -0.82],
  elbowR: [0.8, 0, 0.3],
};

// --- Goblet hold (both hands on the horns, bell bottom-down at the chest) -----
const gobletBase = { ...stance(20, 22), ...knees(28), ...elbows(0.3, -1, 0.1) };
const gobletTop: Frame = { ...gobletBase, pelvis: STAND, torso: { pitch: 3 }, hold: "both", bell: [0, 128, 22] };
const gobletBottom: Frame = {
  ...gobletBase,
  pelvis: [0, 45, -18],
  torso: { pitch: 30 },
  hold: "both",
  bell: [0, 70, 26],
  ...elbows(0.2, -1, 0.2),
};

// --- Lying on the back -----------------------------------------------------------
const lying = {
  pelvis: [0, 10, 30] as V3,
  torso: { pitch: -90 },
  footR: [13, 8, 70] as V3,
  footL: [-13, 8, 70] as V3,
  toeR: [0.2, -0.3, 1] as V3,
  toeL: [-0.2, -0.3, 1] as V3,
  kneeR: [0.15, 1, 0] as V3,
  kneeL: [-0.15, 1, 0] as V3,
};

// --- Halo positions (bell held upside-down by the horns) -------------------------
const haloBase = { ...stance(14, 10), pelvis: STAND, hold: "both" as const };
const haloFront: Frame = { ...haloBase, bell: [0, 140, 24], bellDir: [0, 1, 0.15], axis: [1, 0, 0], ...elbows(0.7, -0.7, 0.2), w: 0.5 };
const haloRight: Frame = {
  ...haloBase,
  bell: [23, 166, 3],
  bellDir: [0.45, 0.9, 0],
  axis: [0, 0, -1],
  elbowR: [0.8, -0.5, 0.2],
  elbowL: [0, -0.4, 1],
  w: 0.5,
};
const haloBack: Frame = { ...haloBase, bell: [0, 156, -21], bellDir: [0, -1, -0.25], axis: [1, 0, 0], ...elbows(0.5, 0.4, 0.8), w: 0.5 };
const haloLeft: Frame = {
  ...haloBase,
  bell: [-23, 166, 3],
  bellDir: [-0.45, 0.9, 0],
  axis: [0, 0, 1],
  elbowR: [0, -0.4, 1],
  elbowL: [-0.8, -0.5, 0.2],
  w: 0.5,
};

// --- Curls ------------------------------------------------------------------------
const curlBase = { ...stance(12, 10), pelvis: STAND_TALL, hold: "both" as const };
const curlHang: Frame = { ...curlBase, bell: [0, 84, 16] };
const curlTop: Frame = { ...curlBase, bell: [0, 128, 22], ...elbows(0.15, -1, -0.2) };

// --- Seated -----------------------------------------------------------------------
const straddle = {
  pelvis: [0, 11, 0] as V3,
  footR: [62, 6, 62] as V3,
  footL: [-62, 6, 62] as V3,
  toeR: [0.25, 1, 0.15] as V3,
  toeL: [-0.25, 1, 0.15] as V3,
  kneeR: [0, 1, 0] as V3,
  kneeL: [0, 1, 0] as V3,
  hold: "both" as const,
};
const twistSeat = {
  pelvis: [0, 11, 0] as V3,
  footR: [14, 8, 46] as V3,
  footL: [-14, 8, 46] as V3,
  toeR: [0.2, -0.3, 1] as V3,
  toeL: [-0.2, -0.3, 1] as V3,
  kneeR: [0.1, 1, 0.3] as V3,
  kneeL: [-0.1, 1, 0.3] as V3,
  hold: "both" as const,
};

// --- Two bells -------------------------------------------------------------------
const mirrorV = (v: V3): V3 => [-v[0], v[1], v[2]];
/** Turn a right-hand single-bell frame into a two-bell frame: the left arm mirrors the right. */
const doubled = (f: Frame): Frame => ({
  ...f,
  hold: "double",
  handL: mirrorV(f.handR!),
  elbowL: f.elbowR ? mirrorV(f.elbowR) : undefined,
});

// --- Bent-over row hinge --------------------------------------------------------
const rowHinge = { ...stance(14, 10), ...knees(15), pelvis: [0, 86, -22] as V3, torso: { pitch: 60 } };

// --- Front rack squat (right hand) ------------------------------------------------
const fsBase = { ...stance(20, 22), ...knees(28) };
const fsTopR: Frame = { ...fsBase, pelvis: STAND, hold: "R", handR: [7, 128, 17], handL: [-21, 86, 8], bellDir: [0.55, -0.6, -0.55], elbowR: [0.1, -1, 0.15] };
const fsBottomR: Frame = {
  ...fsBase,
  pelvis: [0, 48, -16],
  torso: { pitch: 20 },
  hold: "R",
  handR: [7, 75, 12],
  handL: [-22, 50, 30],
  bellDir: [0.55, -0.38, -0.72],
  elbowR: [0.1, -0.95, -0.2],
  elbowL: [-0.5, -0.6, -0.4],
};

// --- Single-arm curl --------------------------------------------------------------
const curlHangR: Frame = { ...stance(12, 10), pelvis: STAND_TALL, hold: "R", handR: [24, 86, 8], handL: [-21, 85, 4], elbowR: [0.1, -1, -0.3] };
const curlTopR: Frame = { ...curlHangR, handR: [19, 124, 28], elbowR: [0.1, -1, -0.2] };

// --- Floor press (right hand) -----------------------------------------------------
const floorBottomR: Frame = { ...lying, hold: "R", handR: [30, 30, -12], handL: [-6, 18, 8], elbowR: [1, -1, 0.6], elbowL: [-1, 0, 0], bellDir: [0.7, -0.3, 0.2] };
const floorTopR: Frame = { ...lying, hold: "R", handR: [17, 72, -17], handL: [-6, 18, 8], elbowR: [1, 0, 0.3], elbowL: [-1, 0, 0], bellDir: [0.3, -0.9, 0.1] };

// --- Carries (marching in place) --------------------------------------------------
const stepR = { pelvis: [0, 94, 0] as V3, footR: [11, 24, 12] as V3, toeR: [0.15, -0.6, 0.8] as V3, kneeR: [0.15, 0.3, 1] as V3, footL: [-11, 8, 0] as V3 };
const stepL = { pelvis: [0, 94, 0] as V3, footL: [-11, 24, 12] as V3, toeL: [-0.15, -0.6, 0.8] as V3, kneeL: [-0.15, 0.3, 1] as V3, footR: [11, 8, 0] as V3 };
const feetTogether = { pelvis: STAND, footR: [11, 8, 0] as V3, footL: [-11, 8, 0] as V3 };
const march = (hands: Partial<Frame>): Frame[] => [
  { ...feetTogether, ...hands, w: 0.5 } as Frame,
  { ...stepR, ...hands, w: 0.5 } as Frame,
  { ...feetTogether, ...hands, w: 0.5 } as Frame,
  { ...stepL, ...hands, w: 0.5 } as Frame,
];

// --- Gorilla row: very wide stance, deep hinge, bells on the floor between the feet ---
const gorilla = { ...stance(34, 30), ...knees(50), pelvis: [0, 60, -20] as V3, torso: { pitch: 60 } };
const gorillaFloor: Frame = { ...gorilla, hold: "double", handR: [12, 25.5, 22], handL: [-12, 25.5, 22], elbowR: [0.5, 0, -1], elbowL: [-0.5, 0, -1] };

// --- Plank on two bells (renegade row) ---------------------------------------------
const plank = {
  pelvis: [0, 57, -21] as V3,
  torso: { pitch: 56 },
  footR: [14, 12, -92] as V3,
  footL: [-14, 12, -92] as V3,
  toeR: [0, -0.6, 0.8] as V3,
  toeL: [0, -0.6, 0.8] as V3,
  kneeR: [0.1, -1, 0] as V3,
  kneeL: [-0.1, -1, 0] as V3,
};
const plankFloor: Frame = { ...plank, hold: "double", handR: [13, 25.5, 22], handL: [-13, 25.5, 22], elbowR: [0.3, 0, -1], elbowL: [-0.3, 0, -1] };

// --- Windmill (bell overhead in the right hand, feet turned to the left) -------------
const windFeet = {
  footR: [20, 8, 0] as V3,
  footL: [-20, 8, 0] as V3,
  toeR: [-0.6, -0.35, 0.75] as V3,
  toeL: [-0.6, -0.35, 0.75] as V3,
  kneeR: [-0.5, 0, 0.8] as V3,
  kneeL: [-0.6, 0, 0.8] as V3,
  pelvisYaw: -30,
};

// ---------------------------------------------------------------------------
export const EXERCISES: Exercise[] = [
  {
    id: "swing",
    name: "Kettlebell Swing",
    subtitle: "Two-hand Russian swing",
    category: "Ballistic",
    muscles: ["Glutes", "Hamstrings", "Core", "Back"],
    description:
      "The foundational ballistic kettlebell move. The power comes from a fast hip hinge and hip snap – the arms only guide the bell up to chest height.",
    cues: [
      "Feet slightly wider than hips, bell on the floor in front of you",
      "Hike the bell back high between your thighs, hips back, flat back",
      "Snap your hips forward and squeeze the glutes – stand tall like a plank",
      "Let the bell float to chest height with straight, relaxed arms",
      "Let it fall, keep standing until your forearms touch your hips, then hinge",
    ],
    mistakes: ["Squatting instead of hinging", "Lifting the bell with the arms", "Leaning back at the top"],
    difficulty: "Beginner",
    unilateral: false,
    duration: 1500,
    frames: [
      { ...swingTop, pause: 0.1, w: 0.55 },
      { ...swingDown, w: 0.4 },
      { ...swingBottom, w: 0.4 },
      { ...swingUp, w: 0.55 },
    ],
    defaultReps: 15,
  },
  {
    id: "american-swing",
    name: "American Swing",
    subtitle: "Two-hand swing to overhead",
    category: "Ballistic",
    muscles: ["Glutes", "Hamstrings", "Shoulders", "Core"],
    description:
      "Like the Russian swing, but the bell travels all the way overhead until it is upside-down above you, arms straight.",
    cues: [
      "Same powerful hip snap as the Russian swing",
      "Keep guiding the bell up until it is directly overhead, bottom pointing up",
      "Arms locked out by the ears, ribs down – do not arch the lower back",
      "Let it fall back down and hinge as the forearms reach the hips",
    ],
    mistakes: ["Over-arching the back at the top", "Pulling with the arms instead of driving with the hips", "Bell drifting behind the head"],
    difficulty: "Intermediate",
    unilateral: false,
    duration: 1900,
    frames: [
      { ...swingBase, pelvis: STAND_TALL, hold: "both", bell: [0, 203, 6], bellDir: [0, 1, 0.05], ...elbows(0.7, 0, 0.3), pause: 0.1, w: 0.45 },
      { ...swingTop, bellDir: [0, 0.6, 0.8], w: 0.35 },
      { ...swingDown, w: 0.4 },
      { ...swingBottom, w: 0.4 },
      { ...swingUp, w: 0.35 },
      { ...swingTop, bellDir: [0, 0.6, 0.8], w: 0.45 },
    ],
    defaultReps: 12,
  },
  {
    id: "one-arm-swing",
    name: "One-Arm Swing",
    subtitle: "Single-arm Russian swing",
    category: "Ballistic",
    muscles: ["Glutes", "Hamstrings", "Core", "Shoulders"],
    description:
      "A swing with one hand. Your trunk has to resist the rotation, so shoulders and hips must stay square.",
    cues: [
      "Grip the handle in the middle, thumb pointing back at the bottom",
      "Shoulders square to the front – do not let the bell twist you",
      "Free arm stays relaxed next to the body",
      "Hip snap, bell floats to chest height",
    ],
    mistakes: ["Rotating the shoulders", "Shrugging the working shoulder"],
    difficulty: "Intermediate",
    unilateral: true,
    duration: 1500,
    frames: [
      { ...swingTop, hold: "R", handR: [4, 135, 60], handL: [-22, 95, 12], pause: 0.1, w: 0.55 },
      { ...swingDown, hold: "R", handR: [2, 92, 26], handL: [-22, 86, 6], w: 0.4 },
      { ...swingBottom, hold: "R", handR: [1, 62, -17], handL: [-20, 56, 10], w: 0.4 },
      { ...swingUp, hold: "R", handR: [2, 92, 26], handL: [-22, 86, 6], w: 0.55 },
    ],
    defaultReps: 10,
  },
  {
    id: "goblet-squat",
    name: "Goblet Squat",
    subtitle: "Squat holding the bell at the chest",
    category: "Legs",
    muscles: ["Quads", "Glutes", "Adductors", "Core"],
    description:
      "Hold the bell by the horns in front of your chest. The front-loaded weight makes it easy to squat deep with an upright torso.",
    cues: [
      "Feet shoulder width, toes slightly out",
      "Bell close to the chest, elbows pointing down",
      "Sit down between your heels, knees push out over the toes",
      "Go as deep as you can with a neutral back, elbows between the knees",
      "Drive up through the whole foot",
    ],
    mistakes: ["Heels lifting", "Knees caving in", "Rounding the lower back at the bottom"],
    difficulty: "Beginner",
    unilateral: false,
    duration: 3000,
    frames: [
      { ...gobletTop, pause: 0.2, w: 1.2 },
      { ...gobletBottom, pause: 0.25, w: 1.2 },
    ],
    defaultReps: 12,
  },
  {
    id: "sumo-squat",
    name: "Sumo Squat",
    subtitle: "Wide-stance squat, bell hanging",
    category: "Legs",
    muscles: ["Adductors", "Glutes", "Quads"],
    description: "Wide stance, toes turned out, the bell hangs from straight arms between your legs.",
    cues: [
      "Stance clearly wider than shoulders, toes out ~40°",
      "Torso stays upright, arms hang long",
      "Push the knees out in line with the toes",
      "Lower until the thighs are about parallel, then stand up",
    ],
    mistakes: ["Knees collapsing inwards", "Leaning forward"],
    difficulty: "Beginner",
    unilateral: false,
    duration: 3000,
    frames: [
      { ...stance(32, 40, 4), ...knees(48), pelvis: [0, 92, 0], hold: "both", bell: [0, 84, 8], pause: 0.2, w: 1.2 },
      { ...stance(32, 40, 4), ...knees(48), pelvis: [0, 52, -6], torso: { pitch: 15 }, hold: "both", bell: [0, 40, 10], pause: 0.2, w: 1.2 },
    ],
    defaultReps: 12,
  },
  {
    id: "deadlift",
    name: "Deadlift",
    subtitle: "Two-hand kettlebell deadlift",
    category: "Strength",
    muscles: ["Hamstrings", "Glutes", "Lower back"],
    description:
      "The bell stands between your feet. Hinge at the hips with a flat back, grip it with both hands and stand up.",
    cues: [
      "Bell between the feet, in line with the middle of the foot",
      "Push the hips back, slight knee bend, flat back",
      "Shoulders slightly in front of the bell, arms straight",
      "Stand up by driving the hips forward, squeeze the glutes",
      "Lower the same way, bell touches the floor lightly",
    ],
    mistakes: ["Rounded back", "Bell too far in front of the feet", "Over-extending at the top"],
    difficulty: "Beginner",
    unilateral: false,
    duration: 3000,
    frames: [
      { ...stance(16, 12), pelvis: STAND, hold: "both", bell: [0, 84, 16], pause: 0.3, w: 1.2 },
      { ...stance(16, 12), ...knees(20), pelvis: [0, 66, -30], torso: { pitch: 65 }, hold: "both", bell: [0, 26, 8], pause: 0.25, w: 1.2 },
    ],
    defaultReps: 12,
  },
  {
    id: "single-leg-deadlift",
    name: "Single-Leg Deadlift",
    subtitle: "One-leg Romanian deadlift",
    category: "Strength",
    muscles: ["Hamstrings", "Glutes", "Core", "Balance"],
    description:
      "Stand on the left leg with the bell in the right hand. Hinge forward while the right leg extends straight behind you.",
    cues: [
      "Standing knee soft, not locked",
      "Hinge at the hip – torso and back leg move as one straight line",
      "Keep the hips square to the floor, toes of the back leg point down",
      "Bell hangs straight below the shoulder",
      "Stand back up by squeezing the glute of the standing leg",
    ],
    mistakes: ["Opening the hip of the lifted leg", "Rounding the back", "Locking the standing knee"],
    difficulty: "Intermediate",
    unilateral: true,
    duration: 3400,
    frames: [
      {
        pelvis: STAND,
        footR: [11, 9, -4],
        footL: [-11, 8, 0],
        hold: "R",
        handR: [18, 82, 19],
        handL: [-19, 82, 4],
        pause: 0.2,
        w: 1.3,
      },
      {
        pelvis: [0, 88, -8],
        torso: { pitch: 80 },
        footR: [10, 73, -92],
        toeR: [0, -1, 0.05],
        kneeR: [0, -1, 0],
        footL: [-11, 8, 0],
        kneeL: [-0.1, 0, 1],
        hold: "R",
        handR: [17, 36, 42],
        handL: [-20, 40, 40],
        pause: 0.2,
        w: 1.3,
      },
    ],
    defaultReps: 8,
  },
  {
    id: "clean",
    name: "Clean",
    subtitle: "Swing into the rack position",
    category: "Ballistic",
    muscles: ["Glutes", "Hamstrings", "Back", "Forearms"],
    description:
      "From a backswing the bell travels close to the body into the rack position: resting on the forearm against the chest.",
    cues: [
      "Hike the bell back like a swing",
      "Hip snap, then pull the elbow back close to the ribs",
      "Rotate the hand around the handle – do not let the bell flip over and bang the wrist",
      "Rack: wrist straight, forearm vertical, elbow tucked to the ribs",
      "Drop it back into the next backswing",
    ],
    mistakes: ["Bell swinging wide (arcing)", "Bent wrist in the rack", "Elbow flaring out"],
    difficulty: "Intermediate",
    unilateral: true,
    duration: 2400,
    frames: [
      { ...backswingR, w: 0.6 },
      { ...cleanDriveR, w: 0.5 },
      { ...rackR, pause: 0.5, w: 0.6 },
      { ...cleanDriveR, w: 0.6 },
    ],
    defaultReps: 8,
  },
  {
    id: "press",
    name: "Overhead Press",
    subtitle: "Strict single-arm press",
    category: "Upper Body",
    muscles: ["Shoulders", "Triceps", "Upper back", "Core"],
    description: "From the rack position the bell is pressed overhead without any help from the legs.",
    cues: [
      "Start in the rack, whole body tight: glutes, abs, grip",
      "Press up and slightly out, forearm stays vertical",
      "Lock out with the biceps next to the ear, bell resting on the back of the forearm",
      "Pull the bell back down into the rack under control",
    ],
    mistakes: ["Leaning back", "Bending the knees (that's a push press)", "Bent wrist"],
    difficulty: "Beginner",
    unilateral: true,
    duration: 3000,
    frames: [
      { ...rackR, pause: 0.35, w: 0.8 },
      { ...pressMidR, w: 0.6 },
      { ...lockoutR, pause: 0.35, w: 0.9 },
      { ...pressMidR, w: 0.9 },
    ],
    defaultReps: 8,
  },
  {
    id: "push-press",
    name: "Push Press",
    subtitle: "Leg-driven single-arm press",
    category: "Full Body",
    muscles: ["Shoulders", "Triceps", "Quads", "Glutes"],
    description: "A short dip and explosive leg drive launch the bell from the rack; the arm finishes the lockout.",
    cues: [
      "Start in the rack position, torso upright",
      "Quick, short dip: bend only the knees, heels stay down",
      "Drive explosively through the legs and press at the same moment",
      "Lock out overhead, legs straight",
      "Lower the bell back to the rack",
    ],
    mistakes: ["Dipping too deep (turning it into a squat)", "Hips pushing back in the dip", "Pressing before the legs drive"],
    difficulty: "Intermediate",
    unilateral: true,
    duration: 2600,
    frames: [
      { ...rackR, pause: 0.3, w: 0.45 },
      { ...rackR, pelvis: [0, 83, -3], handR: [7, 118, 14], ...knees(15), w: 0.3 },
      { ...pressMidR, handR: [16, 166, 10], w: 0.35 },
      { ...lockoutR, pause: 0.35, w: 0.6 },
      { ...pressMidR, w: 0.6 },
    ],
    defaultReps: 8,
  },
  {
    id: "clean-press",
    name: "Clean & Press",
    subtitle: "Clean into a strict press",
    category: "Full Body",
    muscles: ["Glutes", "Shoulders", "Back", "Core"],
    description: "Clean the bell into the rack, pause, press it overhead, return to the rack and drop into the next backswing.",
    cues: [
      "Clean the bell into a clean rack, pause briefly",
      "Press strictly overhead",
      "Return to the rack, then drop into the backswing",
    ],
    mistakes: ["Pressing out of an unstable rack", "Leaning back during the press"],
    difficulty: "Intermediate",
    unilateral: true,
    duration: 4200,
    frames: [
      { ...backswingR, w: 0.6 },
      { ...cleanDriveR, w: 0.5 },
      { ...rackR, pause: 0.3, w: 0.6 },
      { ...pressMidR, w: 0.6 },
      { ...lockoutR, pause: 0.3, w: 0.6 },
      { ...pressMidR, w: 0.6 },
      { ...rackR, pause: 0.2, w: 0.6 },
      { ...cleanDriveR, w: 0.5 },
    ],
    defaultReps: 6,
  },
  {
    id: "snatch",
    name: "Snatch",
    subtitle: "Swing straight to overhead",
    category: "Ballistic",
    muscles: ["Glutes", "Hamstrings", "Shoulders", "Back"],
    description:
      "In one fluid movement the bell travels from the backswing to a locked-out overhead position.",
    cues: [
      "Backswing like a swing, explosive hip snap",
      "Pull the elbow high, bell stays close to the body",
      "Punch your hand through the handle at the top so the bell lands softly on the forearm",
      "Lock out overhead, biceps by the ear",
      "Turn the bell over and let it drop in front of you into the next backswing",
    ],
    mistakes: ["Bell banging on the forearm", "Pressing it up instead of using the hips", "Wide arc away from the body"],
    difficulty: "Advanced",
    unilateral: true,
    duration: 2600,
    frames: [
      { ...backswingR, w: 0.45 },
      { ...cleanDriveR, w: 0.25 },
      { ...cleanDriveR, torso: { pitch: -2 }, pelvis: STAND_TALL, handR: [16, 128, 22], elbowR: [0.7, 0.6, -0.3], bellDir: [0, -1, 0.2], w: 0.3 },
      { ...lockoutR, handR: [24, 174, 12], elbowR: [0.9, 0, 0.3], bellDir: [0.6, -0.2, -0.6], w: 0.25 },
      { ...lockoutR, pause: 0.35, w: 0.5 },
      { ...lockoutR, handR: [10, 140, 45], elbowR: [0.4, -0.5, -0.6], bellDir: [0, 0.3, 1], w: 0.45 },
      { ...cleanDriveR, pelvis: [0, 90, -4], torso: { pitch: 10 }, handR: [6, 95, 18], bellDir: [0, -0.6, 0.8], w: 0.5 },
    ],
    defaultReps: 8,
  },
  {
    id: "high-pull",
    name: "Sumo High Pull",
    subtitle: "Wide-stance pull to the chest",
    category: "Full Body",
    muscles: ["Traps", "Shoulders", "Glutes", "Hamstrings"],
    description: "From a wide-stance hinge, drive up explosively and pull the bell to upper-chest height with high elbows.",
    cues: [
      "Wide stance, toes out, bell between the feet",
      "Hips back, chest up, arms straight",
      "Drive up with the legs and hips first",
      "Then pull the bell up close to the body, elbows high and wide",
      "Lower under control back to the start",
    ],
    mistakes: ["Pulling with the arms before the hips extend", "Elbows below the hands at the top", "Rounding the back"],
    difficulty: "Intermediate",
    unilateral: false,
    duration: 2400,
    frames: [
      { ...stance(30, 35, 2), ...knees(45), pelvis: [0, 56, -14], torso: { pitch: 45 }, hold: "both", bell: [0, 32, 6], w: 0.7 },
      { ...stance(30, 35, 2), ...knees(45), pelvis: [0, 92, 0], hold: "both", bell: [0, 88, 15], ...elbows(0.6, 0.2, -0.6), w: 0.45 },
      { ...stance(30, 35, 2), ...knees(45), pelvis: [0, 92, 0], hold: "both", bell: [0, 136, 20], ...elbows(1, 0.9, -0.2), pause: 0.15, w: 0.55 },
      { ...stance(30, 35, 2), ...knees(45), pelvis: [0, 92, 0], hold: "both", bell: [0, 88, 15], ...elbows(0.6, 0.2, -0.6), w: 0.5 },
    ],
    defaultReps: 10,
  },
  {
    id: "thruster",
    name: "Thruster",
    subtitle: "Goblet squat into overhead press",
    category: "Full Body",
    muscles: ["Quads", "Glutes", "Shoulders", "Triceps"],
    description:
      "Squat deep holding the bell by the horns, then drive up and use the momentum to press it overhead in one movement.",
    cues: [
      "Goblet hold, elbows down",
      "Squat deep with an upright chest",
      "Drive up explosively – as you stand, press the bell overhead",
      "Lock out with straight arms, ribs down",
      "Bring the bell back to the chest and go into the next squat",
    ],
    mistakes: ["Pressing only after standing still (lose the momentum)", "Arching the back overhead"],
    difficulty: "Intermediate",
    unilateral: false,
    duration: 3400,
    frames: [
      { ...gobletTop, w: 1 },
      { ...gobletBottom, pause: 0.1, w: 0.5 },
      { ...gobletTop, w: 0.35 },
      { ...gobletTop, pelvis: STAND_TALL, torso: { pitch: 0 }, bell: [0, 195, 26], ...elbows(0.7, -0.2, 0.5), w: 0.3 },
      { ...gobletTop, pelvis: STAND_TALL, torso: { pitch: 0 }, bell: [0, 203, 6], ...elbows(0.7, 0, 0.3), pause: 0.3, w: 0.35 },
      { ...gobletTop, pelvis: STAND_TALL, torso: { pitch: 0 }, bell: [0, 195, 26], ...elbows(0.7, -0.2, 0.5), w: 0.5 },
    ],
    defaultReps: 10,
  },
  {
    id: "row",
    name: "Bent-Over Row",
    subtitle: "Single-arm row in a hip hinge",
    category: "Upper Body",
    muscles: ["Lats", "Upper back", "Biceps", "Rear delts"],
    description: "Hinge forward with a flat back, free hand on the thigh, and row the bell to your hip.",
    cues: [
      "Hip-width stance, hinge until the torso is about 30° above horizontal",
      "Free hand rests on the thigh, back flat, neck neutral",
      "Bell hangs straight under the shoulder",
      "Pull the elbow back towards the hip, shoulder blade squeezes back",
      "Lower slowly until the arm is straight",
    ],
    mistakes: ["Rotating the torso to lift the bell", "Rounded back", "Pulling the bell to the chest instead of the hip"],
    difficulty: "Beginner",
    unilateral: true,
    duration: 2600,
    frames: [
      {
        ...stance(14, 10),
        ...knees(15),
        pelvis: [0, 86, -22],
        torso: { pitch: 60 },
        hold: "R",
        handR: [21, 50, 22],
        handL: [-13, 68, -4],
        elbowR: [0.3, 0.2, -1],
        pause: 0.2,
        w: 0.9,
      },
      {
        ...stance(14, 10),
        ...knees(15),
        pelvis: [0, 86, -22],
        torso: { pitch: 60 },
        hold: "R",
        handR: [21, 92, -6],
        handL: [-13, 68, -4],
        elbowR: [0.2, 0.7, -1],
        pause: 0.25,
        w: 1.1,
      },
    ],
    defaultReps: 10,
  },
  {
    id: "reverse-lunge",
    name: "Reverse Lunge",
    subtitle: "Goblet-hold step back",
    category: "Legs",
    muscles: ["Quads", "Glutes", "Adductors"],
    description: "Holding the bell at your chest, step back with the right leg and lower until the back knee nearly touches the floor.",
    cues: [
      "Stand tall, bell in the goblet hold",
      "Take a long step back, land on the ball of the back foot",
      "Lower straight down: front shin vertical, back knee just above the floor",
      "Torso stays upright",
      "Push through the front heel to return",
    ],
    mistakes: ["Front knee shooting forward", "Step too short", "Leaning forward"],
    difficulty: "Beginner",
    unilateral: true,
    duration: 3400,
    frames: [
      { ...gobletBase, pelvis: STAND, footR: [11, 8, 0], footL: [-11, 8, 0], hold: "both", bell: [0, 128, 22], pause: 0.15, w: 0.8 },
      {
        ...gobletBase,
        pelvis: [0, 80, -18],
        footR: [11, 26, -45],
        toeR: [0, -0.6, 0.8],
        footL: [-11, 8, 0],
        kneeL: [-0.1, 0, 1],
        hold: "both",
        bell: [0, 115, 4],
        w: 0.6,
      },
      {
        ...gobletBase,
        pelvis: [0, 52, -40],
        torso: { pitch: 5 },
        footR: [11, 13, -80],
        toeR: [0, -0.75, 0.66],
        kneeR: [0, -1, 0.3],
        footL: [-11, 8, 0],
        kneeL: [-0.1, 0, 1],
        hold: "both",
        bell: [0, 87, -14],
        pause: 0.2,
        w: 0.8,
      },
      {
        ...gobletBase,
        pelvis: [0, 80, -18],
        footR: [11, 26, -45],
        toeR: [0, -0.6, 0.8],
        footL: [-11, 8, 0],
        kneeL: [-0.1, 0, 1],
        hold: "both",
        bell: [0, 115, 4],
        w: 0.6,
      },
    ],
    defaultReps: 8,
  },
  {
    id: "lateral-lunge",
    name: "Lateral Lunge",
    subtitle: "Goblet-hold side lunge",
    category: "Legs",
    muscles: ["Adductors", "Glutes", "Quads"],
    description: "Step wide to the right, sit back into the right hip while the left leg stays straight.",
    cues: [
      "Goblet hold, feet together",
      "Big step to the side, toes pointing forward",
      "Sit the hips back over the stepping leg, the other leg stays straight",
      "Chest up, heel of the bent leg stays down",
      "Push off and bring the feet back together",
    ],
    mistakes: ["Bending the straight leg", "Knee caving in", "Heel lifting"],
    difficulty: "Intermediate",
    unilateral: true,
    duration: 3400,
    frames: [
      { ...gobletBase, pelvis: [-31, 93, 0], footR: [-20, 8, 0], footL: [-42, 8, 0], hold: "both", bell: [-31, 128, 22], pause: 0.15, w: 0.8 },
      { ...gobletBase, pelvis: [-8, 90, -4], footR: [8, 22, 2], footL: [-42, 8, 0], hold: "both", bell: [-8, 125, 18], w: 0.6 },
      {
        ...gobletBase,
        pelvis: [30, 58, -16],
        torso: { pitch: 30 },
        footR: [54, 8, 6],
        toeR: [0.35, -0.35, 1],
        kneeR: [0.4, 0, 1],
        footL: [-42, 8, 0],
        toeL: [-0.2, -0.35, 1],
        hold: "both",
        bell: [30, 86, 30],
        ...elbows(0.2, -1, 0.3),
        pause: 0.2,
        w: 0.8,
      },
      { ...gobletBase, pelvis: [-8, 90, -4], footR: [8, 22, 2], footL: [-42, 8, 0], hold: "both", bell: [-8, 125, 18], w: 0.6 },
    ],
    defaultReps: 8,
  },
  {
    id: "halo",
    name: "Alternating Halo",
    subtitle: "Circle the bell around the head, alternating direction",
    category: "Upper Body",
    muscles: ["Shoulders", "Upper back", "Core", "Triceps"],
    description:
      "Hold the bell upside-down by the horns in front of your chest and circle it closely around your head – once clockwise, once counter-clockwise.",
    cues: [
      "Bell upside-down by the horns in front of the chin",
      "Move it past one ear, keeping it close to the head",
      "Behind the head the bell hangs down at the base of the skull, elbows point up",
      "Come around the other ear back to the front",
      "Change direction every rep, glutes and abs tight, head stays still",
    ],
    mistakes: ["Only circling the face (bell never goes behind the head)", "Swaying the hips / arching the back", "Moving the head instead of the bell"],
    difficulty: "Beginner",
    unilateral: false,
    duration: 5200,
    frames: [
      { ...haloFront, pause: 0.12 },
      haloRight,
      haloBack,
      haloLeft,
      { ...haloFront, pause: 0.12 },
      haloLeft,
      haloBack,
      haloRight,
    ],
    defaultReps: 10,
  },
  {
    id: "woodchop",
    name: "Woodchop",
    subtitle: "High-to-low diagonal chop · each side",
    category: "Core",
    muscles: ["Obliques", "Core", "Shoulders", "Glutes"],
    description:
      "Hold the bell with both hands above the right shoulder and chop it diagonally across the body down to the outside of the left knee.",
    cues: [
      "Wide stance, bell high above the right shoulder, arms long",
      "Rotate through the hips and torso while sinking into a half squat",
      "Pivot on the right foot so the right knee turns in – protects the knee",
      "Finish outside the left knee with a flat back",
      "Drive back up the same diagonal path",
    ],
    mistakes: ["Rotating only the arms", "Rounding the back at the bottom", "Not pivoting the back foot"],
    difficulty: "Intermediate",
    unilateral: true,
    duration: 2600,
    frames: [
      {
        pelvis: STAND,
        pelvisYaw: 15,
        torso: { yaw: 30 },
        footR: [24, 8, 0],
        footL: [-24, 11, 0],
        toeL: [0.5, -0.5, 0.7],
        kneeL: [0.6, 0, 0.8],
        hold: "both",
        bell: [28, 190, 12],
        bellDir: [0.3, 0.7, -0.6],
        ...elbows(0.6, -0.3, 0.6),
        pause: 0.15,
        w: 0.5,
      },
      {
        pelvis: [0, 85, -6],
        torso: { pitch: 15 },
        ...stance(24, 15),
        hold: "both",
        bell: [0, 112, 52],
        bellDir: [0, 0.2, 1],
        w: 0.5,
      },
      {
        pelvis: [0, 72, -14],
        pelvisYaw: -20,
        torso: { pitch: 35, yaw: -40 },
        footR: [24, 11, 0],
        toeR: [-0.5, -0.5, 0.7],
        kneeR: [-0.6, 0, 0.8],
        footL: [-24, 8, 0],
        toeL: [-0.3, -0.35, 1],
        kneeL: [-0.3, 0, 1],
        hold: "both",
        bell: [-35.5, 58, 28],
        axis: [0.91, 0, 0.41],
        bellDir: [-0.3, -1, 0.2],
        pause: 0.1,
        w: 0.6,
      },
      {
        pelvis: [0, 85, -6],
        torso: { pitch: 15 },
        ...stance(24, 15),
        hold: "both",
        bell: [0, 112, 52],
        bellDir: [0, 0.2, 1],
        w: 0.6,
      },
    ],
    defaultReps: 10,
  },
  {
    id: "russian-twist",
    name: "Russian Twist",
    subtitle: "Seated rotation, bell taps beside the hips",
    category: "Core",
    muscles: ["Obliques", "Abs", "Hip flexors"],
    description: "Sit leaning back with a straight back and rotate the bell from one hip to the other.",
    cues: [
      "Sit with knees bent, heels on the floor",
      "Lean back about 35° with a long, straight spine",
      "Rotate the chest – not just the arms – to one side",
      "Tap the bell lightly next to the hip",
      "Rotate through the middle to the other side",
    ],
    mistakes: ["Rounding the back", "Only moving the arms", "Swinging fast without control"],
    difficulty: "Intermediate",
    unilateral: false,
    duration: 2600,
    frames: [
      { ...twistSeat, torso: { pitch: -35, twist: 45 }, bell: [30, 26, 4], axis: [0, 0, -1], pause: 0.1 },
      { ...twistSeat, torso: { pitch: -35 }, bell: [0, 50, 22] },
      { ...twistSeat, torso: { pitch: -35, twist: -45 }, bell: [-30, 26, 4], axis: [0, 0, 1], pause: 0.1 },
      { ...twistSeat, torso: { pitch: -35 }, bell: [0, 50, 22] },
    ],
    defaultReps: 16,
  },
  {
    id: "straddle-pass",
    name: "Seated Straddle Pass-Over",
    subtitle: "Wide-leg sit, set the bell down left and right",
    category: "Core",
    muscles: ["Core", "Obliques", "Hip flexors", "Back"],
    description:
      "Sit on the floor with your legs spread wide. With a straight back, lift the bell from the floor on one side, carry it over the middle and set it down on the other side.",
    cues: [
      "Sit tall on your sit bones, legs straight and wide, toes up",
      "Hold the bell with both hands, set it down beside one knee",
      "Lift it up and carry it over the middle in front of you",
      "Lean and rotate from the hips with a straight back and set it down beside the other knee",
      "Each set-down is one rep",
    ],
    mistakes: ["Rounding the back to reach the floor", "Dropping the bell instead of setting it down", "Bending the knees"],
    difficulty: "Beginner",
    unilateral: false,
    duration: 3600,
    views: ["front", "top"],
    frames: [
      { ...straddle, torso: { pitch: 25, yaw: 25 }, bell: [28, 24, 46], axis: [0.85, 0, -0.52], pause: 0.3 },
      { ...straddle, torso: { pitch: 15 }, bell: [0, 50, 48] },
      { ...straddle, torso: { pitch: 25, yaw: -25 }, bell: [-28, 24, 46], axis: [0.85, 0, 0.52], pause: 0.3 },
      { ...straddle, torso: { pitch: 15 }, bell: [0, 50, 48] },
    ],
    defaultReps: 10,
  },
  {
    id: "around-the-world",
    name: "Around the World",
    subtitle: "Pass the bell around the waist",
    category: "Core",
    muscles: ["Core", "Obliques", "Grip", "Shoulders"],
    description: "Pass the bell from hand to hand in a circle around your waist while your body stays still.",
    cues: [
      "Stand tall, bell in the right hand in front of the hips",
      "Carry it around the right side",
      "Hand it over to the left hand behind your back",
      "Bring it around the left side and pass it to the right hand in front",
      "Hips and shoulders stay still – only the arms move",
    ],
    mistakes: ["Swaying the hips with the bell", "Leaning forward", "Dropping the bell during the pass behind the back"],
    difficulty: "Beginner",
    unilateral: false,
    duration: 2800,
    frames: [
      { ...stance(14, 10), pelvis: STAND, hold: "R", handR: [3, 95, 22], handL: [-3, 95, 22], ...elbows(0.6, -0.3, -0.5), w: 0.6 },
      { ...stance(14, 10), pelvis: STAND, hold: "R", handR: [31, 96, 2], handL: [-31, 96, -4], ...elbows(0.6, -0.3, -1), w: 0.6 },
      { ...stance(14, 10), pelvis: STAND, hold: "R", handR: [3, 96, -22], handL: [-3, 96, -22], ...elbows(1, -0.2, -0.2), w: 0.05 },
      { ...stance(14, 10), pelvis: STAND, hold: "L", handR: [3, 96, -22], handL: [-3, 96, -22], ...elbows(1, -0.2, -0.2), w: 0.6 },
      { ...stance(14, 10), pelvis: STAND, hold: "L", handR: [31, 96, -4], handL: [-31, 96, 2], ...elbows(0.6, -0.3, -1), w: 0.6 },
      { ...stance(14, 10), pelvis: STAND, hold: "L", handR: [3, 95, 22], handL: [-3, 95, 22], ...elbows(0.6, -0.3, -0.5), w: 0.05 },
    ],
    defaultReps: 10,
  },
  {
    id: "pullover",
    name: "Pullover",
    subtitle: "Lying pullover with both hands",
    category: "Upper Body",
    muscles: ["Lats", "Chest", "Triceps", "Core"],
    description:
      "Lie on your back with knees bent. Hold the bell by the horns over your chest and lower it behind your head in an arc.",
    cues: [
      "Lie on your back, knees bent, feet flat",
      "Bell over the chest, arms almost straight",
      "Lower it in an arc behind your head, elbows slightly bent and pointing up",
      "Keep the lower back on the floor, ribs down",
      "Pull it back over the chest with the lats",
    ],
    mistakes: ["Arching the lower back off the floor", "Bending the elbows a lot (turns into a triceps extension)", "Going further than your shoulder mobility allows"],
    difficulty: "Beginner",
    unilateral: false,
    duration: 3600,
    views: ["side", "top"],
    frames: [
      { ...lying, hold: "both", bell: [0, 68, -15], ...elbows(1, 0, 0.2), pause: 0.2 },
      { ...lying, hold: "both", bell: [0, 55, -52], bellDir: [0, -0.8, -0.4], ...elbows(0.8, 0.6, 0) },
      { ...lying, hold: "both", bell: [0, 22, -75], bellDir: [0, -0.4, -0.9], ...elbows(0.5, 1, 0), pause: 0.15 },
      { ...lying, hold: "both", bell: [0, 55, -52], bellDir: [0, -0.8, -0.4], ...elbows(0.8, 0.6, 0) },
    ],
    defaultReps: 10,
  },
  {
    id: "floor-press",
    name: "Floor Press",
    subtitle: "Single-arm press lying on the floor",
    category: "Upper Body",
    muscles: ["Chest", "Triceps", "Shoulders"],
    description: "Lie on your back and press the bell from the floor straight up over your shoulder.",
    cues: [
      "Lie on your back, knees bent, upper arm on the floor at about 45° to the body",
      "Bell rests on the outside of the forearm, wrist straight",
      "Press straight up until the arm is locked over the shoulder",
      "Lower until the elbow lightly touches the floor",
    ],
    mistakes: ["Elbow flared out at 90°", "Bent wrist", "Bouncing the elbow off the floor"],
    difficulty: "Beginner",
    unilateral: true,
    duration: 2800,
    views: ["side", "top"],
    frames: [
      { ...lying, hold: "R", handR: [30, 30, -12], handL: [-6, 18, 8], elbowR: [1, -1, 0.6], elbowL: [-1, 0, 0], bellDir: [0.7, -0.3, 0.2], pause: 0.25 },
      { ...lying, hold: "R", handR: [17, 72, -17], handL: [-6, 18, 8], elbowR: [1, 0, 0.3], elbowL: [-1, 0, 0], bellDir: [0.3, -0.9, 0.1], pause: 0.3 },
    ],
    defaultReps: 10,
  },
  {
    id: "curl-press",
    name: "Curl + Horizontal Press",
    subtitle: "Biceps curl, then press forward",
    category: "Upper Body",
    muscles: ["Biceps", "Shoulders", "Chest", "Core"],
    description: "Curl the bell by the horns up to your chest, press it straight forward at chest height, bring it back and lower it.",
    cues: [
      "Hold the bell by the horns, arms long, elbows at your sides",
      "Curl it up to the chest without swinging",
      "Press it straight forward at chest height until the arms are straight",
      "Pull it back to the chest, then lower slowly",
    ],
    mistakes: ["Swinging the bell up with the hips", "Leaning back when pressing", "Pressing upwards instead of forwards"],
    difficulty: "Beginner",
    unilateral: false,
    duration: 3600,
    frames: [
      { ...curlHang, pause: 0.1, w: 0.8 },
      { ...curlTop, w: 0.7 },
      { ...curlBase, bell: [0, 132, 60], ...elbows(0.6, -0.8, 0), pause: 0.15, w: 0.7 },
      { ...curlTop, w: 0.8 },
    ],
    defaultReps: 10,
  },
  {
    id: "bicep-curl",
    name: "Biceps Curl",
    subtitle: "Two-hand curl by the horns",
    category: "Upper Body",
    muscles: ["Biceps", "Forearms"],
    description: "Hold the bell by the horns with straight arms and curl it up to your chest.",
    cues: [
      "Stand tall, elbows pinned to your sides",
      "Curl the bell up to the chest – only the forearms move",
      "Squeeze at the top",
      "Lower slowly until the arms are straight",
    ],
    mistakes: ["Swinging with the hips", "Elbows drifting forward", "Dropping the bell fast"],
    difficulty: "Beginner",
    unilateral: false,
    duration: 2600,
    frames: [
      { ...curlHang, pause: 0.15 },
      { ...curlTop, pause: 0.2 },
    ],
    defaultReps: 12,
  },
  {
    id: "triceps-extension",
    name: "Triceps Extension",
    subtitle: "Overhead extension by the horns",
    category: "Upper Body",
    muscles: ["Triceps", "Shoulders", "Core"],
    description: "Hold the bell overhead by the horns and lower it behind your head by bending only the elbows.",
    cues: [
      "Bell overhead by the horns, arms straight",
      "Elbows point to the ceiling and stay close to the head",
      "Bend only at the elbows, lower the bell behind the head",
      "Extend back up to straight arms",
      "Ribs down – don't arch your back",
    ],
    mistakes: ["Elbows flaring out", "Upper arms moving forward", "Arching the lower back"],
    difficulty: "Beginner",
    unilateral: false,
    duration: 2800,
    frames: [
      { ...stance(14, 10), pelvis: STAND_TALL, hold: "both", bell: [0, 203, 4], ...elbows(0.6, 0.2, 0.4), pause: 0.2 },
      { ...stance(14, 10), pelvis: STAND_TALL, hold: "both", bell: [0, 190, -18], bellDir: [0, -1, -0.3], ...elbows(0.35, 1, 0.4) },
      { ...stance(14, 10), pelvis: STAND_TALL, hold: "both", bell: [0, 166, -24], bellDir: [0, -1, -0.1], ...elbows(0.25, 1, 0.3), pause: 0.15 },
      { ...stance(14, 10), pelvis: STAND_TALL, hold: "both", bell: [0, 190, -18], bellDir: [0, -1, -0.3], ...elbows(0.35, 1, 0.4) },
    ],
    defaultReps: 12,
  },

  // ---- Variants: same movement, different loading ---------------------------------
  {
    id: "row-two-hand",
    name: "Two-Hand Bent-Over Row",
    subtitle: "One bell, both hands, rowed to the belly",
    category: "Upper Body",
    muscles: ["Lats", "Upper back", "Biceps", "Rear delts"],
    description:
      "Hinge forward with a flat back and hold one bell by the handle with both hands. Row it up to your belly button, elbows travelling back close to the body.",
    cues: [
      "Hip-width stance, soft knees, hinge until the torso is about 30° above horizontal",
      "Both hands on the handle, bell hangs below the chest",
      "Pull the elbows back and up, bell travels to the belly button",
      "Squeeze the shoulder blades together at the top",
      "Lower under control until the arms are straight",
    ],
    mistakes: ["Standing up while rowing", "Rounded back", "Shrugging the shoulders to the ears"],
    difficulty: "Beginner",
    unilateral: false,
    duration: 2600,
    frames: [
      { ...rowHinge, hold: "both", bell: [0, 52, 22], ...elbows(0.6, -0.2, -0.6), pause: 0.2, w: 0.9 },
      { ...rowHinge, hold: "both", bell: [0, 86, 2], ...elbows(1, 0.6, -0.8), pause: 0.25, w: 1.1 },
    ],
    defaultReps: 12,
  },
  {
    id: "row-double",
    name: "Double Bent-Over Row",
    subtitle: "A bell in each hand, both arms row together",
    category: "Upper Body",
    muscles: ["Lats", "Upper back", "Biceps", "Lower back"],
    description:
      "Hold a kettlebell in each hand and hinge forward with a flat back. Row both bells to your hips at the same time – your lower back has to hold the hinge without the support of a free hand.",
    cues: [
      "Hinge with a flat back, a bell hanging under each shoulder",
      "Brace the abs – there is no free hand to lean on",
      "Row both elbows back towards the hips",
      "Pause at the top, then lower slowly",
    ],
    mistakes: ["Rounding the lower back", "Jerking the bells up with the legs", "Elbows flaring out wide"],
    difficulty: "Intermediate",
    unilateral: false,
    duration: 2600,
    frames: [
      { ...rowHinge, hold: "double", handR: [24, 51, 21], handL: [-24, 51, 21], elbowR: [0.3, 0.2, -1], elbowL: [-0.3, 0.2, -1], pause: 0.2, w: 0.9 },
      { ...rowHinge, hold: "double", handR: [24, 92, -6], handL: [-24, 92, -6], elbowR: [0.2, 0.7, -1], elbowL: [-0.2, 0.7, -1], pause: 0.25, w: 1.1 },
    ],
    defaultReps: 10,
  },
  {
    id: "press-double",
    name: "Double Overhead Press",
    subtitle: "Press two bells from the rack",
    category: "Upper Body",
    muscles: ["Shoulders", "Triceps", "Upper back", "Core"],
    description:
      "Both bells start in the front rack. Press them overhead at the same time without leaning back, then lower them back to the rack.",
    cues: [
      "Two bells in the rack, elbows tucked, glutes and abs tight",
      "Press both bells up, forearms stay vertical",
      "Lock out with the biceps by the ears, ribs down",
      "Lower both bells back to the rack under control",
    ],
    mistakes: ["Arching the lower back", "One arm racing ahead of the other", "Flaring the elbows in the rack"],
    difficulty: "Intermediate",
    unilateral: false,
    duration: 3000,
    frames: [rackR, pressMidR, lockoutR, pressMidR].map((f, i) => ({ ...doubled(f), pause: [0.35, 0, 0.35, 0][i], w: [0.8, 0.6, 0.9, 0.9][i] })),
    defaultReps: 6,
  },
  {
    id: "clean-double",
    name: "Double Clean",
    subtitle: "Two bells into the rack",
    category: "Ballistic",
    muscles: ["Glutes", "Hamstrings", "Back", "Core"],
    description:
      "Swing two bells back between your legs and clean them into the front rack together. A wider stance makes room for both bells.",
    cues: [
      "Feet a bit wider than for a single bell, bells side by side",
      "Hike both bells back high between the thighs",
      "Hip snap, keep the elbows close and pull the bells into the rack",
      "Rack: wrists straight, forearms vertical, bells resting on the forearms",
      "Drop them back into the next backswing",
    ],
    mistakes: ["Bells crashing onto the forearms", "Stance too narrow for two bells", "Leaning back in the rack"],
    difficulty: "Advanced",
    unilateral: false,
    duration: 2400,
    frames: [
      { ...stance(22, 15), ...knees(18), pelvis: [0, 80, -22], torso: { pitch: 60 }, hold: "double", handR: [11, 62, -16], handL: [-11, 62, -16], bellDir: [0, 0.2, -1], elbowR: [0.3, -0.2, -1], elbowL: [-0.3, -0.2, -1], w: 0.6 },
      { ...stance(22, 15), ...knees(18), pelvis: STAND, torso: { pitch: -2 }, hold: "double", handR: [12, 100, 17], handL: [-12, 100, 17], bellDir: [0.3, -1, 0.3], elbowR: [0.3, -0.3, -1], elbowL: [-0.3, -0.3, -1], w: 0.5 },
      { ...doubled({ ...rackR, ...stance(22, 15), ...knees(18) }), pause: 0.5, w: 0.6 },
      { ...stance(22, 15), ...knees(18), pelvis: STAND, torso: { pitch: -2 }, hold: "double", handR: [12, 100, 17], handL: [-12, 100, 17], bellDir: [0.3, -1, 0.3], elbowR: [0.3, -0.3, -1], elbowL: [-0.3, -0.3, -1], w: 0.6 },
    ],
    defaultReps: 6,
  },
  {
    id: "front-squat-double",
    name: "Double Front Squat",
    subtitle: "Squat with two bells in the rack",
    category: "Legs",
    muscles: ["Quads", "Glutes", "Core", "Upper back"],
    description:
      "Hold two bells in the front rack and squat as deep as you can with an upright torso. One of the best leg builders with kettlebells.",
    cues: [
      "Bells in the rack, elbows tucked in, wrists straight",
      "Feet shoulder width, toes slightly out",
      "Sit straight down between the heels, chest stays up",
      "Knees track over the toes",
      "Drive up through the whole foot, bells stay in the rack",
    ],
    mistakes: ["Elbows dropping and the bells pulling you forward", "Heels lifting", "Rounding the lower back at the bottom"],
    difficulty: "Intermediate",
    unilateral: false,
    duration: 3200,
    frames: [
      { ...doubled(fsTopR), pause: 0.2, w: 1.2 },
      { ...doubled(fsBottomR), pause: 0.2, w: 1.2 },
    ],
    defaultReps: 8,
  },
  {
    id: "front-squat",
    name: "Single-Arm Front Squat",
    subtitle: "Squat with one bell in the rack",
    category: "Legs",
    muscles: ["Quads", "Glutes", "Obliques", "Core"],
    description:
      "Squat holding one bell in the front rack. The offset load forces your core to keep you from leaning towards the bell.",
    cues: [
      "Bell in the right rack, free arm relaxed or out front for balance",
      "Sit down between the heels, chest up",
      "Stay square – don't lean towards the bell",
      "Drive up through the whole foot",
    ],
    mistakes: ["Leaning to the side of the bell", "Elbow drifting away from the ribs", "Heels lifting"],
    difficulty: "Beginner",
    unilateral: true,
    duration: 3200,
    frames: [
      { ...fsTopR, pause: 0.2, w: 1.2 },
      { ...fsBottomR, pause: 0.2, w: 1.2 },
    ],
    defaultReps: 8,
  },
  {
    id: "floor-press-double",
    name: "Double Floor Press",
    subtitle: "Two bells pressed up from the floor",
    category: "Upper Body",
    muscles: ["Chest", "Triceps", "Shoulders"],
    description: "Lying on your back, press a bell in each hand straight up over your shoulders, then lower until the elbows touch the floor.",
    cues: [
      "Lie on your back, knees bent, both upper arms at about 45° to the body",
      "Wrists straight, bells resting on the outside of the forearms",
      "Press both bells up until the arms are locked over the shoulders",
      "Lower slowly until the elbows lightly touch the floor",
    ],
    mistakes: ["Elbows flared out at 90°", "Bells drifting towards the face", "Bouncing the elbows off the floor"],
    difficulty: "Beginner",
    unilateral: false,
    duration: 2800,
    views: ["side", "top"],
    frames: [
      { ...doubled(floorBottomR), pause: 0.25 },
      { ...doubled(floorTopR), pause: 0.3 },
    ],
    defaultReps: 10,
  },
  {
    id: "curl-single",
    name: "Single-Arm Curl",
    subtitle: "Curl one bell by the handle",
    category: "Upper Body",
    muscles: ["Biceps", "Forearms", "Grip"],
    description: "Hold the bell by the handle in one hand and curl it to the shoulder. The off-centre weight makes your grip and forearm work hard.",
    cues: [
      "Stand tall, elbow pinned to your side",
      "Curl the bell up – only the forearm moves",
      "Squeeze at the top, wrist straight",
      "Lower slowly until the arm is straight",
    ],
    mistakes: ["Swinging with the hips", "Elbow drifting forward", "Leaning to the side"],
    difficulty: "Beginner",
    unilateral: true,
    duration: 2600,
    frames: [
      { ...curlHangR, pause: 0.15 },
      { ...curlTopR, pause: 0.2 },
    ],
    defaultReps: 10,
  },
  {
    id: "curl-double",
    name: "Double Biceps Curl",
    subtitle: "A bell in each hand, curl both",
    category: "Upper Body",
    muscles: ["Biceps", "Forearms", "Grip"],
    description: "Hold a kettlebell in each hand at your sides and curl both up to your shoulders at the same time.",
    cues: [
      "Stand tall, a bell in each hand, elbows by your sides",
      "Curl both bells up without moving the upper arms",
      "Squeeze at the top",
      "Lower slowly until the arms are straight",
    ],
    mistakes: ["Swinging the bells up with the hips", "Elbows drifting forward", "Dropping the bells fast"],
    difficulty: "Beginner",
    unilateral: false,
    duration: 2600,
    frames: [
      { ...doubled(curlHangR), pause: 0.15 },
      { ...doubled(curlTopR), pause: 0.2 },
    ],
    defaultReps: 10,
  },
  {
    id: "triceps-single",
    name: "Single-Arm Triceps Extension",
    subtitle: "Overhead extension with one bell",
    category: "Upper Body",
    muscles: ["Triceps", "Shoulders", "Core"],
    description: "Hold one bell by the handle overhead and lower it behind your head by bending only the elbow.",
    cues: [
      "Bell overhead in one hand, arm straight",
      "Elbow points to the ceiling and stays close to the head",
      "Bend only the elbow, lower the bell behind the head",
      "Extend back up to a straight arm, ribs down",
    ],
    mistakes: ["Elbow flaring out", "Upper arm moving forward", "Arching the lower back"],
    difficulty: "Intermediate",
    unilateral: true,
    duration: 2800,
    frames: [
      { ...stance(14, 10), pelvis: STAND_TALL, hold: "R", handR: [10, 205, 2], handL: [-21, 86, 4], elbowR: [0.4, 0.2, 0.4], bellDir: [0, -1, -0.3], pause: 0.2 },
      { ...stance(14, 10), pelvis: STAND_TALL, hold: "R", handR: [10, 170, -24], handL: [-21, 86, 4], elbowR: [0.2, 1, 0.3], bellDir: [0.1, -1, -0.15], pause: 0.15 },
    ],
    defaultReps: 10,
  },
  {
    id: "single-leg-deadlift-two-hand",
    name: "Two-Hand Single-Leg Deadlift",
    subtitle: "One-leg hinge, bell held with both hands",
    category: "Strength",
    muscles: ["Hamstrings", "Glutes", "Core", "Balance"],
    description:
      "Stand on the left leg and hold one bell with both hands. Hinge forward while the right leg extends straight behind you – the centred load makes balancing easier than the one-arm version.",
    cues: [
      "Both hands on the handle, standing knee soft",
      "Hinge at the hip – torso and back leg move as one line",
      "Hips stay square, toes of the back leg point down",
      "Bell travels straight down below the chest",
      "Stand back up by squeezing the glute of the standing leg",
    ],
    mistakes: ["Opening the hip of the lifted leg", "Rounding the back", "Bending the arms"],
    difficulty: "Beginner",
    unilateral: true,
    duration: 3400,
    frames: [
      { pelvis: STAND, footR: [11, 9, -4], footL: [-11, 8, 0], hold: "both", bell: [0, 84, 14], pause: 0.2, w: 1.3 },
      {
        pelvis: [0, 88, -8],
        torso: { pitch: 80 },
        footR: [10, 73, -92],
        toeR: [0, -1, 0.05],
        kneeR: [0, -1, 0],
        footL: [-11, 8, 0],
        kneeL: [-0.1, 0, 1],
        hold: "both",
        bell: [0, 38, 40],
        pause: 0.2,
        w: 1.3,
      },
    ],
    defaultReps: 8,
  },
  {
    id: "suitcase-deadlift",
    name: "Suitcase Deadlift",
    subtitle: "One bell lifted from beside the foot",
    category: "Strength",
    muscles: ["Glutes", "Hamstrings", "Obliques", "Grip"],
    description:
      "The bell stands next to your right foot. Squat-hinge down, grab it with one hand and stand up like you are picking up a suitcase – without leaning to the side.",
    cues: [
      "Bell beside the outside of the right foot",
      "Hips back and down, chest up, flat back",
      "Grip the handle, shoulder pulled down and back",
      "Stand up tall, shoulders level – resist leaning towards the bell",
      "Lower the same way and touch the floor lightly",
    ],
    mistakes: ["Leaning to the side of the bell", "Rounding the back", "Shrugging the working shoulder"],
    difficulty: "Beginner",
    unilateral: true,
    duration: 3000,
    frames: [
      { ...stance(12, 8), pelvis: STAND, hold: "R", handR: [27, 84, 4], handL: [-24, 84, 4], pause: 0.3, w: 1.2 },
      { ...stance(12, 8), ...knees(10), pelvis: [0, 52, -18], torso: { pitch: 40 }, hold: "R", handR: [27, 30, 8], handL: [-24, 34, 12], pause: 0.25, w: 1.2 },
    ],
    defaultReps: 8,
  },

  // ---- More classics ------------------------------------------------------------------
  {
    id: "windmill",
    name: "Windmill",
    subtitle: "Hinge sideways under a locked-out bell",
    category: "Core",
    muscles: ["Obliques", "Shoulders", "Hamstrings", "Hips"],
    description:
      "With the bell locked out overhead, push your hips to the side and hinge down until your free hand reaches your front foot. Eyes stay on the bell the whole time.",
    cues: [
      "Bell locked out overhead in the right hand, feet turned about 45° to the left",
      "Push the hips back and to the right",
      "Slide the free hand down the inside of the left leg",
      "Keep the overhead arm vertical and look at the bell",
      "Drive the hips forward to stand back up",
    ],
    mistakes: ["Bending the overhead arm", "Looking away from the bell", "Rounding the back instead of hinging"],
    difficulty: "Advanced",
    unilateral: true,
    duration: 4000,
    frames: [
      { ...windFeet, pelvis: STAND, torso: { yaw: -35 }, hold: "R", handR: [12, 204, 8], handL: [-20, 82, -8], elbowR: [0.6, 0, 0.4], bellDir: [0.35, -0.45, -0.82], pause: 0.25, w: 1.3 },
      {
        ...windFeet,
        pelvis: [6, 88, -10],
        torso: { pitch: 60, yaw: -35, twist: 60 },
        hold: "R",
        handR: [-7, 186, 22],
        handL: [-30, 40, 30],
        elbowR: [0.5, 0, 0.5],
        elbowL: [-0.6, 0, 0.6],
        bellDir: [0.2, -0.5, -0.85],
        pause: 0.3,
        w: 1.3,
      },
    ],
    defaultReps: 5,
  },
  {
    id: "gorilla-row",
    name: "Gorilla Row",
    subtitle: "Alternating rows from a wide, deep hinge",
    category: "Upper Body",
    muscles: ["Lats", "Upper back", "Biceps", "Core"],
    description:
      "Stand very wide with two bells on the floor between your feet. Sink into a deep hinge and row one bell to your hip while the other hand presses its bell into the floor – then switch.",
    cues: [
      "Very wide stance, toes out, two bells between the feet",
      "Hips back and down, flat back, chest towards the floor",
      "Row one bell to the hip while the other hand pushes its bell into the floor",
      "Lower it to the floor, then row with the other arm",
      "One rep = one row on each side",
    ],
    mistakes: ["Twisting the torso to lift the bell", "Rounding the back", "Standing up between rows"],
    difficulty: "Intermediate",
    unilateral: false,
    duration: 3600,
    frames: [
      { ...gorillaFloor, pause: 0.1, w: 0.6 },
      { ...gorillaFloor, handR: [18, 62, 4], elbowR: [0.3, 1, -0.5], pause: 0.15, w: 0.6 },
      { ...gorillaFloor, pause: 0.1, w: 0.6 },
      { ...gorillaFloor, handL: [-18, 62, 4], elbowL: [-0.3, 1, -0.5], pause: 0.15, w: 0.6 },
    ],
    defaultReps: 8,
  },
  {
    id: "renegade-row",
    name: "Renegade Row",
    subtitle: "Plank on two bells, alternating rows",
    category: "Core",
    muscles: ["Core", "Lats", "Shoulders", "Chest"],
    description:
      "Hold a high plank with your hands on the handles of two bells. Row one bell to your hip without letting the hips rotate, set it down and row the other.",
    cues: [
      "High plank on two bells, hands under the shoulders, feet wide",
      "Squeeze glutes and abs – body in one straight line",
      "Row one bell to the hip while pushing the other into the floor",
      "Hips stay square to the floor",
      "Set the bell down softly and switch sides",
    ],
    mistakes: ["Hips twisting or piking up", "Feet too close together", "Dropping the bell back down"],
    difficulty: "Advanced",
    unilateral: false,
    duration: 3600,
    frames: [
      { ...plankFloor, pause: 0.1, w: 0.6 },
      { ...plankFloor, handR: [15, 62, -4], elbowR: [0.4, 1, -0.6], pause: 0.15, w: 0.6 },
      { ...plankFloor, pause: 0.1, w: 0.6 },
      { ...plankFloor, handL: [-15, 62, -4], elbowL: [-0.4, 1, -0.6], pause: 0.15, w: 0.6 },
    ],
    defaultReps: 8,
  },
  {
    id: "farmers-carry",
    name: "Farmer's Carry",
    subtitle: "Walk tall with a bell in each hand",
    category: "Full Body",
    muscles: ["Grip", "Traps", "Core", "Legs"],
    description:
      "Pick up a heavy bell in each hand and walk with short, controlled steps. Simple, brutally effective for grip, posture and core.",
    cues: [
      "Deadlift the bells up, stand tall",
      "Shoulders down and back, arms long by your sides",
      "Brace the abs and walk with short, quick steps",
      "Eyes forward, don't let the bells swing",
      "Set the bells down with a flat back",
    ],
    mistakes: ["Shrugging the shoulders", "Leaning back or forward", "Long steps that make the bells swing"],
    difficulty: "Beginner",
    unilateral: false,
    duration: 1400,
    frames: march({ hold: "double", handR: [24, 82, 2], handL: [-24, 82, 2], elbowR: [0.2, -0.2, -1], elbowL: [-0.2, -0.2, -1] }),
    defaultReps: 20,
    defaultMode: "time",
  },
  {
    id: "suitcase-carry",
    name: "Suitcase Carry",
    subtitle: "Walk with one bell at your side",
    category: "Core",
    muscles: ["Obliques", "Grip", "Core", "Traps"],
    description:
      "Carry a single bell at your side and walk without leaning. Your obliques on the opposite side work hard to keep you upright.",
    cues: [
      "Bell at your side in one hand, stand tall",
      "Shoulders level – don't lean away from or towards the bell",
      "Brace the abs and walk with short steps",
      "Switch hands for the second side",
    ],
    mistakes: ["Leaning to the side", "Letting the bell bang against the leg", "Shrugging the working shoulder"],
    difficulty: "Beginner",
    unilateral: true,
    duration: 1400,
    frames: march({ hold: "R", handR: [24, 82, 2], handL: [-21, 84, 4], elbowR: [0.2, -0.2, -1] }),
    defaultReps: 20,
    defaultMode: "time",
  },
  {
    id: "upright-row",
    name: "Upright Row",
    subtitle: "Pull the bell up to the chest, elbows high",
    category: "Upper Body",
    muscles: ["Shoulders", "Traps", "Biceps"],
    description: "Stand tall holding the handle with both hands and pull the bell straight up close to your body until it reaches your upper chest.",
    cues: [
      "Stand tall, both hands on the handle, arms long",
      "Pull the bell straight up along the body",
      "Lead with the elbows – they finish higher than the hands",
      "Stop at upper-chest height and lower slowly",
    ],
    mistakes: ["Swinging the bell up with the hips", "Pulling higher than shoulder height if it pinches", "Leaning back"],
    difficulty: "Beginner",
    unilateral: false,
    duration: 2600,
    frames: [
      { ...stance(14, 10), pelvis: STAND_TALL, hold: "both", bell: [0, 86, 12], pause: 0.15 },
      { ...stance(14, 10), pelvis: STAND_TALL, hold: "both", bell: [0, 132, 18], ...elbows(1, 0.8, -0.2), pause: 0.2 },
    ],
    defaultReps: 12,
  },
];

/** Exercises that are the same movement with a different loading. The first entry is the default. */
const VARIANT_GROUPS: Record<string, [string, VariantLabel][]> = {
  swing: [["swing", "Two hands"], ["one-arm-swing", "One arm"]],
  row: [["row", "One arm"], ["row-two-hand", "Two hands"], ["row-double", "Two bells"]],
  press: [["press", "One arm"], ["press-double", "Two bells"]],
  clean: [["clean", "One arm"], ["clean-double", "Two bells"]],
  "front-squat": [["front-squat-double", "Two bells"], ["front-squat", "One arm"]],
  "floor-press": [["floor-press", "One arm"], ["floor-press-double", "Two bells"]],
  curl: [["bicep-curl", "Two hands"], ["curl-single", "One arm"], ["curl-double", "Two bells"]],
  triceps: [["triceps-extension", "Two hands"], ["triceps-single", "One arm"]],
  "single-leg-deadlift": [["single-leg-deadlift", "One arm"], ["single-leg-deadlift-two-hand", "Two hands"]],
  deadlift: [["deadlift", "Two hands"], ["suitcase-deadlift", "One arm"]],
  carry: [["farmers-carry", "Two bells"], ["suitcase-carry", "One arm"]],
};
for (const [group, members] of Object.entries(VARIANT_GROUPS)) {
  for (const [id, label] of members) {
    const ex = EXERCISES.find((e) => e.id === id);
    if (!ex) throw new Error(`Unknown exercise in variant group ${group}: ${id}`);
    ex.variant = { group, label };
  }
}

export const EXERCISE_MAP: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise {
  return EXERCISE_MAP[id] ?? EXERCISES[0];
}

/** All loadings of the same movement (including the exercise itself), default first. */
export function getVariants(ex: Exercise): Exercise[] {
  if (!ex.variant) return [ex];
  return VARIANT_GROUPS[ex.variant.group].map(([id]) => EXERCISE_MAP[id]);
}

/** The exercise shown for a variant group in lists (the group's default). */
export const isPrimary = (ex: Exercise) => !ex.variant || getVariants(ex)[0].id === ex.id;

/** Name as people search for it, e.g. "Bent-Over Row" -> "Kettlebell Bent-Over Row". */
export const seoName = (ex: Exercise) => (/kettlebell/i.test(ex.name) ? ex.name : `Kettlebell ${ex.name}`);

/** URL slug of the exercise guide page, e.g. "kettlebell-bent-over-row". */
export const exerciseSlug = (ex: Exercise) =>
  seoName(ex)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const exerciseBySlug = (slug: string) => EXERCISES.find((e) => exerciseSlug(e) === slug);

export const CATEGORIES: Category[] = ["Ballistic", "Strength", "Legs", "Upper Body", "Full Body", "Core"];

/** Uses one bell in each hand – the plan's weight is per bell. */
export const usesTwoBells = (ex: Exercise) => ex.variant?.label === "Two bells" || ex.frames.some((f) => f.hold === "double");
