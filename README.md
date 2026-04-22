# EMR Blockchain — Sistem Rekam Medis Elektronik Berbasis Blockchain

> **Proyek:** AFL-3 · Universitas Ciputra Online Learning 2026  
> **Penulis:** Ervandy Rangganata (NIM: 0706012414015)

---

## 🌐 Live Demo

| Komponen | URL |
|----------|-----|
| Frontend | https://emr-blockchain.vercel.app |
| Smart Contract (Sepolia) | `0xa328d54d623025b96F91eB654F2A77668cd6EC4c` |
| Explorer | https://sepolia.etherscan.io/address/0xa328d54d623025b96F91eB654F2A77668cd6EC4c |

---

## 🏗️ Arsitektur Sistem

```
┌───────────────────────────────────────────────────────────────┐
│                     FRONTEND (Vercel)                         │
│           Next.js 15 + Tailwind CSS + ethers.js               │
│                                                               │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐   │
│  │ Admin  │ │ Dokter │ │Perawat │ │ Pasien │ │ Apoteker │   │
│  └────────┘ └────────┘ └────────┘ └────────┘ └──────────┘   │
└──────────────────┬───────────────────────────┬───────────────┘
                   │ Firebase SDK              │ ethers.js
                   ▼                           ▼
      ┌────────────────────┐    ┌──────────────────────────┐
      │  Firebase RTDB     │    │  Ethereum Sepolia Testnet│
      │  - patients        │    │  Smart Contract EMRv2    │
      │  - soap_notes      │    │  (Hash + Audit Trail)    │
      │  - doctor_notes    │    └──────────────────────────┘
      │  - prescriptions   │
      │  Firebase Auth     │
      └────────────────────┘
```

---

## 👥 Role-Based Access Control (5 Role)

| Role | Akses |
|------|-------|
| **Admin RS** | Lihat semua pasien, tugaskan ke departemen/poli, kelola akun staff |
| **Dokter** | Input pemeriksaan lengkap, diagnosis, resep obat |
| **Perawat** | Input SOAP dan tanda-tanda vital |
| **Pasien** | Lihat rekam medis + audit trail blockchain |
| **Apoteker** | Proses & konfirmasi pengeluaran resep |

---

## 🏥 Alur Kerja Klinis

```
Pasien Daftar → Admin Tugaskan Poli → Perawat Input SOAP
       ↓                   ↓                    ↓
Firebase + BC         Firebase + BC        Firebase + BC

Dokter Periksa → Resep ke Apoteker → Apoteker Serahkan Obat
       ↓                 ↓                     ↓
  Firebase + BC      Firebase             Firebase + BC
```

---

## ⛓️ Smart Contract (EMRv2.sol)

| Fungsi | Pemanggil | Deskripsi |
|--------|-----------|-----------|
| `registerPatient(emrId, hash)` | Admin/Pasien | Daftarkan pasien on-chain |
| `submitSOAP(emrId, hash)` | Perawat | Rekam SOAP |
| `submitDoctorNote(emrId, hash)` | Dokter | Rekam catatan dokter |
| `fulfillPrescription(emrId, hash)` | Apoteker | Konfirmasi resep |
| `assignDepartment(emrId, hash)` | Admin | Penugasan poli |
| `getEMRActions(emrId)` | Siapa saja | Audit trail |

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/ervandyr2512/emr-blockchain.git
cd emr-blockchain

# Install root (Hardhat)
npm install

# Install frontend
cd frontend && npm install

# Run dev
npm run dev   # http://localhost:3000
```

### Deploy Smart Contract
```bash
npx hardhat run scripts/deployV2.js --network sepolia
```

### Deploy Firebase Rules
```bash
firebase deploy --only database --project emr-blockchain
```

---

## 📁 Struktur Direktori

```
emr-blockchain/
├── contracts/
│   ├── EMR.sol         ← v1 (basic)
│   └── EMRv2.sol       ← v2 multi-role
├── scripts/
│   └── deployV2.js
├── firebase/
│   ├── database.rules.json
│   └── schema.json
└── frontend/           ← Next.js App
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/login & register
    │   │   ├── (dashboard)/admin, doctor, nurse, patient, pharmacist
    │   │   └── api/hash & blockchain
    │   ├── components/layout & ui
    │   ├── contexts/AuthContext
    │   ├── lib/firebase, blockchain, emr, hash, auth
    │   └── types/
    └── package.json
