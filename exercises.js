// Freewriting Studio: the techniques, in my own words, from Stephen Lloyd Webber's "Deep Freewriting".
// Timings: "book" means Webber gives that timing; "suggested" means he leaves it open and the app picks a starting point.
window.FS_MODULES = [
  { n: 1, name: 'Flow' },
  { n: 2, name: 'Structured Freewriting' },
  { n: 3, name: 'Time and Questions' },
  { n: 4, name: 'Multiply Your Ideas' },
  { n: 5, name: 'The Marathon' },
  { n: 6, name: 'Revising and Your Voice' },
  { n: 7, name: 'Deepening the Flow' }
];

// goal: { mode: 'time' | 'words' | 'both', minutes, words, endOn: 'first' | 'last' }
// timing: { book: true/false, text: what the book says or what the app suggests }
// kind: 'write' (default), 'morning' (opens Morning Freewrite), 'reference' (nothing to time), 'recipe' (several phases)
window.FS_TECHNIQUES = [
  {
    id: 'free', module: 0, n: 0, name: 'Freewrite',
    summary: 'Plain freewriting with no technique. Pick a goal and keep the pen moving.',
    how: ['Write whatever comes, without stopping.', 'Don\'t fix, judge or reread until the goal is reached.'],
    seedLabel: 'Seed (optional)', seedHint: 'A word, question or image to start from',
    goal: { mode: 'time', minutes: 10, words: 500, endOn: 'first' },
    timing: { book: false, text: '10 minutes, suggested' }
  },

  // Module 1: Flow
  {
    id: 'vision', module: 1, n: 1, name: 'Set Your Vision',
    summary: 'Ten minutes holding one question: what do you want from this practice?',
    how: ['Hold one question in mind: what do I want from freewriting?', 'Write without stopping until the time is up.', 'When you run dry, ask the question again in different words.'],
    seedLabel: 'Your question', seed: 'What do I want from this practice?',
    goal: { mode: 'time', minutes: 10, words: 500, endOn: 'first' },
    timing: { book: true, text: '10 minutes (book)' }
  },
  {
    id: 'agreement', module: 1, n: 2, name: 'The Freewriting Agreement',
    summary: 'Draft your own contract for how you will write: no stopping, no editing, no judging.',
    how: ['Write out the terms you will hold yourself to while freewriting.', 'Start with the three core ones: don\'t stop, don\'t edit, don\'t judge.', 'Add any of your own. Keep the version you would actually sign.'],
    seedLabel: 'Title', seed: 'My freewriting agreement',
    goal: { mode: 'time', minutes: 10, words: 300, endOn: 'first' },
    timing: { book: false, text: '10 minutes, suggested' }
  },
  {
    id: 'authority', module: 1, n: 3, name: 'Authority Exercise',
    summary: 'A short freewrite on what you love about writing, and which old rules you\'re ready to drop.',
    how: ['Write about what you love in writing.', 'Then name the old rules about writing you\'ve been carrying, and which ones you\'re done with.'],
    seedLabel: 'Your question', seed: 'What do I love about writing, and which old rules can I drop?',
    goal: { mode: 'time', minutes: 10, words: 400, endOn: 'first' },
    timing: { book: false, text: 'The book says "briefly". 10 minutes, suggested' }
  },
  {
    id: 'morning', module: 1, n: 4, name: 'Morning Freewrite', kind: 'morning',
    summary: 'Two or three pages first thing after waking, every day for a few weeks.',
    how: ['Write first thing after you wake, before anything else.', 'No seed and no topic. Anything at all.', 'Keep it up daily. The streak on the Morning Freewrite page tracks it.'],
    goal: { mode: 'words', minutes: 15, words: 750, endOn: 'first' },
    timing: { book: true, text: 'Two or three pages (book). About 750 words' }
  },

  // Module 2: Structured
  {
    id: 'outline', module: 2, n: 5, name: 'Outline Sketch',
    summary: 'A fast freewrite of the main beats in order, then a longer one filling each beat in.',
    how: ['Sketch: list the beats in order, fast, as phrases. No scene-setting, no polish.', 'Fill in: freewrite the piece beat by beat with the sketch open beside you.'],
    phases: [
      { name: 'Sketch', minutes: 5, kind: 'write', hint: 'List the beats in order, fast. Phrases, not sentences.' },
      { name: 'Fill in', minutes: 15, kind: 'write', pin: 0, hint: 'Write the piece beat by beat. The sketch stays in view.' }
    ],
    seedLabel: 'What you\'re sketching',
    goal: { mode: 'time', minutes: 5, words: 200, endOn: 'first' },
    timing: { book: false, text: 'The book says "quick" for the sketch. 5 minutes, suggested; 15 to 20 for the fill-in' }
  },
  {
    id: 'washaway', module: 2, n: 6, name: 'Wash-Away Sketch',
    summary: 'Sketch quickly, note its shape, set it aside, then write the piece without looking back.',
    how: ['Sketch the beats quickly.', 'Notice the shape, then put the sketch away.', 'Freewrite the piece from memory of that shape alone.'],
    phases: [
      { name: 'Sketch', minutes: 5, kind: 'write', hint: 'Sketch the beats quickly. Notice the shape.' },
      { name: 'Write it', minutes: 15, kind: 'write', pin: 0, hidePin: true, hint: 'The sketch is face-down. Write from your memory of its shape. It turns over once you reach the goal.' }
    ],
    seedLabel: 'What you\'re sketching',
    goal: { mode: 'time', minutes: 5, words: 200, endOn: 'first' },
    timing: { book: false, text: '5 minutes for the sketch, suggested' }
  },
  {
    id: 'gradual', module: 2, n: 7, name: 'Gradual Sketch',
    summary: 'Build the sketch in short passes over time, adding detail each round, leaving gaps open.',
    how: ['Write a short pass: what you know so far. Mark what you don\'t know as [gaps].', 'Come back later, hours or days, and add another pass.', 'Stop when there\'s enough to write from.'],
    seedLabel: 'What you\'re sketching',
    goal: { mode: 'time', minutes: 5, words: 150, endOn: 'first' },
    timing: { book: false, text: '5 minutes a pass, suggested' }
  },

  // Module 3: Time and Questions
  {
    id: 'hotseat', module: 3, n: 8, name: 'Hot Seat Mode',
    summary: 'Prepare pointed questions in advance, then answer each one fast against a minute\'s timer.',
    how: ['Write your questions first, before any timer.', 'Then take one question at a time and answer it in one minute, no editing.', 'Move straight on to the next.'],
    sets: [
      { name: 'Column: test the take', questions: [
        'What\'s the strongest case against my take?',
        'What\'s the best real counter-example?',
        'Am I being cynical, or accurate?',
        'Is this pattern specific to this topic, or does it fit almost anything? If it fits anything, what makes this one worth writing?',
        'What\'s the most ordinary, banal outcome of this so far?',
        'What\'s the one line a reader should walk away with?',
        'What haven\'t I said yet that\'s vital to the argument?'
      ] }
    ],
    seedLabel: 'Topic (optional)',
    goal: { mode: 'time', minutes: 1, words: 100, endOn: 'first' },
    timing: { book: true, text: '1 minute a question (book)' }
  },
  {
    id: 'lifecalling', module: 3, n: 9, name: 'Life Calling Exercise',
    summary: 'One large open question, freewritten against for a long stretch, restated whenever you stall.',
    how: ['Put one big open question at the top.', 'Write against it without stopping.', 'When you stall, tap Restate and say the question a different way. Don\'t assume the first wording was complete.'],
    seedLabel: 'Your big question',
    goal: { mode: 'time', minutes: 20, words: 1000, endOn: 'first' },
    timing: { book: false, text: '"An extended stretch" in the book. 20 minutes, suggested' }
  },
  {
    id: 'seed', module: 3, n: 9.5, name: 'Seed Crystal', num: '9a',
    summary: 'One concept held in mind, freewritten outward without a plan, returning to it each time you lose the thread.',
    how: ['Pick one small thing: a question, an image, a line, a single word.', 'Freewrite outward from it. Tangents are allowed.', 'When the thread goes, come back to the seed and launch again. Restate it if it helps.'],
    seedLabel: 'Your seed',
    goal: { mode: 'time', minutes: 10, words: 500, endOn: 'first' },
    timing: { book: false, text: '10 minutes, suggested' }
  },
  {
    id: 'birdseye', module: 3, n: 10, name: 'Bird\'s Eye Mode',
    summary: 'Freewrite at the level of shape and dynamics, not scenes, to map the whole before drafting.',
    how: ['Write about the project from above: who wants what, how the parts sit together, what the middle is for.', 'Let attention jump between characters and parts. Don\'t write scenes.', 'Stop when you feel oriented, not when the clock says so.'],
    seedLabel: 'The project',
    goal: { mode: 'time', minutes: 15, words: 700, endOn: 'first' },
    timing: { book: false, text: 'The book says stop when oriented. 15 minutes, suggested' }
  },

  // Module 4: Multiply Your Ideas
  {
    id: 'reenter', module: 4, n: 11, name: 'Rewrite to Enter the Same Space',
    summary: 'Read an old piece of yours, set it aside, then freewrite back into its mood without repeating it.',
    how: ['Read the old piece once.', 'Put it away.', 'Freewrite into its mood: the feeling, the weather, the tension. Not its plot or sentences.'],
    source: true,
    seedLabel: 'Which old piece',
    goal: { mode: 'time', minutes: 10, words: 500, endOn: 'first' },
    timing: { book: false, text: '10 minutes, suggested' }
  },
  {
    id: 'someone', module: 4, n: 12, name: 'Write Into Someone Else\'s Space',
    summary: 'Take a piece you admire and freewrite into its world: continuation, remix or reply.',
    how: ['Read a page by a writer you admire, once.', 'Close the book.', 'Freewrite into that world as a peer: carry it on, remix it, or answer it.'],
    source: true,
    seedLabel: 'The passage or writer',
    goal: { mode: 'time', minutes: 10, words: 500, endOn: 'first' },
    timing: { book: false, text: '10 minutes, suggested' }
  },
  {
    id: 'feelgoals', module: 4, n: 13, name: 'Feel Your Goals',
    summary: 'Freewrite through the feelings around a goal you\'re conflicted about, before reasoning it out.',
    how: ['Name the goal at the top.', 'Write the feelings underneath it: resignation, contempt, hope, whatever is actually there.', 'Stop early if it goes flat.'],
    seedLabel: 'The goal',
    goal: { mode: 'time', minutes: 15, words: 700, endOn: 'first' },
    timing: { book: false, text: '15 minutes, suggested; stop earlier if it goes flat (book)' }
  },
  {
    id: 'speak', module: 4, n: 14, name: 'Speak-Revision',
    summary: 'Listen to a recording of yourself and write down what the delivery says that the transcript misses.',
    how: ['Record yourself reading or talking through a piece.', 'Listen back.', 'Write what the voice carries: pace, stress, hesitation, what you leaned on.'],
    seedLabel: 'Which recording',
    goal: { mode: 'time', minutes: 10, words: 400, endOn: 'first' },
    timing: { book: false, text: '10 minutes, suggested' }
  },
  {
    id: 'association', module: 4, n: 15, name: 'Navigate by Association',
    summary: 'When you go blank, free-associate word to word from your last word until a new direction opens.',
    how: ['Take the last word you wrote.', 'Write the next word it brings to mind, then the next from that.', 'When a direction opens, follow it in full sentences.'],
    seedLabel: 'Start word',
    goal: { mode: 'time', minutes: 5, words: 200, endOn: 'first' },
    timing: { book: false, text: '5 minutes, suggested' }
  },
  {
    id: 'trees', module: 4, n: 16, name: 'Trees From Tens',
    summary: 'List ten things, then two under each, then two more under each of those, building outward fast.',
    how: ['Write a list of ten.', 'Under each, write two more.', 'Under each of those, two more. Go fast.'],
    seedLabel: 'Ten of what',
    goal: { mode: 'time', minutes: 10, words: 300, endOn: 'first' },
    timing: { book: false, text: '10 minutes, suggested' }
  },
  {
    id: 'relay', module: 4, n: 17, name: 'The Writing Relay',
    summary: 'Write five minutes, move five, rest a minute, review, write again. Repeat.',
    how: ['Write for five minutes.', 'Get up and move for five.', 'Rest a minute, reread, then start the next five-minute leg.'],
    seedLabel: 'What you\'re writing',
    goal: { mode: 'time', minutes: 5, words: 250, endOn: 'first' },
    timing: { book: true, text: '5 minutes a writing leg (book)' }
  },
  {
    id: 'sift', module: 4, n: 18, name: 'Sift a Question From Multiple Perspectives',
    summary: 'Write about a problem to yourself, then to your reader, then to a sceptical reader.',
    how: ['Write about the problem addressed to yourself.', 'Write it again addressed to your reader.', 'Write it a third time to a sceptic who doesn\'t buy it.'],
    phases: [
      { name: 'To yourself', minutes: 5, kind: 'write', hint: 'Write about the problem for your own eyes. No explaining.' },
      { name: 'To your reader', minutes: 5, kind: 'write', pin: 0, hint: 'Now write it for your reader. What do they need that you skipped?' },
      { name: 'To a sceptic', minutes: 5, kind: 'write', pin: 1, hint: 'Write it for a reader who doesn\'t buy it. Answer their objections.' }
    ],
    seedLabel: 'The problem',
    goal: { mode: 'time', minutes: 15, words: 700, endOn: 'first' },
    timing: { book: false, text: '15 minutes (5 for each reader), suggested' }
  },

  // Module 5: The Marathon
  {
    id: 'phrase', module: 5, n: 19, name: 'Turning a Phrase',
    summary: 'Take one simple sentence and rewrite it many ways, noticing how each shifts the meaning.',
    how: ['Put one plain sentence at the top.', 'Rewrite it again and again, one version a line.', 'Notice what each version changes.'],
    lines: true,
    seedLabel: 'Your sentence',
    goal: { mode: 'time', minutes: 5, words: 250, endOn: 'first' },
    timing: { book: false, text: '5 minutes, suggested' }
  },
  {
    id: 'tricks', module: 5, n: 20, name: 'Bag of Tricks', kind: 'reference',
    summary: 'Six small moves for when you stall mid-session.',
    how: ['Make a metaphor for what you\'re writing about.', 'Change register: more formal, more casual, more blunt.', 'Get altitude: step back and write about the shape of it.', 'Repeat or recap what you just wrote.', 'Free-associate from your last word.', 'Share a block of writing with someone.'],
    timing: { book: true, text: 'No timer. Use them inside any session' }
  },

  // Module 6
  {
    id: 'imitation', module: 6, n: 21, name: 'Use Imitation to Feel for Yourself',
    summary: 'Revise your own work, read a page by a writer you admire, then return to your draft.',
    how: ['Work on your own draft for a while.', 'Read a page or two by a writer you admire.', 'Go back to your draft and write. Let the contrast show you your own voice.'],
    seedLabel: 'Which draft',
    goal: { mode: 'time', minutes: 15, words: 600, endOn: 'first' },
    timing: { book: false, text: '15 minutes, suggested' }
  },

  // Module 7
  {
    id: 'reflection', module: 7, n: 22, name: 'Reflection Exercise',
    summary: 'Freewrite through what you\'ve learned from the practice and how it fits the way you already work.',
    how: ['Write about what freewriting has given you so far.', 'And where it doesn\'t fit how you already work.'],
    seedLabel: 'Your question', seed: 'What have I learned, and how does it fit how I work?',
    goal: { mode: 'time', minutes: 10, words: 500, endOn: 'first' },
    timing: { book: false, text: '10 minutes, suggested' }
  },
  {
    id: 'onehour', module: 7, n: 23, name: 'The One-Hour Article/Essay', kind: 'recipe',
    summary: 'Sketch, freewrite, reread and mark, fill gaps and reorder, polish.',
    phases: [
      { name: 'Sketch', minutes: 5, kind: 'write', hint: 'List the beats of the piece in order, fast.' },
      { name: 'Freewrite', minutes: 25, kind: 'write', pin: 0, hint: 'Write the whole piece without stopping. The sketch stays in view.' },
      { name: 'Reread and mark', minutes: 5, kind: 'mark', markFrom: [1], hint: 'Don\'t edit yet. Mark what\'s strong and what\'s dead weight.' },
      { name: 'Fill gaps and reorder', minutes: 20, kind: 'edit', from: 1, dropDead: 2, keep: 2, hint: 'Now edit. The dead weight is already cut; your strong passages are listed beside you. Move things, fill gaps, add facts.' },
      { name: 'Polish', minutes: 5, kind: 'edit', from: 3, hint: 'Line level only. Make the opening earn the piece and the close land. Not the moment to restructure.' }
    ],
    seedLabel: 'Your piece',
    goal: { mode: 'time', minutes: 25, words: 1000, endOn: 'first' },
    timing: { book: true, text: '5 / 25 / 5 / 20 / 5 minutes (book)' }
  },
  {
    id: 'alternate', module: 7, n: 24, name: 'Alternate One-Hour Recipe', kind: 'recipe',
    summary: 'Sketch, freewrite, throw that draft away, sketch again, rewrite clean, then a longer polish.',
    phases: [
      { name: 'Sketch', minutes: 5, kind: 'write', hint: 'List the beats of the piece in order, fast.' },
      { name: 'Freewrite', minutes: 20, kind: 'write', pin: 0, hint: 'Write the piece. Expect to throw this draft away; it\'s for finding out what you think.' },
      { name: 'Discard and sketch again', minutes: 5, kind: 'write', discards: 1, hint: 'The first draft is set aside. Sketch again from what you learned writing it.' },
      { name: 'Rewrite clean', minutes: 20, kind: 'write', pin: 2, hint: 'Write the piece again from the new sketch.' },
      { name: 'Polish', minutes: 10, kind: 'edit', from: 3, hint: 'A longer polish. Line level: opening, close, flab.' }
    ],
    seedLabel: 'Your piece',
    goal: { mode: 'time', minutes: 20, words: 800, endOn: 'first' },
    timing: { book: true, text: '5 / 20 / 5 / 20 / 10 minutes (book)' }
  },
  {
    id: 'clarify', module: 7, n: 25, name: '30-Minute Idea Clarification', kind: 'recipe',
    summary: 'Write freely, debate yourself, mark what matters, then write toward a summary. Keep only the summary.',
    phases: [
      { name: 'Write freely', minutes: 5, kind: 'write', hint: 'Write about the idea, any way in.' },
      { name: 'Debate yourself', minutes: 10, kind: 'write', pin: 0, hint: 'Argue with what you just wrote. Take the other side, then answer it.' },
      { name: 'Reread and mark', minutes: 5, kind: 'mark', markFrom: [0, 1], hint: 'Mark the passages that matter.' },
      { name: 'Write toward a summary', minutes: 10, kind: 'write', keep: 2, hint: 'Write toward a short summary of the idea. What you marked is beside you.' }
    ],
    result: 'Your summary. The freewriting behind it is set aside below.',
    seedLabel: 'The idea',
    goal: { mode: 'time', minutes: 5, words: 250, endOn: 'first' },
    timing: { book: true, text: '5 / 10 / 5 / 10 minutes (book)' }
  }
];

