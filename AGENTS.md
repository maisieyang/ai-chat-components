# Repository Guidelines

## Project Structure & Module Organization
The Next.js App Router entry lives in `src/app`, with `layout.tsx` and `page.tsx` orchestrating the chat experience and API routes under `src/app/api`. Shared UI sits in `src/components`, organized by feature (for example, `ChatWindow/` wraps streaming UI primitives). Hook logic is consolidated in `src/hooks`, reusable markdown processors in `src/utils`, and theming tokens in `src/styles/chatgpt-syntax-theme.js`. Static assets belong in `public/`, and Tailwind configuration is centralized in `tailwind.config.js`.

## Build, Test, and Development Commands
- `npm run dev` – start the Turbopack dev server on port 3000; confirm streaming output in the chat view while iterating.
- `npm run build` – create an optimized production build; always run when touching `src/app/api` or streaming utilities.
- `npm run start` – serve the production bundle locally to verify edge runtime behaviour.
- `npm run lint` – run the flat ESLint config (`next/core-web-vitals` + TypeScript); use it to gate pull requests.

## Coding Style & Naming Conventions
Code is TypeScript-first with `strict` mode enabled and the `@/*` path alias—import shared code as `import { CalloutBox } from '@/components/CalloutBox'`. Components and files use PascalCase (`MessageBubble.tsx`), hooks start with `use` (`useAutoScroll.ts`), and utilities stay in camelCase. Prefer named exports, Tailwind utility classes, and keep design tokens aligned with `tailwind.config.js`. Follow Prettier defaults (2-space indent, trailing commas where valid) and rely on ESLint for final formatting validation.

## Testing Guidelines
No automated test runner ships yet; when adding coverage, co-locate `*.test.ts(x)` files near the implementation and exercise streaming behaviour with `@testing-library/react` + mock fetches. Always run `npm run lint` before committing, and manually verify the theme with `test-theme.html` plus dark/light toggles in the dev server. Document any skipped cases in the PR description.

## Commit & Pull Request Guidelines
Commits follow Conventional Commit prefixes (`feat:`, `fix:`, `refactor:`) as seen in the history—keep scopes concise and prefer English summaries. Every PR should include: a short purpose statement, linked issue or task ID, screenshots or screen recordings for UI-facing changes (light and dark themes), a checklist of verification steps (`npm run lint`, manual streaming test), and notes about new environment variables or migrations. Request review from another agent before merging.

## Environment & Configuration
Set `OPENAI_API_KEY` in `.env.local` before hitting the chat API (`src/app/api/chat/route.ts` exits early without it). Keep secrets out of the repo and document any additional configuration keys in the PR. When updating Tailwind or theme tokens, reflect the change in `src/styles/chatgpt-syntax-theme.js` and call it out so designers can review.
