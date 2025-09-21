# Copilot Instructions for AI Agents

## Project Overview
This is a React Native project using Expo for cross-platform development. The main entry point is `App.tsx`, which loads the login screen from `src/pages/teladelogin`.

## Architecture & Structure
- **Main App**: `App.tsx` renders the root view and includes the login component.
- **Login Screen**: Located at `src/pages/teladelogin/idex.tsx` (note: file is currently empty, likely intended for login UI logic).
- **Styles**: Use React Native's `StyleSheet` for component styling. Shared styles may be placed in `src/pages/teladelogin/style.ts`.
- **Assets**: Images and icons are stored in `assets/` and `src/assets/`.
- **Components**: Place reusable UI elements in `src/components/`.
- **Global Logic**: Use `src/global/` for shared utilities or state.

## Developer Workflows
- **Start App**: Use Expo scripts in `package.json`:
  - `npm start` or `expo start` for development server
  - `npm run android`, `npm run ios`, or `npm run web` for platform-specific launches
- **TypeScript**: Strict mode is enabled via `tsconfig.json`. All new code should be type-safe.
- **Dependencies**: Core dependencies are `expo`, `react`, and `react-native`. Type definitions are managed in `devDependencies`.

## Project-Specific Conventions
- **File Naming**: Pages are under `src/pages/`, components under `src/components/`. Follow lower-case and hyphen/underscore naming for directories.
- **Login Flow**: The login logic should be implemented in `idex.tsx` (consider renaming to `index.tsx` for convention).
- **Styling**: Use `StyleSheet.create` for styles. Place screen-specific styles in the corresponding `style.ts` file.
- **Imports**: Use relative imports from the `src` directory. Example: `import mylogin from '.src/pages/teladelogin';` (fix path to `./src/pages/teladelogin` if needed).

## Integration Points
- **Expo**: Handles build, run, and platform integration.
- **React Navigation**: Not present, but if navigation is added, place config in `src/navigation/`.
- **Assets**: Reference images from `src/assets/` using `require` or import statements.

## Examples
- To add a new screen, create a folder in `src/pages/` and add `index.tsx` and `style.ts`.
- To add a reusable button, place it in `src/components/` and import as needed.

## Recommendations
- Fix the typo in `idex.tsx` to `index.tsx` for clarity and convention.
- Populate empty files with initial component or style code to avoid confusion.

---
_Review and update these instructions as the project evolves. If any section is unclear or missing, provide feedback for improvement._
