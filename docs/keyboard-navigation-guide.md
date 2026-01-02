# Keyboard Navigation Guide - OpenRide

**Version:** 1.0  
**Last Updated:** January 1, 2026  
**Compliance:** WCAG 2.2 Level AAA

## Overview

OpenRide is fully accessible via keyboard navigation. All interactive elements can be reached and activated without a mouse, ensuring equal access for users who rely on keyboards, switch devices, or assistive technologies.

---

## Universal Keyboard Shortcuts

### Navigation
| Key | Action |
|-----|--------|
| `Tab` | Move focus to next interactive element |
| `Shift + Tab` | Move focus to previous interactive element |
| `Enter` | Activate focused link or button |
| `Space` | Activate focused button or toggle checkbox |
| `Escape` | Close modal, dialog, or dropdown |
| `Arrow Keys` | Navigate within dropdown menus, radio groups, or tabs |

### Skip Navigation
| Key | Action |
|-----|--------|
| `Tab` (first press) | Focus on "Skip to main content" link |
| `Enter` | Jump directly to main content area |

**Why Skip Links Matter:** Skip links allow keyboard users to bypass repetitive navigation menus and jump straight to the page's primary content, saving time and reducing frustration.

---

## Page-Specific Navigation

### Homepage (`/`)

#### Tab Order
1. **Skip to main content** link (visually hidden, appears on focus)
2. **OpenRide logo** - Returns to homepage
3. **Navigation menu items**
   - Governance
   - Driver Dashboard (if authenticated)
   - Rider Dashboard (if authenticated)
4. **Sign In button** (if not authenticated)
5. **User profile menu** (if authenticated)
6. **Main content area**
   - "Book a Ride Now" button
   - "Send a Package" button
   - "Book Courier Service" button
7. **Footer links**
   - Accessibility Statement
   - Terms of Service
   - Privacy Policy

#### Keyboard Actions
- **Enter on "Book a Ride"** → Navigate to `/ride/book`
- **Enter on "Send a Package"** → Navigate to `/delivery-booking`
- **Enter on "Book Courier"** → Navigate to `/delivery-booking?type=courier`
- **Enter on "Sign In"** → Redirect to OAuth login portal

---

### Ride Booking Page (`/ride/book`)

#### Tab Order
1. Skip to main content link
2. Navigation header
3. **Pickup location input** (autocomplete enabled)
4. **Destination location input** (autocomplete enabled)
5. **Date/time picker** (if applicable)
6. **Vehicle type selector** (radio buttons or dropdown)
7. **Estimate fare button**
8. **Payment method selector**
9. **Confirm booking button**

#### Keyboard Actions
- **Type in location inputs** → Autocomplete suggestions appear
- **Arrow Down/Up** → Navigate autocomplete suggestions
- **Enter** → Select highlighted suggestion
- **Tab to payment selector** → Arrow keys to choose payment method
- **Enter on "Confirm Booking"** → Submit ride request

#### Autocomplete Navigation
```
1. Type "123 Main" in pickup input
2. Press Arrow Down to enter suggestion list
3. Use Arrow Down/Up to highlight desired address
4. Press Enter to select
5. Press Tab to move to destination input
```

---

### Driver Application Page (`/driver/apply`)

#### Tab Order (Multi-Step Form)

**Step 1: Personal Information**
1. Skip to main content link
2. Progress indicator (read by screen readers)
3. Full name input
4. Email input
5. Phone number input
6. Next button

**Step 2: Vehicle Information**
1. Vehicle make input
2. Vehicle model input
3. Vehicle year input
4. Vehicle color input
5. License plate input
6. Passenger capacity input
7. Back button
8. Next button

**Step 3: Documents**
1. Driver's license upload button
2. Insurance upload button
3. Registration upload button
4. Back button
5. Next button

**Step 4: KYC Verification**
1. Check KYC status button
2. Complete KYC button (opens Pi Network portal)
3. Back button
4. Next button

**Step 5: Review & Submit**
1. Review all entered information (read-only)
2. Back button
3. Submit application button

