# Azure App Service

This template creates only the public Linux web app `jexodic` in the existing
resource group `gomun`, using the existing B2 plan `ASP-gomun-bb4f`.
It does not update the plan, resource group, or other apps. No additional paid
services are provisioned. A system managed identity is enabled without role grants.

The runtime is Node.js 24 LTS. Deploy the prebuilt ZIP produced by
`web/scripts/build-azure.mjs`, containing the server bundle, static assets and
runtime package manifest. App Service starts it with `npm start`, without a remote
build. `/healthz` is the health probe. FTP and SCM basic authentication are
disabled; use Entra ID deployment credentials.

## Deployment order, including every redeployment

1. Validate and review the subscription deployment using `infra/main.bicep` and
   `infra/main.parameters.json`. Use incremental deployment mode.
2. Provision the infrastructure.
3. Securely configure `AZURE_OPENAI_API_KEY` as an App Service application setting
   using `az webapp config appsettings set --settings @/dev/stdin --output none`
   through the private-input Node helper. This merges with existing settings.
   Never print the value, commit it, or put it into Bicep parameters or deployment
   outputs.
4. Upload the prebuilt ZIP using Entra ID, then verify `/healthz`, the website and
   an AI request. The final URL comes from the `publicOrigin` deployment output.

**The appsettings child resource replaces the settings collection. Every IaC
deployment must be followed by step 3, even when no code changes.** Until the key
is reapplied the app serves its editorial fallback and AI is unavailable. The
template intentionally never reads existing secret settings into deployment
history. App Service encrypts its application settings at rest; authorized Azure
administrators can still retrieve them.

`PUBLIC_ORIGIN` derives from the actual hostname Azure assigns, including any
regional/random suffix. Do not assume the URL is `jexodic.azurewebsites.net`.
The in-memory AI cache and daily quota reset on process restart and apply per
worker process; `AI_DAILY_LIMIT=100` is not an account-wide spend limit.
