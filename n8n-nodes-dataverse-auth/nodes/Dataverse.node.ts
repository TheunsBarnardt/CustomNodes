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
import { Operation } from "./operation";
import { operationOptions } from "./operationOptions";
import { getOperations } from "./getOperations";
import { patchOperations } from "./patchOperations";
import { postOperations } from "./postOperations";
import { optionsetOperations } from "./optionsetOperations";
import { globaloptionsetOperations } from "./globaloptionsetOperations";
import { entityLookupOperations } from "./entityLookupOperations";
import { Properties } from "./properties";
import { OperationType } from "./operationType";

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
      operationOptions,    
      ...getOperations,
      ...patchOperations,
      ...postOperations,
      ...optionsetOperations,
      ...globaloptionsetOperations,
	    ...entityLookupOperations
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


  

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> 
  {
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

        const entityName = this.getNodeParameter(Properties.ENTITYNAME,itemIndex,"") as string;
        const patch_recordid = this.getNodeParameter(Properties.PATCH_RECORDID,itemIndex,"") as string;
        const patch_data = this.getNodeParameter(Properties.PATCH_DATA,itemIndex,null) as IDataObject;
        const optionset_entityname = this.getNodeParameter(Properties.OPTIONSET_ENTITYNAME,itemIndex,"") as string;
        const optionset_attributename = this.getNodeParameter(Properties.OPTIONSET_ATTRIBUTENAME,itemIndex,"") as string;
        const global_attributeName = this.getNodeParameter(Properties.GLOBAL_ATTRIBUTENAME,itemIndex,"") as string;
        const entityname = this.getNodeParameter(Properties.ENTITYNAME,itemIndex,"") as string;
        const entity_id = this.getNodeParameter(Properties.ENTITY_ID,itemIndex,"") as string;
        const entity_name = this.getNodeParameter(Properties.ENTITY_NAME,itemIndex,"") as string;

        switch (operation) {
          case Operation.GET:
            type = this.getNodeParameter("type", itemIndex) as string;
            ({ query, columnsData } = await handleGetOperation(this,type, query, itemIndex, columnsData, entityName));
            break;
          case Operation.PATCH:
            columnsData = await handlePatchOperation(this,columnsData, itemIndex, entityName, patch_recordid, patch_data);
            break;
          case Operation.POST:
            columnsData = await handlePostOperation(this,columnsData, itemIndex, entityName, patch_data);
            break;
          case Operation.OPTIONSET:
            query = await handleOptionSetOperation(query, optionset_entityname, optionset_attributename, itemIndex);
            break;
          case Operation.GLOBALOPTIONSET:
            query = await handleGlobalOptionSetOperation(query, global_attributeName, itemIndex);
            break;
          case Operation.ENTITY:
            await handleEntityOperation(entityname, entity_id, entity_name, entityName, itemIndex);
            break;
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

    async function handleEntityOperation(entityname: string, entity_id: string, entity_name: string, entityName: string, itemIndex: number) {
      const modifiedEntityLogicalName = auth.modifyEntityLogicalName(entityname);
      const entityquery = `${modifiedEntityLogicalName}?$select=${entity_id},${entity_name}&$orderby=${entity_name} asc`;

      const data = await auth.GetData(
        OperationType.ODATA,
        entityName,
        entityquery || ""
      );

      const mappedOptions = data.value.map((entry: any) => ({
        Id: entry[entity_id],
        Name: entry[entity_name],
      }));
      const result = { options: mappedOptions };

      returnData.push({
        json: result as unknown as IDataObject,
        pairedItem: itemIndex,
      });
    }

    async function handleGlobalOptionSetOperation(query: string | undefined, global_attributeName: string, itemIndex: number) {
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
      else if (data.value &&
        data.value.length > 0 &&
        data.value[0].OptionSet &&
        data.value[0].OptionSet.Options) {
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
      return query;
    }

    async function handleOptionSetOperation(query: string | undefined, optionset_entityname: string, optionset_attributename: string, itemIndex: number) {
      query = `EntityDefinitions(LogicalName='${optionset_entityname}')/Attributes(LogicalName='${optionset_attributename}')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName,DisplayName&$expand=OptionSet($select=Options)`;

      const data = await auth.GetData("ODATA", "", query);

      let output: IDataObject;
      if (data.OptionSet && data.OptionSet.Options) {
        const options = data.OptionSet.Options.map((entry: any) => ({
          Id: entry.Value,
          Name: entry.Label.LocalizedLabels[0].Label,
        }));
        output = { options };
      } else if (data.value &&
        data.value.length > 0 &&
        data.value[0].OptionSet &&
        data.value[0].OptionSet.Options) {
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
      return query;
    }

    async function handlePostOperation(func:IExecuteFunctions,columnsData: IDataObject | undefined, itemIndex: number, entityName: string, patch_data: IDataObject) {
      columnsData = func.getNodeParameter(
        "postcolumn",
        itemIndex,
        ""        
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
      return columnsData;
    }

    async function handlePatchOperation(func:IExecuteFunctions,columnsData: IDataObject | undefined, itemIndex: number, entityName: string, patch_recordid: string, patch_data: IDataObject) {
    debugger;
    
      columnsData = func.getNodeParameter(
        "column",
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
      return columnsData;
    }

    async function handleGetOperation(func:IExecuteFunctions,type: string, query: string | undefined, itemIndex: number, columnsData: IDataObject | undefined, entityName: string) {

     query = func.getNodeParameter("getQuery", itemIndex) as string;

      const data = await auth.GetData(type, entityName, query || "");
      returnData.push({
        json: data as IDataObject,
        pairedItem: itemIndex,
      });
      return { query, columnsData };
    }
  }
}