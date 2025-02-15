import { INodeProperties } from "n8n-workflow";
import { Properties } from "./properties";
import { Operation } from "./operation";


export const globaloptionsetOperations : INodeProperties[] =[
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
]
