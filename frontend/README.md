# Frontend - Diagnostic Center Management System

This directory contains the frontend for the Diagnostic Center Management System. 

## 1. Project Overview
This serves as the primary frontend UI/UX and architectural guideline for the Diagnostic Center WebApp. It is tailored to ensure consistency in component creation, state management, and overall design language.

The design language is heavily inspired by the reference landing page: `/docs/mockup.webp`.

### Core User Roles
1. **Patient**: Books appointments, views reports, views prescriptions.
2. **Receptionist**: Manages appointments and queues.
3. **Doctor**: Consults, creates records, prescribes medicines, orders tests.
4. **Lab Technician**: Views test orders, uploads diagnostic results.

---

## 2. Tech Stack & Library Usage
- **Framework**: React + Vite + TypeScript
- **Styling**: Tailwind CSS v4
- **Component Library**: shadcn/ui
- **Icons**: lucide-react
- **Forms**: react-hook-form + zod (Strict validation for medical data)
- **Data Fetching**: tanstack-query (React Query) against the Go API
- **Tables**: tanstack-table (Essential for staff-facing lists like Patient Queue, Lab Orders)
- **Charts**: recharts (Admin/Management Dashboard analytics)
- **Dates**: dayjs (Appointment scheduling, DOBs, report timestamps)
- **Notifications**: sonner (Toast notifications for actions like "Test Result Uploaded")
- **State Management**: zustand (For client state: Sidebar toggles, active patient context)
- **HTTP Client**: axios
- **Animations**: framer-motion (Page transitions, modal popups, toast entry)

---

## 3. Design System & Theme

Based on the reference image the design system should adopt a clean, modern, and trustworthy medical aesthetic.

### 3.1 Color Palette (Tailwind v4 Configuration Target)
The theme relies on deep teals, vibrant cyan, and a warm yellow accent to create a "healing yet professional" environment.

*   **Primary (Teal/Dark Blue)**: `#0d4750` (Used for footer, dark bento-box cards, major headings)
*   **Secondary (Vibrant Cyan)**: `#1c96a3` (Used for primary buttons, highlights, active states)
*   **Accent (Warm Yellow)**: `#ffb703` (Used for CTAs like "Book Appointment", rating stars)
*   **Background (Light Blue-Gray)**: `#f4f8fa` (Used for the main app background to reduce eye strain compared to pure white)
*   **Surface (White)**: `#ffffff` (Used for cards, modals, table backgrounds)
*   **Text/Foreground**:
    *   Dark: `#1a202c` (Body text)
    *   Muted: `#64748b` (Secondary text, subtitles)

### 3.2 Typography
*   **Font Family**: A clean Sans-Serif like `Plus Jakarta Sans` or `Inter`.
*   **Headings**: Bold, well-spaced. (e.g., `text-3xl font-bold text-primary`)
*   **Body**: Highly readable, `text-base text-gray-700`.

### 3.3 UI Characteristics (shadcn/ui overrides)
*   **Border Radius**: The reference design heavily features rounded corners.
    *   Cards/Images: `rounded-2xl` or `rounded-3xl`
    *   Buttons: `rounded-full` (Pill shape)
    *   Inputs: `rounded-full` for search bars, `rounded-xl` for standard forms.
*   **Shadows**: Soft, diffused shadows (`shadow-sm` and `shadow-md` with slight blue/teal tint).
*   **Layout Style**: "Bento Box" grids for dashboards and feature lists, large generous padding (`p-6` to `p-8` on cards).

---

## 4. Architecture & State Strategy

### 4.1 Folder Structure Standard
```text
src/
├── assets/         # Static images, icons
├── components/     # shadcn components, shared UI (buttons, cards)
├── features/       # Feature-based modules (appointments, consultations, lab)
│   ├── appointments/
│   │   ├── components/
│   │   ├── hooks/      # tanstack-query hooks (e.g., useAppointments.ts)
│   │   ├── store/      # local zustand slices if needed
│   │   └── schema.ts   # zod schemas
├── layouts/        # PatientLayout, StaffLayout (Sidebar vs Topbar)
├── lib/            # axios instance, dayjs config, utils (cn)
├── pages/          # Route components mapping to features
└── store/          # Global zustand store (auth state, global UI state)
```

### 4.2 Data Fetching (Tanstack Query)
*   Keep queries modularized inside `/features/{domain}/hooks`.
*   Always use descriptive query keys: `['appointments', 'list', { date, doctorId }]`.
*   Handle global errors (e.g., 401 Unauthorized) via Axios interceptors.

### 4.3 Form Handling
*   Use `react-hook-form` connected to `zod`.
*   Create a reusable `<FormInput />` component wrapping shadcn's `<FormItem>`.
*   Medical data (prescriptions) requires array fields (`useFieldArray`) for adding multiple medicines dynamically.

---

## 5. View Layouts & Flows

### 5.1 Patient Portal (B2C Interface)
*   **Navigation**: Top Navigation Bar (Logo left, Links center, Profile/CTA right).
*   **Dashboard**:
    *   Upcoming Appointment Card.
    *   Quick actions: "Book New", "View Last Report".
*   **Look & Feel**: Mirrors the uploaded landing page closely (friendly, spacious).

### 5.2 Staff Portal (B2B Interface - Receptionist, Doctor, Lab Tech)
*   **Navigation**: Collapsible Left Sidebar (using `lucide-react` icons).
*   **Dashboard**: Data-dense but clean.
    *   **Receptionist**: View of today's schedule (`dayjs` + `tanstack-table`), status toggles (Arrived, Consulting, Done).
    *   **Doctor**: Active patient context. Split screen: History on left, Current Consultation (Notes, Rx, Lab Order) on right.
    *   **Lab Tech**: Table of pending lab orders. Clicking opens an upload modal (Dropzone for PDFs + manual entry for values).
*   **Look & Feel**: Slightly more utilitarian than the patient portal but retains the color palette (cyan active states, rounded corners on panels).

---

## React + TypeScript + Vite Setup

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

### React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

### Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
