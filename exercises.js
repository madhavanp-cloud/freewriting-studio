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
    later: 'A two-part screen, with the sketch pinned beside the fill-in, comes in stage 2. For now, run the sketch here, then start a second session for the fill-in.',
    seedLabel: 'What you\'re sketching',
    goal: { mode: 'time', minutes: 5, words: 200, endOn: 'first' },
    timing: { book: false, text: 'The book says "quick" for the sketch. 5 minutes, suggested; 15 to 20 for the fill-in' }
  },
  {
    id: 'washaway', module: 2, n: 6, name: 'Wash-Away Sketch',
    summary: 'Sketch quickly, note its shape, set it aside, then write the piece without looking back.',
    how: ['Sketch the beats quickly.', 'Notice the shape, then put the sketch away.', 'Freewrite the piece from memory of that shape alone.'],
    later: 'In stage 2 the app hides the sketch for you while you write.',
    seedLabel: 'What you\'re sketching',
    goal: { mode: 'time', minutes: 5, words: 200, endOn: 'first' },
    timing: { book: false, text: '5 minutes for the sketch, suggested' }
  },
  {
    id: 'gradual', module: 2, n: 7, name: 'Gradual Sketch',
    summary: 'Build the sketch in short passes over time, adding detail each round, leaving gaps open.',
    how: ['Write a short pass: what you know so far. Mark what you don\'t know as [gaps].', 'Come back later, hours or days, and add another pass.', 'Stop when there\'s enough to write from.'],
    later: 'In stage 2 the passes are kept together in one running sketch, each one dated.',
    seedLabel: 'What you\'re sketching',
    goal: { mode: 'time', minutes: 5, words: 150, endOn: 'first' },
    timing: { book: false, text: '5 minutes a pass, suggested' }
  },

  // Module 3: Time and Questions
  {
    id: 'hotseat', module: 3, n: 8, name: 'Hot Seat Mode',
    summary: 'Prepare pointed questions in advance, then answer each one fast against a minute\'s timer.',
    how: ['Write your questions first, before any timer.', 'Then take one question at a time and answer it in one minute, no editing.', 'Move straight on to the next.'],
    later: 'In stage 2, Hot Seat gets its own screen: list the questions once, and each gets a minute and moves on by itself. For now, run one minute per question here.',
    seedLabel: 'The question',
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
    seedLabel: 'Which old piece',
    goal: { mode: 'time', minutes: 10, words: 500, endOn: 'first' },
    timing: { book: false, text: '10 minutes, suggested' }
  },
  {
    id: 'someone', module: 4, n: 12, name: 'Write Into Someone Else\'s Space',
    summary: 'Take a piece you admire and freewrite into its world: continuation, remix or reply.',
    how: ['Read a page by a writer you admire, once.', 'Close the book.', 'Freewrite into that world as a peer: carry it on, remix it, or answer it.'],
    later: 'In stage 3 you can paste the passage in; it shows once and then closes when the timer starts.',
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
    later: 'In stage 3 this gets three tabs, one for each reader.',
    seedLabel: 'The problem',
    goal: { mode: 'time', minutes: 15, words: 700, endOn: 'first' },
    timing: { book: false, text: '15 minutes (5 for each reader), suggested' }
  },

  // Module 5: The Marathon
  {
    id: 'phrase', module: 5, n: 19, name: 'Turning a Phrase',
    summary: 'Take one simple sentence and rewrite it many ways, noticing how each shifts the meaning.',
    how: ['Put one plain sentence at the top.', 'Rewrite it again and again, one version a line.', 'Notice what each version changes.'],
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
    phases: [['Sketch', 5], ['Freewrite', 25], ['Reread and mark', 5], ['Fill gaps and reorder', 20], ['Polish', 5]],
    later: 'The phase-by-phase recipe timer comes in stage 2. For now, Start runs the 25-minute freewrite phase.',
    seedLabel: 'Your piece',
    goal: { mode: 'time', minutes: 25, words: 1000, endOn: 'first' },
    timing: { book: true, text: '5 / 25 / 5 / 20 / 5 minutes (book)' }
  },
  {
    id: 'alternate', module: 7, n: 24, name: 'Alternate One-Hour Recipe', kind: 'recipe',
    summary: 'Sketch, freewrite, throw that draft away, sketch again, rewrite clean, then a longer polish.',
    phases: [['Sketch', 5], ['Freewrite', 20], ['Discard and sketch again', 5], ['Rewrite clean', 20], ['Polish', 10]],
    later: 'The phase-by-phase recipe timer comes in stage 2. For now, Start runs the 20-minute freewrite phase.',
    seedLabel: 'Your piece',
    goal: { mode: 'time', minutes: 20, words: 800, endOn: 'first' },
    timing: { book: true, text: '5 / 20 / 5 / 20 / 10 minutes (book)' }
  },
  {
    id: 'clarify', module: 7, n: 25, name: '30-Minute Idea Clarification', kind: 'recipe',
    summary: 'Write freely, debate yourself, mark what matters, then write toward a summary. Keep only the summary.',
    phases: [['Write freely', 5], ['Debate yourself', 10], ['Reread and mark', 5], ['Write toward a summary', 10]],
    later: 'The phase-by-phase recipe timer comes in stage 2. For now, Start runs the first 5-minute phase.',
    seedLabel: 'The idea',
    goal: { mode: 'time', minutes: 5, words: 250, endOn: 'first' },
    timing: { book: true, text: '5 / 10 / 5 / 10 minutes (book)' }
  }
];
