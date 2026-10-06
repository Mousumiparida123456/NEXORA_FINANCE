<div align="center">

# ◈ NEXORA

### Financial Intelligence × Transaction Risk Protection

**Understand your money. Detect financial risk. Make safer decisions.**

<p>
  <a href="https://nexora-finance-fintech-dashboard.vercel.app/">
    <img src="https://img.shields.io/badge/🚀%20LIVE%20DEMO-NEXORA-111827?style=for-the-badge"/>
  </a>
  <a href="https://github.com/Mousumiparida123456/NEXORA_FINANCE">
    <img src="https://img.shields.io/badge/💻%20SOURCE-GITHUB-181717?style=for-the-badge&logo=github"/>
  </a>
</p>

<p>
  <img src="https://img.shields.io/badge/React-TypeScript-61DAFB?style=flat-square&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/XGBoost-Fraud%20Detection-FF6600?style=flat-square"/>
  <img src="https://img.shields.io/badge/Python-ML-3776AB?style=flat-square&logo=python&logoColor=white"/>
</p>

</div>

---

# 🚀 NEXORA at a Glance

**NEXORA** is a fintech intelligence platform designed around one simple idea:

> **Financial management should not only tell you what happened to your money — it should also help determine whether the activity is trustworthy.**

NEXORA combines two capabilities inside one platform:

### 💰 Personal Finance Intelligence
Understand transactions, spending patterns and financial activity.

### 🛡️ NEXORA Sentinel
Evaluate transactions for potential fraud and convert machine-learning predictions into actionable security decisions.

Instead of building a finance dashboard and a fraud detector as two disconnected systems, NEXORA connects them through a unified transaction intelligence layer.

**LIVE DEPLOYEMENT LINK : https://nexora-finance-fintech-dashboard.vercel.app/**

---

# 🎯 The Problem

Modern financial platforms generate enormous amounts of transaction data, but users and businesses often face two separate problems.

### Problem 1 — Financial Visibility

Users can see their transactions, but raw transaction lists do not always provide enough insight into:

- Where money is going
- Spending patterns
- Financial activity
- Potentially unusual transactions

### Problem 2 — Transaction Risk

Fraud detection systems can identify suspicious activity, but a prediction alone is not enough.

A useful fraud system should answer:

> **Why is this transaction risky?**

and more importantly:

> **What should happen next?**

NEXORA addresses both problems through a unified intelligence pipeline.

---

# 💡 The NEXORA Approach

```text
                 FINANCIAL ACTIVITY
                         │
                         ▼
              ┌─────────────────────┐
              │       NEXORA        │
              └──────────┬──────────┘
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
      💰 FINANCE                 🛡️ SENTINEL
      INTELLIGENCE               RISK ENGINE
             │                       │
             ▼                       ▼
       Understand              Detect Risk
       Transactions            Score Risk
       Spending                Explain Risk
             │                       │
             └───────────┬───────────┘
                         ▼
                  SMARTER DECISIONS
````

The platform therefore moves from:

**Transaction → Intelligence → Risk → Decision**

---

# 🛡️ NEXORA Sentinel

**Sentinel is the transaction security layer of NEXORA.**

It evaluates transactions through multiple stages instead of relying on a single static rule.

### Sentinel Pipeline

```text
Transaction
     │
     ▼
┌─────────────────────┐
│ 1. Input Validation │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ 2. Feature          │
│    Engineering      │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ 3. XGBoost Fraud    │
│    Prediction       │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ 4. Risk Fusion      │
│ ML + Behavioral +   │
│ Security Signals    │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ 5. Policy Engine    │
└──────────┬──────────┘
           ▼
      ┌────┼────┐
      ▼    ▼    ▼
    ALLOW REVIEW BLOCK
      │    │    │
      └────┼────┘
           ▼
