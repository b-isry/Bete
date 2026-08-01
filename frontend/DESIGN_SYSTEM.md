# Bete Design System — Heritage Editorial

Canonical token source: `frontend/tailwind.config.ts`  
Authority: `stitch_bete_premium_property_discovery/heritage_editorial/DESIGN.md`  
Stitch screens audited: **15** `code.html` files under `stitch_bete_premium_property_discovery/` (plus `DESIGN.md`).

---

## 1. Tokens

### Color (Material-3-style)

| Token | Hex |
|-------|-----|
| `background` / `surface` / `surface-bright` | `#fbf9f5` |
| `surface-dim` | `#dbdad6` |
| `surface-container-lowest` | `#ffffff` |
| `surface-container-low` | `#f5f3ef` |
| `surface-container` | `#efeeea` |
| `surface-container-high` | `#eae8e4` |
| `surface-container-highest` / `surface-variant` | `#e4e2de` |
| `surface-tint` | `#3f6653` |
| `on-surface` / `on-background` | `#1b1c1a` |
| `on-surface-variant` | `#414844` |
| `inverse-surface` | `#30312e` |
| `inverse-on-surface` | `#f2f0ec` |
| `outline` | `#717973` |
| `outline-variant` | `#c1c8c2` |
| `primary` | `#012d1d` |
| `on-primary` | `#ffffff` |
| `primary-container` | `#1b4332` |
| `on-primary-container` | `#86af99` |
| `inverse-primary` | `#a5d0b9` |
| `primary-fixed` | `#c1ecd4` |
| `primary-fixed-dim` | `#a5d0b9` |
| `on-primary-fixed` | `#002114` |
| `on-primary-fixed-variant` | `#274e3d` |
| `secondary` | `#795919` |
| `on-secondary` | `#ffffff` |
| `secondary-container` | `#fdd185` |
| `on-secondary-container` | `#785818` |
| `secondary-fixed` | `#ffdea9` |
| `secondary-fixed-dim` | `#ebc076` |
| `on-secondary-fixed` | `#271900` |
| `on-secondary-fixed-variant` | `#5e4100` |
| `tertiary` | `#22262b` |
| `on-tertiary` | `#ffffff` |
| `tertiary-container` | `#383c41` |
| `on-tertiary-container` | `#a3a6ad` |
| `tertiary-fixed` | `#e0e2e9` |
| `tertiary-fixed-dim` | `#c3c7cd` |
| `on-tertiary-fixed` | `#181c21` |
| `on-tertiary-fixed-variant` | `#43474d` |
| `error` | `#ba1a1a` |
| `on-error` | `#ffffff` |
| `error-container` | `#ffdad6` |
| `on-error-container` | `#93000a` |

**Note:** Narrative copy in DESIGN.md sometimes cites mid-forest `#1B4332` and warm gold `#C9A15A` as “primary / secondary.” In the token system those map to **`primary-container`** and the gold **`secondary-container` / fixed** family — not the `primary` / `secondary` keys (which are the darker M3 roles).

### Shape

| Scale key | Value |
|-----------|-------|
| `none`, `sm`, `DEFAULT`, `md`, `lg`, `xl`, `2xl`, `3xl` | `0px` |
| `full` | `9999px` (avatars, dots, circular icon buttons only) |

### Type scale

| Utility | Family | Size / leading / tracking / weight |
|---------|--------|--------------------------------------|
| `text-display-lg` | serif (Libre Caslon) | 64 / 72 / -0.02em / 400 |
| `text-display-lg-mobile` | serif | 40 / 48 / -0.01em / 400 |
| `text-headline-md` | serif | 32 / 40 / — / 400 |
| `text-headline-sm` | serif | 24 / 32 / — / 400 |
| `text-body-lg` | body-serif (Source Serif 4) | 18 / 32 / — / 400 |
| `text-body-md` | body-serif | 16 / 28 / — / 400 |
| `text-label-md` | sans (Work Sans) | 14 / 20 / 0.05em / 500 |
| `text-label-sm` | sans | 12 / 16 / 0.03em / 600 |

Font pairing is enforced via a Tailwind plugin so size utilities always set `font-family`.

### Elevation

Prefer **1px borders** (`border-outline-variant`) over shadows. If lift is required: `shadow-editorial` → `0px 4px 20px rgba(27, 67, 50, 0.05)`.

---

## 2. Diff vs previous `tailwind.config.ts` (Home / Property Detail build)

The in-repo config was **already aligned** with DESIGN.md YAML for the full M3 color set, sharp radii, and type scale. This prompt’s update:

| Area | Change |
|------|--------|
| **Color keys renamed** | **None.** Keys and hexes already matched DESIGN.md. |
| **Radius values flipped** | **None in the repo config** — already `0px` for `sm`→`2xl` (+ `3xl`), `full` retained. |
| **Additions** | File header documenting canonical source; DESIGN.md `spacing` scale (`base`, `gutter`, `margin-*`, `container-max`); `maxWidth.container-max`; `boxShadow.editorial`. |
| **Stitch → token remaps** (for patching pages that still hardcode stitch CDN values) | See §4. |

If a page still uses stitch-local CDN values from **property_detail** / **agency_discovery**, treat these as hex swaps (same Tailwind class names):

| Class / role | Stitch deviant hex | Canonical token hex |
|--------------|--------------------|---------------------|
| `bg-primary` / `text-primary` | `#1B4332` | `#012d1d` (`primary`) — mid green lives on `primary-container` |
| `bg-background` / `bg-surface` | `#F8F6F2` | `#fbf9f5` |
| `text-on-surface` | `#1A1A1A` | `#1b1c1a` |
| `bg-secondary` / gold accents | `#C9A15A` | Prefer `secondary` `#795919` or `secondary-container` `#fdd185` |