```

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Smart Contract | Solidity ^0.8.19, Hardhat |
| Blockchain | Ethereum Sepolia Testnet |
| Frontend | Next.js 15, React 18, TypeScript |
| Styling | Tailwind CSS v3 |
| Auth & DB | Firebase Auth + Realtime Database |
| Web3 Client | ethers.js v6 |
| Icons | Lucide React |
| Deployment | Vercel |

---

## Project Overview

A decentralised EMR platform built on Ethereum where:

- **Patients own their medical data** and control who can access it
- **Blockchain stores only the SHA-256 hash** of each record (metadata)
- **Full medical data is stored off-chain** (JSON files, simulating IPFS)
- **Smart contract enforces access control** — doctors read records only when granted permission

---

## Folder Structure

```
emr-blockchain/
├── contracts/
│   └── EMR.sol                    ← Solidity smart contract
├── scripts/
│   └── deploy.js                  ← Hardhat deployment script
├── test/
│   └── EMR.test.js                ← Smart contract unit tests
├── backend/
│   ├── src/
│   │   ├── server.js              ← Express API entry point
│   │   ├── routes/
│   │   │   ├── records.js         ← /record endpoints
│   │   │   └── access.js          ← /grant-access, /revoke-access, etc.
│   │   ├── services/
│   │   │   └── contractService.js ← ethers.js contract wrapper
│   │   ├── utils/
│   │   │   ├── hash.js            ← SHA-256 hashing (simulated IPFS CID)
│   │   │   └── storage.js         ← Off-chain JSON file storage
│   │   └── contract/
│   │       └── EMR.json           ← Generated by deploy.js (ABI + address)
│   ├── data/records/              ← Off-chain medical data (JSON files)
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/index.html
│   ├── src/
│   │   ├── index.js
│   │   ├── App.js                 ← Root component + routing
│   │   ├── hooks/useWallet.js     ← MetaMask connection hook
│   │   ├── utils/contract.js      ← ethers.js contract helpers
│   │   ├── components/
│   │   │   ├── shared/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Notification.jsx
│   │   │   │   ├── Spinner.jsx
│   │   │   │   └── RoleSelector.jsx
│   │   │   ├── patient/
│   │   │   │   ├── PatientDashboard.jsx
│   │   │   │   ├── CreateRecord.jsx
│   │   │   │   ├── RecordList.jsx
│   │   │   │   └── AccessManager.jsx
│   │   │   └── doctor/
│   │   │       └── DoctorDashboard.jsx
│   │   └── contract/
│   │       └── EMR.json           ← Generated by deploy.js (ABI + address)
│   └── package.json
├── hardhat.config.js
├── package.json
└── .env.example
```

---

## Step-by-Step Deployment Guide

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| MetaMask | Latest browser extension |

---

### Step 1 — Install root dependencies (Hardhat)

```bash
cd "Blockchain - Smart Contract - EMR"
npm install
```

---

### Step 2 — Start the local Hardhat blockchain node

```bash
npx hardhat node
```

This prints **20 test accounts** with private keys and 10 000 ETH each.  
Keep this terminal open — it is your local Ethereum network.

Example output:
```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

---

### Step 3 — Deploy the smart contract

Open a **new terminal**:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

Expected output:
```
Deploying EMR contract with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Account balance: 10000.0 ETH
EMR deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Contract info written to backend/src/contract/EMR.json
Contract info written to frontend/src/contract/EMR.json
```

---

### Step 4 — Configure and start the backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=<paste address from Step 3>
PORT=3001
DATA_DIR=./data/records
```

Then:
```bash
npm install
npm start
```

Backend runs at **http://localhost:3001**

---

### Step 5 — Configure MetaMask

1. Open MetaMask → **Add a network manually**:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. Import a test account:
   - Click account icon → **Import Account**
   - Paste a private key from Step 2 (e.g. Account #1 for the patient)

3. Repeat for another account (e.g. Account #2 for the doctor)

---

### Step 6 — Start the frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs at **http://localhost:3000**

---

### Step 7 — Use the application

1. Open **http://localhost:3000** in Chrome (with MetaMask)
2. Click **Connect MetaMask**
3. Choose your role:
   - **Patient**: create records, view records, grant/revoke doctor access
   - **Doctor**: register your address first, then view/add/update patient records

---

### Run smart contract tests

```bash
# From the root directory
npx hardhat test
```

---

## API Endpoints

### Base URL: `http://localhost:3001`

---

### POST `/record` — Create a medical record

**Request body:**
```json
{
  "privateKey": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "medicalData": {
    "diagnosis": "Hypertension Stage 1",
    "prescription": "Amlodipine 5mg once daily",
    "notes": "Patient advised to reduce sodium intake",
    "doctorName": "Dr. Sari Dewi",
    "visitDate": "2026-04-16"
  }
}
```

**Response:**
```json
{
  "success": true,
  "recordId": "1",
  "dataHash": "a3f1b2c4d5e6...",
  "txHash": "0xabc123..."
}
```