┌─────────────────────┐
│ 6. Audit Logging    │
└─────────────────────┘
```

---

# 🧠 Real Machine Learning

NEXORA does not use a hardcoded random fraud score.

The Sentinel engine uses a trained **XGBoost classification model** based on the **IEEE-CIS Fraud Detection dataset**.

The model is integrated into the Sentinel pipeline through a dedicated inference layer.

### Model

```text
Algorithm      : XGBoost
Dataset        : IEEE-CIS Fraud Detection
Features       : 397
Model Version  : nexora-fraud-v1
Model Source   : IEEE-CIS-XGBoost
```

---

# 📊 Model Performance

| Metric           |      Result |
| ---------------- | ----------: |
| ROC-AUC          |  **89.84%** |
| PR-AUC           |  **49.51%** |
| Precision        |  **23.73%** |
| Recall           |  **67.86%** |
| F1 Score         |  **35.17%** |
| Training Samples | **413,378** |
| Test Samples     |  **88,581** |
| Features         |     **397** |
| Fraud Rate       |   **3.50%** |

### Why these metrics?

Fraud datasets are highly imbalanced.

If legitimate transactions heavily outnumber fraudulent transactions, accuracy alone can give a misleading picture.

NEXORA therefore emphasizes:

* **ROC-AUC** → overall ranking capability
* **PR-AUC** → performance under class imbalance
* **Recall** → ability to catch fraudulent transactions
* **Precision** → how many flagged transactions are actually fraudulent
* **F1** → balance between precision and recall

---

# 🔬 Model Training Strategy

The dataset was processed using a chronological split based on transaction time.

```text
IEEE-CIS Dataset
       │
       ▼
Feature Processing
       │
       ▼
Chronological Split
       │
 ┌─────┼─────┐
 ▼     ▼     ▼
Train  Val   Test
70%    15%   15%
       │
       ▼
    XGBoost
       │
       ▼
 Fraud Model
```

This avoids simply mixing future and past transactions randomly and provides a more realistic evaluation setup for transaction data.

---

# 🔍 How NEXORA Decides Risk

The XGBoost model produces a fraud probability.

But NEXORA does not blindly use that probability as the final decision.

Instead:

```text
              XGBoost
                 │
                 ▼
        Fraud Probability
                 │
                 ▼
        ┌────────────────┐
        │   Risk Fusion  │
        └───────┬────────┘
                │
       ┌────────┼────────┐
       ▼        ▼        ▼
      ML     Behavior  Security
    Signal    Signal     Rules
       │        │        │
       └────────┼────────┘
                ▼
          Final Risk Score
                │
                ▼
         Policy Evaluation
                │
       ┌────────┼────────┐
       ▼        ▼        ▼
     ALLOW    REVIEW    BLOCK
```

This creates a layered decision system.

---

# 🚦 Risk Decisioning

NEXORA converts risk into an actionable decision.

### 🟢 ALLOW

Transaction risk is within an acceptable range.

### 🟡 REVIEW

Transaction requires additional investigation or monitoring.

### 🔴 BLOCK

Transaction crosses the configured high-risk threshold.

The system therefore moves beyond:

> **"Fraud probability = X"**

towards:

> **"Here is the risk, here is why it matters, and here is what the system recommends doing."**

---

# 🔥 Behavioral & Security Signals

The Sentinel pipeline can combine machine-learning output with additional signals such as:

* Transaction velocity
* Behavioral anomalies
* Security rules
* High-severity indicators
* Transaction context
* Risk thresholds

This creates a **multi-layer risk decision engine** rather than a single-model application.

---

# 📜 Auditability

A security decision is valuable only when it can be investigated later.

NEXORA therefore records structured Sentinel audit information.

### Audit information includes:

```text
Transaction ID
Risk Score
Risk Level
Decision
Primary Reasons
Model Version
Policy Version
Timestamp
Metadata
```

This enables a reviewer to understand:

```text
What happened?
      ↓
What did the model predict?
      ↓
What risk signals were triggered?
      ↓
What decision was made?
      ↓
Which model/policy produced it?
```

---

# 💰 Personal Finance Manager

NEXORA also provides a financial management layer.

### Core capabilities

* Transaction tracking
* Financial dashboard
* Spending overview
* Transaction history
* Account monitoring
* Financial insights
* Financial activity analysis

The objective is to transform raw financial records into information that is easier to understand.

---

# 🧩 Platform Modules

```text
                    NEXORA
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   FINANCE         SENTINEL       ANALYTICS
   MANAGER          ENGINE          LAYER
        │              │              │
        ▼              ▼              ▼
 Transactions      Risk Engine     Insights
 Spending          XGBoost         Metrics
 Accounts          Risk Fusion     Trends
 History           Policy          Performance
                   Audit