---

## 3. Component catalogue (from 15 stitch screens + shipped UI)

### Buttons (`Button`)

| Variant | Style | States |
|---------|-------|--------|
| **primary** (default CTA / Sign In) | `bg-primary-container` + `text-on-primary`, Work Sans bold uppercase tracking-widest | hover → `bg-primary`; focus-visible outline; disabled opacity 40% |
| **secondary** (boost / premium) | `bg-secondary-container` + `text-on-secondary-container` | hover brightness-95 |
| **outline** | Transparent + `border-outline` | hover `bg-surface-container-low` |
| **ghost** | Text-only muted | hover `text-primary` |
| **destructive** | `bg-error` + `text-on-error`, uppercase | hover opacity 90% |
| **icon** | Square 40×40, `border-outline-variant` | hover `bg-surface-container` |

Always `rounded-none`. Observed across homepage, search, admin queues, support, seller dashboards.

### Cards (`Card`)

- **default:** white (`surface-container-lowest`) + 1px `outline-variant/50` — listing cards, content blocks.
- **muted:** `surface-container-low` + softer border — secondary panels.
- **elevated:** same as default + `shadow-editorial` — rare; prefer border-only.

No drop shadows by default. Sharp corners only.

### Inputs (`Input`)

| Variant | When | Screens observed |
|---------|------|------------------|
| **`underline` (DEFAULT)** | Form fields, contact forms, compose | Support Center contact form; Messages compose textarea (`border-b` only) |
| **`stroke`** | Search / filter chrome with full 1px frame | Support hero search; Messages conversation search; Admin / Moderation / Verification search bars; Agency profile search |
| **`filled`** | Dense toolbars | Seller workspace search (`bg-surface-container`, no border) |

**Default for text fields in product forms: `underline`.** Use `stroke` or `filled` only for search/toolbars.

### Badge / status pill (`StatusPill`)

- Shape: sharp (`rounded-none`), `label-sm` uppercase tracking-widest, tight `px-2 py-1`.
- Tones:
  - LIVE → `primary-fixed` / `on-primary-fixed-variant`
  - VERIFIED → `primary/10` + light primary border
  - PENDING → `secondary-container`
  - REJECTED / danger → `error-container`
  - muted / expired → `surface-container-highest`

Seen on admin moderation, verification queue, seller listings, homepage agency cards.

### Tables (Admin — Overview, Moderation, Verification)

- Header row: `bg-surface-container-low`, `label-sm` uppercase, `outline-variant` bottom border.
- Body rows: `border-b border-outline-variant`, hover `bg-surface-container-low` (or lowest).
- Cells: body-md for content; action buttons outline / compact.
- Thumbnail cells: fixed small sharp image wells (`surface-container-highest`).
- No rounded table chrome.

### Stat cards (`StatCard`) — Analytics + Seller Dashboard

- Tall panel (`h-40`), tonal border fill (`surface-container-low` default).
- Label: `label-sm` uppercase secondary.
- Value: serif `display-lg-mobile`.
- Optional trend chip with Material Symbol `trending_up` / `trending_down`.
- Tones: `default` | `primary` (filled forest) | `secondary` (gold container) | `danger` (error value).

### Chat bubbles (`ChatBubble`) — Messages

- Sharp rectangles, no tail.
- **Outgoing:** `bg-primary` + `text-on-primary`, right-aligned.
- **Incoming:** `bg-surface-container` + `text-on-surface`, left-aligned.
- Meta timestamp: `label-sm` / `on-surface-variant`.
- Composer: underline textarea (default input style).

---

## 4. Screens whose stitch `borderRadius` must be treated as `0`

Canonical config forces `0px`. These stitch `code.html` files declared **non-zero** radii (`DEFAULT: 0.25rem`, `lg: 0.5rem`, `xl: 0.75rem`) and must not be copied literally into the app:

| Screen folder | Declared stitch radius |
|---------------|------------------------|
| `bete_agency_discovery_homepage` | 0.25 / 0.5 / 0.75 rem |
| `bete_agency_profile_listings` | 0.25 / 0.5 / 0.75 rem |
| `bete_ai_home_finder_brand_synchronized` | 0.25 / 0.5 / 0.75 rem |
| `bete_messages` | 0.25 / 0.5 / 0.75 rem |
| `bete_moderation_queue` | 0.25 / 0.5 / 0.75 rem |
| `bete_property_detail_brand_synchronized` | 0.25 / 0.5 / 0.75 rem *(called out deviation)* |
| `bete_saved_collections_clean_hierarchy` | 0.25 / 0.5 / 0.75 rem |
| `bete_seller_workspace_dashboard` | 0.25 / 0.5 / 0.75 rem *(called out deviation)* |
| `bete_support_center` | 0.25 / 0.5 / 0.75 rem |
| `bete_user_profile_dashboard` | 0.25 / 0.5 / 0.75 rem |

Already sharp in stitch config (`0px`):

- `bete_admin_platform_overview`
- `bete_search_discovery`
- `bete_seller_dashboard`

**Missing** `borderRadius` in stitch (would inherit Tailwind CDN defaults — treat as needing the same sharp override):

- `bete_analytics_revenue_dashboard`
- `bete_seller_verification_queue`

`rounded-full` on avatars / unread dots remains allowed via the `full` token.

---

## 5. Icons

Material Symbols Outlined via Google Fonts stylesheet + `<Icon name="…" />` — never Lucide / SVG icon packages.
