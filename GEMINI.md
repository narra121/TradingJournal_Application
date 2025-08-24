# Project Overview

Trading Journal application built with React, Vite, TypeScript, Redux Toolkit, and an AWS backend (Cognito-authenticated REST API: API Gateway + Lambda + DynamoDB + S3 for images). Users record trades, journal psychology, and view analytics.

Firebase has been fully removed (was previously used for Auth/Firestore/Storage). Configuration is now AWS-only; no feature flag remains.

## Building and Running

### Prerequisites

* Node.js and npm (LTS)
* AWS backend deployed (see `docs/` for infrastructure phases)

### Installation

1. Clone the repository.
2. Install dependencies:
    ```bash
    npm install
    ```

### Running the development server

```bash
npm run dev
```

Dev server: http://localhost:5173

### Building for production

```bash
npm run build
```

Outputs production bundle to `dist/`.

## Development Conventions

* TypeScript throughout
* Redux Toolkit slices in `src/app`
* API wrappers under `src/lib/api` (auth, trades, stats forthcoming)
* UI components in `src/components` and `src/ui` (Radix + shadcn based)
* Tailwind CSS for styling
* Import alias `@` -> `src`
* Env: only `VITE_API_BASE_URL` optionally; a sensible default exists for local testing

See `docs/migration-firebase-to-aws.md` for historical context and remaining post-migration cleanup.
