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
} from "n8n-workflow";
import { dataverseAuth } from "../credentials/dataverseAuth.credentials";

export enum Operation {
  GET = "GET",
  PATCH = "PATCH",
  POST = "POST",
  OPTIONSET = "OPTIONSET",
  GLOBALOPTIONSET = "GLOBALOPTIONSET",
  ENTITY = "ENTITY",
}

export enum OperationType {
  FETCHXML = "FETCHXML",
  ODATA = "ODATA",
  COLUMN = "COLUMN",
  JSON = "JSON",
}

enum Properties {
  //GET
  GET_QUERY = "GET_QUERY",
  GET_COLUMN = "GET_COLUMN",
  GET_COLUMNNAME = "GET_COLUMNNAME",
  GET_COLUMNVALUE = "GET_COLUMNVALUE",

  //PATCH
  PATCH_RECORDID = "PATCH_RECORDID",
  PATCH_DATA = "PATCH_DATA",
  PATCH_COLUMNS = "PATCH_COLUMNS",
  PATCH_COLUMN = "PATCH_COLUMN",
  PATCH_COLUMNNAME = "PATCH_COLUMNNAME",
  PATCH_COLUMNVALUE = "PATCH_COLUMNVALUE",

  //GET and PATCH
  ENTITYNAME = "ENTITYNAME",

  OPTIONSET_ENTITYNAME = "OPTIONSET_ENTITYNAME",
  OPTIONSET_ATTRIBUTENAME = "OPTIONSET_ATTRIBUTENAME",

  GLOBAL_ATTRIBUTENAME = "GLOBAL_ATTRIBUTENAME",

  ENTITY_ID = "ENTITY_ID",
  ENTITY_NAME = "ENTITY_NAME",

  TYPE = "TYPE",
  OPERATION = "OPERATION",
}

