import {
	IDataObject,
	INodeExecutionData,
	INodeType,
    IExecuteFunctions,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
	ILoadOptionsFunctions,
	INodePropertyOptions,
} from 'n8n-workflow';
import { dataverseAuth } from '../credentials/dataverseAuth.credentials';

export class Dataverse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Dataverse',
		name: 'dataverse',
		icon: 'file:./resources/Dataverse_scalable.svg',
		group: ['transform'],
		version: 1,
		description: 'Dataverse',
		subtitle: '={{ $parameter["operation"] }}',
		defaults: {
			name: 'Dataverse',
		},
		inputs: ['main' as NodeConnectionType],
		outputs: ['main' as NodeConnectionType],
		credentials: [
			{
				// eslint-disable-next-line n8n-nodes-base/node-class-description-credentials-name-unsuffixed
				name: 'dataverseAuth',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
                    {
                        name: 'Get Data',
                        value: 'GET',
                        action: 'Retrieve data',
                    },                  
                    {
                        name: 'Update Record',
                        value: 'PATCH',
                        action: 'Update record',
                    },
                    {
                        name: 'Delete Record',
                        value: 'DELETE',
                        action: 'Delete record',
                    },
                ],
                default: 'GET',
			},			
			{
				displayName: 'FetchXML Query',
				name: 'fetchXML',
				type: 'string',
				typeOptions: { editor: 'jsEditor' },
				default: '',
				displayOptions: {
					show: {
						operation: ['GET'],
					},
				},
				description: 'Webapi Query',
				required: true,				
			},
			{
				displayName: 'Entity Name',
				name: 'entityName',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getEntityList',
				},
				default: '',
				displayOptions: {
					show: {
						operation: ['PATCH'],
					},
				},
				required: true,
				description: 'Select the Dataverse entity (e.g., contacts, accounts)',
			},
			{
				displayName: 'Record ID',
				name: 'recordId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['PATCH'],
					},
				},
				required: true,
				description: 'The unique identifier (GUID) of the record to update',
			},
			{
				displayName: 'Json Data',
				name: 'updateData',
				type: 'json',
				typeOptions: {
					alwaysOpenEditWindow: true,
				},
				default: '{}',
				displayOptions: {
					show: {
						operation: ['PATCH'],
					},
				},
				required: true,
				description: 'The JSON object containing fields and values to update',
			},
		],
	};

	// Adjust methods for loadOptions
	methods = {
		loadOptions: {
			async getEntityList(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('dataverseAuth');
				const auth = new dataverseAuth();
				await auth.authenticate(credentials, { url: '' }); // Authenticate

				const tables = await auth.ListTables(); // Assuming this method returns the list of tables

				// Convert tables to dropdown options
				return tables.tables.map((table: { logicalName: string, displayName: string }) => ({
					name: `${table.displayName} - (${table.logicalName})`,
					value: table.logicalName,
				}));
			},
		},
	};

	// The rest of your execute function remains as it is
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0);
		const credentials = await this.getCredentials('dataverseAuth');
		const auth = new dataverseAuth();
		await auth.authenticate(credentials, { url: '' });

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const query = this.getNodeParameter('fetchXML', itemIndex) as string;

				if (operation === 'GET') {
					const data = await auth.GetData(query);
					returnData.push({
						json: data as IDataObject,
						pairedItem: itemIndex,
					});
				} else if (operation === 'PATCH') {
					const entityName = this.getNodeParameter('entityName', itemIndex) as string;
					const recordId = this.getNodeParameter('recordId', itemIndex) as string;
					const updateData = this.getNodeParameter('updateData', itemIndex) as IDataObject;

					const updateResponse = await auth.UpdateData(entityName, recordId, updateData);
					returnData.push({
						json: updateResponse as IDataObject,
						pairedItem: itemIndex,
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					items.push({
						json: this.getInputData(itemIndex)[0].json,
						error: error as NodeOperationError,
						pairedItem: itemIndex,
					});
				} else {
					if ((error as NodeOperationError).context) {
						(error as NodeOperationError).context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error as Error, {
						itemIndex,
					});
				}
			}
		}
		return this.prepareOutputData(returnData);
	}
}
