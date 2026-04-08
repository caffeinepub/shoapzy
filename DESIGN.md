# Design Brief

**App**: Shoapzy (Flipkart-style e-commerce) | **Tone**: Trustworthy, energetic, transaction-focused | **Differentiation**: Flipkart color language with instant visual recognition

## Palette

| Token | OKLCH | Usage |
|-------|-------|-------|
| Primary | `0.575 0.244 264.4` | Navbar, CTAs, links, sidebar |
| Accent | `0.634 0.258 41.3` | Sale badges, highlights, urgent actions |
| Success | `0.530 0.161 155.4` | Discount %, savings text, approval states |
| Warning | `0.825 0.196 70.2` | Star ratings (★), alerts |
| Background | `0.962 0.005 293.4` | Page bg, light zones |
| Card | `1 0 0` | White product cards, modals, elevated surfaces |
| Foreground | `0.192 0.006 293.4` | Text, dark grey headings |
| Muted | `0.920 0.008 261.4` | Borders, dividers, secondary text |
| Destructive | `0.577 0.245 27.325` | Errors, cancellations, remove actions |

## Typography

| Layer | Font | Scale | Weight |
|-------|------|-------|--------|
| Display | General Sans | 32–48px | 600–700 (semibold–bold) |
| Body | General Sans | 14–16px | 400–600 |
| Mono | Geist Mono | 12–14px | 400–500 |

## Structural Zones

| Zone | Background | Border | Shadow | Purpose |
|------|------------|--------|--------|---------|
| Navbar | Primary blue gradient | None | Elevated | Header, logo, search, user menu |
| Hero | Accent orange gradient | None | None | Flash sale, countdown, promo banner |
| Product Grid | Muted light grey | Subtle | Card | Main content area |
| Product Card | White | Muted border | Card elevation | Product display with image, price, rating |
| Address Card | White | Muted border | Card elevation | Saved address with label badge, edit/delete actions |
| Comparison Grid | Muted light grey | Subtle | Card | 1–4 product cards side-by-side for attribute comparison |
| Referral Section | Card white | Primary border | Elevated | Code display box, share buttons, stats grid |
| Footer | Primary blue | Top border | None | Company info, links |
| Modal | Card white | Primary border | Elevated | Checkout, confirmation dialogs |

## Component Patterns

- **Buttons**: Primary (blue bg, white text), Accent (orange bg, white text), Secondary (outlined, muted border, foreground text)
- **Product Card**: Image area, star rating (yellow ★), title (foreground), MRP (strikethrough, muted), selling price (bold, foreground), discount badge (orange bg, white text, animated pulse)
- **Input Fields**: Muted border, focus ring uses primary blue
- **Badges**: Discount (orange bg), Success (green bg), Alert (red bg), Label (primary bg + white text for Address labels: "Home", "Office", "Other") — all with white text, `text-xs` font-semibold
- **Address Card**: White bg, muted border, label badge in top-right (primary bg), address text (foreground), edit/delete icon buttons (muted text, hover primary)
- **Referral Code Box**: White bg, primary border (2px), monospace font, copy button (accent bg), share buttons (secondary outline)
- **Star Rating**: Yellow (#ffca28 OKLCH), clickable/interactive states subtle shadow
- **Comparison Attribute Row**: Checkbox-style indicators (green ✓ or grey ✗) for matching attributes across products

## Spacing & Rhythm

- **Grid**: 4px base unit; spacing: 8px, 12px, 16px, 24px, 32px
- **Density**: Cards 16px padding, modals 24px padding, navbar 12px vertical
- **Rhythm**: Alternating card zones (white / light grey sections) for visual pause

## Motion & Animation

- **Transition Base**: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` for interactive elements, buttons, shadows
- **Badge Pulse**: `pulse-badge` 2s loop on discount badges (brightness flicker 1–0.8 opacity)
- **Slide-In**: `slide-in` 0.3s on product card appearance
- **Card Hover**: Shadow elevation from `shadow-card` to `shadow-card-hover` with smooth transition
- **Focus States**: Ring via `focus:ring-primary` on inputs, 2px primary border on buttons

## Constraints & Anti-Patterns

- ✅ White product cards on light grey background; never white-on-white
- ✅ Orange discount badges with green savings text on cards
- ✅ Yellow stars (#ffca28 OKLCH) for all ratings
- ✅ Blue navbar full-width with subtle shadow; never partial-width
- ✅ Product price layout: MRP (strikethrough grey) + Selling Price (bold dark) + Discount Badge (orange, pulsing)
- ✅ Blue primary buttons for CTAs; orange for urgent/sale actions
- ❌ Never use purple, pink, cyan in primary or secondary UI
- ❌ Never mix OKLCH with hex/rgb(); only raw `L C H` in CSS vars
- ❌ No decorative body text gradients or card background patterns
- ❌ Keep shadows subtle; no neon glow or high-blur effects

## Signature Detail

**Pulsing Orange Discount Badges**: Orange (#fb641b) badge with green savings text and `animate-pulse-badge` 2s loop. Eyes draw instantly to time-sensitive offers. Placed below MRP (strikethrough) and selling price on every product card. This Flipkart-signature detail is the visual anchor for urgency and value perception across the marketplace.

**Three New Feature Pages**:
1. **Address Book** — Saved addresses as white cards with label badges ("Home"/"Office"/"Other" in primary blue), edit/delete inline actions, add new address button (primary). Emphasizes quick checkout.
2. **Product Comparison** — Up to 4 products displayed side-by-side in white cards; attribute grid below shows checkmarks (green ✓) or crosses (grey ✗) for matching specs. Reduces decision friction.
3. **Referral Program** — Unique referral code in monospace font within a primary-bordered box, copy button (orange accent), social share buttons (WhatsApp/email), stats cards showing total referrals and SuperCoins earned. Incentivizes viral growth.
