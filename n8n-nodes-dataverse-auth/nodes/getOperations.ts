import { OperationType } from "./operationType";
import { Operation } from "./operation";
import { INodeProperties } from "n8n-workflow";

export const getOperations : INodeProperties[] =[
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
];
