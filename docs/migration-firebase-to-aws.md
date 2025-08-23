# Migration Plan: Firebase -> AWS (Cognito + API Gateway + DynamoDB)

Comprehensive, sequential checklist to replace Firebase Auth/Firestore/Storage with the new AWS backend and adopt the updated Trade data model from `api-endpoints.md`.

---
## Legend
- [ ] Open task  
- [x] Completed (will check as we implement)  
- (⚠️) Indicates potential breaking change / requires coordination  
- (★) Quick win / low risk  

---
## High-Level Phases
1. Baseline & Safety
2. Domain Model Refactor (Types Only)
3. API Client & Auth (Cognito wrapper endpoints)
4. Trade CRUD Migration (Firestore -> REST)
5. Image Handling (Firebase Storage -> S3 via API)
6. UI Component Field Refactor (Rename + Add New Fields)
7. Journal / Psychology / Analytics Alignment with New Fields
8. Stats Integration (`/v1/stats`)
9. Cleanup & Decommission Firebase
10. Testing, QA, and Rollout

---
## 1. Baseline & Safety
NOTE: Existing Firebase data will NOT be migrated; AWS environment starts empty.
- [x] Create feature branch `feat/aws-migration` (⚠️)  
- [x] Capture current production (or main) build works (build + lint)  
- [ ] Freeze adding new Firebase-dependent features during migration window  
- [x] Add a temporary feature flag env var `VITE_BACKEND_MODE=firebase|aws` to allow incremental switch (`.env.example`)  
- [x] Add `VITE_API_BASE_URL` placeholder for AWS API (`.env.example`)  

### Deliverables
- Branch + env flag + documented rollback steps. No data export required.

Rollback: Switch flag back to `firebase`, revert package removal commit (no data restore needed).

---
## 2. Domain Model Refactor (Types Only)
Introduce new interfaces alongside old to allow incremental adoption.

Progress Note: Core type file and mapping helper implemented (trade-aws.ts, barrel export updated). Remaining runtime adoption happens in later phases.

### New Trade Interfaces (Target AWS Model)
Will add in `src/app/types/trade-aws.ts`:
- ApiTradeImage
- ApiPartialClose
- ApiPsychology (boolean facets + emotionalState)
- ApiTrade (full AWS trade object)
- ApiTradeCreate (subset for POST)
- ApiTradeUpdate (partial for PUT)
- ApiStats (from `/v1/stats`)
- Auth token shapes (IdTokenPayload optional interface)

### Field Mapping Table
| Firebase (current) | AWS Field | Action |
|--------------------|-----------|--------|
| trade.tradeId (string) | tradeId | Keep (rename wrapper removal) |
| trade.symbol | symbol | Keep |
| trade.side | side | Keep (ensure BUY|SELL only) |
| trade.openDate | openDate | Keep (format YYYY-MM-DD) |
| trade.closeDate | closeDate | Keep |
| trade.entry (number) | entryPrice | Rename |
| trade.exit (number) | exitPrice | Rename |
| trade.qty (number) | quantity | Rename |
| trade.pnl (number) | pnl | Keep (now derived; stop sending) |
| trade.status (OPEN/CLOSED/etc) | status | Keep (derived) |
| images[].{id,url,timeframe,description} | images[].same | Keep (extend: allow base64Data on create/update) |
| psychology.isGreedy | psychology.greed | Rename & nest |
| psychology.isFomo | psychology.fomo | Rename |
| psychology.isRevenge | psychology.revenge | Rename |
| psychology.emotionalState | emotionalState (top-level) | Move out of psychology object |
| psychology.notes | postTradeNotes (or preTradeNotes?) | Map to postTradeNotes |
| analysis.riskRewardRatio | riskRewardRatio | Keep (derived; optional) |
| analysis.setupType | setupType | Keep |
| analysis.mistakes[] | mistakes[] | Keep |
| metrics.riskPerTrade | riskAmount | Rename (semantic: confirm dollars vs risk units) |
| metrics.stopLossDeviation | (drop?) / custom? | Possibly remove or store in notes/tags |
| metrics.targetDeviation | (drop?) | Same as above |
| metrics.marketConditions | marketCondition | Rename (singular) |
| metrics.tradingSession | tradingSession | Keep |
| (NEW) | timeframe | Add optional UI input |
| (NEW) | commission, fees | Add (default 0) |
| (NEW) | stopLoss, takeProfit | Add optional planning fields |
| (NEW) | partialCloses[] | Add (UI later) |
| (NEW) | netPnl | Display when provided |
| (NEW) | tags[] | Add tag picker later |
| (NEW) | tradeGrade | Add (dropdown A-F) |
| (NEW) | confidence/setupQuality/execution | Add numeric sliders 0-10 later |
| (NEW) | lessons[], newsEvents[], economicEvents[] | Stage later |
| (NEW) | createdAt / updatedAt | Show read-only |

