import {
    ICredentialDataDecryptedObject,
    ICredentialType,
    IHttpRequestOptions,
    INodeProperties,
} from 'n8n-workflow';

import request from 'request';

// eslint-disable-next-line n8n-nodes-base/cred-class-name-unsuffixed
export class dataverseAuth implements ICredentialType {

    private accessToken: string | null = null;
    private scope: string | null = null;
    private credentials: ICredentialDataDecryptedObject | null = null;
    private tokenExpiry: number | null = null;

    async authenticate(credentials: ICredentialDataDecryptedObject, requestOptions: IHttpRequestOptions): Promise<IHttpRequestOptions> {
		debugger;
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

		debugger;
        return new Promise<any>((resolve, reject) => {
            request.post({
                url: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
                form: {
                    grant_type: 'client_credentials',
                    client_id: clientId,
                    client_secret: clientSecret,
                    scope: `${resourceURL}/.default`,
                },
                json: true,
            }, (error, response, body) => {
                if (error) {
                    return reject(error);
                }
                if (!response || !response.body || !response.body.access_token) {
                    return reject(new Error("Invalid token response: " + JSON.stringify(response?.body || response)));
                }

                resolve(body);
            });
        });
    }

    async fetchDataverseData(apiUrl: string): Promise<any> {
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
            const expiresIn = tokenResponse.expires_in ? parseInt(tokenResponse.expires_in, 10) : 3600; // Correct parsing
            this.tokenExpiry = Date.now() + expiresIn * 1000;
            console.log("Token Refreshed!");
        }

        const fullApiUrl = `${this.scope}/api/data/v9.2/${apiUrl}`;
		console.log("fullApiUrl: ", fullApiUrl);

        return new Promise<any>((resolve, reject) => {
            request.get({
                url: fullApiUrl,
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                    'OData-MaxPageSize': 5000,
                },
                json: true,
            }, (error, response, body) => {
                if (error) {
                    return reject(error);
                }
                if (!response || !response.body) {
                    return reject(new Error(`Invalid response from Dataverse API: ${response?.statusCode} - ${response?.statusMessage}`));
                }
                if (response.statusCode < 200 || response.statusCode >= 300) { // Check status code
                    return reject(new Error(`Dataverse API error: ${response.statusCode} - ${response.statusMessage}. Details: ${JSON.stringify(response.body)}`));
                }
                resolve(body);
            });
        });
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

