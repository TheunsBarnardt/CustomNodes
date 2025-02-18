import { INodeTypeDescription, NodeConnectionType } from "n8n-workflow";

export const formFinalizerDescription: INodeTypeDescription = {
  displayName: 'Multistep Form Finalizer',
  name: 'formFinalizer',
  icon: 'file:./resources/n8n_custom_forms_icon.svg',
  group: ['route'],
  version: 1.0,
  description: 'Combine all collected form inputs from previous steps',
  defaults: {
    name: 'Form Finalizer',
  },
  inputs: ['main' as NodeConnectionType],
  outputs: ['main' as NodeConnectionType],
  properties: [],
};