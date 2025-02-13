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
						name: 'Get Lookup from OptionSet',
                        value: 'optionset',
                        action: 'Retrieve lookup data from OptionSet',
                    },  
                ],
                default: 'GET',
			},	
			//Get
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'FetchXML', value: 'fetchxml' },
					{ name: 'OData', value: 'odata' },
					{
						name: 'Column',
						value: 'column',
						description: 'Manually select and update specific columns',
					},
				],
				default: 'fetchxml',
				displayOptions: {
					show: {
						operation: ['GET'],
					},
				},
				required: true,
				description: 'Select the query type: FetchXML or OData',
			},
			{
				displayName: 'Query',
				name: 'getQuery',
				type: 'string',
				typeOptions: { editor: 'jsEditor' },
				default: '',
				displayOptions: {
					show: {
						operation: ['GET'],
						type: ['odata','fetchxml'],
					},
				},
				description: 'Webapi Query',
				required: true,				
			},	
			//Patch		
			{
				displayName: 'Record Id',
				name: 'recordId',
				type: 'string',				
				default: '',
				displayOptions: {
					show: {
						operation: ['PATCH'],
					},
				},
				required: true,
				description: 'Record Id of the record to update',
			},
			{
				displayName: 'Type',
				name: 'type',
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
						type: ['json'],
					},
				},
				required: true,
				description: 'The JSON object containing fields and values to update',
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
						operation: ['PATCH',"GET"],
						type: ['column'],
					},
					
				},
				required: true,
				description: 'Select the Dataverse entity (e.g., contacts, accounts)',
			},			
			{
				displayName: 'Columns',
				name: 'column',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				displayOptions: {
					show: {
						operation: ['PATCH'],
						type: ['column'],
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
			{
				displayName: 'Columns',
				name: 'columnget',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				displayOptions: {
					show: {
						operation: ["GET"],
						type: ['column'],
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
							}							
						],
					},
				],
			},
			//optionset
			{
				displayName: 'Entity Name',
				name: 'entityNameoptionset',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getEntityList',
				},
				default: '',
				displayOptions: {
					show: {
						operation: ["optionset"]				
					},
				},
				required: true,
				description: 'Select the Dataverse entity (e.g., contacts, accounts)',
			},		
			{
				displayName: 'Attribute Name',
				name: 'attributeName',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['optionset'],
					},
				},
				description: 'Enter the attribute name for the OptionSet',
			},
		],
	};

	methods = {
	loadOptions: {
		async getEntityList(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
			// Use cached data if available
			const cachedTables = dataverseAuth.getCachedTables();
			if (cachedTables) {
				return cachedTables;
			}
			const credentials = await this.getCredentials('dataverseAuth');
			const auth = new dataverseAuth();
			await auth.authenticate(credentials, { url: '' });
			const tablesResponse = await auth.ListTables();
			const options = tablesResponse.tables.map((table: { logicalName: string, displayName: string }) => ({
				name: `${table.displayName} - (${table.logicalName})`,
				value: table.logicalName,
			}));
			dataverseAuth.setCachedTables(options);
			return options;
		},

		async getEntityColumns(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
			const entityName = this.getCurrentNodeParameter('entityName') as string;
			if (!entityName) return [];
			// Return cached columns if available
			const cachedColumns = dataverseAuth.getCachedEntityColumns(entityName);
			if (cachedColumns) {
				return cachedColumns;
			}
			const credentials = await this.getCredentials('dataverseAuth');
			const auth = new dataverseAuth();
			await auth.authenticate(credentials, { url: '' });
			const columnsResponse = await auth.ListEntityColumns(entityName);
			const options = columnsResponse.columns.map((col: { logicalName: string, displayName: string }) => ({
				name: `${col.displayName} - (${col.logicalName})`,
				value: col.logicalName,
			}));
			dataverseAuth.setCachedEntityColumns(entityName, options);
			return options;
		},
	},
};

	// The rest of your execute function remains as it is
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		debugger;
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0);
		const credentials = await this.getCredentials('dataverseAuth');
		const auth = new dataverseAuth();
		await auth.authenticate(credentials, { url: '' });

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				
				let type :string | '';
				let columnsData: IDataObject | undefined;
				let query: string | undefined;
				let entityName: string = '';

				if (operation === 'GET') {

					type = this.getNodeParameter('type', itemIndex) as string;	
					if (type === 'odata' || type === 'fetchxml') {
						query = this.getNodeParameter('getQuery', itemIndex) as string;

						// Use the raw JSON data provided
					} else if (type === 'column') {
						debugger;
						entityName = this.getNodeParameter('entityName', itemIndex) as string;
						columnsData = this.getNodeParameter('columnget', itemIndex) as IDataObject;
						if (columnsData?.columnValues) {
							if (Array.isArray(columnsData.columnValues)) {
								query = columnsData.columnValues.map( (col) => `${col.columnName} `).join(',');
							} else {
								throw new Error('Column values are not in the expected format');
							}
						} else {
							throw new Error('Column values are missing');
						}
						
					}

					const data = await auth.GetData(type,entityName, query || '');
					returnData.push({
						json: data as IDataObject,
						pairedItem: itemIndex,
					});
					

				} else if (operation === 'PATCH') {
					const entityName = this.getNodeParameter('entityName', itemIndex) as string;
					const recordId = this.getNodeParameter('recordId', itemIndex) as string;
					type = this.getNodeParameter('type', itemIndex) as string;	

					// Initialize payload parts
					let jsonData: IDataObject = {};
				
					if (type === 'json') {
						// Use the raw JSON data provided
						jsonData = this.getNodeParameter('updateData', itemIndex) as IDataObject;
					} else if (type === 'column') {
						// Use the fixed collection of columns
						columnsData = this.getNodeParameter('columns', itemIndex) as IDataObject;
					}
				
					// Pass both payloads to the UpdateData function; the function will merge them
					const updateResponse = await auth.UpdateData(entityName, recordId, jsonData, columnsData);
					returnData.push({
						json: updateResponse as IDataObject,
						pairedItem: itemIndex,
					});
				}
				else if (operation === 'optionset') {
					debugger;		
					const entityNameoptionset = this.getNodeParameter('entityNameoptionset', itemIndex) as string;			
					const attributeName = this.getNodeParameter('attributeName', itemIndex) as string;
					
					query = `EntityDefinitions(LogicalName='${entityNameoptionset}')/Attributes(LogicalName='${attributeName}')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName,DisplayName&$expand=OptionSet($select=Options)`;
					console.log(query);
					const data = await auth.GetData('odata', '', query);
					
					let output: IDataObject;
					if (data.OptionSet && data.OptionSet.Options) {
						const options = data.OptionSet.Options.map((entry: any) => ({
							Id: entry.Value,
							Name: entry.Label.LocalizedLabels[0].Label,
						}));
						output = { options };
					} else if (data.value && data.value.length > 0 && data.value[0].OptionSet && data.value[0].OptionSet.Options) {
						const options = data.value[0].OptionSet.Options.map((entry: any) => ({
							Id: entry.Value,
							Name: entry.Label.LocalizedLabels[0].Label,
						}));
						output = { options };
					} else {
						output = data;
					}
					
					returnData.push({
						json: output,
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
