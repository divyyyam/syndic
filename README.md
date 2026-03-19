Syndic — Cross-Border Settlement Infrastructure for Micro-Remittances
Overview

Syndic is a blockchain-enabled cross-border payments infrastructure focused on enabling instant, low-cost micro and recurring remittances between high-volume corridors such as India ↔ UAE.

Traditional remittance rails rely on multi-layer correspondent banking networks (e.g., SWIFT) or centralized remittance providers. These systems introduce:

High FX spreads and transfer fees

Settlement delays ranging from 2–5 business days

Limited transparency in transaction state

Poor accessibility for low-income or underbanked users

Syndic addresses these limitations through a regionally distributed liquidity network of synchronized settlement wallets (“Sister Wallets”) combined with blockchain-verified balance reconciliation.

The platform enables local settlement in destination regions while maintaining global value synchronization on-chain, significantly reducing both cost and latency.

Core Architecture
1. Regional Liquidity Clusters

Each supported geography maintains a Sister Wallet Node, responsible for:

Local fiat on-ramping and off-ramping

Maintaining pooled liquidity reserves

Executing domestic payouts through banking or partner APIs

Monitoring solvency and liquidity thresholds

This removes the need for actual cross-border capital movement per transaction.

2. On-Chain Balance Synchronization

Instead of transferring funds across borders for every remittance:

The sender’s regional wallet debits locally

The receiver’s regional wallet credits locally

Net exposure between wallets is periodically reconciled on-chain

This mechanism provides:

Deterministic settlement guarantees

Transparent proof of reserves and liabilities

Programmable reconciliation via smart contracts

3. Crypto-Fiat Conversion Layer

Syndic integrates licensed liquidity partners for:

Fiat → Stablecoin conversion

Stablecoin → Fiat withdrawals

Dynamic FX routing

Slippage-aware execution

This enables real-time movement of value across jurisdictions without relying on correspondent banking.

Transaction Flow

Sender deposits fiat into the local Syndic wallet (e.g., UAE cluster).

Fiat is converted into stablecoin liquidity.

A synchronization event is committed on-chain updating the global liquidity state.

The destination wallet (e.g., India cluster) immediately releases equivalent fiat to the receiver.

Periodic net settlement between clusters occurs via smart contract-driven liquidity balancing.

End-user experience: seconds-level settlement with predictable fees.

Key Advantages

Significant reduction in remittance fees through local settlement routing

Near real-time transfer finality

Full transaction traceability via blockchain state commitments

Programmable liquidity management and exposure control

Improved access for migrant workers, freelancers, and underbanked populations

Corridor-optimized architecture enabling scalable expansion

Example Corridor

A worker in Dubai sends funds to family in Kerala:

Deposit processed locally in UAE

Balance synchronization executed on-chain

INR payout triggered instantly from Indian liquidity cluster

No SWIFT routing or multi-bank settlement delay

Technology Stack

Frontend

Next.js

Tailwind CSS

Backend

Express.js

Prisma ORM

PostgreSQL

Blockchain Layer

Solana smart contracts for liquidity reconciliation

Stablecoin settlement primitives

Custom exposure and routing logic

Future Roadmap

Multi-corridor liquidity routing engine

Real-time FX optimization using AI-driven path selection

DAO-governed liquidity provisioning

On-chain proof-of-liquidity dashboards

SDK for fintech integrations

Portfolio

https://divyamm.xyz
