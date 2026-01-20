# Architecture Refactoring Plan: Unified Financial & Sales System

## 1. Current State & Problems
- **Scattered Logic**: Logic for calculating debts, creating transactions, and validating sales is spread across `sales.js`, `receivables.js`, `clients.service.js`, and `clientContracts.js`.
- **Inconsistent Truth**: Frontend sends "pending" amounts which the backend trusts blindly (fixed recently, but the pattern persists in other areas).
- **Direct Database Manipulation**: Many functions write directly to `receivables` or `financialTransactions` without a centralized service, risking data integrity.
- **God Functions**: `saveSale` handles payment processing, contract creation, and inventory updates all in one large function.

## 2. Proposed Architecture (Service Layer Pattern)

We will introduce a strict Service Layer to handle business logic, decoupling "Data Persistence" from "Business Rules".

### Core Modules (Backend `functions/src`)

#### A. Financial Module (`src/financial/services/`)
1.  **`FinancialTransactionService.js`**
    - **Responsibility**: The ONLY entry point to add/remove money.
    - **Methods**: `recordIncome()`, `recordExpense()`, `voidTransaction()`.
    - **Triggers**: Updates `dailySummary` and `monthlySummary` automatically via Firestore triggers (already exists, but needs standardizing).

2.  **`ReceivableService.js`**
    - **Responsibility**: Manages "Accounts Receivable" (Debts).
    - **Methods**: `createReceivable()`, `applyPayment()`, `cancelReceivable()`, `getOpenReceivables(clientId)`.
    - **Rule**: `pending` amount is ALWAYS `amount - totalPaid`. Never set manually.

3.  **`PaymentProcessor.js`** (New)
    - **Responsibility**: Handles payment method logic (Credit Card installments, Cash, Pix).
    - **Methods**: `processPayments(paymentMethods[])`.
    - **Output**: Returns a list of standardized transaction payloads to be saved.

#### B. Sales Module (`src/sales/services/`)
1.  **`SalesOrchestrator.js`** (Refactoring `sales.js`)
    - **Responsibility**: Coordinates the sale flow.
    - **Flow**:
        1. Validate Stock/Availability.
        2. Calculate Totals (Items Sum).
        3. Call `PaymentProcessor` to validate payments.
        4. Save Sale Document.
        5. Call `FinancialTransactionService` to record instant payments.
        6. Call `ReceivableService` to record remaining debt.
        7. Call `ContractService` (if applicable).

#### C. Contracts Module (`src/clientContracts/services/`)
1.  **`ContractLifecycleService.js`**
    - **Responsibility**: Handles Status Changes (Active <-> Suspended <-> Canceled).
    - **Integration**: calls `ReceivableService` to cancel open debts upon contract cancellation (if configured).

## 3. Implementation Roadmap

### Phase 1: Establish the "Financial Core" (Safe)
- [x] Create `functions/src/financial/services` directory.
- [ ] Move `createTransactionInternal` to `FinancialTransactionService`.
- [ ] Move `createReceivableInternal` and `distributePaymentToReceivables` to `ReceivableService`.
- [ ] Create `PaymentProcessor` to standardize payment array parsing.

### Phase 2: Refactor `saveSale` (Critical)
- [ ] Update `saveSale` to use `PaymentProcessor` for calculations.
- [ ] Update `saveSale` to use `ReceivableService` for debt creation.
- [ ] Ensure `saveSale` ignores frontend `pending` values completely.

### Phase 3: Unify Frontend Data Access
- [ ] Update `clients.service.js` to fetching purely from Receivables for debt display (Completed in previous step, but needs verification).
- [ ] Create a consolidated `useFinancialSummary` hook for Dashboards that reads from the standardized collections.

## 4. Key Rules for the Future
1.  **frontend NEVER calculates debt**. It only sends `items` and `payments`. Backend calculates `total - payments = debt`.
2.  **Transactions are Immutable logs**. If a mistake is made, we do not edit the transaction; we create a "Correction" transaction (void/refund).
3.  **Receivables are the Single Source of Truth for Debt**. If it's not in `receivables` collection with `status: open`, the client owes nothing.

## 5. Next Immediate Step
Refactor `functions/src/sales/sales.js` to delegate payment processing to a new helper `functions/src/sales/services/paymentProcessor.js`.