```

---

# 📊 Model Performance Dashboard

NEXORA exposes the model's actual evaluation results inside the application.

The Model Performance section provides visibility into:

* ROC-AUC
* PR-AUC
* Precision
* Recall
* F1 Score
* Training samples
* Test samples
* Feature count
* Fraud rate
* Feature importance
* Model version
* Model source

This allows the ML layer to be inspected rather than hidden behind a generic **"AI detected fraud"** label.

---

# 🧪 Model Verification

NEXORA includes numerical parity verification between the Python model and backend inference layer.

The same transaction was evaluated through both paths.

```text
Python Model
Probability → 0.057371

Backend
Probability → 0.057371

Difference
→ 0.000000
```

### Result

```text
✓ Model loaded
✓ Feature transformation verified
✓ Python inference verified
✓ Backend inference verified
✓ Numerical parity verified
```

---

# 🧪 End-to-End Sentinel Verification

A complete transaction can be processed through:

```text
Transaction
     ↓
Validation
     ↓
Feature Engineering
     ↓
XGBoost
     ↓
Risk Fusion
     ↓
Policy Engine
     ↓
Decision
     ↓
Audit Log
```

Example high-risk evaluation:

```text
Risk Score  : 94 / 100
Risk Level  : CRITICAL
Decision    : BLOCK
Model       : nexora-fraud-v1
```

This validates the complete path from transaction input to security decision.

---

# 🏗️ System Architecture

```text
┌──────────────────────────────────────────────┐
│              NEXORA FRONTEND                 │
│                                              │
│ React + TypeScript + Vite                    │
│ Finance Dashboard + Sentinel Workspace       │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│                 API SERVER                   │
│                                              │
│ Node.js + Express                            │
│ Authentication + Validation + Rate Limiting  │
└───────────────┬──────────────┬───────────────┘
                │              │
                ▼              ▼
        ┌────────────┐  ┌─────────────────┐
        │ PostgreSQL │  │ Sentinel Engine │
        │            │  │                 │
        │ Users      │  │ Validation      │
        │ Accounts   │  │ Feature Engine  │
        │ Transactions│ │ XGBoost         │
        │ Audit Logs │  │ Risk Fusion     │
        └────────────┘  │ Policy Engine   │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ Python Inference│
                        │ XGBoost Model   │
                        └─────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

* React
* TypeScript
* Vite
* Responsive dashboard architecture

## Backend

* Node.js
* Express
* REST APIs
* Zod validation
* Helmet
* Rate limiting
* Authentication

## Database

* PostgreSQL
* Drizzle ORM

## Machine Learning

* Python
* XGBoost
* IEEE-CIS Fraud Detection dataset
* Feature engineering
* Model evaluation

## Deployment

* Vercel
* PostgreSQL / Supabase
* GitHub

---

# 📁 Project Structure

```text
NEXORA_FINANCE/
│
├── artifacts/
│   │
│   ├── fintech-dashboard/
│   │   └── src/
│   │       └── features/
│   │
│   └── api-server/
│       ├── api/
│       ├── src/
│       │   └── sentinel/
│       │       ├── models/
│       │       ├── services/
│       │       └── ...
│       └── scripts/
│
├── lib/
│   └── db/
│       ├── src/
│       └── drizzle/
│
├── ml-training/
│   │
│   ├── src/
│   │   ├── preprocess.py
│   │   ├── train.py
│   │   ├── predict_single.py
│   │   ├── test_inference.py
│   │   └── verify_parity.py
│   │
│   └── artifacts/
│       ├── nexora_fraud_v1.json
│       ├── feature_schema.json
│       ├── metrics.json
│       ├── feature_importance.json
│       └── model_metadata.json
│
├── package.json
├── INTEGRATION_GUIDE.md
└── README.md
```

---

# 🚀 Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/Mousumiparida123456/NEXORA_FINANCE.git

cd NEXORA_FINANCE
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create the required environment configuration.

Example:

```env
DATABASE_URL=your_postgresql_connection_string
CLIENT_ORIGIN=http://localhost:3000
GEMINI_API_KEY=your_gemini_api_key
```

Additional integrations may require their own credentials.

> Never commit `.env` files or secret credentials.

---

# ▶️ Run the Backend

```bash
cd artifacts/api-server

npm install

npm run dev
```

