# THIRA

Three.js ocean coming-soon site. One downward gesture scrolls smoothly to the ending; an upward gesture returns to the opening. Includes an underwater entrance, whirlpool, liquid logo reveal, mobile tilt and adaptive rendering quality.

## Run

- `npm install`
- `npm run dev` — development server on localhost:4175.
- `npm run build` — production output in `dist`.
- `npm run preview` — production preview on localhost:8080.

## Checks

- `npm test` — wave sampling, adaptive performance and tilt checks.
- `npm run verify:ocean` — browser check for forward/backward auto-scroll; requires the preview on port 8080.
- Remaining `scripts/verify-*.mjs` capture specific rendering features using a production server on port 4176. They create ignored output in `artifacts`.
- `scripts/profile-narrative.mjs` measures rendering cost on port 4176 with the opt-in profiler.

`src` contains the app and shaders. `logo-centered.svg` is the animated main mark. The two PNGs in `sb logo` are the corner presenter marks. Generated `dist`, `artifacts`, and installed `node_modules` are ignored by Git.