### Tasks
- [x] Add new type file `trade-aws.ts` (★)  
- [x] Export re-mapped enums/constants (side, status, grade)  
- [x] Update barrel (`index.ts`) to re-export new AWS types (without breaking existing yet)  
- [x] Add type guards / mapping helper `mapLegacyTradeToApiPartial()` for transitional rendering  
- [ ] (Pending) Remove legacy mapping once all components consume `ApiTrade`  
- [ ] No runtime changes yet (keep Firebase feature-flag path until Phase 4)  

Reference: Types derived from JSON Schemas in `/schemas` (`trade-create.schema.json`, `trade-update.schema.json`). Any schema change should regenerate corresponding interfaces.

---
## 3. API Client & Auth (Cognito Wrapper Endpoints)
We replace Firebase auth flows with backend `/auth/*` endpoints.

### Auth State Changes
Current: `AuthState { user, isLoggedIn }` with Firebase UID.
New: store tokens + decoded user claims (sub, email) & expiry.

### Tasks
- [ ] Create `src/lib/api/client.ts` with base fetch wrapper (handles JSON, errors, Authorization header)  
- [ ] Create `src/lib/api/auth.ts` with functions: signup, confirmSignup, login, refresh, forgotPassword, confirmForgotPassword, logoutAll  
- [ ] Extend `authSlice` -> `awsAuthSlice` or migrate in place: store `{ idToken, accessToken, refreshToken, expiresAt, user: { sub, email } }`  
- [ ] Implement refresh flow thunk (auto refresh 60s before expiry)  
- [ ] Replace `onAuthStateChanged` logic in `LoginPage.tsx` with token bootstrap from localStorage  
- [ ] Add secure storage (localStorage keys: `tj.idToken`, `tj.refreshToken`, `tj.expiresAt`)  
- [ ] Implement logout: clear tokens + Redux reset  
- [ ] Feature flag: if `VITE_BACKEND_MODE=firebase` keep old path, else AWS path.

Error Handling: Standardize errors to show toast with `message` or generic fallback.

---
## 4. Trade CRUD Migration
Replace Firestore `subscribeToTrades` and thunks with REST.

Endpoints:
- POST /v1/trades
- GET /v1/trades (list + filters)
- GET /v1/trades/{id}
- PUT /v1/trades/{id}
- DELETE /v1/trades/{id}

### Tasks
- [ ] Create `src/lib/api/trades.ts` with functions: createTrade, getTrade, listTrades, updateTrade, deleteTrade  
- [ ] Create `tradesSliceAws.ts` (new) mirroring current shape but using `ApiTrade` list  
- [ ] Adjust selectors (e.g., `selectTradeDetails`) to use AWS types (transitional mapping for UI expecting old fields)  
- [ ] Implement list thunk with query params (symbol, status, startDate, endDate)  
- [ ] Remove real-time subscription; add manual refresh & optional polling (configurable)  
- [ ] Support optimistic update for update & delete (rollback on error)  
- [ ] Use Idempotency-Key header for create (uuid v4)  
- [ ] Migrate image create path (see Phase 5)  
- [ ] Mark old Firestore thunks as deprecated (console.warn)  

