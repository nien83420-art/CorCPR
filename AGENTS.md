# corCPR development rules

## Repository safety

- Perform all development work in isolated Git worktrees. Never modify the `main` branch or the original working directory directly.
- Obtain explicit user approval for each specific push, merge, deployment, publication, pull request creation, or GitHub settings change.
- Obtain explicit user approval before modifying production services, databases, credentials, or environment secrets.
- Obtain permission before deleting files or performing destructive Git operations.

## Development workflow

- Before implementing a feature, propose a concise implementation plan and wait for user approval.
- Make small, focused, reversible changes and avoid unrelated refactoring.
- Preserve existing functionality unless the user specifically requests a change.
- Run relevant tests after approved changes.
- Report the exact paths of all changed files and identify which tests passed or failed. Report tests that were skipped or could not run. Claim a pass only for a test that was actually executed and passed.

## Local website testing

- Prefer local development and browser previews. Give the user an opportunity to review changes before any GitHub update.
- From the isolated worktree with dependencies available, run `pnpm dev` and open `http://localhost:3000` in a browser, or use the local URL printed by the server. Grant camera access when testing the camera-based training flow.
- Obtain explicit user approval before deploying a preview or production environment.

## corCPR requirements

- Preserve the existing Kazakh, Russian, and English interfaces.
- Treat camera-based movement estimates as unvalidated training indicators. Reserve clinical measurement claims for appropriately validated methods.
- Claim reliable camera measurement of compression depth, compression force, or CPR effectiveness only with appropriate validation.
- Preserve existing user workflows unless the user approves a change.
- Flag potentially misleading medical feedback for expert review.

## Communication

- Use Russian for explanations, plans, and progress reports.
- Use English for code identifiers and technical documentation where appropriate.
- Ask for clarification when requirements are genuinely ambiguous.
