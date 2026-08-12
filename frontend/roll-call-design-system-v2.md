# Roll Call — Design System
### Full-site visual identity for the Assignment & Submission Management System
*Reference file for frontend implementation. Covers the marketing landing page AND every authenticated screen (Admin, Teacher, Student) implied by `backend_api.md`. Ground truth for design decisions — not aspirational, build to this exactly unless a technical constraint forces a deviation (note the deviation if so).*

**Scope of this file:** §0–12 cover brand, tokens, and the public landing page. §13 onward cover the logged-in application — shell, auth, and every screen per role. Both halves share one token system; the app screens dial back atmosphere (fewer blobs, tighter spacing, higher data density) because they're used daily, not visited once.

---

## 0. Concept

**The metaphor: a school ledger, seen through glass.**

This is a gradebook system — Admins, Teachers, and Students living inside Classes, Subjects, Assignments, and Submissions. The visual language borrows from the physical objects of a school office: parchment report cards, chalkboards, ink stamps, roll-call sheets, dotted ledger lines. Glassmorphism is used deliberately, not decoratively — panels look like frosted classroom windows, letting a soft chalkboard/parchment backdrop show through blurred.

This is **not**: a generic SaaS dashboard, a neon-on-black tech aesthetic, or a childish "back to school" theme with crayons and cartoon icons. It should read as calm, trustworthy, and administratively serious — closer to a well-run school office than an EdTech startup pitch deck.

**Signature elements (the one or two things this page is remembered by):**
1. **The roll-call rail** — a vertical dotted line running down the page as the user scrolls, with small tick-marks that fill in (like a name being checked off a register) as each section enters view. This is the scroll-progress indicator, and it's the single most distinctive device on the page.
2. **Ink-stamp role badges** — circular, slightly rotated badge shapes (like a rubber date-stamp) used anywhere a role (Admin / Teacher / Student) is shown.

---

## 1. Color — 60/30/10

Two full palettes (light + dark). Do not blend palettes across modes. Do not introduce new hexes outside this table — every color on the page must trace back to a token below.

### Light mode
| Role | Token | Hex | Usage share |
|---|---|---|---|
| Dominant (60%) | `--bg-page` | `#F4F1E6` (parchment) | Page background, negative space |
| Dominant, alt | `--bg-page-alt` | `#EDE8D8` | Section band behind glass panels, subtle |
| Secondary (30%) | `--ink` | `#14261D` (ink forest) | Body text, headings, glass borders (low-opacity) |
| Secondary surface | `--glass-surface` | `rgba(255,255,255,0.55)` | Glass panel fill |
| Secondary surface, muted | `--glass-surface-muted` | `rgba(244,241,230,0.4)` | Nested/inset glass |
| Accent (10%) | `--moss` | `#3F7D57` | CTAs, links, active nav state, focus rings |
| Accent, hover | `--moss-deep` | `#2C5C3F` | Hover/active on accent elements |
| Functional flag (⌐10%, used only on status data) | `--stamp` | `#B4552F` (terracotta ink) | "Late" badges only — never decorative |

### Dark mode
| Role | Token | Hex | Usage share |
|---|---|---|---|
| Dominant (60%) | `--bg-page` | `#0E1913` (chalkboard) | Page background |
| Dominant, alt | `--bg-page-alt` | `#132019` | Section band |
| Secondary (30%) | `--ink` | `#F4F1E6` (chalk) | Body text, headings |
| Secondary surface | `--glass-surface` | `rgba(20,38,29,0.55)` | Glass panel fill |
| Secondary surface, muted | `--glass-surface-muted` | `rgba(14,25,19,0.45)` | Nested/inset glass |
| Accent (10%) | `--moss` | `#5FCB8A` | CTAs, links, active nav state, focus rings |
| Accent, hover | `--moss-bright` | `#7FDDA3` | Hover/active on accent elements |
| Functional flag | `--stamp` | `#E28259` | "Late" badges only |

**Rule:** `--stamp` is a *data* color, not a *brand* color. It only ever appears on a `Submission.IsLate` indicator or similar status flag. If a design calls for "a warm accent for visual interest," the answer is no — add moss-tinted texture instead, not the stamp color.

