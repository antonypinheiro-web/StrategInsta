# AI Rules for StrategInsta Development

This document outlines the core technologies and best practices for developing the StrategInsta application. Adhering to these rules ensures consistency, maintainability, and optimal performance.

## Tech Stack Overview

1.  **Vite**: A fast build tool that provides an extremely fast development experience for modern web projects.
2.  **TypeScript**: A strongly typed superset of JavaScript that adds static type definitions, improving code quality and developer experience.
3.  **React**: A declarative, component-based JavaScript library for building user interfaces.
4.  **shadcn/ui**: A collection of reusable components built with Radix UI and Tailwind CSS. These components are designed to be easily customizable and composable.
5.  **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs. All styling should be done using Tailwind classes.
6.  **React Router**: A standard library for routing in React applications, used for declarative navigation.
7.  **Tanstack Query (React Query)**: A powerful library for managing, caching, and synchronizing server state in React applications.
8.  **Lucide React**: A collection of beautiful, pixel-perfect icons for React projects.
9.  **Sonner**: A modern toast component for displaying notifications.
10. **Radix UI**: A low-level UI component library that provides unstyled, accessible components, forming the foundation for shadcn/ui.

## Library Usage Guidelines

*   **React**: Use React for all UI development. Components should be functional components.
*   **TypeScript**: All new code must be written in TypeScript, leveraging its type-checking capabilities.
*   **Vite**: Used for project setup, development server, and bundling. No direct interaction with Vite configuration is typically needed unless adding specific plugins.
*   **Tailwind CSS**: **Mandatory for all styling.** Apply styles directly using Tailwind utility classes. Avoid custom CSS files or inline styles unless absolutely necessary for dynamic values.
*   **shadcn/ui**:
    *   **Prioritize shadcn/ui components** for common UI elements (buttons, cards, forms, dialogs, etc.).
    *   **Do NOT modify shadcn/ui component files directly.** If a component needs customization beyond its props, create a new component that wraps or extends the shadcn/ui component, or build a new component from scratch following the project's styling conventions.
*   **React Router**:
    *   Manage client-side routing.
    *   **Keep all main application routes within `src/App.tsx`**.
*   **Tanstack Query**: Use for all data fetching, caching, and synchronization with backend APIs.
*   **Lucide React**: Use for all icons throughout the application.
*   **Sonner**: Use for displaying all toast notifications to the user.
*   **Radix UI**: Generally used indirectly via shadcn/ui. Direct usage of Radix primitives should only occur when building highly custom components that are not covered by shadcn/ui.
*   **File Structure**:
    *   Place all source code in the `src` directory.
    *   Pages should reside in `src/pages/`.
    *   Reusable UI components should reside in `src/components/`.
    *   Utility functions should reside in `src/lib/` or `src/utils/`.
    *   Hooks should reside in `src/hooks/`.
    *   Directory names must be all lower-case.
*   **Responsiveness**: All UI designs must be responsive and adapt gracefully to different screen sizes (mobile, tablet, desktop). Utilize Tailwind's responsive utility classes.
*   **Error Handling**: Do not implement `try/catch` blocks for API calls or component logic unless specifically requested. Errors should be allowed to bubble up for centralized handling and debugging.
*   **Supabase/Auth/Database/Server-side Functions**: If a request involves authentication, database interactions, or server-side logic (e.g., handling API keys), the user must first be prompted to add Supabase integration.