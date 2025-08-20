# AI Development Rules for this Application

This document outlines the core technologies and best practices to follow when developing features for this application.

## Tech Stack Overview

*   **Frontend Framework:** React with TypeScript
*   **Build Tool:** Vite
*   **Routing:** React Router DOM
*   **Styling:** Tailwind CSS
*   **UI Components:** shadcn/ui (built on Radix UI)
*   **Icons:** Lucide React
*   **Backend & Database:** Supabase
*   **Data Fetching & Caching:** React Query
*   **Form Management:** React Hook Form with Zod for validation
*   **Charting:** Recharts
*   **Notifications:** shadcn/ui's `use-toast` hook for general notifications.

## Library Usage Guidelines

To maintain consistency and efficiency, please adhere to the following rules when implementing new features or modifying existing ones:

*   **React & TypeScript:** All new components and logic should be written using React and TypeScript.
*   **Vite:** Leverage Vite's fast development server and build capabilities.
*   **React Router DOM:** Use `react-router-dom` for all client-side routing. Keep main routes defined in `src/App.tsx`.
*   **Tailwind CSS:** All styling should be done using Tailwind CSS utility classes. Avoid inline styles or separate CSS files unless absolutely necessary for complex, non-Tailwindable styles (which should be rare).
*   **shadcn/ui Components:** Prioritize using components from the `shadcn/ui` library. These components are pre-styled with Tailwind and provide accessibility out-of-the-box. If a required component is not available in `shadcn/ui`, create a new, small, focused component in `src/components/` using Tailwind CSS. Do not modify existing `shadcn/ui` component files directly.
*   **Lucide React:** Use icons from the `lucide-react` library for all iconography needs.
*   **Supabase:** Interact with the backend exclusively through the `supabase` client imported from `src/integrations/supabase/client.ts`. Do not hardcode API keys or secrets in the frontend.
*   **React Query:** For fetching, caching, and synchronizing server state, use `@tanstack/react-query`.
*   **React Hook Form & Zod:** For form handling, use `react-hook-form` for state management and validation, and `zod` for schema-based validation.
*   **Recharts:** When creating charts or data visualizations, use the `recharts` library.
*   **Notifications:** For user feedback (success messages, errors, warnings), use the `use-toast` hook provided by `shadcn/ui` (imported from `@/hooks/use-toast`).
*   **Utility Functions:** Use `clsx` and `tailwind-merge` for conditionally applying and merging Tailwind CSS classes. For general utility functions, add them to `src/lib/utils.ts`.
*   **File Structure:**
    *   Page-level components go into `src/pages/`.
    *   Reusable UI components go into `src/components/`.
    *   Custom React hooks go into `src/hooks/`.
    *   Supabase client and types are in `src/integrations/supabase/`.
*   **Responsiveness:** All designs must be responsive and work well across various screen sizes (mobile, tablet, desktop).
*   **Simplicity & Elegance:** Aim for simple, elegant, and maintainable code. Avoid over-engineering. Implement only what is requested, without unnecessary complexity or placeholders.