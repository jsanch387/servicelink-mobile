---
name: apple-design
description: >-
  Applies Apple Human Interface Guidelines and the Liquid Glass design
  language to product UI in this app. Use when creating or restyling pages,
  components, layouts, cards, buttons, navigation, empty states, typography,
  or motion, and when the user mentions Apple design, polish, glass,
  hierarchy, spacing, or visual refinement.
---

# Apple design

Product UI in this app follows Apple's current design system: clarity, deference, and depth, updated by the Liquid Glass language from WWDC25. Marketing pages may be more expressive. Dashboard, booking, onboarding, settings, and assistant surfaces follow the rules below.

Sources: [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/), [Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/), [Get to know the new design system](https://developer.apple.com/videos/play/wwdc2025/356/).

## Two layers

The interface is two layers. Do not blur them.

| Layer   | What belongs                                        | How it looks                             |
| ------- | --------------------------------------------------- | ---------------------------------------- |
| Content | Lists, metrics, forms, photos, charts, empty states | Quiet fill on the canvas. No blur.       |
| UI      | Navigation, toolbars, sticky bars, popovers, sheets | One floating material above the content. |

The UI layer exists to get around and act. It recedes when the person is reading or editing. Brand color lives in the content layer. Tint only the single primary action.

## Use what already exists

Do not invent a new button, card, or font.

- Type: `var(--font-primary)` in `src/styles/fonts.css`. It already resolves to San Francisco on Apple devices via `-apple-system`.
- Canvas: `--dashboard-bg` (`#0f0f0f`) and `--dashboard-border` (`#2a2a2a`) in `src/app/globals.css`.
- Actions: `Button`, `IconButton`, and `Switch` in `src/components/shared/`.
- Floating surfaces: `GlassCard` only for chrome that sits above content (popover, sheet, sticky bar). Content cards use a flat fill, not `GlassCard`.

Interactive targets keep `cursor-pointer`. Disabled targets use `cursor-not-allowed`.

## Hierarchy

Express hierarchy with layout, grouping, size, and one tint. Remove decoration before adding it.

- One primary action per view. It is visually separate from the group: filled white (`Button` `primary`) or a single accent. Everything else is `secondary`, `outline`, or `ghost`.
- Group controls by function and by how often they are used. Related actions share a container. A text button and an icon button are separate containers, so they are not read as one control.
- Secondary actions move into a menu when a bar is crowded.
- Destructive actions stay quiet (`danger` outline) until a confirm step.
- If every control is tinted, none of them is primary. Put extra color in the content, not the chrome.

## Shape

Apple builds layout from three shapes. Match them.

| Shape      | Radius                           | Use here                                                                                                           |
| ---------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Fixed      | constant, `rounded-[10px]`       | Dense controls and content cards. This is the app default, same as `Button`.                                       |
| Capsule    | `rounded-full` (half the height) | Standout actions, switches, pills, search fields. On desktop, reserve capsules for the one action that should pop. |
| Concentric | parent radius − padding          | Anything nested inside a rounded surface.                                                                          |

Concentric rule: `innerRadius = outerRadius − padding`. A 10px control inside a card needs the card radius to equal `10 + the gap` between the control and the card edge. If the padding is larger than the card radius, the corners look pinched. Increase the card radius or reduce the gap. Do not mix a capsule inside a tight 10px card.

Corners that flare past the parent, or pinch inside it, are wrong. Nested artwork, inputs, and buttons share the parent's center.

## Spacing and type

Rhythm is an 8px grid: 8, 12, 16, 24, 32. Related items sit 8–12px apart. Sections sit 24–32px apart. Prefer space over a divider.

- Touch targets are at least 44px (`Button` `sm` and up). Dense desktop icon actions may be 36px (`xs`) when surrounded by space.
- Align titles and body to the leading edge. Center only a single hero or an empty state.
- One title weight per view: `font-semibold` or `font-bold` with `tracking-tight`. Body is `text-sm` or `text-base` at normal weight.
- Secondary copy is `text-white/60` or `text-zinc-400`. Do not stack three gray levels.
- Functional UI is sentence case. Uppercase tracking is for marketing, not dashboards, forms, or settings.
- Icon-only controls need an accessible name. If a symbol is ambiguous (edit vs select), use a text label.

## Color

- Canvas stays `#0f0f0f`. Content surfaces lift slightly: `bg-white/[0.03]` to `bg-white/[0.06]`, hairline `border-white/[0.08]`.
- Text on the canvas is white or `white/60`. Do not put gray text on a gray fill.
- Semantic color is status only: emerald for success, amber for warning, red for danger. Color the status, not the whole card.
- Separators are 1px at `white/[0.08]`, or omitted. A sticky bar uses a soft fade into the canvas, not a hard line plus a blur.
- Support a readable dark surface. Do not rely on color alone to convey state.

## Materials

Glass is the navigation layer. It is not a texture for every card.

- One glass surface per stack. Never glass on glass. Content inside glass uses a flat fill or transparency, not another blur.
- Apply the material to the control itself, not to an inner wrapper.
- Popovers and sheets spring from the control that opened them and dim the content behind them when they interrupt the flow.
- At rest, avoid content sliding under glass. Inset the content, or let a soft scroll-edge fade dissolve it. Use one edge treatment per view. Do not stack a hard divider on a soft fade.
- Large surfaces (sidebar, sheet) do not flip between light and dark as content scrolls. Small controls may.

`GlassCard` today is `bg-white/[0.03] backdrop-blur-md border-white/[0.08]`. That is the regular glass. Do not add a second blur, a colored glow, or a heavier border on top of it.

## Motion

Motion explains a change. It is not decoration.

- Pressed controls use `active:scale-[0.98]`, already on `Button`.
- Enter with opacity plus 8–16px of rise, 200–350ms, `cubic-bezier(0.22, 1, 0.36, 1)`. Stagger siblings by 60–90ms.
- A menu or sheet grows from its source. It does not fade in from the center of the screen.
- No bounce, no infinite glow, no float loops on data, forms, or settings.
- Wrap motion in `@media (prefers-reduced-motion: reduce)` and drop transform and elastic effects. Opacity-only fades are fine.

## Layout

Design the structure once, then let it breathe.

- Narrow (phone): one column, capsule primary action, extra margin at the screen edge.
- Wide (dashboard): inset sidebar, content is the canvas, rounded rectangles for compact controls, the capsule reserved for the primary action.
- The same symbols, labels, and grouping persist across both. A control does not change meaning because the viewport changed.
- Empty states: one sentence and one action. No illustration wall.

## Checklist

Before finishing a UI change:

- [ ] Content and chrome are separate layers
- [ ] One primary action; everything else is quiet
- [ ] Nested radii are concentric
- [ ] Sentence case, leading alignment, 8px spacing rhythm
- [ ] Shared `Button` / `IconButton` / `Switch` / tokens, no one-off styles
- [ ] Glass used once, only on floating chrome
- [ ] Motion is short, physical, and disabled under reduced motion
- [ ] Icon-only controls have names; contrast holds on `#0f0f0f`

## Patterns

```tsx
// Content card: flat, concentric with the 10px controls inside.
// Gap is 12px, so the card radius is 22px.
<section className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-3">
  <h2 className="text-base font-semibold tracking-tight text-white">Today</h2>
  <p className="mt-1 text-sm text-white/60">3 bookings need a reply.</p>
  <div className="mt-3 flex gap-2">
    <Button size="sm">Review</Button>
    <Button size="sm" variant="ghost">Later</Button>
  </div>
</section>

// Sticky chrome: one glass bar, soft fade, no second blur underneath.
<header className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#0f0f0f]/80 backdrop-blur-md">
  …
</header>
```

Avoid: uppercase section labels in product UI, tinted borders on every card, stacked `backdrop-blur`, capsule buttons packed into a 10px container, and a second primary button.
