import { INodeProperties } from "n8n-workflow";
import { Operation } from "./operation";

export const operationOptions : INodeProperties = {
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
};