import { INodeProperties } from "n8n-workflow";
import { Operation } from "./operation";


export const postOperations : INodeProperties[] =[
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
]