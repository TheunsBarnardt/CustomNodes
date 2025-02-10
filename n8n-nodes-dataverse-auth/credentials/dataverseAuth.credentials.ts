import {
    ICredentialDataDecryptedObject,
    ICredentialType,
    IHttpRequestOptions,
    INodeProperties,
} from 'n8n-workflow';

import * as xml2js from 'xml2js';

async function fetchWrapper(url: string, options: any) {
    const fetch = (await import('node-fetch')).default;
    return fetch(url, options);
}

export class dataverseAuth implements ICredentialType {
    private accessToken: string | null = null;
    private scope: string | null = null;
    private credentials: ICredentialDataDecryptedObject | null = null;
    private tokenExpiry: number | null = null;

    async authenticate(credentials: ICredentialDataDecryptedObject, requestOptions: IHttpRequestOptions): Promise<IHttpRequestOptions> {
        this.credentials = credentials;
        const { tenantId, clientId, clientSecret, scope } = credentials as { tenantId: string, clientId: string, clientSecret: string, scope: string };
        this.scope = scope;

        const tokenResponse = await this.getToken(tenantId, clientId, clientSecret, scope);

        requestOptions.headers = {
            ...requestOptions.headers,
            Authorization: `Bearer ${tokenResponse.access_token}`,
            'Content-Type': 'application/json',
            'OData-MaxPageSize': '5000',
        };

        this.accessToken = tokenResponse.access_token;
        this.tokenExpiry = Date.now() + (tokenResponse.expires_in ? parseInt(tokenResponse.expires_in, 10) * 1000 : 3600000);

        return requestOptions;
    }

    private async getToken(tenantId: string, clientId: string, clientSecret: string, resourceURL: string): Promise<any> {
        const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
        const response = await fetchWrapper(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret,
                scope: `${resourceURL}/.default`,
            }).toString(),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch token: ${response.status} - ${response.statusText}`);
        }

        return response.json();
    }

    async GetData(fetchXml: string): Promise<any> {
        if (!this.accessToken || !this.scope || !this.credentials) {
            throw new Error("Authentication required before fetching data.");
        }

        if (this.isTokenExpired()) {
            const { tenantId, clientId, clientSecret, scope } = this.credentials;
            const tokenResponse = await this.getToken(
                String(tenantId),
                String(clientId),
                String(clientSecret),
                String(scope)
            );
            this.accessToken = tokenResponse.access_token;
            this.tokenExpiry = Date.now() + (tokenResponse.expires_in ? parseInt(tokenResponse.expires_in, 10) * 1000 : 3600000);
        }

        const entityLogicalName = await this.extractEntityName(fetchXml);
        if (!entityLogicalName) {
            throw new Error("Invalid FetchXML: Entity name could not be determined.");
        }

        const encodedFetchXml = encodeURIComponent(fetchXml);
        const fullApiUrl = `${this.scope}/api/data/v9.2/${entityLogicalName}?fetchXml=${encodedFetchXml}`;

        const response = await fetchWrapper(fullApiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                'OData-MaxPageSize': '5000',
                'Prefer': 'odata.include-annotations="*"',
            },
        });

        if (!response.ok) {
            throw new Error(`Dataverse API error: ${response.status} - ${response.statusText}`);
        }

        return response.json();
    }

    private async extractEntityName(fetchXml: string): Promise<string | null> {
        try {
            const parser = new xml2js.Parser({ explicitArray: false });
            const parsedXml = await parser.parseStringPromise(fetchXml);
            return parsedXml?.fetch?.entity?.$?.name || null;
        } catch (error) {
            console.error("Error parsing FetchXML:", error);
            return null;
        }
    }

    private isTokenExpired(): boolean {
        return this.tokenExpiry === null || Date.now() >= this.tokenExpiry;
    }

    name = 'dataverseAuth';
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
                },
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
            default: 'https://<your-org-name>.crm4.dynamics.com',
            description: 'The URL of your Dataverse environment (e.g., https://<your-org-name>.crm4.dynamics.com)',
        },
    ];
}
