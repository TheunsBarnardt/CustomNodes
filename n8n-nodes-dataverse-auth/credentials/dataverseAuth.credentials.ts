// dataverseAuth.credentials.ts

import {
    IDataObject,
    IHttpRequestOptions,
    INodeProperties,
    ICredentialDataDecryptedObject,
    ICredentialType,
    INodePropertyOptions,
} from 'n8n-workflow';
import axios, { AxiosInstance } from 'axios';

export class dataverseAuth implements ICredentialType {

    // Cache token and expiry
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;
    private scope: string | null = null;
    private credentials: ICredentialDataDecryptedObject | null = null;
    private axiosInstance: AxiosInstance | null = null;

    // Static caches for load options data
    private static cachedTables: INodePropertyOptions[] | null = null;
    private static cachedEntityColumns: { [entityName: string]: INodePropertyOptions[] } = {};
    
    public static getCachedTables(): INodePropertyOptions[] | null {
        return dataverseAuth.cachedTables;
    }
    
    public static setCachedTables(tables: INodePropertyOptions[]): void {
        dataverseAuth.cachedTables = tables;
    }
    
    public static getCachedEntityColumns(entityName: string): INodePropertyOptions[] | undefined {
        return dataverseAuth.cachedEntityColumns[entityName];
    }
    
    public static setCachedEntityColumns(entityName: string, options: INodePropertyOptions[]): void {
        dataverseAuth.cachedEntityColumns[entityName] = options;
    }   
    
