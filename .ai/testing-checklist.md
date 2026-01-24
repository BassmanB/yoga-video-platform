# Testing Checklist - Home View

## ✅ Manual Testing Checklist

### Responsive Design

- [ ] **Mobile (375px)**
  - [ ] Navbar displays correctly
  - [ ] Category pills scroll horizontally
  - [ ] Level select is full width
  - [ ] Clear filters button is full width
  - [ ] Video grid shows 1 column
  - [ ] Cards are readable and clickable
- [ ] **Tablet (768px)**
  - [ ] Video grid shows 2 columns
  - [ ] Filters layout switches to row
  - [ ] Level select has fixed width (w-64)
- [ ] **Desktop (1024px)**
  - [ ] Video grid shows 3 columns
  - [ ] All elements properly spaced
- [ ] **Large Desktop (1280px+)**
  - [ ] Video grid shows 4 columns
  - [ ] Container maintains max-width

### Authentication Flow

- [ ] **Logged Out User**
  - [ ] "Zaloguj się" button visible in navbar
  - [ ] Clicking button shows email prompt
  - [ ] Premium videos show blur overlay
  - [ ] Premium videos show "Tylko Premium" text
  - [ ] Free videos are accessible
- [ ] **Logged In - Free User**
  - [ ] Avatar shows in navbar with first letter
  - [ ] Dropdown shows email and "Free" badge
  - [ ] Premium videos still blurred
  - [ ] Free videos accessible
  - [ ] Logout button works
- [ ] **Logged In - Premium User**
  - [ ] Avatar shows in navbar
  - [ ] Dropdown shows "Premium" badge
  - [ ] All videos accessible (no blur)
  - [ ] Can view premium content
- [ ] **Logged In - Admin**
  - [ ] Avatar shows in navbar
  - [ ] Dropdown shows "Admin" badge
  - [ ] All videos accessible
  - [ ] Can see draft/archived videos (if implemented)

### Filtering

- [ ] **Category Filter**
  - [ ] "Wszystkie" shows all videos
  - [ ] "Yoga" filters to yoga only
  - [ ] "Mobilność" filters to mobility only
  - [ ] "Kalistenika" filters to calisthenics only
  - [ ] Active category has filled style
  - [ ] URL updates with ?category=yoga
- [ ] **Level Filter**
  - [ ] "Wszystkie poziomy" shows all
  - [ ] "Początkujący" filters correctly
  - [ ] "Średniozaawansowany" filters correctly
  - [ ] "Zaawansowany" filters correctly
  - [ ] URL updates with ?level=beginner
- [ ] **Combined Filters**
  - [ ] Can combine category + level
  - [ ] URL shows both params: ?category=yoga&level=beginner
  - [ ] Clear filters button appears when filters active
  - [ ] Clear filters resets to all videos
  - [ ] Clear filters removes URL params

### Video Cards

- [ ] **Display**
  - [ ] Thumbnail loads correctly (16:9 ratio)
  - [ ] Title displays (max 2 lines with ellipsis)
  - [ ] Duration badge shows in bottom-right
  - [ ] Category badge shows correctly
  - [ ] Level badge shows correctly
  - [ ] Premium badge shows for premium videos
- [ ] **Interactions**
  - [ ] Hover effect scales card (scale-105)
  - [ ] Click navigates to /video/[id]
  - [ ] Tab navigation works (keyboard)
  - [ ] Enter key navigates (keyboard)
  - [ ] Space key navigates (keyboard)
  - [ ] Focus ring visible (ring-2 ring-indigo-500)
- [ ] **Error Handling**
  - [ ] Broken image shows placeholder SVG
  - [ ] Placeholder is visible and styled

### Loading States

- [ ] **Initial Load**
  - [ ] Skeleton loader shows 9 cards
  - [ ] Skeleton matches card layout
  - [ ] Animation is smooth
- [ ] **Filter Change**
  - [ ] Skeleton shows during refetch
  - [ ] Transition is smooth
- [ ] **Slow Connection**
  - [ ] Loading state persists
  - [ ] No layout shift

### Empty States

- [ ] **No Videos**
  - [ ] Shows "Nie znaleziono nagrań" message
  - [ ] Icon displays correctly
- [ ] **No Results After Filter**
  - [ ] Shows appropriate message
  - [ ] "Wyczyść filtry" button appears
  - [ ] Button clears filters and shows all videos

### Error Handling

- [ ] **API Error**
  - [ ] Toast notification appears
  - [ ] "Spróbuj ponownie" action works
  - [ ] Empty state shows
- [ ] **Network Error**
  - [ ] Shows "Brak połączenia z internetem"
  - [ ] Toast notification appears
- [ ] **Invalid URL Params**
  - [ ] Invalid category ignored
  - [ ] Invalid level ignored
  - [ ] No error shown to user (silent fail)

### Accessibility (A11y)

- [ ] **Keyboard Navigation**
  - [ ] Tab through all interactive elements
  - [ ] Focus indicators visible
  - [ ] Skip to main content (if implemented)
  - [ ] Escape closes dropdowns
- [ ] **Screen Reader**
  - [ ] Page has proper heading structure (h1, h2, etc.)
  - [ ] Images have alt text
  - [ ] Buttons have aria-labels
  - [ ] Filter bar has role="search"
  - [ ] Video grid has role="list"
  - [ ] Cards have role="article"
  - [ ] Loading states have aria-live
- [ ] **Color Contrast**
  - [ ] Text readable on backgrounds
  - [ ] Focus indicators visible
  - [ ] Badges have sufficient contrast

### Performance

- [ ] **Initial Load**
  - [ ] Page loads in < 3s
  - [ ] No layout shift (CLS)
  - [ ] Images lazy load
- [ ] **Interactions**
  - [ ] Filter changes are instant
  - [ ] No janky animations
  - [ ] Smooth scrolling

### Cross-Browser Testing

- [ ] **Chrome** (latest)
- [ ] **Firefox** (latest)
- [ ] **Safari** (latest)
- [ ] **Edge** (latest)

### Mobile Testing

- [ ] **iOS Safari**
- [ ] **Android Chrome**
- [ ] **Touch interactions work**
- [ ] **No horizontal scroll**

## 🐛 Known Issues

_Document any known issues here during testing_

## 📝 Notes

_Add any additional notes or observations_
