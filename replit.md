# Quiz de Cuidados Faciais

## Overview
A mobile-first quiz funnel for a facial yoga/skincare **PDF guide** product, similar to Mimika but with a **deep purple and gold** color palette. All content is in Brazilian Portuguese. The product is a PDF guide (not an app). Includes a gender question at the start.

## Architecture
- **Frontend-only**: Pure React quiz with no backend/database needed (marketing funnel)
- **Framework**: React + Vite + TypeScript + Tailwind CSS
- **Routing**: wouter
- **Animations**: framer-motion
- **UI**: shadcn/ui components + custom quiz components

## Key Files
- `client/src/pages/quiz.tsx` - Main quiz page with 55+ steps (including loading screens)
- `client/src/App.tsx` - Router setup
- `client/src/index.css` - Theme variables (Plus Jakarta Sans font)
- `client/index.html` - SEO meta tags in Portuguese
- `client/public/images/` - Generated facial concern illustrations + stock photos

## Quiz Flow
1. Welcome/Landing - social proof, "GUIA #1 DO BRASIL" badge, gold accents
2. Gender question (added at start)
3. Objectives section - facial concerns with real illustrative images
4. Loading animation (analyzing objectives)
5. Personalization info screen
6. Lifestyle section - routine, habits, sleep, work
7. Loading animation (analyzing lifestyle)
8. Nutrition section - diet, water, bloating
9. Loading animation (analyzing nutrition)
10. Skin section - type, problems (with images), goals, allergies, color
11. Loading animation (analyzing skin)
12. About You section - age, face shape, statement screens with photos, preferences
13. Loading animation (compiling profile)
14. Results/Testimonials with avatars
15. Timeline chart, comparison chart, features (with images), steps
16. Email capture for PDF guide

## Images
- `client/public/images/*.png` - AI-generated facial concern illustrations (queda-facial, rugas-linhas, bolsas-olhos, etc.)
- `client/public/images/*.jpg` - Stock photos for testimonials, statement screens, and emotional sections

## Color Palette
- Background: deep purple (#1a0a2e)
- Dark background: #120820
- Gold accent: #d4af37 / #f0c040
- Purple accent: #7c3aed
- Purple mid: #2d1b4e
- CTA buttons: purple-to-gold gradient
- Progress bar: purple-to-gold gradient
- Selected states: gold borders/backgrounds
- Stars/ratings: gold

## Design
- Mobile-first responsive design (max-w-md)
- Smooth slide transitions between steps (framer-motion AnimatePresence)
- Loading/analyzing animations between sections with pulsing rings, progress bars, and sequential checkmarks
- Grid options with real images for facial concerns
- Statement screens with stock photos (jawline.jpg, eye-wrinkles.jpg, woman-mirror.jpg, stressed-woman.jpg)
- Header shows section name, "GUIA #1 DO BRASIL" badge, and gold 4.8 star rating
