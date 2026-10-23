targetScope = 'subscription'

param environmentName string
param location string
param sessionId string
param deployedBy string
param createdAt string
param resourceGroupName string = 'gomun'
param appServicePlanName string = 'ASP-gomun-bb4f'
param appServiceName string = 'jexodic'

var tags = {
  'app-onboard-skill': 'true'
  'app-onboard-session-id': sessionId
  'created-at': createdAt
  environment: environmentName
  'deployed-by': deployedBy
}

// The existing resource group and plan are never updated by this deployment.
resource existingGroup 'Microsoft.Resources/resourceGroups@2024-03-01' existing = {
  name: resourceGroupName
}

module appService './modules/app-service.bicep' = {
  name: 'jexodic-app-service'
  scope: existingGroup
  params: {
    location: location
    tags: tags
    appServicePlanName: appServicePlanName
    appServiceName: appServiceName
  }
}

output appServiceId string = appService.outputs.appServiceId
output publicOrigin string = appService.outputs.publicOrigin
