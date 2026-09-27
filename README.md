# THIRA

THIRA is a women-centred tech and ideas conclave in Kochi, Kerala, India, brought to you by IEEE MEC Student Branch WIE. It creates room for conversations, questions and stories spanning technology, careers, leadership, innovation and the many paths beyond the familiar.

## Event Overview

In the middle of the noise around us, THIRA is an invitation to pause and see something differently: a story you have never heard, a woman who questioned what was expected of her, or an idea that stays with you long after the conversation ends.

THIRA has come to MEC to bring together people and perspectives from across Kochi, Kerala and South India. Come to listen, engage, debate and learn. Follow the waves of technology, ambition and curiosity wherever they lead.

## Sessions and Experiences

### Technical Talks

Technology changes the world around us faster than we can always process. Hear from people working inside those changes, bring your questions, discover new ideas and get a clearer view of what it means to build a future in evolving technical fields.

### Beyond the Usual Career Path

There is a whole coastline beyond the short list of careers we are usually handed. Hear from women in finance, filmmaking, theatre, management and other unexpected fields about what it took to choose a different direction and what life looks like on the other side.

### Lightning Talks

Every speaker arrives at the dais by a different route. Lightning Talks brings those journeys close, turning short, vivid stories into moments that may begin to feel like your own.

### Panel Discussions

No wave rises alone. Our panels bring together people who have lived different versions of the same field to agree, disagree and think out loud. The goal is not one perfect answer, but a fuller view shaped by several directions.

### Keynote Conversations

Our keynote speakers share the storms, detours, doubts and discoveries behind where they are today. These are stories about changing course, continuing forward and learning from the journey, not just arriving at a destination.

### Plenary Sessions

We are not the same, and that is the point. Different disciplines and experiences contribute different strokes to a larger picture. THIRA creates space for those perspectives to meet and make sense together.

### Stalls and Experiences

Wander, explore and look around. Bring your friends or come alone. Among the things you came expecting, you may find an idea, community or possibility you did not know you were looking for.

## Why Attend THIRA?

Your usual field is only one part of a much larger world. THIRA helps you step outside your comfort zone, meet people from different disciplines, hear honest journeys and discover possibilities across technology, finance, management, filmmaking, theatre and more.

Everyone is welcome to listen, question, participate and find a new direction in the conversation.

## Run

- `npm install`
- `npm run dev` — development server on localhost:4175.
- `npm run build` — production output in `dist`.
- `npm run preview` — production preview on localhost:8080.

## Checks

- `npm test` — wave sampling and adaptive performance checks.
- `npm run verify:ocean` — browser check for forward/backward manual scrolling; requires the preview on port 8080.
- Remaining `scripts/verify-*.mjs` capture specific rendering features using a production server on port 4176. They create ignored output in `artifacts`.
- `scripts/profile-narrative.mjs` measures rendering cost on port 4176 with the opt-in profiler.

`src` contains the app and shaders. `logo-centered.svg` is the animated main mark. The two PNGs in `sb logo` are the corner presenter marks. Generated `dist`, `artifacts`, and installed `node_modules` are ignored by Git.
