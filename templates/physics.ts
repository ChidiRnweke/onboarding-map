import { defineMap, docLink, ref } from 'onboarding-map';

/*
 * Introductory mechanics for a first-year student: from describing motion to
 * predicting it with forces and with energy. A small, complete example of a
 * map outside software.
 */

const wiki = docLink('wikipedia', 'https://en.wikipedia.org/wiki/');

export default defineMap({
  id: 'intro-mechanics',
  version: '0.1.0',
  title: 'Introductory mechanics',
  motto: 'Predict first, then check.',
  labels: {
    intro:
      'Four weeks from describing motion to predicting it. Follow the route; the rest of the map is physics you will meet later.',
    period: 'Week',
    tip: { label: 'Worked example', hint: 'Hint' },
    aria: { map: 'Map of classical mechanics' },
    refs: { heading: 'In the textbook' },
    sources: { wikipedia: 'Wikipedia', textbook: 'Textbook' },
  },

  kinds: [
    { id: 'concept', label: 'Concept', plural: 'Concepts', description: 'A quantity or idea used to describe motion.' },
    { id: 'law', label: 'Law', plural: 'Laws', description: 'A statement about nature that experiments keep confirming.' },
    { id: 'method', label: 'Method', plural: 'Methods', description: 'A way of working out an answer.' },
  ],
  periods: [
    { period: 1, title: 'Describing motion', summary: 'Where things are, how fast, and how that changes.' },
    { period: 2, title: 'Causes of motion', summary: 'Forces, and what energy lets you skip.' },
  ],
  documents: [
    {
      id: 'openstax',
      title: 'OpenStax University Physics, Volume 1',
      date: '2016-09-19',
      audience: 'First-year university students',
      url: 'https://openstax.org/details/books/university-physics-volume-1',
    },
  ],

  goal: {
    title: 'Predicting motion',
    statement: 'You can predict how an object moves from the forces on it, and check the answer with energy.',
    doneWhen: 'Given a ball thrown off a cliff or a block sliding down a ramp, you can predict where and how fast, two ways.',
    story:
      'Motion is described with vectors that change in time. Forces change that motion, by Newton’s second law. Energy is a shortcut: when it is conserved, it gives speeds without following the motion step by step.',
    modules: [
      {
        id: 'kinematics',
        title: 'Describing motion',
        purpose: 'You can only predict what you can describe.',
        dependsOn: [],
        builtFrom: ['vectors', 'derivatives', 'velocity', 'acceleration'],
        produces: ['Position, velocity and acceleration of anything, as vectors'],
        refs: [ref('openstax')],
      },
      {
        id: 'projectiles',
        title: 'Projectiles',
        purpose: 'The first motion you can predict completely.',
        dependsOn: ['kinematics'],
        relations: [{ to: 'kinematics', verb: 'applies' }],
        builtFrom: ['constant-acceleration', 'free-fall', 'projectile-motion'],
        produces: ['Where a thrown object lands, and when'],
      },
      {
        id: 'dynamics',
        title: 'Forces',
        purpose: 'Explains why the acceleration is what it is.',
        dependsOn: ['kinematics'],
        relations: [{ to: 'kinematics', verb: 'explains' }],
        builtFrom: ['newtons-first', 'newtons-second', 'free-body-diagram', 'friction'],
        produces: ['The acceleration of an object from the forces on it'],
      },
      {
        id: 'energy',
        title: 'Energy',
        purpose: 'Answers “how fast?” without following the motion.',
        dependsOn: ['dynamics'],
        relations: [{ to: 'dynamics', verb: 'shortcuts' }],
        builtFrom: ['work', 'kinetic-energy', 'potential-energy', 'energy-conservation'],
        produces: ['Speeds from heights, and a second check on every answer'],
      },
    ],
  },

  domains: [
    { id: 'math', order: 0, label: 'Mathematical tools', shortLabel: 'Math', color: '#6B7280', tagline: 'The language mechanics is written in.' },
    { id: 'kinematics', order: 1, label: 'Kinematics', color: '#2563EB', tagline: 'Describing motion without asking why.' },
    { id: 'dynamics', order: 2, label: 'Dynamics', color: '#DC2626', tagline: 'Forces and how they change motion.' },
    { id: 'conservation', order: 3, label: 'Conservation laws', shortLabel: 'Conservation', color: '#059669', tagline: 'Quantities that stay the same, and what they let you skip.' },
    { id: 'beyond', order: 4, label: 'Beyond mechanics', shortLabel: 'Beyond', color: '#7C3AED', tagline: 'Where classical mechanics stops working.' },
  ],

  nodes: [
    // Mathematical tools
    { id: 'math-basics', label: 'Calculus and vectors', domain: 'math', kind: 'category', status: 'path', summary: 'The two tools every later idea uses.' },
    {
      id: 'vectors', label: 'Vectors', domain: 'math', kind: 'concept', status: 'path', parent: 'math-basics', stage: 'describe',
      summary: 'Quantities with a size and a direction, like a displacement of 3 m north-east. Added tip to tail, and split into x and y components.',
      docs: [wiki('Vectors', 'Euclidean_vector')], refs: [ref('openstax')],
    },
    {
      id: 'derivatives', label: 'Derivatives', domain: 'math', kind: 'method', status: 'path', parent: 'math-basics', stage: 'describe',
      summary: 'How fast one quantity changes as another does. Velocity is the derivative of position with respect to time.',
      docs: [wiki('Derivative', 'Derivative')], refs: [ref('openstax')],
    },
    {
      id: 'integrals', label: 'Integrals', domain: 'math', kind: 'method', status: 'context', parent: 'math-basics',
      summary: 'The reverse of a derivative: from a velocity over time back to the distance covered.',
    },
    {
      id: 'units', label: 'Dimensional analysis', domain: 'math', kind: 'method', status: 'context', parent: 'math-basics',
      summary: 'Checking that the units on both sides of an equation match. Catches most algebra mistakes.',
    },

    // Kinematics
    { id: 'describing', label: 'Describing motion', domain: 'kinematics', kind: 'category', status: 'path', summary: 'The quantities.' },
    {
      id: 'velocity', label: 'Velocity', domain: 'kinematics', kind: 'concept', status: 'path', parent: 'describing', stage: 'describe',
      summary: 'How fast position changes, and in which direction. Speed is its size.',
      docs: [wiki('Velocity', 'Velocity')], refs: [ref('openstax')],
    },
    {
      id: 'acceleration', label: 'Acceleration', domain: 'kinematics', kind: 'concept', status: 'path', parent: 'describing', stage: 'describe',
      summary: 'How fast velocity changes. Braking, speeding up and turning are all acceleration.',
      docs: [wiki('Acceleration', 'Acceleration')], refs: [ref('openstax')],
    },
    {
      id: 'reference-frames', label: 'Reference frames', domain: 'kinematics', kind: 'concept', status: 'context', parent: 'describing',
      summary: 'Motion is always measured relative to something. A ball dropped in a moving train falls straight down for the passenger.',
    },
    { id: 'solving', label: 'Solving motion', domain: 'kinematics', kind: 'category', status: 'path', summary: 'Getting positions and times.' },
    {
      id: 'constant-acceleration', label: 'Constant-acceleration equations', domain: 'kinematics', kind: 'method', status: 'path', parent: 'solving', stage: 'projectile',
      summary: 'Four equations linking position, velocity, acceleration and time when the acceleration does not change.',
      docs: [wiki('Equations of motion', 'Equations_of_motion')], refs: [ref('openstax')],
    },
    {
      id: 'numerical', label: 'Step-by-step simulation', domain: 'kinematics', kind: 'method', status: 'alternative', parent: 'solving', alternativeTo: 'constant-acceleration',
      summary: 'Advancing the motion in small time steps on a computer. Works for any force, but hides the pattern; we solve by hand first.',
      docs: [wiki('Numerical methods for ODEs', 'Numerical_methods_for_ordinary_differential_equations')],
    },
    {
      id: 'free-fall', label: 'Free fall', domain: 'kinematics', kind: 'concept', status: 'path', parent: 'solving', stage: 'projectile',
      summary: 'Near the ground everything falls with the same acceleration, g ≈ 9.8 m/s², if air resistance is small.',
      docs: [wiki('Free fall', 'Free_fall')], refs: [ref('openstax')],
    },
    {
      id: 'projectile-motion', label: 'Projectile motion', domain: 'kinematics', kind: 'concept', status: 'path', parent: 'solving', stage: 'projectile',
      summary: 'A thrown object moves steadily sideways while falling freely. Treating the two directions separately is the whole trick.',
      docs: [wiki('Projectile motion', 'Projectile_motion')], refs: [ref('openstax')],
    },
    {
      id: 'circular-motion', label: 'Circular motion', domain: 'kinematics', kind: 'concept', status: 'context', parent: 'solving',
      summary: 'Moving in a circle at constant speed is still acceleration, pointing to the centre.',
    },

    // Dynamics
    { id: 'newton', label: 'Newton’s laws', domain: 'dynamics', kind: 'category', status: 'path', summary: 'Why motion changes.' },
    {
      id: 'newtons-first', label: 'First law', domain: 'dynamics', kind: 'law', status: 'path', parent: 'newton', stage: 'forces',
      summary: 'Without a net force, an object keeps its velocity. Motion does not need a cause; changes in motion do.',
      docs: [wiki('Newton’s laws of motion', 'Newton%27s_laws_of_motion')], refs: [ref('openstax')],
    },
    {
      id: 'newtons-second', label: 'Second law', domain: 'dynamics', kind: 'law', status: 'path', parent: 'newton', stage: 'forces',
      summary: 'Net force equals mass times acceleration, F = ma. The bridge from forces to the kinematics you already know.',
      docs: [wiki('Newton’s laws of motion', 'Newton%27s_laws_of_motion')], refs: [ref('openstax')],
    },
    {
      id: 'newtons-third', label: 'Third law', domain: 'dynamics', kind: 'law', status: 'context', parent: 'newton',
      summary: 'Forces come in pairs: if A pushes B, B pushes A equally hard the other way.',
    },
    {
      id: 'lagrangian', label: 'Lagrangian mechanics', domain: 'dynamics', kind: 'method', status: 'alternative', parent: 'newton', alternativeTo: 'newtons-second',
      summary: 'The same physics derived from energies instead of forces. More powerful for complicated systems; forces are easier to picture first.',
      docs: [wiki('Lagrangian mechanics', 'Lagrangian_mechanics')],
    },
    { id: 'forces', label: 'Kinds of force', domain: 'dynamics', kind: 'category', status: 'path', summary: 'What pushes and pulls.' },
    {
      id: 'free-body-diagram', label: 'Free-body diagram', domain: 'dynamics', kind: 'method', status: 'path', parent: 'forces', stage: 'forces',
      summary: 'A sketch of one object with every force on it as an arrow. Almost every dynamics problem starts here.',
      docs: [wiki('Free body diagram', 'Free_body_diagram')], refs: [ref('openstax')],
    },
    {
      id: 'friction', label: 'Friction', domain: 'dynamics', kind: 'concept', status: 'path', parent: 'forces', stage: 'forces',
      summary: 'The force that resists sliding, roughly proportional to how hard the surfaces are pressed together.',
      docs: [wiki('Friction', 'Friction')], refs: [ref('openstax')],
    },
    { id: 'springs', label: 'Spring force', domain: 'dynamics', kind: 'law', status: 'context', parent: 'forces', summary: 'A spring pulls back in proportion to how far it is stretched (Hooke’s law).' },
    { id: 'drag', label: 'Air resistance', domain: 'dynamics', kind: 'concept', status: 'context', parent: 'forces', summary: 'Grows with speed; the reason a feather and a hammer fall differently on Earth.' },

    // Conservation laws
    { id: 'energy-group', label: 'Energy', domain: 'conservation', kind: 'category', status: 'path', summary: 'The quantity that is never lost.' },
    {
      id: 'work', label: 'Work', domain: 'conservation', kind: 'concept', status: 'path', parent: 'energy-group', stage: 'energy',
      summary: 'Force times distance moved along it. The way forces put energy into or take it out of an object.',
      docs: [wiki('Work', 'Work_(physics)')], refs: [ref('openstax')],
    },
    {
      id: 'kinetic-energy', label: 'Kinetic energy', domain: 'conservation', kind: 'concept', status: 'path', parent: 'energy-group', stage: 'energy',
      summary: 'Energy of motion, ½mv². Doubling the speed quadruples it.',
      docs: [wiki('Kinetic energy', 'Kinetic_energy')], refs: [ref('openstax')],
    },
    {
      id: 'potential-energy', label: 'Potential energy', domain: 'conservation', kind: 'concept', status: 'path', parent: 'energy-group', stage: 'energy',
      summary: 'Energy stored by position, like mgh for height above the ground.',
      docs: [wiki('Potential energy', 'Potential_energy')], refs: [ref('openstax')],
    },
    {
      id: 'energy-conservation', label: 'Conservation of energy', domain: 'conservation', kind: 'law', status: 'path', parent: 'energy-group', stage: 'energy',
      summary: 'Without friction, kinetic plus potential energy stays the same. With it, the missing energy has become heat.',
      docs: [wiki('Conservation of energy', 'Conservation_of_energy')], refs: [ref('openstax')],
    },
    { id: 'momentum-group', label: 'Momentum', domain: 'conservation', kind: 'category', status: 'context', summary: 'The other conserved quantity.' },
    { id: 'momentum', label: 'Momentum', domain: 'conservation', kind: 'concept', status: 'context', parent: 'momentum-group', summary: 'Mass times velocity. Conserved when no outside force acts, which makes collisions solvable.' },
    { id: 'collisions', label: 'Collisions', domain: 'conservation', kind: 'concept', status: 'context', parent: 'momentum-group', summary: 'Momentum is always conserved in a collision; kinetic energy only in elastic ones.' },
    { id: 'angular-momentum', label: 'Angular momentum', domain: 'conservation', kind: 'concept', status: 'context', parent: 'momentum-group', summary: 'Why a spinning skater speeds up when pulling in their arms.' },

    // Beyond mechanics
    { id: 'limits', label: 'Where it breaks down', domain: 'beyond', kind: 'category', status: 'context', summary: 'Newton is an approximation.' },
    { id: 'relativity', label: 'Special relativity', domain: 'beyond', kind: 'concept', status: 'context', parent: 'limits', summary: 'Near the speed of light, time and length depend on who measures them.' },
    { id: 'quantum', label: 'Quantum mechanics', domain: 'beyond', kind: 'concept', status: 'context', parent: 'limits', summary: 'At atomic sizes, position and velocity cannot both be known exactly.' },
    { id: 'chaos', label: 'Chaos', domain: 'beyond', kind: 'concept', status: 'context', parent: 'limits', summary: 'Some systems follow Newton exactly yet cannot be predicted far ahead, like a double pendulum.' },
  ],

  edges: [
    { from: 'velocity', to: 'derivatives', kind: 'is-defined-by' },
    { from: 'newtons-second', to: 'acceleration', kind: 'determines' },
    { from: 'free-fall', to: 'newtons-second', kind: 'follows-from', label: 'follows from' },
    { from: 'work', to: 'kinetic-energy', kind: 'changes' },
    { from: 'friction', to: 'energy-conservation', kind: 'turns-energy-into-heat', label: 'turns energy into heat in' },
    { from: 'integrals', to: 'constant-acceleration', kind: 'derives' },
    { from: 'momentum', to: 'newtons-third', kind: 'follows-from' },
  ],

  stages: [
    {
      id: 'describe', period: 1, order: 1,
      title: 'Describe a motion',
      feeling: 'I can describe how something moves with numbers, not words.',
      task: 'Film something moving, measure its position over time and turn that into velocity and acceleration.',
      delivers: ['kinematics'],
      waypoints: ['vectors', 'derivatives', 'velocity', 'acceleration'],
      do: [
        'Film a ball rolling across a table next to a ruler, with your phone.',
        { text: 'Step through the video and write down the position every 0.1 s.', tip: 'Most phones can play video frame by frame; at 30 fps, 0.1 s is every third frame.', tipKind: 'reveal' },
        { text: 'Work out the velocity between each pair of measurements.', nodes: ['velocity', 'derivatives'] },
      ],
      observe: [
        { text: 'Is the velocity the same everywhere? Where does it change?', note: true, nodes: ['acceleration'] },
        { text: 'What would the numbers look like for a ball rolling downhill?', note: true },
      ],
      read: ['vectors', 'derivatives', 'velocity', 'acceleration', 'reference-frames'],
      checkpoint: 'From your own table of positions you can give the ball’s velocity and say whether it accelerated.',
      refs: [ref('openstax')],
    },
    {
      id: 'projectile', period: 1, order: 2,
      title: 'Predict a throw',
      feeling: 'I predicted where something would land before it did.',
      task: 'Predict where a ball rolled off a table lands, then check.',
      delivers: ['projectiles'],
      waypoints: ['constant-acceleration', 'free-fall', 'projectile-motion'],
      do: [
        'Measure the table height and the speed of a ball rolling across it (as in stage 1).',
        { text: 'Predict how far from the table the ball lands.', tip: 'Fall time from the height: h = ½gt². Distance = speed × that time.', tipKind: 'reveal', nodes: ['projectile-motion'] },
        'Mark the spot, roll the ball, and see.',
      ],
      observe: [
        { text: 'How far off was your prediction? What could explain the difference?', note: true },
        { text: 'Did the sideways speed change during the fall?', nodes: ['projectile-motion'] },
      ],
      read: ['constant-acceleration', 'free-fall', 'projectile-motion', 'numerical', 'drag'],
      checkpoint: 'Your prediction lands within a few centimetres, and you can explain why sideways and downwards are separate.',
      refs: [ref('openstax')],
    },
    {
      id: 'forces', period: 2, order: 3,
      title: 'Find the forces',
      feeling: 'I can explain an acceleration from the forces that cause it.',
      task: 'Pull a block along a table with a spring scale and explain its motion with Newton’s second law.',
      delivers: ['dynamics'],
      waypoints: ['newtons-first', 'newtons-second', 'free-body-diagram', 'friction'],
      do: [
        'Pull a block steadily with a spring scale and note the force needed to keep it moving at constant speed.',
        { text: 'Draw the free-body diagram for the block.', nodes: ['free-body-diagram'] },
        { text: 'Pull harder and work out the acceleration you expect.', tip: 'Net force = pull − friction; a = net force / mass.', tipKind: 'reveal', nodes: ['newtons-second'] },
      ],
      observe: [
        { text: 'At constant speed, what is the net force? Why?', note: true, nodes: ['newtons-first'] },
        { text: 'Does friction change when you pull harder?', note: true, nodes: ['friction'] },
      ],
      read: ['newtons-first', 'newtons-second', 'free-body-diagram', 'friction', 'newtons-third', 'lagrangian'],
      checkpoint: 'You can draw the free-body diagram and predict the block’s acceleration from the pull, its mass and friction.',
      refs: [ref('openstax')],
    },
    {
      id: 'energy', period: 2, order: 4,
      title: 'Take the shortcut',
      feeling: 'I can get a speed from a height without following the motion.',
      task: 'Predict a ball’s speed at the bottom of a ramp using energy, and compare with a force-based answer.',
      delivers: ['energy'],
      waypoints: ['work', 'kinetic-energy', 'potential-energy', 'energy-conservation'],
      do: [
        { text: 'Predict the speed at the bottom of a ramp from its height alone.', tip: 'mgh = ½mv², so v = √(2gh). The mass cancels.', tipKind: 'reveal', nodes: ['energy-conservation'] },
        'Measure the actual speed with the filming method from stage 1.',
      ],
      observe: [
        { text: 'Why did you not need the ramp’s angle?', note: true, nodes: ['potential-energy'] },
        { text: 'Where did the missing energy go, if the measured speed is lower?', note: true, nodes: ['friction', 'work'] },
      ],
      read: ['work', 'kinetic-energy', 'potential-energy', 'energy-conservation', 'momentum'],
      checkpoint: 'You can predict the speed two ways — with forces and with energy — and explain why they differ.',
      refs: [ref('openstax')],
    },
  ],
});
