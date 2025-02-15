import { INodeProperties } from "n8n-workflow";
import { Properties } from "./properties";
import { Operation } from "./operation";


export const optionsetOperations : INodeProperties[] =[
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
]
