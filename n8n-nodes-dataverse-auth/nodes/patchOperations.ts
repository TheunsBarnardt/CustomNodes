import { INodeProperties } from "n8n-workflow";
import { Properties } from "./properties";
import { Operation } from "./operation";


export const patchOperations : INodeProperties[] =[
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
        operation: [Operation.PATCH, Operation.POST],
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
];