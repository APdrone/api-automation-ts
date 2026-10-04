# Axios API Test Automation Suite (`axios-ts`)

> Enterprise-grade REST & Microservices API Automation Suite powered by Axios, TypeScript, and `@script-crux` core adapters.

This repository demonstrates complete API automation patterns against the **BillPulse Distributed FinTech Microservices Platform**, featuring contract isolation, distributed pub/sub event testing, telemetry tracking, and design patterns (Strategy, Factory, Builder).

---

## 🏛️ Project Architecture

```
axios-ts/
├── src/
│   ├── builders/            # Builder Pattern (InvoicePayloadBuilder)
│   ├── clients/             # Strongly-typed API Client Wrappers (BaseAxiosClient)
│   │   ├── billPulseClient.ts          # Gateway-level client
│   │   ├── testingControlClient.ts     # Health & Database reset coordinator
│   │   └── microservices/              # Isolated Service Clients (:4001, :4002, :4005)
│   │       ├── authServiceClient.ts
│   │       ├── billingServiceClient.ts
│   │       └── reportingServiceClient.ts
│   ├── factories/           # Factory Pattern (InvoiceFactory)
│   ├── strategies/          # Strategy Pattern (AuthStrategies: Admin, Manager, Viewer, Anonymous)
│   └── tests/               # Automated Test Suites (Node.js Native Test Runner)
│       ├── auth-rbac.spec.ts                     # RBAC permission matrix tests
│       ├── invoice-lifecycle.spec.ts             # State machine (DRAFT -> PENDING -> PROCESSING -> PAID)
│       ├── async-job-polling.spec.ts             # Asynchronous CSV generation & polling
│       ├── telemetry-and-contract-validation.spec.ts # Distributed tracing & SLA duration profiler
│       ├── disposable-and-env-validation.spec.ts # Env validation & LIFO entity teardown
│       └── microservices/
│           ├── gateway-aggregation.spec.ts       # API Gateway (:4000) health aggregation
│           ├── distributed-events.spec.ts        # Pub/Sub event bus settlement
│           └── service-isolation-and-contracts.spec.ts # Direct microservice contract tests
├── package.json
└── tsconfig.json
```

---

## 📦 Core Library Integration (`@script-crux`)

This suite actively consumes and validates:
- **`@script-crux/adapter-axios`**: `BaseAxiosClient`, distributed tracing headers (`X-Correlation-Id`, `X-Request-Id`), SLA duration profiler, runtime schema validator (`getAndValidate<T>`), and `ContractValidationError`.
- **`@script-crux/core-shared`**: `ConfigManager`, `EnvValidator`, `DisposableEntityManager`, and `TestLogger`.
- **`@script-crux/core-api`**: Database and contract types.

---

## 🧩 Architectural Design Patterns

1. **Builder Pattern** (`InvoicePayloadBuilder`): Fluent construction of complex multi-item invoice payloads with discount and tax rate configurations.
2. **Factory Pattern** (`InvoiceFactory`): Predefined domain presets (`createStandardInvoice`, `createHighValueEnterpriseInvoice`, `createZeroDiscountInvoice`).
3. **Strategy Pattern** (`IAuthStrategy`): Pluggable authentication strategies (`AdminAuthStrategy`, `ManagerAuthStrategy`, `ViewerAuthStrategy`, `AnonymousAuthStrategy`) automatically minting JWTs via `BaseAxiosClient`.
4. **Service Isolation & Contract Testing**: Direct endpoint tests against isolated microservice ports (`:4001`, `:4002`, `:4005`) verifying shared contract compliance.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 18
- Running BillPulse Microservices Cluster (`npm run dev:server` in `app-billpulse`)

### 2. Installation

```bash
npm install
```

### 3. Running API Tests

```bash
# Run all 31 API test suites
npm test


# Run a specific test suite
npm test -- src/tests/telemetry-and-contract-validation.spec.ts
npm test -- src/tests/microservices/distributed-events.spec.ts
```

---

## 📄 License
ISC
