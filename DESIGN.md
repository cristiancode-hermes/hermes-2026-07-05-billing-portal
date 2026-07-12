# Design System — Billing Portal

> Based on the [Billing Portal](PRODUCT.md) product brief.

## Overview

This document defines the visual design system for **Billing Portal**. It follows a utility-first Tailwind CSS approach with custom theme tokens layered on top of the default Tailwind palette.

---

## Colors

All projects in this suite share a consistent color philosophy with indigo primary, slate secondary, and semantic accent colors. Project-specific deviations are noted.

### Primary — Indigo

| Token     | Hex       | OKLCH                      |
|-----------|-----------|----------------------------|
| 50        | `#eef2ff` | oklch(96% 0.02 271)        |
| 100       | `#e0e7ff` | oklch(93% 0.03 271)        |
| 200       | `#c7d2fe` | oklch(86% 0.06 271)        |
| 300       | `#a5b4fc` | oklch(78% 0.10 271)        |
| 400       | `#818cf8` | oklch(70% 0.15 271)        |
| **500**   | `#6366f1` | **oklch(62% 0.19 261)**    |
| 600       | `#4f46e5` | oklch(54% 0.20 261)        |
| 700       | `#4338ca` | oklch(46% 0.19 261)        |
| 800       | `#3730a3` | oklch(39% 0.17 261)        |
| 900       | `#312e81` | oklch(33% 0.15 261)        |

### Secondary — Slate

| Token     | Hex       | OKLCH                      |
|-----------|-----------|----------------------------|
| 50        | `#f8fafc` | oklch(98% 0.01 255)        |
| 100       | `#f1f5f9` | oklch(96% 0.01 255)        |
| 200       | `#e2e8f0` | oklch(93% 0.01 255)        |
| 300       | `#cbd5e1` | oklch(87% 0.02 255)        |
| 400       | `#94a3b8` | oklch(71% 0.03 255)        |
| **500**   | `#64748b` | **oklch(56% 0.04 255)**    |
| 600       | `#475569` | oklch(44% 0.04 255)        |
| 700       | `#334155` | oklch(37% 0.04 255)        |
| 800       | `#1e293b` | oklch(28% 0.04 255)        |
| 900       | `#0f172a` | oklch(21% 0.04 255)        |

### Semantic Colors

| Role      | Token    | Hex       | OKLCH                      |
|-----------|----------|-----------|----------------------------|
| Success   | 500      | `#22c55e` | oklch(69% 0.20 145)        |
| Warning   | 500      | `#f59e0b` | oklch(76% 0.18 85)         |
| Danger    | 500      | `#ef4444` | oklch(62% 0.19 27)         |
| Info      | 500      | `#3b82f6` | oklch(62% 0.17 241)        |

---

## Typography

| Usage      | Font Stack                                      | Weight                         |
|------------|-------------------------------------------------|--------------------------------|
| Body       | `Inter`, system-ui, -apple-system, sans-serif   | 400 / 500                      |
| Headings   | `Inter`, system-ui, sans-serif                  | 600 / 700 / 800                |
| Mono/code  | `JetBrains Mono`, `Fira Code`, monospace        | 400 / 500                      |

### Type Scale

| Level    | Size      | Weight | Line Height |
|----------|-----------|--------|-------------|
| h1       | 2.25rem   | 700    | 1.2         |
| h2       | 1.875rem  | 600    | 1.25        |
| h3       | 1.5rem    | 600    | 1.3         |
| h4       | 1.25rem   | 500    | 1.35        |
| body     | 1rem      | 400    | 1.5         |
| small    | 0.875rem  | 400    | 1.5         |
| caption  | 0.75rem   | 400    | 1.4         |

---

## Spacing

Based on a **4px grid**:

| Token  | Pixels  |
|--------|---------|
| 1      | 4px     |
| 2      | 8px     |
| 3      | 12px    |
| 4      | 16px    |
| 5      | 20px    |
| 6      | 24px    |
| 8      | 32px    |
| 10     | 40px    |
| 12     | 48px    |
| 16     | 64px    |

---

## Border Radius

| Token  | Value  |
|--------|--------|
| sm     | 4px    |
| md     | 6px    |
| lg     | 8px    |
| xl     | 12px   |
| 2xl    | 16px   |
| full   | 9999px |

---

## Shadows

| Token   | Value                                                                    |
|---------|--------------------------------------------------------------------------|
| sm      | `0 1px 2px 0 rgb(0 0 0 / 0.05)`                                        |
| md      | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`     |
| lg      | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`   |
| xl      | `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`  |
| card    | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`        |
| modal   | `0 20px 25px -5px rgb(0 0 0 / 0.2), 0 8px 10px -6px rgb(0 0 0 / 0.2)`  |

---

## Components

### Button

| Variant    | Classes                                                      |
|------------|--------------------------------------------------------------|
| Primary    | `bg-primary-500 text-white px-4 py-2 rounded-lg font-medium` |
| Secondary  | `bg-secondary-100 text-secondary-700 px-4 py-2 rounded-lg border border-secondary-200` |
| Ghost      | `text-secondary-600 px-3 py-2 rounded-md hover:bg-secondary-100` |
| Danger     | `bg-danger-500 text-white px-4 py-2 rounded-md font-medium` |
| Icon       | `w-9 h-9 rounded-md hover:bg-secondary-100 flex items-center justify-center` |

### Card

| Element   | Styles                                                               |
|-----------|----------------------------------------------------------------------|
| Container | `bg-white rounded-xl shadow-sm border border-secondary-200 p-6`      |
| Hover     | `shadow-md`                                                          |

### Input

| State     | Styles                                                         |
|-----------|----------------------------------------------------------------|
| Default   | `w-full px-3 py-2 rounded-lg border border-secondary-200`      |
| Focus     | `ring-2 ring-primary-200 border-primary-400`                    |
| Error     | `border-danger-500 ring-danger-200`                             |
| Dark mode | `bg-secondary-100 border-secondary-300 text-secondary-200`      |

### Badge

| Variant   | Styles                                                               |
|-----------|----------------------------------------------------------------------|
| Default   | `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium` |

### Modal

| Element    | Styles                                                                 |
|------------|------------------------------------------------------------------------|
| Overlay    | `fixed inset-0 bg-black/50 z-50 flex items-center justify-center`      |
| Content    | `bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4`               |

---

## Design Rules

1. **Utility-first**: All styles are composed from Tailwind utility classes. No custom CSS except for theme token definitions and animations.
2. **Dark mode**: Toggled via a `.dark` class on `<html>`. All surfaces invert following the secondary/reverse-light palette.
3. **Accessibility**: WCAG 2.1 Level AA target. Body text >= 4.5:1 contrast. Large text >= 3:1. Focus rings on all interactive elements.
4. **Motion**: Respects `prefers-reduced-motion`. All animations are optional and decorative.
5. **Skeleton loading**: Used for async content. Pulse/shimmer animation on neutral backgrounds.

---

## Anti-patterns

- ❌ Gradients as primary backgrounds (reserved for accent/logo only)
- ❌ Decorative elements that obscure data
- ❌ Purple-to-blue gradient templates (explicit anti-reference from product brief)
- ❌ Cream backgrounds with over-rounded everything
- ❌ Enterprise density that sacrifices readability
- ❌ Inline styles outside of utility-first approach
- ❌ Hard-coded color values outside the theme token system
