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
				displayName: 'Update Mode',
				name: 'updateMode',
				type: 'options',
				options: [
					{
						name: 'JSON',
						value: 'json',
						description: 'Provide the update data as a JSON object',
					},
					{
						name: 'Column',
						value: 'column',
						description: 'Manually select and update specific columns',
					},
				],
				default: 'json',
				displayOptions: {
					show: {
						operation: ['PATCH'],
					},
				},
				description: 'Choose how to update the record',
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
						updateMode: ['json'],
					},
				},
				required: true,
				description: 'The JSON object containing fields and values to update',
			},			
			{
				displayName: 'Columns to Update',
				name: 'columnsToUpdate',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				displayOptions: {
					show: {
						operation: ['PATCH'],
						updateMode: ['column'],
					},
				},
				options: [
					{
						displayName: 'Column',
						name: 'columnValues',
						values: [
							{
								displayName: 'Column Name',
								name: 'columnName',
								type: 'options',
								typeOptions: {
									loadOptionsMethod: 'getEntityColumns',
								},
								default: '',
								description: 'Select the column to update',
							},
							{
								displayName: 'Column Value',
								name: 'columnValue',
								type: 'string',
								default: '',
								description: 'Enter the value for the selected column',
							},
						],
					},
				],
			},
		],
	};

	// Adjust methods for loadOptions
	methods = {
		loadOptions: {
			async getEntityList(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('dataverseAuth');
				const auth = new dataverseAuth();
				await auth.authenticate(credentials, { url: '' });
	
				const tables = await auth.ListTables();
	
				return tables.tables.map((table: { logicalName: string, displayName: string }) => ({
					name: `${table.displayName} - (${table.logicalName})`,
					value: table.logicalName,
				}));
			},
	
			async getEntityColumns(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const entityName = this.getCurrentNodeParameter('entityName') as string;
				if (!entityName) {
					return [];
				}
	
				const credentials = await this.getCredentials('dataverseAuth');
				const auth = new dataverseAuth();
				await auth.authenticate(credentials, { url: '' });
	
				const columns = await auth.ListEntityColumns(entityName); // Fetch columns for the selected entity
	
				return columns.columns.map((table: { logicalName: string, displayName: string }) => ({
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
