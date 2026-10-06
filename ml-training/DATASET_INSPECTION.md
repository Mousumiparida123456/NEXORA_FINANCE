# IEEE-CIS Fraud Detection Dataset Inspection Report

**Date:** October 6, 2026  
**Project:** NEXORA Finance (`ml-training`)  
**Status:** **NOT READY** (Missing `train_identity.csv` in `ml-training/data/`)

---

## 1. Overview & File Verification

| File Name | File Existence | Size (Bytes) | Size (MB) | Rows | Columns |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `train_transaction.csv` | **EXISTS** | 683,351,067 | 651.69 MB | 590,540 | 394 |
| `train_identity.csv` | **MISSING** | N/A | N/A | 0 | 0 |

---

## 2. Train Transaction Inspection (`train_transaction.csv`)

- **Total Rows:** 590,540
- **Total Columns:** 394
- **Numerical Columns:** 380 (`int64`: 4, `float64`: 376)
- **Categorical/Object Columns:** 14 (`ProductCD`, `card4`, `card6`, `P_emaildomain`, `R_emaildomain`, `M1`-`M9`)
- **Duplicate Rows:** 0 (No exact duplicate rows found)

### Target Distribution (`isFraud`)
- **Target Column:** `isFraud` (Verified present)
- **Total Transactions:** 590,540
- **Non-Fraud Transactions (`isFraud == 0`):** 569,877 (96.5010%)
- **Fraud Transactions (`isFraud == 1`):** 20,663 (3.4990%)
- **Fraud Class Imbalance Ratio:** ~27.58 : 1

### Missing Values Statistics
- **Total Missing Cells:** 95,566,686 out of 232,672,760 total cells (**41.07%** overall missing rate)
- **Columns with >50% Missing Values:** 174 columns
- **Top Missing Columns:**
  - `dist2`: 552,913 missing (93.63%)
  - `D7`: 551,623 missing (93.41%)
  - `D13`: 528,588 missing (89.51%)
  - `D14`: 528,353 missing (89.47%)
  - `D12`: 525,823 missing (89.04%)
  - `D6`: 517,353 missing (87.61%)
  - `D9` & `D8`: 515,614 missing (87.31%)

---

## 3. Train Identity Inspection (`train_identity.csv`)

- **Status:** **MISSING** from `ml-training/data/`
- **Rows:** 0
- **Columns:** 0
- **TransactionID:** Cannot verify in identity file because file is not present.

---

## 4. Join Verification (`TransactionID`)

- **Transaction Records (`train_transaction.csv`):** 590,540
- **Identity Records (`train_identity.csv`):** 0 (Missing)
- **Matching `TransactionID` records:** 0
- **Identity Join Coverage:** **0.00%** of transactions have identity information.

> [!WARNING]
> In the IEEE-CIS Fraud Detection dataset standard benchmark, `train_identity.csv` typically contains 144,233 rows with network and device details (such as `DeviceType`, `DeviceInfo`, `id_01` to `id_38`). Because `train_identity.csv` is missing from `ml-training/data/`, identity features cannot be joined.

---

## 5. Important Available Features & Verification

| Feature Name | Status | Type | Missing Count | Missing % | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TransactionID` | **FOUND** | `int64` | 0 | 0.00% | Unique primary key / timestamp index |
| `TransactionDT` | **FOUND** | `int64` | 0 | 0.00% | Timedelta from reference date |
| `TransactionAmt` | **FOUND** | `float64` | 0 | 0.00% | Payment amount in USD |
| `ProductCD` | **FOUND** | `object` | 0 | 0.00% | Product code (W, C, R, H, S) |
| `card1` | **FOUND** | `int64` | 0 | 0.00% | Payment card categorical code |
| `card2` | **FOUND** | `float64` | 8,933 | 1.51% | Card sub-code |
| `card3` | **FOUND** | `float64` | 1,565 | 0.27% | Card country code |
| `card4` | **FOUND** | `object` | 1,577 | 0.27% | Card brand (visa, mastercard, etc.) |
| `card5` | **FOUND** | `float64` | 4,259 | 0.72% | Card type code |
| `card6` | **FOUND** | `object` | 1,571 | 0.27% | Card type (debit, credit) |
| `addr1` | **FOUND** | `float64` | 65,706 | 11.13% | Purchaser billing region |
| `addr2` | **FOUND** | `float64` | 65,706 | 11.13% | Purchaser billing country |
| `dist1` | **FOUND** | `float64` | 352,271 | 59.65% | Distance metric 1 |
| `dist2` | **FOUND** | `float64` | 552,913 | 93.63% | Distance metric 2 |
| `DeviceType` | **NOT FOUND** | N/A | N/A | N/A | Expected in `train_identity.csv` |
| `DeviceInfo` | **NOT FOUND** | N/A | N/A | N/A | Expected in `train_identity.csv` |

### Potentially Useful Features Identified in `train_transaction.csv`
- **C1 – C14 (14 columns):** Counting features (e.g. how many cards associated with domain, etc.). 0 missing values. Highly predictive.
- **D1 – D15 (15 columns):** Time-delta features (days between past transactions). Varying missingness.
- **M1 – M9 (9 columns):** Match flags (name on card, address match, etc.).
- **V1 – V339 (339 columns):** Vesta engineered features including ranking, counting, and relationship features.
- **P_emaildomain & R_emaildomain:** Purchaser and recipient email domain categories.

---

## 6. Data Leakage Safeguards

- **Target Treatment:** `isFraud` is strictly designated as the target variable ($y$) and must NEVER be passed as an input feature ($X$).
- **Identifier Exclusion:** `TransactionID` is a sequential transaction key. It must be excluded from feature vectors to prevent the model from memorizing row order / IDs instead of learning fraud dynamics.

---

## 7. Potential Limitations & Risk Assessment

1. **Missing Identity File:** `train_identity.csv` is absent from `ml-training/data/`. As a result, network attributes, browser versions, operating systems, and device specs (`id_01`-`id_38`, `DeviceType`, `DeviceInfo`) are completely missing.
2. **High Sparsity / Missing Rates:** 174 out of 394 features in `train_transaction.csv` have missing rate exceeding 50%. Advanced imputation or tree-based algorithms capable of handling native NaNs (e.g., LightGBM / XGBoost) will be required.
3. **Severe Class Imbalance:** Fraud cases account for only **3.50%** of total transactions. Model evaluation must use PR-AUC or ROC-AUC rather than raw accuracy.