// Used only inside a Column project: the One-Hour recipe from the freewrite on, since the project already has a sketch.
window.FS_TECHNIQUES.push({
  id: 'columndraft', module: 0, n: 0, hidden: true, name: 'Column draft',
  summary: 'Draft against the sketch, reread and mark, fill gaps and reorder, polish.',
  phases: [
    { name: 'Draft', minutes: 25, kind: 'write', hint: 'Write the column section by section, without stopping. The sketch and anchors stay beside you.' },
    { name: 'Reread and mark', minutes: 5, kind: 'mark', markFrom: [0], hint: 'Don\'t edit yet. Flag the strong lines and the dead weight.' },
    { name: 'Fill gaps, reorder, cut', minutes: 20, kind: 'edit', from: 0, dropDead: 1, keep: 1, hint: 'Bring the critical mind in now. Move the strong material into the order that serves the piece, insert the facts, cut what\'s weak.' },
    { name: 'Polish', minutes: 10, kind: 'edit', from: 2, hint: 'Line level only. The opening line earns the piece, the closing line lands, cut flab.' }
  ],
  seedLabel: 'Working title',
  timing: { book: true, text: '25 / 5 / 20 / 5 to 10 minutes (book)' }
});

// Projects: a set of techniques run in order, each step able to see what earlier steps produced.
window.FS_PIPELINES = {
  column: {
    name: 'Column',
    blurb: 'An opinion column built on a contrarian or provocative take, from your column process note. About two hours end to end.',
    skip: 'Left out for column length: Bird\'s Eye Mode, Trees From Tens and the Writing Relay.',
    steps: [
      { key: 'angle', name: 'Start with the vague angle', tech: 'free', minutes: 10, seedLabel: 'Your angle',
        hint: 'Write the cynical or contrarian impulse as it actually occurs to you. Two half-formed claims stitched together is a normal start.' },
      { key: 'sharpen', name: 'Sharpen it with Life Calling', tech: 'lifecalling', minutes: 20, show: ['angle'], seed: 'Why does this feel true? What convinced me?',
        hint: 'Hunt for the one specific example or moment that actually convinced you. Restate the question whenever you stall.' },
      { key: 'feel', name: 'Feel the emotion under it', tech: 'feelgoals', minutes: 15, show: ['angle'], seed: 'What do I actually feel about this?',
        hint: 'Resignation, contempt, whatever it really is. It usually surfaces the real evidence. Stop early if it goes flat.' },
      { key: 'steelman', name: 'Steelman the opposition (Hot Seat)', tech: 'hotseat', show: ['angle'], questions: [0, 1, 2, 3],
        hint: 'One minute a question, no editing.' },
      { key: 'angleqs', name: 'Hot Seat on the angle itself', tech: 'hotseat', show: ['angle'], questions: [4, 5, 6],
        hint: 'One minute a question, no editing.' },
      { key: 'clarify', name: 'If the angle is still too vague: 30-Minute Idea Clarification', tech: 'clarify', show: ['angle'], optional: true,
        hint: 'Only if the Hot Seat had nothing to bite on. Keep the summary, not the freewriting.' },
      { key: 'anchors', name: 'Get two or three real anchors', kind: 'anchors',
        hint: 'A specific fact, date, announcement or quote. Checkable, not remembered secondhand. The one step that isn\'t freewriting.' },
      { key: 'outline', name: 'Outline Sketch with the anchors placed', tech: 'outline', show: ['anchors', 'angleqs'],
        hint: 'Beats in order: hook, claim, evidence, counter-case answered, close. Put each anchor into the beat it supports.' },
      { key: 'draft', name: 'Draft, reread, fill gaps, polish', tech: 'columndraft', show: ['outline', 'anchors'],
        hint: 'The One-Hour recipe from the freewrite on.' }
    ]
  },
  fiction: {
    name: 'Fiction scene',
    blurb: 'A scene from a seed to a revised draft: the route the merchant and the monk took.',
    steps: [
      { key: 'seed', name: 'Find the seed', tech: 'seed', minutes: 10, seedLabel: 'Your seed: an image, a line or a question',
        hint: 'Freewrite outward from one small thing. Come back to it when you lose the thread.' },
      { key: 'birdseye', name: 'Map it from above', tech: 'birdseye', show: ['seed'],
        hint: 'Who wants what, how the parts sit together. No scenes yet.' },
      { key: 'outline', name: 'Outline Sketch the scene', tech: 'outline', show: ['birdseye'],
        hint: 'The beats of this one scene, in order.' },
      { key: 'draft', name: 'Draft the scene', tech: 'free', minutes: 25, show: ['outline'], seedLabel: 'The scene',
        hint: 'Write the scene against the sketch, without stopping.' },
      { key: 'revise', name: 'Revise by writing into a writer you admire', tech: 'someone', show: ['draft'],
        hint: 'Read a page by a writer who does what your draft doesn\'t yet, then freewrite the scene again in that register.' }
    ]
  }
};
