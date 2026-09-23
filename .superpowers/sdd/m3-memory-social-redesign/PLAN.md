# M3 Memory Social Feed Redesign Plan

## Design Direction

Transform M3 Memory from a traditional portfolio/archive layout to a **social media feed aesthetic** inspired by social platforms like TikTok, Instagram Reels, and BeReal.

### Key Design Elements

**Color & Theme**
- Dark theme base (matches current dark mode)
- Primary accent: Teal/turquoise (#00D9FF or similar)
- Secondary accents: Purple/blue highlights
- Pill-shaped buttons with teal background

**Layout**
- Feed-style scrollable cards (portrait-focused)
- Desktop: Main feed (center) + Right sidebar with metrics
- Mobile: Full-width feed, stacked layout
- Aspect ratios: 2:3 or 9:16 (portrait)

**Navigation**
- Teal pill-shaped buttons for category/filter navigation
- Horizontal scrollable button bar
- Categories: All, Festival, Friends, Conversations, Adventure, etc.

**Engagement Metrics (Right Sidebar)**
- Likes count
- Comments count
- Bookmarks/saves count
- Share count
- User engagement indicators

**Card Components**
- Portrait image/video (full-bleed)
- Overlay text metadata (who shared, date, category)
- Hashtag-style categorization
- Engagement metrics below card

## Implementation Roadmap

### Phase 1: Layout Structure & Components (Tasks 1-3)

**Task 1: Create FeedCard Component**
- Portrait-focused card component
- Support for image, overlay text, metadata
- Responsive sizing (desktop/mobile)
- Engagement metrics display

**Task 2: Create PillNavigation Component**
- Teal pill-shaped button component
- Horizontal scrollable container
- Active state styling
- Category filtering functionality

**Task 3: Create MetricsSidebar Component**
- Desktop-only right sidebar
- Display engagement metrics
- User interaction stats
- Responsive hide on mobile

### Phase 2: Feed Layout (Tasks 4-5)

**Task 4: Redesign HomePage Layout**
- Replace hero + gallery with feed grid
- Integrate FeedCard components
- Add horizontal pill navigation
- Implement responsive feed grid

**Task 5: Responsive Feed Grid**
- Desktop: Main feed + sidebar (3-column layout)
- Tablet: Main feed + smaller sidebar (2-column)
- Mobile: Full-width feed, stacked cards

### Phase 3: Styling & Polish (Tasks 6-7)

**Task 6: Color & Theme Updates**
- Update CSS variables for teal accents
- Add pill button styling
- Update card hover/active states
- Refine dark theme colors

**Task 7: Typography & Spacing**
- Adjust spacing for feed layout
- Update headline sizing for cards
- Fine-tune engagement metric display
- Ensure 4/8/12/16/24/32px scale

### Phase 4: Verification & Deployment (Tasks 8-9)

**Task 8: Visual Verification**
- Screenshots at desktop (1440px), tablet (1024px), mobile (390px)
- Compare against design spec
- Verify color accuracy, spacing, responsiveness

**Task 9: Build, Type Check, Deploy**
- Run typecheck
- Run lint
- Run production build
- Deploy to Vercel

## Design Specifications

### Color Palette
```
--primary-accent: #00D9FF (teal)
--secondary-accent: #6B5FFF (purple)
--background-dark: #0F0F0F
--card-background: #1A1A1A
--text-primary: #FFFFFF
--text-muted: #8B8B8B
--border-color: #2A2A2A
```

### Component Dimensions

**FeedCard**
- Desktop width: ~400-500px
- Aspect ratio: 2:3 (portrait)
- Border radius: 12px
- Box shadow: 0 8px 24px rgba(0,0,0,0.3)

**Pill Navigation Buttons**
- Height: 36px
- Padding: 8px 16px
- Border radius: 20px (fully rounded)
- Font size: 14px

**MetricsSidebar**
- Width: 120-140px
- Desktop only (display: none on <1200px)
- Shows: Likes, Comments, Bookmarks, Shares

### Breakpoints
- Desktop: ≥1200px
- Tablet: 768px - 1199px
- Mobile: <768px

## Component Hierarchy

```
HomePage
├── FeedHeader (with pill navigation)
├── FeedContainer
│  ├── MainFeed
│  │  └── FeedCard[] (stacked vertically)
│  └── MetricsSidebar (desktop only)
└── FeedFooter
```

## Sample Feed Data Structure

```typescript
interface FeedItem {
  id: string;
  imageUrl: string;
  altText: string;
  contributor: string;
  date: string;
  category: string;
  hashtags: string[];
  engagement: {
    likes: number;
    comments: number;
    bookmarks: number;
    shares: number;
  };
  overlay?: {
    title?: string;
    subtitle?: string;
  };
}
```

## Migration Path

1. Keep existing content/data structure
2. Create new feed-style components in parallel
3. Update HomePage to use new feed layout
4. Preserve all existing functionality (remember form, etc.)
5. Update global styles for teal accent theme

## Quality Criteria

- ✅ All cards portrait-focused (2:3 aspect ratio)
- ✅ Teal pill buttons for navigation
- ✅ Right sidebar visible on desktop (≥1200px)
- ✅ Mobile: single-column full-width feed
- ✅ No horizontal scroll at any breakpoint
- ✅ Engagement metrics displayed
- ✅ Dark theme with teal/purple accents
- ✅ Responsive and performant
- ✅ Accessibility maintained
- ✅ No console errors or warnings

## Success Metrics

- Visually matches social feed aesthetic (from reference images)
- All content accessible and readable
- Metrics display accurately
- Responsive at all breakpoints
- Build passes all checks
- Deploy successfully to Vercel