    // Helper: Create or Update Axios Instance
    private updateAxiosInstance() {
        if (!this.scope || !this.accessToken) return;
        if (!this.axiosInstance) {
            this.axiosInstance = axios.create({
                baseURL: this.scope,
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                    'OData-MaxPageSize': '5000',
                },
            });
        } else {
            // Update the token header if token has been refreshed
            this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
        }
    }

    // Authenticate (and reuse valid tokens)
    async authenticate(credentials: ICredentialDataDecryptedObject, requestOptions: IHttpRequestOptions): Promise<IHttpRequestOptions> {
        this.credentials = credentials;
        const { tenantId, clientId, clientSecret, scope } = credentials as { tenantId: string; clientId: string; clientSecret: string; scope: string };
        this.scope = scope;

        // If we already have a valid token, just update the request headers
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            this.updateAxiosInstance();
            requestOptions.headers = {
                ...requestOptions.headers,
                Authorization: `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                'OData-MaxPageSize': '5000',
            };
            return requestOptions;
        }

        // Otherwise, get a new token
        const tokenResponse = await this.getToken(String(tenantId), String(clientId), String(clientSecret), String(scope));
        this.accessToken = tokenResponse.access_token;

        // Set expiry (using token's expires_in or default to 3600 seconds)
        const expiresIn = tokenResponse.expires_in ? parseInt(tokenResponse.expires_in, 10) : 3600;
        this.tokenExpiry = Date.now() + expiresIn * 1000;

        // Update axios instance with the new token
        this.updateAxiosInstance();

        requestOptions.headers = {
            ...requestOptions.headers,
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'OData-MaxPageSize': '5000',
        };

        return requestOptions;
    }

    // Token retrieval
    private async getToken(tenantId: string, clientId: string, clientSecret: string, resourceURL: string): Promise<any> {
        try {
            const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
            const data = new URLSearchParams();
            data.append('grant_type', 'client_credentials');
            data.append('client_id', clientId);
            data.append('client_secret', clientSecret);
            data.append('scope', `${resourceURL}/.default`);

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

    // Ensure valid token (for every API call)
    private async ensureAuthenticated(): Promise<void> {
        if (!this.accessToken || Date.now() >= this.tokenExpiry) {
            if (!this.credentials) {
                throw new Error('Credentials are not available.');
            }
            const { tenantId, clientId, clientSecret, scope } = this.credentials as {
                tenantId: string;
                clientId: string;
                clientSecret: string;
                scope: string;
            };
            const tokenResponse = await this.getToken(String(tenantId), String(clientId), String(clientSecret), String(scope));
            this.accessToken = tokenResponse.access_token;
            const expiresIn = tokenResponse.expires_in ? parseInt(tokenResponse.expires_in, 10) : 3600;
            this.tokenExpiry = Date.now() + expiresIn * 1000;
            this.updateAxiosInstance();
        }
    }

    async CreateData(entityName: string, payload: IDataObject,columnsToUpdate?: IDataObject): Promise<any> {

        await this.ensureAuthenticated();
        if (!this.axiosInstance) throw new Error('Axios instance not available');
    
        // Start with the updateData payload (if provided)
        let body: IDataObject = {};
        if (payload && Object.keys(payload).length > 0) {
            body = { ...payload };
        }    
        
        if (
            columnsToUpdate &&
            columnsToUpdate.columnValues &&
            Array.isArray(columnsToUpdate.columnValues)
        ) {
            for (const columnUpdate of columnsToUpdate.columnValues) {
                if (columnUpdate.columnName) {
                    body[columnUpdate.columnName] = columnUpdate.columnValue;
                }
            }
        }
        const databody = JSON.stringify(body);   
        const modifiedEntityLogicalName = this.modifyEntityLogicalName(entityName);     
        const fullApiUrl = `/api/data/v9.2/${modifiedEntityLogicalName}`;
        const headers = {
            "OData-MaxVersion": "4.0",
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json",
            "Prefer": "odata.include-annotations=*",
        };

        try {
            const response = await this.axiosInstance.post(fullApiUrl, databody, { headers });
            return response.data;
        } catch (error: any) {
            throw new Error(
                `Dataverse API error: ${error.response?.status} - ${error.response?.statusText}. Details: ${JSON.stringify(
                    error.response?.data
                )}`
            );
        }       
    }
    
    // API calls using the shared axios instance
    async UpdateData(
        entityName: string,
        recordId: string,
        updateData: IDataObject,
        columnsToUpdate?: IDataObject
    ): Promise<any> {
        await this.ensureAuthenticated();
        if (!this.axiosInstance) throw new Error('Axios instance not available');
    
        // Start with the updateData payload (if provided)
        let body: IDataObject = {};
        if (updateData && Object.keys(updateData).length > 0) {
            body = { ...updateData };
        }
    
        // Merge in columns from columnsToUpdate (if provided)
        // Expected format: { columnValues: [ { columnName: string, columnValue: string }, ... ] }
        if (
            columnsToUpdate &&
            columnsToUpdate.columnValues &&
            Array.isArray(columnsToUpdate.columnValues)
        ) {
            for (const columnUpdate of columnsToUpdate.columnValues) {
                if (columnUpdate.columnName) {
                    body[columnUpdate.columnName] = columnUpdate.columnValue;
                }
            }
        }
        const databody = JSON.stringify(body);   
        const modifiedEntityLogicalName = this.modifyEntityLogicalName(entityName);     
        const fullApiUrl = `/api/data/v9.2/${modifiedEntityLogicalName}(${recordId})`;
        const headers = {
            "OData-MaxVersion": "4.0",
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json",
            "Prefer": "odata.include-annotations=*",
        };

        try {
            const response = await this.axiosInstance.patch(fullApiUrl, databody, { headers });
            return response.data;
        } catch (error: any) {
            throw new Error(
                `Dataverse API error: ${error.response?.status} - ${error.response?.statusText}. Details: ${JSON.stringify(
                    error.response?.data
                )}`
            );
        }
    }
    

    async ListEntityColumns(entityName: string): Promise<{ columns: any[] }> {
        await this.ensureAuthenticated();
        if (!this.axiosInstance) throw new Error('Axios instance not available');

        const apiUrl = `/api/data/v9.2/EntityDefinitions(LogicalName='${entityName}')/Attributes?$select=LogicalName,DisplayName`;
        try {
            const response = await this.axiosInstance.get(apiUrl);
            const columns = response.data.value.map((attribute: any) => ({
                logicalName: attribute.LogicalName,
                displayName: attribute.DisplayName?.UserLocalizedLabel?.Label || attribute.LogicalName,
            }));
            return { columns };
        } catch (error: any) {
            throw new Error(`Dataverse API error: ${error.response?.status} - ${error.response?.statusText}. Details: ${JSON.stringify(error.response?.data)}`);
        }
    }

    async ListTables(): Promise<{ tables: any[] }> {
        await this.ensureAuthenticated();
        if (!this.axiosInstance) throw new Error('Axios instance not available');

        const apiUrl = `/api/data/v9.2/EntityDefinitions?$select=LogicalName,DisplayName`;
        try {
            const response = await this.axiosInstance.get(apiUrl);
            const entities = response.data.value.map((entity: any) => ({
                logicalName: entity.LogicalName,
                displayName: entity.DisplayName?.UserLocalizedLabel?.Label || entity.LogicalName,
            }));
            return { tables: entities };
        } catch (error: any) {
            throw new Error(`Dataverse API error: ${error.response?.status} - ${error.response?.statusText}. Details: ${JSON.stringify(error.response?.data)}`);
        }
    }

    // For FetchXML queries

    private extractEntityNameFromFetchXml(fetchXml: string): string | null {
        const match = fetchXml.match(/<entity name=['"]([^'"]+)['"]/);
        return match ? match[1] : null;
    }

    public modifyEntityLogicalName(entityLogicalName: string): string {
        if (entityLogicalName.endsWith('y')) {
            // Remove the trailing "y" and add "ies"
            return entityLogicalName.slice(0, -1) + 'ies';
        } else if (entityLogicalName.endsWith('s')) {
            return entityLogicalName + 'es';
        } else {
            return entityLogicalName + 's';
        }
    }

    async GetData(type: string,entityName: string, query: string): Promise<any> {
        await this.ensureAuthenticated();
        if (!this.axiosInstance) throw new Error('Axios instance not available');
        let fullApiUrl = '';

        if (type === "FETCHXML") {
            const entityLogicalName = this.extractEntityNameFromFetchXml(query);
            if (!entityLogicalName) {
                throw new Error("Failed to extract entity name from FetchXML.");
            }
            const modifiedEntityLogicalName = this.modifyEntityLogicalName(entityLogicalName);
            fullApiUrl = `/api/data/v9.2/${modifiedEntityLogicalName}?fetchXml=${encodeURIComponent(query)}`;           
        } else  if (type === "ODATA") {
             fullApiUrl = `/api/data/v9.2/${query}`;   
        } else if (type === "column") {
            const modifiedEntityLogicalName = this.modifyEntityLogicalName(entityName);
            fullApiUrl = `/api/data/v9.2/${modifiedEntityLogicalName}?$select=${query}`;
        } 
        try {
            const response = await this.axiosInstance.get(fullApiUrl, {
                headers: { Prefer: 'odata.include-annotations="*"' },
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Dataverse API error: ${error.response?.status} - ${error.response?.statusText}. Details: ${JSON.stringify(error.response?.data)}`);
        }       
    }

    // ICredentialType Metadata
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
            typeOptions: { password: true },
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
