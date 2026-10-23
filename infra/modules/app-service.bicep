param location string
param tags object
param appServicePlanName string
param appServiceName string

resource existingPlan 'Microsoft.Web/serverfarms@2026-08-01' existing = {
  name: appServicePlanName
}

resource appService 'Microsoft.Web/sites@2026-08-01' = {
  name: appServiceName
  location: location
  tags: tags
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: existingPlan.id
    reserved: true
    httpsOnly: true
    publicNetworkAccess: 'Enabled'
    siteConfig: {
      linuxFxVersion: 'NODE|24-lts'
      appCommandLine: 'npm start'
      alwaysOn: true
      healthCheckPath: '/healthz'
      minTlsVersion: '1.2'
      scmMinTlsVersion: '1.2'
      ftpsState: 'Disabled'
      http20Enabled: true
    }
  }
}

// This child resource avoids a cycle while using Azure's assigned hostname.
// Reapply AZURE_OPENAI_API_KEY securely after EVERY infrastructure deployment.
// App Service replaces this appsettings collection; see ../README.md.
resource appSettings 'Microsoft.Web/sites/config@2026-08-01' = {
  parent: appService
  name: 'appsettings'
  properties: {
    SCM_DO_BUILD_DURING_DEPLOYMENT: 'false'
    WEBSITE_RUN_FROM_PACKAGE: '1'
    NODE_ENV: 'production'
    AI_DAILY_LIMIT: '100'
    PUBLIC_ORIGIN: 'https://${appService.properties.defaultHostName}'
    AZURE_OPENAI_ENDPOINT: 'https://sonnetia.services.ai.azure.com/openai/v1/responses'
    AZURE_OPENAI_DEPLOYMENT: 'gpt-4o'
  }
}

resource scmAuth 'Microsoft.Web/sites/basicPublishingCredentialsPolicies@2026-08-01' = {
  parent: appService
  name: 'scm'
  properties: {
    allow: false
  }
}

resource ftpAuth 'Microsoft.Web/sites/basicPublishingCredentialsPolicies@2026-08-01' = {
  parent: appService
  name: 'ftp'
  properties: {
    allow: false
  }
}

output appServiceId string = appService.id
output publicOrigin string = 'https://${appService.properties.defaultHostName}'
