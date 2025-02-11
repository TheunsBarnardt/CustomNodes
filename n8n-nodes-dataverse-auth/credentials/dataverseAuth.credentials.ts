import {
    ICredentialDataDecryptedObject,
    ICredentialType,
    IDataObject,
    IHttpRequestOptions,
    INodeProperties,
} from 'n8n-workflow';

import axios from 'axios';

export class dataverseAuth implements ICredentialType {

    private accessToken: string | null = null;
    private scope: string | null = null;
    private credentials: ICredentialDataDecryptedObject | null = null;
    private tokenExpiry: number | null = null;
  
    private extractEntityNameFromFetchXml(fetchXml: string): string | null {
        const match = fetchXml.match(/<entity name="([^"]+)"/);
        return match ? match[1] : null;
    }

    async authenticate(credentials: ICredentialDataDecryptedObject, requestOptions: IHttpRequestOptions): Promise<IHttpRequestOptions> {
        this.credentials = credentials;
        const { tenantId, clientId, clientSecret, scope } = credentials as { tenantId: string, clientId: string, clientSecret: string, scope: string };
        this.scope = scope;

        const tokenResponse = await this.getToken(
            String(tenantId),
            String(clientId),
            String(clientSecret),
            String(scope)
        );

        requestOptions.headers = {
            ...requestOptions.headers,
            Authorization: `Bearer ${tokenResponse.access_token}`,
            'Content-Type': 'application/json',
            'OData-MaxPageSize': 5000,
        };

        this.accessToken = tokenResponse.access_token;

        // Correctly get the expires_in value if it exists, otherwise default to 1 hour
        const expiresIn = tokenResponse.expires_in ? parseInt(tokenResponse.expires_in, 10) : 3600;
        this.tokenExpiry = Date.now() + expiresIn * 1000;

        return requestOptions;
    }

    private async getToken(tenantId: string, clientId: string, clientSecret: string, resourceURL: string): Promise<any> {
        try {
            const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
            const data = new URLSearchParams();
            data.append('grant_type', 'client_credentials');
            data.append('client_id', clientId);
            data.append('client_secret', clientSecret);
            data.append('scope', `${resourceURL}/.default`);

            console.log("url: ", url);
            console.log("body: ", `${data}`);
            const response = await axios.post(url, data, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            return response.data;
        } catch (error) {
            throw new Error(`Error fetching token: ${error}`);
        }
    }

    async UpdateData(entityName: string, recordId: string, updateData: IDataObject): Promise<any> {
        if (!this.accessToken || !this.scope) {
            throw new Error("Authentication required before updating data.");
        }
    
        const fullApiUrl = `${this.scope}/api/data/v9.2/${entityName}(${recordId})`;
        console.log("Update API URL:", fullApiUrl);
    
        try {
            const response = await axios.patch(fullApiUrl, updateData, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                    'OData-MaxPageSize': '5000',
                    'Prefer': 'return=representation',
                },
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Dataverse API error: ${error.response?.status} - ${error.response?.statusText}. Details: ${JSON.stringify(error.response?.data)}`);
        }
    }

    async ListTables(): Promise<any> {
        if (!this.accessToken || !this.scope) {
            throw new Error("Authentication required before retrieving tables.");
        }
    
        const apiUrl = `${this.scope}/api/data/v9.2/EntityDefinitions?$select=LogicalName,DisplayName`;
    
        try {
            const response = await axios.get(apiUrl, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                    'OData-MaxPageSize': '5000',
                },
            });
    
            // Extracting logical names and display names
            const entities = response.data.value.map((entity: any) => ({
                logicalName: entity.LogicalName,
                displayName: entity.DisplayName?.UserLocalizedLabel?.Label || entity.LogicalName,
            }));
    
            return { tables: entities };
        } catch (error: any) {
            throw new Error(`Dataverse API error: ${error.response?.status} - ${error.response?.statusText}. Details: ${JSON.stringify(error.response?.data)}`);
        }
    }
    async GetData(fetchXml: string): Promise<any> {
        if (!this.accessToken || !this.scope || !this.credentials) {
            throw new Error("Authentication required before fetching data.");
        }
    
        if (this.isTokenExpired()) {
            const { tenantId, clientId, clientSecret, resourceURL } = this.credentials;
            const tokenResponse = await this.getToken(
                String(tenantId),
                String(clientId),
                String(clientSecret),
                String(resourceURL)
            );
            this.accessToken = tokenResponse.access_token;
            this.tokenExpiry = Date.now() + (tokenResponse.expires_in ? parseInt(tokenResponse.expires_in, 10) : 3600) * 1000;
            console.log("Token Refreshed!");
        }

        const entityLogicalName = this.extractEntityNameFromFetchXml(fetchXml);
        if (!entityLogicalName) {
            throw new Error("Failed to extract entity name from FetchXML.");
        }

        const fullApiUrl = `${this.scope}/api/data/v9.2/${entityLogicalName}s?fetchXml=${fetchXml}`;
        console.log("fullApiUrl: ", fullApiUrl);
    
        try {
            const response = await axios.get(fullApiUrl, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                    'OData-MaxPageSize': '5000',
                    'Prefer': 'odata.include-annotations="*"',
                },
            });
    
            return response.data;
        } catch (error: any) {
            throw new Error(`Dataverse API error: ${error.response?.status} - ${error.response?.statusText}. Details: ${JSON.stringify(error.response?.data)}`);
        }
    }

    private isTokenExpired(): boolean {
        return this.tokenExpiry === null || Date.now() >= this.tokenExpiry;
    }
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
            displayName: 'Scope',
            name: 'scope',
            type: 'string',
            default: 'https://<your-org-name>.crm4.dynamics.com', // Example, replace with your URL
            description: 'The URL of your Dataverse environment (e.g., https://<your-org-name>.crm4.dynamics.com)',
        },
        // Add more properties for other authentication methods if you add them above.
        // For example, for OAuth you might need redirect URIs, authorization URLs, etc.
    ];
}