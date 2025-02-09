import {
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

// eslint-disable-next-line n8n-nodes-base/cred-class-name-unsuffixed
export class dataverseAuth implements ICredentialType {
    // eslint-disable-next-line n8n-nodes-base/cred-class-field-name-unsuffixed
    name = 'dataverseAuth';
    // eslint-disable-next-line n8n-nodes-base/cred-class-field-display-name-missing-api
    displayName = 'Dataverse Auth';
    properties: INodeProperties[] = [
        {
            displayName: 'Authentication Method',
            name: 'authenticationMethod',
            type: 'options',
            options: [
                {
                    name: 'Client Credentials',
                    value: 'clientCredentials',
                }               
            ],
            default: 'clientCredentials',
        },
        {
            displayName: 'Tenant ID',
            name: 'tenantId',
            type: 'string',
            default: '',
            description: 'The Azure Active Directory tenant ID',
        },
        {
            displayName: 'Client ID',
            name: 'clientId',
            type: 'string',
            default: '',
            description: 'The application (client) ID registered in Azure AD',
        },
        {
            displayName: 'Client Secret',
            name: 'clientSecret',
            type: 'string',
            typeOptions: {
                password: true,
            },
            default: '',
            description: 'The client secret generated for the application in Azure AD',
        },
        {
            displayName: 'Resource URL',
            name: 'resourceURL',
            type: 'string',
            default: 'https://<your-org-name>.crm4.dynamics.com', // Example, replace with your URL
            description: 'The URL of your Dataverse environment (e.g., https://<your-org-name>.crm4.dynamics.com)',
        },
        // Add more properties for other authentication methods if you add them above.
        // For example, for OAuth you might need redirect URIs, authorization URLs, etc.
    ];
}

