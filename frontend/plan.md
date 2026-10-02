# ActionDesk implementation plan

## Product direction
ActionDesk is a business memory and action layer for small businesses: it turns scattered customer, sales, supplier, document and internal communication data into connected context and clear next steps.

## Design system
- **Design movement:** Editorial SaaS / quiet futurism. Premium and intelligent without sci-fi theatrics.
- **Core principles:** Calm clarity, evidence over spectacle, visible continuity, and decisive action.
- **Color philosophy:** Midnight navy anchors trust and focus. Warm paper/cream surfaces make the product feel human and legible. Electric blue marks insight and system activity; a restrained lavender-violet glow signals synthesis.
- **Layout paradigm:** A narrative rail with asymmetrical product panels, generous margins, and visual systems that move from scattered inputs into one composed operating view.
- **Signature elements:** The ActionDesk prism mark, thin connector lines with pulse dots, and “signal cards” that pair a tiny source icon with a concrete next action.
- **Interaction philosophy:** Every interaction should make the intelligence legible: hover a source to reveal its role, switch the demo tab to see context change, and use CTAs to move from curiosity to action.
- **Animation:** Soft rise-and-fade reveals, slow connector pulses, and small state changes on cards. The long-form page also uses a subtle top reading-progress line, an active section rail, and slow ambient hero parallax to reward scrolling without competing with the message. Respect `prefers-reduced-motion`; no animation should be required to understand content.
- **Typography system:** Geist / Inter-like sans for interface copy and a high-contrast serif accent for editorial moments. Large headlines use tight tracking; metadata uses compact uppercase labels.
- **Brand essence:** The calm business memory for owners who need to know what matters next. Personality: observant, grounded, decisive.
- **Brand voice:** Specific, unhurried, quietly confident. Examples: “Your business remembers everything. Now it can tell you what to do next.” / “One signal at a time, ActionDesk turns context into momentum.”
- **Wordmark & logo:** A compact four-sided prism with an offset center node, paired with a wordmark that uses a custom dot over the “i” as a small electric-blue signal.
- **Signature brand color:** Action Blue `#5C7CFF` — clear enough for action, soft enough to feel trustworthy.

## Project structure
- `app/page.tsx`: Landing page sections and interaction state.
- `app/globals.css`: Tailwind layers, tokens, background treatment, and responsive product mockup styling.
- `app/layout.tsx`: Metadata and global font setup.
- `public/manus-routes.json`: Route manifest for the managed preview.
- `app.config.ts`: Project logo metadata.

## Implementation approach
Use a flexible Next.js App Router project with Tailwind CSS, Framer Motion, and Lucide icons. Keep the landing page self-contained and frontend-only: the guided AI demo uses local sample scenarios to make the concept tangible without requiring a backend. Product visuals are composed from semantic HTML/CSS so they remain responsive and accessible on smaller screens.
