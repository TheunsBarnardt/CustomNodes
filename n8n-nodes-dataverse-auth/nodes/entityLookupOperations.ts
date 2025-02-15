import { INodeProperties } from "n8n-workflow";
import { Operation } from "./operation";
import { Properties } from "./properties";

export const entityLookupOperations : INodeProperties[] =[
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
]