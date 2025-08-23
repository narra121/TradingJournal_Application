# Project Overview

This is a trading journal application built with React, Vite, TypeScript, Redux, and Firebase. It allows users to track their trades and view various analytics about their performance.

The application uses Firebase for authentication and data storage. The frontend is built with React and TypeScript, using Vite for the build tool. Redux is used for state management. The UI is built with a combination of custom components and components from the Radix UI library.

## Building and Running

### Prerequisites

*   Node.js and npm

### Installation

1.  Clone the repository.
2.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the development server

```bash
npm run dev
```

This will start the development server at `http://localhost:5173`.

### Building for production

```bash
npm run build
```

This will create a `dist` directory with the production-ready files.

## Development Conventions

*   The project uses TypeScript for static typing.
*   The code is organized into a `src` directory, with subdirectories for components, pages, and Redux store.
*   The project uses ESLint for linting.
*   The project uses Prettier for code formatting.
*   The project uses aliases for imports, with `@` pointing to the `src` directory.
