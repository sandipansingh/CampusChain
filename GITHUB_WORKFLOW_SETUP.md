# GitHub Actions Workflow Setup Guide

This guide details the environment variables and secrets you need to configure in your GitHub Repository settings to ensure the automated build, test, and Vercel deployment workflows run successfully.

---

## 1. Required GitHub Secrets

Configure these values under **Settings → Secrets and variables → Actions → Repository secrets** on your GitHub repository.

### Vercel Integration Secrets

These secrets authenticate and authorize the GitHub Action runner to build and deploy your Next.js application to Vercel via the Vercel CLI.

| Secret Name | Description | How to Obtain |
|---|---|---|
| `VERCEL_TOKEN` | Vercel Personal Access Token | Go to Vercel Dashboard → **Account Settings → Tokens** and create a new token. |
| `VERCEL_ORG_ID` | Vercel Team/Organization ID | Run `cd frontend && vercel link` locally to link your project. After linking, open `frontend/.vercel/project.json` and copy the `orgId` value. |
| `VERCEL_PROJECT_ID` | Vercel Project ID | Open the same `frontend/.vercel/project.json` and copy the `projectId` value. |

> [!NOTE]
> If these Vercel secrets are left unset, the workflow will automatically fall back to building the Next.js bundle and uploading it as a GitHub Action build artifact for 90 days.

### Stellar & Smart Contract Secrets

These public parameters configure the Next.js bundle during the compilation phase to point to your specific testnet contracts and administration keys.

| Secret Name | Suggested Value (Stellar Testnet) | Description |
|---|---|---|
| `NEXT_PUBLIC_STELLAR_RPC_URL` | `https://soroban-testnet.stellar.org` | The Soroban RPC endpoint used by the client to interact with the ledger. |
| `NEXT_PUBLIC_STELLAR_PASSPHRASE` | `Test SDF Network ; September 2015` | The Stellar Testnet passphrase to build and verify transactions. |
| `NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID` | *Your Deployed Identity Contract ID* | Deployed address of the `CampusIdentity` smart contract. |
| `NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID` | *Your Deployed Token Contract ID* | Deployed address of the `CampusToken` smart contract. |
| `NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID` | *Your Deployed Service Contract ID* | Deployed address of the `CampusService` smart contract. |
| `NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS` | *Your Deployed Platform Admin Address* | Stellar public key for the platform administrator (used for XLM purchase tracking). |

---

## 2. Setting Up GitHub Environment Configuration

1. **Navigate to Secrets**:
   Go to your GitHub repository, click on the **Settings** tab.
2. **Access Secrets Panel**:
   In the left sidebar, expand **Secrets and variables** and click **Actions**.
3. **Add Repository Secrets**:
   Click the **New repository secret** button. Add each key-value pair from the tables above.

---

## 3. How the Workflows Use These Environment Variables

- **Test Suite (`test.yml`)**:
  - Does not require any secrets.
  - Automatically runs Rust unit tests (`cargo test`) and frontend tests (`npm run test` using Vitest with mocked Freighter contexts) on all pull requests and pushes to `main`.
- **PR Checks (`pr-checks.yml`)**:
  - Focuses on static analysis, type-checking, linting, and a mock production build to ensure code health before merging.
- **Deploy Frontend (`deploy.yml`)**:
  - Pulls project settings from Vercel using `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`.
  - Injects all `NEXT_PUBLIC_*` variables at the job-level environment.
  - Compiles the Next.js production build using these environment variables so the built client-side code points to the correct network contracts.
  - Deploys the prebuilt output folder `.vercel/output` to production.