#### Keyboard Actions
- **Enter on upload buttons** → Opens file picker dialog
- **Enter on "Next"** → Validates current step and advances
- **Enter on "Back"** → Returns to previous step
- **Enter on "Submit Application"** → Submits form (requires confirmation)

#### Form Validation
- **Tab away from invalid field** → Error message announced by screen reader
- **Focus returns to first invalid field** → When clicking "Next" with errors

---

### Governance Page (`/governance`)

#### Tab Order
1. Skip to main content link
2. Navigation header
3. **DAO governance tier information** (informational cards)
4. **Create proposal button** (if authenticated)
5. **Proposal list** (each proposal is a focusable card)
   - Proposal title (heading)
   - Proposal description
   - Vote For button
   - Vote Against button
   - View details link
6. **Pagination controls** (if applicable)
   - Previous page button
   - Page number buttons
   - Next page button

#### Keyboard Actions
- **Enter on "Create Proposal"** → Opens proposal creation modal
- **Enter on "Vote For"** → Casts vote in favor (requires confirmation)
- **Enter on "Vote Against"** → Casts vote against (requires confirmation)
- **Enter on "View Details"** → Expands full proposal text

#### Modal Navigation (Proposal Creation)
```
1. Enter on "Create Proposal" → Modal opens, focus moves to first input
2. Tab through: Title input → Description textarea → Tier selector → Submit button
3. Escape → Closes modal, focus returns to "Create Proposal" button
4. Enter on "Submit" → Submits proposal, modal closes
```

---

### Driver Dashboard (`/driver`)

#### Tab Order
1. Skip to main content link
2. Sidebar navigation
   - Overview
   - Active Rides
   - Ride History
   - Earnings
   - Settings
3. **Availability toggle switch**
4. **Statistics cards** (read-only, focusable for screen readers)
5. **Active ride card** (if ride in progress)
   - View ride details button
   - Navigate to pickup button
   - Complete ride button
6. **Ride history table**
   - Each row is focusable
   - View details button per row

#### Keyboard Actions
- **Space on availability toggle** → Toggles online/offline status
- **Enter on sidebar items** → Navigate to different dashboard sections
- **Enter on "Navigate to Pickup"** → Opens map navigation
- **Enter on "Complete Ride"** → Opens ride completion modal

---

### Rider Dashboard (`/rider`)

#### Tab Order
1. Skip to main content link
2. Sidebar navigation
   - Overview
   - Book a Ride
   - Active Rides
   - Ride History
   - Payment Methods
   - Settings
3. **Active ride card** (if ride in progress)
   - Track driver button
   - Contact driver button
   - Cancel ride button
4. **Quick action buttons**
   - Book new ride
   - View ride history
5. **Recent rides list**
   - Each ride card is focusable
   - Rate ride button
   - Rebook button

#### Keyboard Actions
- **Enter on "Track Driver"** → Opens live map tracking
- **Enter on "Contact Driver"** → Opens messaging interface
- **Enter on "Cancel Ride"** → Opens cancellation confirmation dialog
- **Enter on "Rate Ride"** → Opens rating modal (1-5 stars)

---

## Form Controls

### Text Inputs
- **Tab** → Focus on input field
- **Type** → Enter text
- **Tab** → Move to next field (triggers validation on blur)

### Dropdowns / Select Menus
- **Tab** → Focus on dropdown
- **Space or Enter** → Open dropdown menu
- **Arrow Down/Up** → Navigate options
- **Enter** → Select highlighted option
- **Escape** → Close dropdown without selecting

### Radio Buttons
- **Tab** → Focus on radio group
- **Arrow Down/Up** → Select next/previous option
- **Space** → Select focused option

### Checkboxes
- **Tab** → Focus on checkbox
- **Space** → Toggle checked/unchecked state

### Buttons
- **Tab** → Focus on button
- **Enter or Space** → Activate button

### Modals / Dialogs
- **Modal opens** → Focus moves to first interactive element inside modal
- **Tab** → Cycles through modal elements only (focus trap)
- **Escape** → Closes modal, focus returns to trigger element