Backend:

```text
http://localhost:9999
```

---

# ▶️ Run the Frontend

```bash
cd artifacts/fintech-dashboard

npm install

npm run dev
```

Then open the local URL provided by Vite.

---

# 🤖 ML Training & Inference

The machine-learning implementation lives inside:

```text
ml-training/
```

### Training

```text
Dataset
   ↓
Preprocessing
   ↓
Feature Engineering
   ↓
Train / Validation / Test
   ↓
XGBoost
   ↓
Evaluation
   ↓
Model Artifact
```

### Inference

The backend uses:

```text
predict_single.py
```

to perform transaction-level inference.

Example response:

```json
{
  "fraudProbability": 0.057371,
  "predictedFraud": false,
  "modelVersion": "nexora-fraud-v1",
  "modelSource": "IEEE-CIS-XGBoost"
}
```

---

# 🔐 Security

NEXORA follows a layered security approach.

```text
Authentication
      ↓
Input Validation
      ↓
Rate Limiting
      ↓
Fraud Detection
      ↓
Risk Fusion
      ↓
Policy Enforcement
      ↓
Audit Logging
```

Security technologies include:

* Authentication middleware
* Request validation
* Helmet security headers
* Rate limiting
* User-scoped data access
* Structured audit logs

---

# 📦 Dataset Handling

The IEEE-CIS dataset is used for model development and evaluation.

The raw dataset is intentionally **not included in the GitHub repository** because of its size and data-handling considerations.

Expected local structure:

```text
ml-training/
└── data/
    ├── train_transaction.csv
    ├── train_identity.csv
    ├── test_transaction.csv
    └── test_identity.csv
```

The dataset directory should remain ignored by Git.

---

# 🌐 Live Demo

<div align="center">

### 🚀 Experience NEXORA

**[OPEN LIVE DASHBOARD →](https://nexora-finance-fintech-dashboard.vercel.app/)**

### 💻 Explore the Code

**[VIEW GITHUB REPOSITORY →](https://github.com/Mousumiparida123456/NEXORA_FINANCE)**

</div>

---

# 🗺️ Roadmap

### ✅ Current

* Personal Finance Dashboard
* Transaction Management
* Sentinel Risk Engine
* XGBoost Fraud Detection
* Risk Fusion
* Policy Engine
* Allow / Review / Block decisions
* Audit Logging
* Model Performance Dashboard

### 🔜 Next

* Real-time transaction streams
* Advanced behavioral profiling
* Explainable fraud decisions
* Improved anomaly detection
* Production-grade model serving
* Continuous model monitoring
* Optimized inference using ONNX / specialized acceleration

---

# 🌟 What Makes NEXORA Different?

Traditional finance dashboards answer:

> **"What happened?"**

Traditional fraud systems answer:

> **"Is this suspicious?"**

NEXORA connects both.

```text
                 WHAT HAPPENED?
                       │
                       ▼
                Financial Data
                       │
                       ▼
                WHAT IS RISKY?
                       │
                       ▼
                  ML + Rules
                       │
                       ▼
                WHAT NEXT?
                       │
                       ▼
              ALLOW / REVIEW / BLOCK
                       │
                       ▼
                 AUDIT TRAIL
```

### The result:

> **NEXORA turns financial data into actionable financial intelligence.**

---

# 🏆 Project Vision

NEXORA is built around a simple principle:

> **Don't just monitor financial activity. Understand it, evaluate it, and act on it.**

The long-term vision is to evolve NEXORA into a real-time financial intelligence layer capable of combining:

**Transaction Data + Machine Learning + Behavioral Intelligence + Security Policies**

into one continuously operating decision system.

---

# 👩‍💻 Built By

<div align="center">

### **Mousumi Parida**

**CSE Student • Full-Stack Developer • DSA Enthusiast**

Building at the intersection of:

**FinTech × Machine Learning × Security × Software Engineering**

</div>

---

<div align="center">

# ◈ NEXORA

### **Understand your money.**

### **Question every transaction.**

### **Protect what matters.**

⭐ If you find the project interesting, consider starring the repository.

</div>
```

> **NEXORA isn't just a dashboard with an "AI" label — the README demonstrates the actual XGBoost model, metrics, inference path, risk fusion, policy engine, and audit trail.**