Transitional Strategy: Keep both slices behind feature flag; route components via a selector hook.

---
## 5. Image Handling (S3)
Option A (initial): Inline base64 in trade create/update (simpler).  
Option B (optimized): Use /v1/upload-url then PUT binary, then send `images:[{ id, url, ... }]` in update.

### Tasks
- [ ] Add helper `requestUploadUrl(tradeId, contentType)`  
- [ ] Abstract image uploader `uploadTradeImage(file, tradeId)` chooses Option B  
- [ ] In dialog/components, when user attaches image: (1) getPresignedUrl, (2) PUT file, (3) collect key->public URL (assuming backend returns accessible URL)  
- [ ] Update save handler in `TradeJournalDialog` to build `images` array without temporary dummy URLs  
- [ ] Remove Firebase storage logic (placeholder comments)  
- [ ] Handle replacement vs append (use IDs for upsert)  

Progressive Enhancement: Start inline for speed, refactor to presigned if size/perf issues arise.

---
## 6. UI Component Field Refactor
Components impacted: `TradeJournalDialog`, `TradesPage`, `AnalyticsTable`, `TradeDetailsDialog*`, `TradeJournal.tsx`, any filters.

### Tasks
- [ ] Update displayed/edited fields: entry->entryPrice, exit->exitPrice, qty->quantity  
- [ ] Add inputs (optional): stopLoss, takeProfit, commission, fees, riskAmount  
- [ ] Add dropdowns: tradeGrade (A-F), timeframe (list), marketCondition (single), tags (multi-select)  
- [ ] Add sliders (0-10): confidence, setupQuality, execution  
- [ ] Replace psychology booleans with expanded set (greed, fear, fomo, revenge, overconfidence, patience)  
- [ ] Move emotionalState to top-level (retain UI grouping)  
- [ ] Map old notes -> postTradeNotes (add preTradeNotes field)  
- [ ] Display computed fields read-only: pnl, netPnl, riskRewardRatio, status  
- [ ] Show createdAt / updatedAt  
- [ ] Update form validation & default values  
- [ ] Remove unused legacy metrics fields (stopLossDeviation, targetDeviation) or adapt into helper text  

---
## 7. Journal / Analytics Alignment
- [ ] Update any aggregation code relying on old `pnl` calculation to trust API value  
- [ ] If local analytics exist, refactor to use `ApiTrade` fields (realizedPartialPnl, remainingQuantity for open positions)  
- [ ] Enhance UI to show partial closes timeline (future: optional)  
- [ ] Add tag filtering UI (calls listTrades with `tag=`)  

---
## 8. Stats Integration
- [ ] Create `src/lib/api/stats.ts` with `getStats()`  
- [ ] New slice `statsSlice.ts` (caches stats + lastFetch)  
- [ ] Dashboard components use API stats instead of client sums  
- [ ] Handle loading state + stale-while-revalidate (refetch after trade mutation)  

---
## 9. Cleanup & Decommission Firebase
- [ ] Remove firebase imports & code paths once AWS flag stable  
- [ ] Delete `firebase.ts`, `auth.ts` (Firebase), Firestore thunks  
- [ ] Prune `firebase` dependency from `package.json`  
- [ ] Remove Firebase env vars from `.env` & docs  
- [ ] Update `GEMINI.md` to reflect AWS stack  
- [ ] Remove dead code (unsubscribe logic, storage placeholders)  

---
## 10. Testing, QA, Rollout
### Automated
- [ ] Add unit tests for API client (mock fetch)  
- [ ] Add reducer tests for new slices  
- [ ] Add mapping tests (legacy -> new types)  

### Manual
- [ ] Sign up / confirm / login / refresh flow  
- [ ] Create trade (minimal required)  
- [ ] Create trade with images  
- [ ] Update trade: add exitPrice (status transitions)  
- [ ] Delete trade (confirm removal + stats change)  
- [ ] Stats reflect closed trade PnL  
- [ ] Negative PnL updates worstLoss correctly  
- [ ] Token auto-refresh around expiry  
- [ ] Unauthorized request (removed token) -> 401 -> redirect/login  

