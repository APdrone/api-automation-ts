# Axios API Test Automation Suite (`axios-ts`)

> Lightweight, high-performance REST API Automation Testing Framework using Axios, TypeScript, and `@script-crux` core adapters.

---

## 🏛️ Project Architecture

```
axios-ts/
├── src/
│   ├── config/              # API Base URLs, headers, environment variables
│   ├── clients/             # Strongly-typed API client wrappers
│   ├── models/              # TypeScript request/response interfaces & DTOs
│   └── tests/               # API Test Specifications
│       ├── creatingData.spec.ts  # POST / PUT data creation & mutation tests
│       └── gettingData.spec.ts   # GET query and response schema tests
├── package.json
└── tsconfig.json
```

---

## 📦 Framework Dependencies

This project consumes:
- [`@script-crux/adapter-axios`](https://www.npmjs.com/package/@script-crux/adapter-axios): Pre-configured Axios instance with automatic retries, interceptors, and logging.
- [`@script-crux/core-shared`](https://www.npmjs.com/package/@script-crux/core-shared): Shared configuration and logger utilities.
- [`@script-crux/core-api`](https://www.npmjs.com/package/@script-crux/core-api): Schema validation & database verification utilities.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 18
- `npm` or `pnpm`

### 2. Installation

```bash
# Install dependencies
npm install
```

### 3. Running API Tests

```bash
# Run all API tests
npm test

# Run tests in watch mode / specific spec
npm test -- src/tests/gettingData.spec.ts
```

---

## 📄 License
ISC
