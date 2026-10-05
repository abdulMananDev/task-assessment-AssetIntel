# Working rules

## Think before building

- Before writing code, state the plan in 3-5 bullets and list edge cases.
- Ask me when a requirement is ambiguous; don't assume.
- Work one step at a time and stop after each step for my review.

## Code quality

- TypeScript strict, no `any`.
- Derive data instead of storing it (filtered rows, counts).
- Small components (~100 lines), one responsibility each.

## UI taste

- Calm, restrained UI: one accent colour, consistent spacing from tokens.
- Motion only in response to user actions (drawer open/close), under 250ms, respect prefers-reduced-motion.
- Clear empty, loading and error states. Visible keyboard focus.
- Mobile-first; test at 375px.