### Semantic mapping (from the actual data model)
- `Status: Draft` → neutral ink, 50% opacity, dashed outline (unfinished, chalk-sketch feel)
- `Status: Published` → `--moss` solid
- `Status: Closed` → `--ink` solid, no glow
- `Submission: Graded` → `--moss` stamp badge (circular, "checked")
- `Submission: IsLate = true` → `--stamp` badge

---

## 2. Typography

| Role | Typeface | Source | Usage |
|---|---|---|---|
| Display | **Fraunces** (variable, opsz 72, wght 500–600) | Google Fonts | H1/H2, hero statement, section titles. Has ink-trap serif detailing — reads "printed," not "app." |
| Body | **Inter** (wght 400/500) | Google Fonts | Paragraphs, nav, buttons, form fields |
| Utility / data | **IBM Plex Mono** (wght 400/500) | Google Fonts | Timestamps, IDs, role tags, the roll-call rail labels, table/grade data — anything that is literally a record |

**Scale (desktop / mobile):**
- Display XL (hero): 64px / 40px, Fraunces 560, line-height 1.05, letter-spacing -0.01em
- Display L (section titles): 40px / 28px, Fraunces 540, line-height 1.1
- Display M (card titles): 24px / 20px, Fraunces 520
- Body L: 19px / 17px, Inter 400, line-height 1.6
- Body M: 16px, Inter 400, line-height 1.65
- Caption / mono: 13px, IBM Plex Mono 500, letter-spacing 0.02em, uppercase for eyebrows only (e.g. "ENTRY — 03")

**Rule:** Never use Fraunces below 20px (loses its character at small sizes — drop to Inter). Never use IBM Plex Mono for paragraph copy — it's for records/labels only, matching its role in the actual metaphor.

---

## 3. Glassmorphism spec

This is the core visual technique — apply consistently, don't reinvent per component.

```css
.glass-panel {
  background: var(--glass-surface);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  border: 1px solid rgba(var(--ink-rgb), 0.10);
  border-radius: 20px;
  box-shadow:
    0 1px 0 rgba(255,255,255,0.15) inset,   /* light-mode top sheen; drop for dark */
    0 20px 40px -12px rgba(var(--ink-rgb), 0.18);
}

.glass-panel--muted {   /* nested cards inside a glass panel */
  background: var(--glass-surface-muted);
  backdrop-filter: blur(12px);
  border-radius: 14px;
  border: 1px solid rgba(var(--ink-rgb), 0.08);
  box-shadow: none;
}

.glass-pill {  /* buttons, badges, nav */
  border-radius: 999px;
  backdrop-filter: blur(14px);
}
```

**What sits behind the glass (required — glass is invisible over a flat background):**
- 2–3 large, soft blurred "chalk-dust" blobs (radial gradients, `--moss` at ~15% opacity and `--ink` at ~8% opacity), positioned absolutely, `filter: blur(80–120px)`, slow ambient drift animation (60–90s loop, translate ±40px). One blob per major section is enough — don't fill the whole page with them.
- A very faint dotted grid (like ledger paper), `background-image: radial-gradient(rgba(ink,0.06) 1px, transparent 1px)`, `background-size: 24px 24px`, opacity 0.4. This is what makes the "paper/chalkboard" surface read as textured rather than flat, and it's what the glass is visibly refracting.

**Depth discipline:** maximum 2 layers of glass stacked (page backdrop → glass panel → one muted nested card inside it). Never glass-on-glass-on-glass — it turns to mud.

---

## 4. Dark / light mode toggle

- Toggle control lives top-right of the nav: a small pill switch styled as a **chalk/parchment flip** — sun-like mark for light, a small crescent/chalk-dot for dark (use simple line icons, not emoji).
- Persist choice in `localStorage` (`theme: "light" | "dark"`), default to `prefers-color-scheme`.
- Apply theme via a `data-theme="light|dark"` attribute on `<html>`; all colors above are CSS custom properties that swap per attribute — no component should hardcode a hex.
- Transition: `background-color, color, border-color 240ms ease-out` on `html` and glass panels only (not on every element — avoid a flash of transition on icons/images).
- Respect `prefers-reduced-motion`: disable the blob drift animation and the transition above, swap instantly.

---

## 5. Layout system