---

### GET `/record/:id` — Get a record by ID

```
GET /record/1?privateKey=0x59c6995...
```

**Response:**
```json
{
  "id": "1",
  "patient": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "dataHash": "a3f1b2c4d5e6...",
  "timestamp": "1713225600",
  "active": true,
  "medicalData": {
    "diagnosis": "Hypertension Stage 1",
    "prescription": "Amlodipine 5mg once daily",
    "notes": "Patient advised to reduce sodium intake",
    "doctorName": "Dr. Sari Dewi",
    "visitDate": "2026-04-16"
  }
}
```

---

### PUT `/record/:id` — Update a record

```json
{
  "privateKey": "0x...",
  "medicalData": {
    "diagnosis": "Hypertension Stage 2",
    "prescription": "Amlodipine 10mg once daily",
    "notes": "Follow-up in 1 month"
  },
  "isDoctor": false
}
```

Set `"isDoctor": true` to call `updateRecordByDoctor` instead.

---

### DELETE `/record/:id` — Soft-delete a record

```json
{
  "privateKey": "0x..."
}
```

**Response:**
```json
{ "success": true, "txHash": "0x..." }
```

---

### POST `/register-doctor` — Register a doctor

```json
{
  "doctorAddress": "0xC44Fe3E082C4E1CB6a68dD2452e79da0d74b0e6b"
}
```

---

### POST `/grant-access` — Patient grants doctor access

```json
{
  "privateKey": "0x59c6995...",
  "doctorAddress": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
}
```

---

### POST `/revoke-access` — Patient revokes doctor access

```json
{
  "privateKey": "0x59c6995...",
  "doctorAddress": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
}
```

---

### GET `/check-access` — Check if doctor has access

```
GET /check-access?patient=0x70997970...&doctor=0x3C44CdDd...
```

**Response:**
```json
{ "patient": "0x...", "doctor": "0x...", "hasAccess": true }
```

---

### GET `/check-doctor` — Check if address is a doctor

```
GET /check-doctor?address=0x3C44CdDd...
```

**Response:**
```json
{ "address": "0x...", "isDoctor": true }
```

---

## Smart Contract Summary

| Function | Type | Description |
|----------|------|-------------|
| `createRecord` | CREATE | Patient creates their own record |
| `createRecordByDoctor` | CREATE | Doctor creates record for patient (needs access) |
| `registerDoctor` | CREATE | Register a doctor address |
| `grantAccess` | CREATE | Patient grants doctor access |
| `getRecord` | READ | Fetch a single record (owner or authorised doctor) |
| `checkAccess` | READ | Check if doctor has access to patient |
| `getMyRecords` | READ | Get all active record IDs for caller |
| `checkDoctor` | READ | Check if address is a registered doctor |
| `updateRecord` | UPDATE | Patient updates their own record hash |
| `updateRecordByDoctor` | UPDATE | Doctor updates record (needs access) |
| `revokeAccess` | UPDATE | Patient revokes doctor access |
| `deleteRecord` | DELETE | Soft-delete (active = false) |
| `deactivateDoctor` | DELETE | Remove doctor registration |

---

## Security Considerations

1. **Access control**: All write functions use `onlyPatient` / `onlyDoctor` modifiers
2. **Soft delete**: Records are never purged — the blockchain provides an immutable audit trail
3. **Off-chain privacy**: Full medical JSON never touches the blockchain, only its hash
4. **Hash integrity**: Any tampered off-chain file will produce a hash mismatch — detectable
5. **Private key handling**: In this academic demo private keys are passed in the API body for simplicity. In production, use wallet signature verification (EIP-712 / SIWE) with JWT sessions — never transmit private keys over HTTP

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     React Frontend                           │
│  MetaMask ──► ethers.js ──► EMR Contract (read/write)        │
│              ──► Backend API  (off-chain data)               │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP (JSON)
┌────────────────────────▼─────────────────────────────────────┐
│                   Node.js / Express Backend                  │
│  POST /record  →  hash(data)  →  saveJSON  →  contract.createRecord(hash)
│  GET  /record  →  contract.getRecord(id)   →  readJSON(hash) │
└──────────┬────────────────────────────┬──────────────────────┘
           │  ethers.js                 │  fs (./data/records/)
┌──────────▼───────────┐   ┌────────────▼───────────────────┐
│  Ethereum (Hardhat)  │   │  Off-Chain Storage (sim. IPFS) │
│  EMR.sol             │   │  <sha256hash>.json             │
│  ─ hash on-chain     │   │  ─ full medical JSON off-chain │
└──────────────────────┘   └────────────────────────────────┘
```