export class Dataverse implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Dataverse",
    name: "dataverse",
    icon: "file:./resources/Dataverse_scalable.svg",
    group: ["transform"],
    version: 1,
    description: "Seamless integration with the Dynamics 365 Dataverse API",
    subtitle: '={{ $parameter["operation"] }}',
    defaults: {
      name: "Dataverse",
    },
    inputs: ["main" as NodeConnectionType],
    outputs: ["main" as NodeConnectionType],
    credentials: [
      {
        // eslint-disable-next-line n8n-nodes-base/node-class-description-credentials-name-unsuffixed
        name: "dataverseAuth",
        required: true,
      },
    ],
    properties: [
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        options: [
          {
            name: "Get data",
            value: Operation.GET,
            action: "Retrieve data",
          },
          {
            name: "Update record",
            value: Operation.PATCH,
            action: "Update record",
          },
		  {
            name: "Create record",
            value: Operation.POST,
            action: "Create record",
          },
          {
            name: "Get lookup from option set definitions",
            value: Operation.OPTIONSET,
            action: "Retrieve lookup data from OptionSet",
          },
          {
            name: "Get lookup from global option set definitions",
            value: Operation.GLOBALOPTIONSET,
            action: "Retrieve lookup data from GlobalOptionSetDefinitions",
          },
          {
            name: "Get lookup from entity",
            value: Operation.ENTITY,
            action: "Retrieve lookup data from table",
          },
        ],
        default: Operation.GET,
      },
      //Get
      {
        displayName: "Type",
        name: "type",
        type: "options",
        options: [
          { name: "FetchXML", value: OperationType.FETCHXML },
          { name: "OData", value: OperationType.ODATA },        
        ],
        default: OperationType.FETCHXML,
        displayOptions: {
          show: {
            operation: [Operation.GET],
          },
        },
        required: true,
        description: "Select the query type: FetchXML or OData",
      },
      {
        displayName: "Query",
        name: "getQuery",
        type: "string",
        typeOptions: { editor: "jsEditor" },
        default: "",
        displayOptions: {
          show: {
            operation: [Operation.GET],
            type: [OperationType.ODATA, OperationType.FETCHXML],
          },
        },
        description: "Webapi Query",
        required: true,
      },
      //Patch
      {
        displayName: "Record Id",
        name: Properties.PATCH_RECORDID,
        type: "string",
        default: "",
        displayOptions: {
          show: {
            operation: [Operation.PATCH],
          },
        },
        required: true,
        description: "Record Id of the record to update",
      },      
      {
        displayName: "Entity Name",
        name: Properties.ENTITYNAME,
        type: "options",
        typeOptions: {
          loadOptionsMethod: "getEntityList",
        },
        default: "",
        displayOptions: {
          show: {
            operation: [Operation.PATCH, Operation.GET,,Operation.POST],
          },
        },
        required: true,
        description: "Select the Dataverse entity (e.g., contacts, accounts)",
      },
      {
        displayName: "Columns",
        name: "column",
        type: "fixedCollection",
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        displayOptions: {
          show: {
            operation: [Operation.PATCH],
          },
        },
        options: [
          {
            displayName: "Column",
            name: "columnValues",
            values: [
              {
                displayName: "Column Name",
                name: "columnName",
                type: "options",
                typeOptions: {
                  loadOptionsMethod: "getEntityColumns",
                },
                default: "",
                description: "Select the column to update",
              },
              {
                displayName: "Column Value",
                name: "columnValue",
                type: "string",
                default: "",
                description: "Enter the value for the selected column",
              },
            ],
          },
        ],
      },
	  {
        displayName: "Columns",
        name: "postcolumn",
        type: "fixedCollection",
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        displayOptions: {
          show: {
            operation: [Operation.POST]
          },
        },
        options: [
          {
            displayName: "Column",
            name: "columnValues",
            values: [
              {
                displayName: "Column Name",
                name: "columnName",
                type: "options",
                typeOptions: {
                  loadOptionsMethod: "getEntityColumns",
                },
                default: "",
                description: "Select the column to update",
              },
              {
                displayName: "Column Value",
                name: "columnValue",
                type: "string",
                default: "",
                description: "Enter the value for the selected column",
              },
            ],
          },
        ],
      },
      {
        displayName: "Columns",
        name: "columnget",
        type: "fixedCollection",
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        displayOptions: {
          show: {
            operation: [Operation.GET],
            type: [OperationType.COLUMN],
          },
        },
        options: [
          {
            displayName: "Column",
            name: "columnValues",
            values: [
              {
                displayName: "Column Name",
                name: "columnName",
                type: "options",
                typeOptions: {
                  loadOptionsMethod: "getEntityColumns",
                },
                default: "",
                description: "Select the column to update",
              },
            ],
          },
        ],
      },
	  
      //optionset
      {
        displayName: "Entity Name",
        name: Properties.OPTIONSET_ENTITYNAME,
        type: "options",
        typeOptions: {
          loadOptionsMethod: "getEntityList",
        },
        default: "",
        displayOptions: {
          show: {
            operation: [Operation.OPTIONSET],
          },
        },
        required: true,
        description: "Select the Dataverse entity (e.g., contacts, accounts)",
      },
      {
        displayName: "Attribute Name",
        name: Properties.OPTIONSET_ATTRIBUTENAME,
        type: "string",
        default: "",
        displayOptions: {
          show: {
            operation: [Operation.OPTIONSET],
          },
        },
        description: "Enter the attribute name for the OptionSet",
      },
      {
        displayName: "Attribute Name",
        name: Properties.GLOBAL_ATTRIBUTENAME,
        type: "string",
        default: "",
        displayOptions: {
          show: {
            operation: [Operation.GLOBALOPTIONSET],
          },
        },
        description: "Enter the attribute name for the OptionSet",
      },
      //entity lookup
      {
        displayName: "Entity Name",
        name: Properties.ENTITYNAME,
        type: "options",
        typeOptions: {
          loadOptionsMethod: "getEntityList",
        },
        default: "",
        displayOptions: {
          show: {
            operation: [Operation.ENTITY],
          },
        },
        required: true,
        description: "Select the Dataverse entity (e.g., contacts, accounts)",
      },
      {
        displayName: "Id column",
        name: Properties.ENTITY_ID,
        type: "options",
        typeOptions: {
          loadOptionsMethod: "getEntityColumns",
          loadOptionsDependsOn: [Properties.ENTITYNAME],
        },
        displayOptions: {
          show: {
            operation: [Operation.ENTITY],
          },
        },
        required: true,
        default: "",
        description: "Select the column that contains the id",
      },
      {
        displayName: "Name column",
        name: Properties.ENTITY_NAME,
        type: "options",
        typeOptions: {
          loadOptionsMethod: "getEntityColumns",
          loadOptionsDependsOn: [Properties.ENTITYNAME],
        },
        displayOptions: {
          show: {
            operation: [Operation.ENTITY],
          },
        },
        required: true,
        default: "",
        description: "Select the column that contains the name",
      },
    ],
  };

  methods = {
    loadOptions: {
      async getEntityList(
        this: ILoadOptionsFunctions
      ): Promise<INodePropertyOptions[]> {
        // Use cached data if available
        const cachedTables = dataverseAuth.getCachedTables();
        if (cachedTables) {
          return cachedTables;
        }
        const credentials = await this.getCredentials("dataverseAuth");
        const auth = new dataverseAuth();
        await auth.authenticate(credentials, { url: "" });
        const tablesResponse = await auth.ListTables();
        const options = tablesResponse.tables.map(
          (table: { logicalName: string; displayName: string }) => ({
            name: `${table.displayName} - (${table.logicalName})`,
            value: table.logicalName,
          })
        );
        dataverseAuth.setCachedTables(options);
        return options;
      },

      async getEntityColumns(
        this: ILoadOptionsFunctions
      ): Promise<INodePropertyOptions[]> {

        const entityName = this.getCurrentNodeParameter(
          Properties.ENTITYNAME
        ) as string;
        if (!entityName) return [];
        // Return cached columns if available
        const cachedColumns = dataverseAuth.getCachedEntityColumns(entityName);
        if (cachedColumns) {
          return cachedColumns;
        }
        const credentials = await this.getCredentials("dataverseAuth");
        const auth = new dataverseAuth();
        await auth.authenticate(credentials, { url: "" });
        const columnsResponse = await auth.ListEntityColumns(entityName);
        const options = columnsResponse.columns.map(
          (col: { logicalName: string; displayName: string }) => ({
            name: `${col.displayName} - (${col.logicalName})`,
            value: col.logicalName,
          })
        );
        dataverseAuth.setCachedEntityColumns(entityName, options);
        return options;
      },
    },
  };

  // The rest of your execute function remains as it is
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const credentials = await this.getCredentials("dataverseAuth");
    const auth = new dataverseAuth();
    const operation = this.getNodeParameter("operation", 0);

    await auth.authenticate(credentials, { url: "" });

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        let type: string | "";
        let columnsData: IDataObject | undefined;
        let query: string | undefined;

        const entityName = this.getNodeParameter(
          Properties.ENTITYNAME,
          itemIndex,
          ""
        ) as string;

        /* 
		  const get_column = this.getNodeParameter(
			Properties.GET_COLUMN,
			itemIndex,
			null
		  ) as IDataObject;
 */
        const patch_recordid = this.getNodeParameter(
          Properties.PATCH_RECORDID,
          itemIndex,
          ""
        ) as string;

        /*
		  const patch_columns = this.getNodeParameter(
			Properties.PATCH_COLUMNS,
			itemIndex,
			null
		  ) as IDataObject;*/
        const patch_data = this.getNodeParameter(
          Properties.PATCH_DATA,
          itemIndex,
          null
        ) as IDataObject;



        const optionset_entityname = this.getNodeParameter(
          Properties.OPTIONSET_ENTITYNAME,
          itemIndex,
          ""
        ) as string;

        const optionset_attributename = this.getNodeParameter(
          Properties.OPTIONSET_ATTRIBUTENAME,
          itemIndex,
          ""
        ) as string;

        const global_attributeName = this.getNodeParameter(
          Properties.GLOBAL_ATTRIBUTENAME,
          itemIndex,
          ""
        ) as string;

        const entityname = this.getNodeParameter(
          Properties.ENTITYNAME,
          itemIndex,
          ""
        ) as string;

        const entity_id = this.getNodeParameter(
          Properties.ENTITY_ID,
          itemIndex,
          ""
        ) as string;

        const entity_name = this.getNodeParameter(
          Properties.ENTITY_NAME,
          itemIndex,
          ""
        ) as string;

        if (operation === Operation.GET) {
          type = this.getNodeParameter("type", itemIndex) as string;
          if (type === OperationType.ODATA || type === OperationType.FETCHXML) {
            query = this.getNodeParameter("getQuery", itemIndex) as string;

            // Use the raw JSON data provided
          } else if (type === OperationType.COLUMN) {
            columnsData = this.getNodeParameter(
              "columnget",
              itemIndex
            ) as IDataObject;
            if (columnsData?.columnValues) {
              if (Array.isArray(columnsData.columnValues)) {
                query = columnsData.columnValues
                  .map((col) => `${col.columnName} `)
                  .join(",");
              } else {
                throw new Error("Column values are not in the expected format");
              }
            } else {
              throw new Error("Column values are missing");
            }
          }

          const data = await auth.GetData(type, entityName, query || "");
          returnData.push({
            json: data as IDataObject,
            pairedItem: itemIndex,
          });
        } else if (operation === Operation.PATCH) {
          
            // Use the fixed collection of columns
            columnsData = this.getNodeParameter(
              "columns",
              itemIndex
            ) as IDataObject;
         

          // Pass both payloads to the UpdateData function; the function will merge them
          const updateResponse = await auth.UpdateData(
            entityName,
            patch_recordid,
            patch_data,
            columnsData
          );
          returnData.push({
            json: updateResponse as IDataObject,
            pairedItem: itemIndex,
          });
        }
		else if (operation === Operation.POST) {
		
			  // Use the fixed collection of columns
			  columnsData = this.getNodeParameter(
				"postcolumn",
				itemIndex
			  ) as IDataObject;
			
  
			// Pass both payloads to the UpdateData function; the function will merge them
			const updateResponse = await auth.CreateData(
			  entityName,
			  patch_data,
			  columnsData
			);
			returnData.push({
			  json: updateResponse as IDataObject,
			  pairedItem: itemIndex,
			});
		  }  
		else if (operation === Operation.OPTIONSET) {
          query = `EntityDefinitions(LogicalName='${optionset_entityname}')/Attributes(LogicalName='${optionset_attributename}')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName,DisplayName&$expand=OptionSet($select=Options)`;

          const data = await auth.GetData("ODATA", "", query);

          let output: IDataObject;
          if (data.OptionSet && data.OptionSet.Options) {
            const options = data.OptionSet.Options.map((entry: any) => ({
              Id: entry.Value,
              Name: entry.Label.LocalizedLabels[0].Label,
            }));
            output = { options };
          } else if (
            data.value &&
            data.value.length > 0 &&
            data.value[0].OptionSet &&
            data.value[0].OptionSet.Options
          ) {
            const options = data.value[0].OptionSet.Options.map(
              (entry: any) => ({
                Id: entry.Value,
                Name: entry.Label.LocalizedLabels[0].Label,
              })
            );
            output = { options };
          } else {
            output = data;
          }

          returnData.push({
            json: output,
            pairedItem: itemIndex,
          });
        } else if (operation === Operation.GLOBALOPTIONSET) {
          query = `GlobalOptionSetDefinitions(Name='${global_attributeName}')`;

          const data = await auth.GetData("ODATA", "", query);

          let output: IDataObject;

          // First, check if options are directly available in the response
          if (data.Options && Array.isArray(data.Options)) {
            const options = data.Options.map((entry: any) => ({
              Id: entry.Value,
              Name: entry.Label.LocalizedLabels[0].Label,
            }));
            output = { options };
          }
          // Otherwise, if they are nested under OptionSet.Options
          else if (data.OptionSet && data.OptionSet.Options) {
            const options = data.OptionSet.Options.map((entry: any) => ({
              Id: entry.Value,
              Name: entry.Label.LocalizedLabels[0].Label,
            }));
            output = { options };
          }
          // Sometimes the response is wrapped inside a value array
          else if (
            data.value &&
            data.value.length > 0 &&
            data.value[0].OptionSet &&
            data.value[0].OptionSet.Options
          ) {
            const options = data.value[0].OptionSet.Options.map(
              (entry: any) => ({
                Id: entry.Value,
                Name: entry.Label.LocalizedLabels[0].Label,
              })
            );
            output = { options };
          } else {
            output = data;
          }

          returnData.push({
            json: output,
            pairedItem: itemIndex,
          });
        } else if (operation === Operation.ENTITY) {
          const modifiedEntityLogicalName =
            auth.modifyEntityLogicalName(entityname);
          const entityquery = `${modifiedEntityLogicalName}?$select=${entity_id},${entity_name}&$orderby=${entity_name} asc`;

          const data = await auth.GetData(
            OperationType.ODATA,
            entityName,
            entityquery || ""
          );

		  const mappedOptions  = data.value.map((entry: any) => ({			
			  Id: entry[entity_id],
			  Name: entry[entity_name],		
		  }));
		  const result = { options: mappedOptions };
		  
          returnData.push({
            json: result as unknown as IDataObject,
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
