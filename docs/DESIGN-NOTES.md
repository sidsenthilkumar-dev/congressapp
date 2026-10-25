# Rebound interface decisions

The visual system uses ivory surfaces, ink headings, and a restrained sage accent. A single type hierarchy distinguishes page headings, section headings, practical instructions, and metadata. Reading size and contrast take priority over decorative density; medical instructions should not require zooming to read.

`src/styles/premium.css` is the final shared presentation layer. Feature styles continue to own component layouts. Shared tokens define card radius, quiet elevation, colors, focus treatment, and 160–220 ms interface transitions. Hover elevation is limited to actionable cards. Modal and page entry use a small translation and opacity change, without large scaling or panning.

The daily hub emphasizes a real next action, a personal plan, a body check-in, and a record of activity. Its progress indicator only represents recorded routine completion. It does not award a medical recovery score, prescribe movement, or penalize rest days.

Mobile navigation retains accessible full names and renders compact text labels below each icon through `.nav-label[data-short-label]`. Safe-area padding keeps controls above the device home indicator. Decorative sidebar content is removed on short desktop windows so navigation remains available.

The global reduced-motion rule removes nonessential transitions and animations. Exercise diagrams also honor the operating-system preference, and the movement viewer includes a static-guide control. Warnings retain their own colors and remain legible; they are not restyled as achievement cards.

Keyboard focus uses a visible three-pixel ring with separation from the control. Primary actions are at least 44 pixels high. Compact secondary controls meet the W3C minimum target guidance and use spacing to reduce accidental taps; important navigation and session actions are larger.

A desktop and 390-pixel mobile browser review was performed with the new shared layer. The mobile safety card uses a two-column grid to prevent its explanatory text from collapsing beside the review action. The viewport checks did not find horizontal overflow. This is a focused interface check, not a full accessibility conformance audit.