- Max content width: 1180px, centered, 24px side padding (mobile: 20px).
- 12-column grid, 24px gutter (desktop); collapses to 4-column, 16px gutter under 640px.
- Vertical rhythm: sections separated by 120px (desktop) / 72px (mobile) of breathing room — generous, since this is a single long scroll and needs clear "chapter breaks."
- Radius scale: 20px (panels), 14px (buttons/inputs), 999px (pills/badges). No sharp corners anywhere except the roll-call rail's tick marks (small squares, intentionally precise/administrative).
- Shadow scale: only the two defined in §3 — don't invent a third.

---

## 6. The roll-call rail (signature scroll element)

A vertical line fixed to the left edge on desktop (hidden below 1180px — see §11 — replaced by a slim fixed top progress bar instead):

- A 1px dotted line in `--ink` at 20% opacity, spanning a fixed vertical band (`top: 120px` to `bottom: 120px` of the viewport, not the full page height).
- One tick per content section with an id (4 in the current build: "why this exists," "three roles," "the flow," "the rules"). **Tick position is calculated from each section's real scroll offset relative to the rail's own height**, not evenly spaced by index — sections of different length should visibly produce unevenly spaced ticks, because that's what makes the rail an honest progress indicator rather than a decorative "01/02/03/04" strip.
- Tick default state: small hollow square, 9×9px, mono label to its right (e.g. "entry 01 — why this exists," sentence case) in ~10.5px IBM Plex Mono, opacity 0.
- Active state (current section, determined by which section's top has crossed roughly 35% down the viewport): tick fills solid `--moss` and scales up slightly (~1.25×) with the overshoot easing from §9; label fades to opacity 0.65 and stays.
- Clicking or pressing Enter/Space on a tick scrolls smoothly to that section (`scrollIntoView`, `block: start`); ticks are real interactive elements (`role="button"`, `tabindex="0"`, descriptive `aria-label`) so they're keyboard-reachable, not just clickable divs.
- On viewports below 1180px, swap this entire component for a 3px fixed top bar that fills left-to-right with overall page scroll percentage — same signature idea (a filling record of progress), adapted to a width where a left-margin rail has no room to live.

This directly reflects the product's real behavior (attendance/roll-call, ledger entries) rather than being a generic "01/02/03" numbered-steps device — order here means something (you are moving through a record).

---

## 7. Landing page — full scroll architecture

One continuous scrollable page. Section-by-section spec below; copy is close-to-final (voice: plain, active, no filler — a school office register, not a startup pitch).

### Nav (sticky, glass)
- Left: wordmark "Roll Call" (Fraunces 600, 20px) + small ink-stamp mark.
- Center/right: `Product` `Roles` `How it works` anchor links (Inter 15px).
- Right: theme toggle, then primary button "Sign in".
- Background: `.glass-panel` variant, full-width, 72px tall, appears only after 40px scroll (transparent over hero before that).

### Section 1 — Hero
- Eyebrow (mono, moss): "A SYSTEM OF RECORD FOR ASSIGNMENTS"
- H1 (Fraunces, Display XL): "Every assignment. Every submission. One ledger everyone can trust."
- Subhead (Body L, `--ink` at 75%): "Admins set up classes and teachers. Teachers publish assignments and grade work. Students submit before the deadline — or after, if it's allowed. Nothing gets lost, nothing gets faked."
- Visual: a large glass panel "floating gradebook" mockup — a stylized table row showing an assignment moving through Draft → Published → Closed with a submission ticking Submitted → Graded. This is the hero's thesis made literal: the product *is* the state machine.
- Two buttons: primary "Wanna join the system?" (moss fill, routes to sign-up/sign-in — same button as the final CTA, present here too for users who scroll no further) + secondary ghost "See how it works" (scrolls to §How it works).

### Section 2 — The problem (short, one glass panel, left-aligned text / right illustration)
- Eyebrow: "ENTRY 01 — WHY THIS EXISTS"
- Headline: "Spreadsheets don't know who's late."
- Body: 2–3 sentences on the real pain — scattered files, no record of what was submitted when, grading feedback lost in chat threads, no single source of truth for who's teaching what.

### Section 3 — Roles (three ink-stamp cards)
- Eyebrow: "ENTRY 02 — THREE ROLES, ONE LEDGER"
- Headline: "Everyone sees exactly what's theirs."
- Three glass cards in a row (stack on mobile), each with an ink-stamp badge (Admin / Teacher / Student), one line on what they control:
  - **Admin** — sets up classes, subjects, teachers, and who teaches what.
  - **Teacher** — publishes assignments to their classes, reviews submissions, grades.
  - **Student** — sees only what's published to their class, submits before the deadline.

### Section 4 — How it works (the flow — justified sequence, this one *is* a real process)
- Eyebrow: "ENTRY 03 — THE FLOW"
- Headline: "From draft to grade, in order."
- A horizontal (vertical on mobile) connected sequence inside one large glass panel, dotted connector line (echoes the rail): `Draft → Published → Submitted → Graded / Closed`. Each node: small mono label + one-line description. Small note under the Submitted node: "Late is fine — if the teacher allows it."

### Section 5 — What's actually enforced (trust/credibility section)
- Eyebrow: "ENTRY 04 — THE RULES DON'T BEND"
- Headline: "The system holds the line, so people don't have to."
- Three compact glass-muted cards, plain language versions of real business rules (not implementation detail — the *promise* to the user):
  - "A teacher can't grade a class they don't teach."
  - "A closed assignment stops taking submissions — no exceptions, no back-channel."
  - "Every edit to a submission is kept, not overwritten. Nothing quietly disappears."

### Section 6 — Quiet proof / stats band
- Three small metric-style glass pills in a row: e.g. "3 roles" · "Full submission history, every edit" · "One deadline rule, enforced automatically" — framed as *properties of the system*, not vanity growth metrics (no "10,000+ users" — this is an internal school tool, don't fabricate social proof).

### Section 7 — Final CTA
- Full-width glass panel, centered content, largest blob glow behind it.
- Headline (Fraunces Display L): "Ready to take roll?"
- Subhead: "Sign in if you're already on the register. Otherwise, get set up in a minute."
- **Primary button: "Wanna join the system?"** (moss fill, 56px tall, generous horizontal padding) → routes to `/auth` (a combined sign-up/sign-in screen, or sign-up with a "already have an account? sign in" link — implementer's call, see §9).

### Footer
- Minimal: wordmark, mono-styled line "Built as a system of record, not a to-do app.", links (Privacy, role-based demo credentials note if this stays a demo).

---

## 8. Components (for the agentic frontend build)

| Component | Notes |
|---|---|
| `Button/Primary` | `--moss` fill, `--bg-page` text (light) / `--ink`-on-mint contrast-checked text (dark), 14px/28px padding, radius 999px, hover = `--moss-deep`/`--moss-bright`, active = scale(0.98) |
| `Button/Ghost` | transparent fill, 1px `--ink` @ 20% border, same padding/radius |
| `Badge/RoleStamp` | circular, 44px, 2° rotation, 1.5px dashed border in role's color, mono initials (A/T/S) centered |
| `Badge/Status` | pill, 12px mono uppercase, color per §1 semantic mapping |
| `Card/Glass` | see §3 `.glass-panel` |
| `Card/GlassMuted` | see §3 `.glass-panel--muted`, used nested |
| `Nav/Sticky` | see §7 Nav spec |
| `Rail/RollCall` | see §6 |
| `ThemeToggle` | see §4 |
| `Timeline/Flow` | connected-node sequence, used in §7 Section 4 only — don't reuse as generic "3 steps" filler elsewhere, it should stay meaningfully tied to the actual assignment lifecycle |

**Forms (sign-up / sign-in, post-landing):** carry the same glass-panel + parchment/chalkboard system, but reduce blob density to one subtle blob (forms need higher legibility, less atmosphere). Inputs: `.glass-panel--muted` styling, 44px height, focus ring = 2px `--moss`. Role selector on sign-up should visually reuse `Badge/RoleStamp`.

---

## 9. Motion

- Easing: use `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) for all reveal/entrance motion — it decelerates smoothly and reads calmer than a linear or standard ease-out, which matters since this page leans on scroll-reveal repeatedly. Use `cubic-bezier(0.34, 1.56, 0.64, 1)` (slight overshoot) only for small, snappy things — the theme-toggle knob, button press feedback — never for large panels.
- Page-load: hero content fades/slides up 16px, staggered ~130ms between the copy block and the ledger mockup, 700ms expo-out. Once, not looped.
- Scroll-reveal: each section's glass panel fades in + rises 18px as it enters viewport (`IntersectionObserver`, threshold ~0.18, with a negative bottom `rootMargin` so it fires slightly before the panel is fully in view), 700ms expo-out. Fires once per section — don't re-trigger on scroll-up/down.
- Blob drift: continuous, slow (60–90s), transform-only (translate + a subtle scale), never opacity-flicker, eased with the same expo-out curve for a less mechanical loop than a linear one.
- Rail ticks: position is computed from each section's actual scroll offset (not an even 1-of-N split) so the tick genuinely lines up with where the section sits on the page; active state transitions with the overshoot easing above so the "check" feels tactile. Recompute tick positions on load, on resize, and once more ~400ms after load to absorb late web-font layout shift.
- Buttons: 180ms transform / background transition on hover (`translateY(-1px)` + soft shadow), `scale(0.96)` on press. Hover-only affordances (`translateY`) are skipped on touch devices (`@media (hover:none)`) since there's no hover state to animate into.
- Cards (`role-card`) lift 4px on hover with the expo-out curve — this is the only element-level hover-lift outside of buttons; don't add hover-lift to every glass panel or it stops meaning anything.
- Respect `prefers-reduced-motion: reduce` — disable blob drift, hover transforms, and all entrance/stagger animation; reveal elements should render in their final state immediately rather than staying invisible.

---

## 10. Accessibility

- Color contrast: body text against `--bg-page`/`--bg-page-alt` must hit WCAG AA (4.5:1) in both modes — verify `--ink` at full opacity meets this; only use reduced-opacity ink for genuinely decorative/secondary text, never for body copy.
- All glass panels must remain readable if `backdrop-filter` is unsupported — set a solid fallback `background-color` (a flat parchment/chalkboard tint) before the `backdrop-filter` declaration.
- Focus states: visible 2px `--moss` outline on every interactive element, never removed.
- Roll-call rail is decorative/supplementary navigation — must not be the only way to reach a section; standard nav links must also work, and rail ticks need accessible names (`aria-label="Jump to: why this exists"`).
- Reduced motion respected everywhere per §9.
- Theme toggle must be a real `<button>` with `aria-pressed` state, keyboard operable.

---

## 11. Responsive breakpoints

Five tiers, tokens scale fluidly between them with `clamp()` rather than jumping at each step (so nothing visibly "snaps" mid-resize):

- `≥1180px` desktop — full layout, roll-call rail visible on the left, max content width 1180px.
- `1024–1179px` — rail is replaced by a **3px top progress bar** (fixed, full-width, fills left-to-right with scroll position) — the rail needs 26px of dead margin on both sides that doesn't exist at this width.
- `900–1023px` — content max-width narrows to ~920px; still 2-column hero/role/rule grids.
- `640–899px` — hero, "problem," role, and rule grids all collapse to 1 column; nav's anchor links (`Product` / `Roles` / `How it works`) move into a hamburger-triggered slide-down panel (glass-styled, matches `.glass`) that also repeats the primary CTA; the "how it works" flow sequence switches from a horizontal `→` connector to a vertical stack with a `⋮` connector.
- `<640px` — single column throughout; hero buttons and the final CTA button go full-width; section vertical padding drops from 110px to 56px; blob effects stay but are visually smaller relative to viewport (no code change needed if blobs are sized in px, not vw).
- `<480px` — drop the nav's ink-stamp mark next to the wordmark (redundant at this width), stack the stats-band pills vertically.

**Implementation note:** use `clamp(min, preferred-vw, max)` for hero/section-title font sizes and section padding instead of hard-coded per-breakpoint values — it's what keeps the motion "smooth" across a resize or on foldables/mid-size tablets rather than visibly jumping at each media query.

---

## 12. Implementation notes (for the agentic frontend developer)

- Tech-stack agnostic spec — build in whatever the project already uses (React/Next, plain HTML, etc.), but implement colors and type as CSS custom properties exactly as tokenized in §1–2 so theme-switching is a single attribute flip, not a re-render.
- Fonts: load Fraunces, Inter, IBM Plex Mono from Google Fonts (or self-host if the project has a font pipeline) — do not substitute system fonts, the type pairing is load-bearing for the concept.
- `backdrop-filter` needs a solid-color fallback (§10) — check support, don't assume.
- The landing page is marketing/informational only and unauthenticated. The CTA "Wanna join the system?" routes to the auth flow described in `backend_api.md` (`POST /api/auth/register` for sign-up, `POST /api/auth/login` for sign-in) — build sign-up and sign-in as either two routes or one tabbed screen; either is fine, but the CTA copy and destination must stay consistent with whichever is chosen.
- Do not invent new colors, fonts, radii, or shadow values beyond what's tokenized here. If a component genuinely needs something not covered, flag it rather than guessing — extend this file, don't drift from it silently.
- Copy in §7 is close-to-final and can be used directly; product/business-rule copy should stay accurate to `Backend_idea.md` — don't embellish claims about what the system does.

---
---

# Part 2 — The application (post-login)

Everything below is what a person sees after the landing page's "Wanna join the system?" CTA. Same tokens, same glass system, same typefaces — but this is a working tool used daily, so atmosphere is dialed back in favor of clarity and density.

## 13. App-mode adjustments to the base system

- **Blobs:** one blob maximum per screen, smaller (≤300px) and stationary (no drift animation) — movement behind dense data is a distraction, not delight.
- **Glass blur:** reduce to `blur(14px)` on the app shell chrome (sidebar, topbar) so it stays legible with a data table scrolling behind it; content cards can keep the full `blur(20px)` from §3.
- **Radius:** dashboard cards/tables use 14px, not 20px — 20px starts to look "marketing" at small card sizes.
- **Density:** table rows 44px tall, form fields 44px tall, section padding drops to 32–40px (from the landing page's 110px) — this is a tool, not a scroll-story.
- **Type:** Fraunces is used far more sparingly here — page titles only (24px Display M). Everything else, including all table data, buttons, and labels, is Inter or IBM Plex Mono. The serif is a landing-page/brand device, not a UI workhorse.
- **Roll-call rail:** does not appear in-app. It's a landing-page-only device tied to "scrolling through a story." In-app navigation is the sidebar (§14).

## 14. App shell

One shared shell, role-aware nav items. Two-pane layout: fixed left sidebar (desktop) + main content.

```
┌──────────────┬─────────────────────────────────────────┐
│  Roll Call    │  Topbar: page title · search · avatar    │
│  (stampmark)  ├─────────────────────────────────────────┤
│               │                                           │
│  ○ Dashboard  │                                           │
│  ○ Classes    │              main content                 │
│  ○ Subjects   │         (glass cards / tables)             │
│  ○ Teacher    │                                           │
│    assign.    │                                           │
│  ○ Assignments│                                           │
│  ○ Submissions│                                           │
│  ○ Users      │                                           │
│               │                                           │
│  role stamp + │                                           │
│  name, sign out                                           │
└──────────────┴─────────────────────────────────────────┘
```

- **Sidebar:** `.glass` panel, full viewport height, 240px wide, fixed. Nav item = icon (Tabler-style outline, simple line icons — no filled/cartoon icons) + label, 44px tall, active state = `--moss` text + a 2px left border in `--moss` + faint `--glass-muted` background. Bottom of sidebar: role stamp badge (§8 `Badge/RoleStamp`) + user name (Inter 14px) + "Sign out" as a quiet text link.
- **Nav items are role-filtered**, not just permission-hidden — an item a role can't use should not render at all (a Student never sees "Users" in the DOM). Nav sets below.
- **Topbar:** page title (Fraunces Display M, 24px) left-aligned; a search input (client-side filter — see §16, no server-side search exists) center/right where the screen has a list; theme toggle + avatar menu far right.
- **Mobile (<900px):** sidebar collapses to a bottom tab bar (icons only, 5 max) for the primary items, with an overflow "More" sheet for the rest; topbar stays, search moves under it.

**Nav by role:**
| Role | Nav items |
|---|---|
| Admin | Dashboard, Users, Classes, Subjects, Teacher assignments, Assignments, Submissions |
| Teacher | Dashboard, My assignments, Submissions, My teaching (their `TeacherSubjectClass` rows, read-only) |
| Student | Dashboard, Assignments, My submissions |

## 15. Auth screens

Single route, tabbed: **Sign in** / **Create account**, `.glass` card (440px wide) centered on a quiet one-blob background, same parchment/chalkboard backdrop as the landing page so the transition doesn't feel like a different product.

**Sign in**
- Fields: Email, Password (44px `.glass-muted` inputs, §8).
- Primary button full-width: "Sign in".
- Error state (401): inline banner above the fields, `--stamp`-tinted background at 10% opacity, text "That email or password isn't right." — never distinguish "wrong password" from "no such user" in the copy (matches the API's own 401-for-both behavior — don't leak which one it was).
- No "forgot password" flow exists in the API — omit rather than build a dead end.

**Create account**
- Fields: Name, Email, Password, Role (a 3-way segmented control styled with `Badge/RoleStamp` — Admin / Teacher / Student, tapping selects it), Class (dropdown, **only rendered when Role = Student**, populated from `GET /api/classes`).
- Helper text under Class field: "Only students belong to a class." — explains why the field appears/disappears rather than leaving it unexplained.
- Note for implementer: the API's primary user-creation path is Admin-only `POST /api/users`; `POST /api/auth/register` exists but is described as primarily for testing. Ship self-serve sign-up against `/api/auth/register` for this demo/product context, but flag to backend if self-serve account creation (including Admin/Teacher roles) is actually intended to stay open — that's a product decision, not a design one.
- Errors (400): inline per-field where the API gives a field-level message (duplicate email, missing classId, weak password); a general banner otherwise.
- On success: route straight into the app shell, landing on Dashboard for the resolved role.

## 16. Shared UI patterns (used across every app-mode screen)

**Data table**
- `.glass` container, header row in `--ink` at 60% opacity, 12px uppercase Inter 500. Rows 44px, 1px hairline dividers `rgba(ink,0.08)`, hover = `--glass-muted` background.
- Every list endpoint returns unfiltered/unpaginated arrays (`backend_api.md` §10) — **all search, sort, and pagination is client-side.** Every table needs: a search input (filters visible columns), clickable column headers for sort (small chevron indicator), and pagination controls (20/50/100 rows) once a list plausibly exceeds ~30 rows (Assignments, Submissions, Users). Don't build server-side filtering UI (page-number query params etc.) — there's nothing on the backend to call.
- Status/role values render as the pill/badge components from §1 and §8, never plain text.

**Modal**
- Used for: create/edit Class, create/edit Subject, create Teacher-assignment row, create user (Admin), grade a submission. `.glass` panel, 560px wide, centered, backdrop is a flat `rgba(ink,0.35)` scrim (not blurred — keep the modal itself the only frosted layer, per the "max 2 layers of glass" rule in §3).
- Footer: ghost "Cancel" + primary action button, right-aligned. Primary button label is the verb, not "Submit" — "Create class", "Save changes", "Publish assignment".

**Forms**
- Field label above input, 13px Inter 500, `--text-secondary`-equivalent (ink at 70%). Inline validation on blur, not on every keystroke. Error text 13px in `--stamp` color, appears under the field only.

**File upload (Submission `file` field)**
- Drag-and-drop `.glass-muted` dropzone, dashed border (echoes the "Draft" status treatment — visually ties "not yet committed" states together). Shows accepted types explicitly: `.pdf .docx .doc .zip .png .jpg .jpeg`, max 10MB. On drop: filename + size shown as a chip with a remove (×) action. Zero-byte files are still submitted for validation, not silently blocked client-side — let the server's 400 surface if it rejects one, per the API's explicit "validated even at 0 bytes" rule.

**Grading panel** (Teacher/Admin, on a submission)
- Marks: numeric input with visible `/ MaxMarks` suffix, client-side clamps to `0–MaxMarks` before submit to match the API's own validation. Feedback: textarea. Submit button: "Save grade" → sets status to Graded, reflected instantly as a `pill-graded` badge.

**Submission history**
- Rendered as a mono-styled vertical list (echoes the ledger/rail device from the landing page, appropriately reused here since it *is* a literal edit history) — each entry: timestamp (IBM Plex Mono), content snapshot, file link if present. Newest first, matches API order.

**Empty states**
- Glass-muted panel, one line naming the space + one action. E.g. Student with no assignments: "Nothing published to your class yet." No CTA needed (there's nothing the student can do). Teacher with no assignments: "You haven't published anything yet." + "Create assignment" button.

**Toasts**
- Bottom-right, `.glass` pill, auto-dismiss 4s. Confirmation copy states the fact, not an apology or exclamation: "Assignment published.", "Grade saved.", "Class created." Errors: "Couldn't save — [reason]." with a Retry action where retrying makes sense.

**Loading**
- Skeleton rows (flat `--glass-muted` blocks, no shimmer animation — shimmer reads as more "AI generated app" than this brand wants) for tables; a simple centered spinner only for full-page loads.

## 17. Screens by role

### Admin
| Screen | Route | Contents |
|---|---|---|
| Dashboard | `/dashboard` | Metric pills (total classes, subjects, active assignments, submissions this week) + a glass table of the 5 most recent submissions across the system |
| Users | `/users` | Full table (`GET /api/users`, unfiltered incl. inactive — show an Active/Inactive pill, not a filtered-out row), create/edit/deactivate via modal |
| Classes | `/classes` | Table + create/edit modal; delete = soft delete confirmation ("Students in this class won't lose their data, but the class will disappear from lists.") |
| Subjects | `/subjects` | Same pattern as Classes |
| Teacher assignments | `/teacher-assignments` | Table of Teacher × Subject × Class rows; create modal with three dropdowns; this screen is the only place these rows are made, so its empty state explicitly says: "No teacher is assigned to any subject or class yet — assignments can't be created until this exists." (ties directly to the real dependency in `Backend_idea.md`) |
| Assignments (oversight) | `/assignments` | All assignments, any teacher, read-mostly for Admin — filters by status via client-side tabs (Draft/Published/Closed) |
| Submissions (oversight) | `/submissions` | All submissions system-wide, read-only oversight table |

### Teacher
| Screen | Route | Contents |
|---|---|---|
| Dashboard | `/dashboard` | Metric pills scoped to their own assignments (published count, ungraded submissions needing attention — this is the number that matters most to a teacher, surface it prominently) |
| My assignments | `/assignments` | Table of their own assignments only, any status; "Create assignment" opens a form (Title, Description, Subject, Class, Deadline, MaxMarks, AllowLateSubmission) — Subject/Class dropdowns are constrained client-side to combinations that exist in their own `TeacherSubjectClass` rows, so an invalid combination can't even be selected, rather than only being caught server-side |
| Assignment detail | `/assignments/:id` | Assignment info + status changer (Draft→Published→Closed as buttons, not a raw dropdown, since it's a one-way-ish lifecycle) + submissions table scoped to that assignment |
| Submissions | `/submissions` | All submissions across their assignments, filterable by assignment; opens the grading panel (§16) per row |

### Student
| Screen | Route | Contents |
|---|---|---|
| Dashboard | `/dashboard` | "Due soon" list (published assignments in their class, sorted by deadline) as the hero content — this is the single thing a student opens the app to check |
| Assignments | `/assignments` | Published assignments for their class only; each row shows a computed status the API doesn't literally return but the UI should derive: Not submitted / Submitted / Late / Graded, using presence-of-Submission + IsLate + Status per `Backend_idea.md` rule 8 |
| Assignment detail | `/assignments/:id` | Full brief + the submit form (§16 file upload + content) or, if already submitted, a read view with an "Edit submission" action (disabled once the assignment is Closed, matching the enforced rule) + their own submission history |
| My submissions | `/submissions` (mine) | Flat list of everything they've ever submitted, across assignments, with grade/feedback where available |

## 18. Route map (for the implementer)

```
/                      → landing page (Part 1)
/auth                  → sign in / create account (§15)
/dashboard             → role-specific (§17)
/classes               → Admin
/subjects              → Admin
/teacher-assignments   → Admin
/users                 → Admin
/assignments           → Admin (oversight) · Teacher (own) · Student (published/own class)
/assignments/:id       → Teacher · Student
/submissions           → Admin (all) · Teacher (own assignments)
/submissions/:id       → detail/grade panel, Teacher/Admin/owning Student
```

Everything in Part 2 consumes the exact endpoints and status-code behavior documented in `backend_api.md` — if a screen above implies an endpoint that doesn't exist (there is no `/me`, no server-side pagination, no password-reset), the screen has already been designed around that constraint. Don't add UI that assumes a capability the API doesn't have.