---

## Focus Indicators

All interactive elements display a **visible focus indicator** when navigated via keyboard:

- **Default:** 2px solid blue outline (`outline: 2px solid #1e40af`)
- **Contrast ratio:** Minimum 3:1 against background (WCAG 2.2 SC 2.4.13)
- **Always visible:** Focus indicators are never removed with `outline: none`

### Custom Focus Styles
- **Buttons:** Blue ring with 2px offset
- **Form inputs:** Blue border with subtle shadow
- **Cards:** Blue border around entire card
- **Links:** Blue underline + outline

---

## Screen Reader Announcements

### Dynamic Content Updates
- **Ride request submitted** → "Ride request submitted successfully. Searching for drivers."
- **Driver assigned** → "Driver assigned. John Doe will arrive in 5 minutes."
- **Vote cast** → "Your vote has been recorded. Thank you for participating in governance."

### Error Messages
- **Form validation error** → "Error: Full name is required. Please enter your full name."
- **Network error** → "Error: Unable to connect to server. Please check your internet connection."

### Loading States
- **Data loading** → "Loading ride history. Please wait."
- **Form submitting** → "Submitting application. Please wait."

### ARIA Live Regions
All toast notifications and dynamic status updates are announced via `aria-live="polite"` regions.

---

## Accessibility Best Practices

### For Keyboard Users
1. **Use Tab and Shift+Tab** to navigate through all interactive elements
2. **Use Enter or Space** to activate buttons and links
3. **Use Arrow keys** within dropdown menus and radio groups
4. **Use Escape** to close modals and cancel actions
5. **Look for focus indicators** to track your current position

### For Screen Reader Users
1. **Use heading navigation** (H key in NVDA/JAWS) to jump between sections
2. **Use landmark navigation** (D key for main, N key for nav) to skip to regions
3. **Use form mode** (F key) to quickly navigate form fields
4. **Listen for ARIA live announcements** for dynamic updates
5. **Use "Skip to main content" link** to bypass navigation

### For Switch Device Users
1. **Configure switch timing** to allow adequate time for activation
2. **Use scanning mode** to highlight interactive elements sequentially
3. **Activate with switch press** when desired element is highlighted

---

## Testing Keyboard Navigation

### Manual Testing Checklist
- [ ] All interactive elements are reachable via Tab key
- [ ] Focus order is logical and follows visual layout
- [ ] Focus indicators are clearly visible
- [ ] No keyboard traps (can always Tab away)
- [ ] Enter/Space activate buttons and links
- [ ] Escape closes modals and dropdowns
- [ ] Arrow keys work in menus and radio groups
- [ ] Form validation errors are announced
- [ ] Dynamic content updates are announced

### Automated Testing
Run Playwright accessibility tests:
```bash
pnpm exec playwright test accessibility.spec.ts
```

---

## Keyboard Shortcuts Summary

| Action | Shortcut |
|--------|----------|
| Navigate forward | `Tab` |
| Navigate backward | `Shift + Tab` |
| Activate button/link | `Enter` or `Space` |
| Close modal/dropdown | `Escape` |
| Navigate menu items | `Arrow Up/Down` |
| Skip to main content | `Tab` then `Enter` (first element) |
| Submit form | `Enter` (when focused on submit button) |
| Cancel action | `Escape` |

---

## Support

If you encounter any keyboard navigation issues or have suggestions for improvement:

1. Visit our [Accessibility Statement](/accessibility)
2. Submit feedback via the accessibility contact form
3. Email: accessibility@openride.example.com

We are committed to maintaining WCAG 2.2 Level AAA compliance and continuously improving keyboard accessibility.

---

## Resources

- [WCAG 2.2 Keyboard Accessible Guidelines](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=211#keyboard-accessible)
- [WebAIM Keyboard Accessibility](https://webaim.org/articles/keyboard/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)

---

**Document Version:** 1.0  
**Last Reviewed:** January 1, 2026  
**Next Review:** July 1, 2026
