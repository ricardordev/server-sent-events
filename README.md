# Server-Sent Events

A minimal reference implementation showcasing **Server-Sent Events (SSE)** in **Next.js**, using the GitHub REST API as a live data source to simulate real-time streaming.

**Stack:** Next.js · React · Tailwind CSS 4 · Sentry

> [!IMPORTANT]
> **Disclaimer:** This is example code. For production use, implement proper security measures.

---

## Environment Variables

Create a `.env` file in the root directory and populate it with the following variables:

```env
# Telemetry & Monitoring (Sentry)
SENTRY_AUTH_TOKEN=
SENTRY_DSN=
SENTRY_TRACES_SAMPLE_RATE=
SENTRY_ENABLE_LOGS=
```

---

## Getting Started

Clone the repository, install the dependencies, and fire up the local development server using your preferred package manager:

```bash
# Install dependencies
npm install # or yarn, pnpm, bun

# Start the development server
npm run dev
```

---

## API

The SSE endpoint streams GitHub repository results in real-time:

```
GET /api/search?q=<term>
```

Returns `400` if `q` is missing.

---

ricardo albrecht - ricardoalbrecht1@gmail.com