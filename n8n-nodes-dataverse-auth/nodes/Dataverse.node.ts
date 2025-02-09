
import {
	IDataObject,
	INodeExecutionData,
	INodeType,
    IExecuteFunctions,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';
import { dataverseAuth } from '../credentials/dataverseAuth.credentials';


export class Dataverse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Dataverse Auth',
		name: 'dataverse',
		icon: 'fa:fingerprint',
		group: ['transform'],
		version: 1,
		description: 'JWT',
		subtitle: '={{ $parameter["operation"] }}',
		defaults: {
			name: 'JWT',
		},
		inputs: ['main' as NodeConnectionType],
		outputs: ['main'as NodeConnectionType],
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
                        name: 'GET',
                        value: 'GET',
                        action: 'Retrieve data',
                    },
                    {
                        name: 'POST',
                        value: 'POST',
                        action: 'Create data',
                    },
                    {
                        name: 'PUT',
                        value: 'PUT',
                        action: 'Update data',
                    },
                    {
                        name: 'PATCH',
                        value: 'PATCH',
                        action: 'Partially update data',
                    },
                    {
                        name: 'DELETE',
                        value: 'DELETE',
                        action: 'Delete data',
                    },
                ],
                default: 'GET',
			},			
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Webapi Query',
				required: true,				
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0);
		const credentials = await this.getCredentials('dataverseAuth');		
		const auth = new dataverseAuth();
        await auth.authenticate(credentials, {
			url: ''
		}); // Authenticate using client credentials


		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {				
				if (operation === 'GET') {
					const query = this.getNodeParameter('query', itemIndex) as string;			

					const data = await auth.GetData(query);
					
                    returnData.push({
                        json: data as IDataObject, // Push the actual parsed data
                        pairedItem: itemIndex,
                    });
				}				

			} catch (error) {
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error: error as NodeOperationError, pairedItem: itemIndex });
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