### Performance / DX
- [ ] Ensure no blocking large base64 payloads (consider presigned path if large)  
- [ ] Confirm bundle size reduction after removing Firebase  

### Rollout
- [ ] Deploy backend stage (ensure `ApiBaseUrl` available)  
- [ ] Set env `VITE_API_BASE_URL` in build pipeline  
- [ ] Ship feature flagged build (`VITE_BACKEND_MODE=aws`) to staging  
- [ ] Smoke tests pass  
- [ ] Remove feature flag (hardcode AWS) after confidence  

---
## Data & Field Default Strategy
| Field | Default on Create (UI) |
|-------|------------------------|
| side | BUY |
| quantity | 1 |
| openDate | today (YYYY-MM-DD) |
| commission / fees | 0 |
| riskAmount | 0 |
| psychology booleans | false |
| confidence/setupQuality/execution | 5 |
| tradeGrade | null (unassigned) |
| tags | [] |
| images | [] |

Derived (do not send if undefined): pnl, netPnl, status, riskRewardRatio.

---
## Transitional Mapping Helper (Pseudo-code)
```
function mapLegacyTrade(t: Trade): Partial<ApiTrade> {
  return {
    tradeId: t.trade.tradeId,
    symbol: t.trade.symbol,
    side: t.trade.side,
    openDate: t.trade.openDate,
    closeDate: t.trade.closeDate || null,
    entryPrice: t.trade.entry,
    exitPrice: t.trade.exit || null,
    quantity: t.trade.qty,
    pnl: t.trade.pnl, // will eventually rely on API value
    status: t.trade.status,
    images: t.images?.map(i => ({ id: i.id, url: i.url, timeframe: i.timeframe || null, description: i.description || null })) || [],
    psychology: {
      greed: t.psychology.isGreedy,
      fomo: t.psychology.isFomo,
      revenge: t.psychology.isRevenge,
      fear: false,
      overconfidence: false,
      patience: false,
    },
    emotionalState: t.psychology.emotionalState,
    postTradeNotes: t.psychology.notes,
    riskRewardRatio: t.analysis.riskRewardRatio || null,
    setupType: t.analysis.setupType || null,
    mistakes: t.analysis.mistakes || [],
    marketCondition: t.metrics.marketConditions || null,
    tradingSession: t.metrics.tradingSession || null,
    riskAmount: t.metrics.riskPerTrade || 0,
  };
}
```

---
## Security Considerations
- Store only IdToken/RefreshToken (avoid AccessToken unless needed)  
- Use `Authorization: <IdToken>` per backend expectation (no Bearer prefix required but allowed)  
- Refresh logic must prevent thundering herd (single in-flight refresh)  
- Clear tokens on 401 / token parsing failure  

---
## Error Handling Strategy
| Layer | Action |
|-------|--------|
| API client fetch | Parse JSON; if !ok throw ApiError(code,message,details) |
| Thunks | catch -> dispatch rejected with message |
| Components | show toast / inline error |

---
## Analytics & Telemetry (Optional)
- Add simple timing logs around trade create/list for initial performance baseline.  
- After removal of Firebase, compare bundle size (expect reduction).  

---
## Post-Migration Cleanup
- Remove feature flag usage  
- Archive migration document (keep in `docs/` for history)  
- Update architecture diagram and onboarding guide  

---
## Open Questions (Clarify if needed)
1. Are `stopLossDeviation` & `targetDeviation` needed? How to map?  
2. Should psychology.notes split into pre/post?  
3. Provide tag taxonomy or free-form?  
4. Are we supporting partial closes UI now or later?  
5. Risk amount currency (assumed USD) – confirm.  

---
## Next Implementation Step
Proceed with Phase 2: Add AWS trade type definitions & mapping utilities (behind feature flag) unless you want revisions first.

Let me know if any adjustments are needed before coding Phase 2.
