import { INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';

export const CustomFormStepDescription: INodeTypeDescription = {
  displayName: 'Custom Form Step',
  name: 'formStep',
  icon: 'file:./resources/n8n_custom_forms_icon.svg',
  group: ['route'],
  version: 1.0,
  description: 'Add an intermediate step to the form',
  defaults: {
    name: 'Form Step',
  },
  inputs: ['main' as NodeConnectionType],
  outputs: ['main' as NodeConnectionType],
  properties: [
    {
      displayName: 'Step Name',
      name: 'stepName',
      type: 'string',
      default: 'Step 1',
      description: 'The name of the step',
    },
    {
      displayName: 'Form Inputs',
      name: 'stepInputs',
      type: 'fixedCollection',
      typeOptions: {
        multipleValues: true,
      },
      placeholder: 'Add Input',
      default: {},
      options: [
        {
          name: 'stepInput',
          displayName: 'Input',
          values: [
            {
              displayName: 'Name',
              name: 'name',
              type: 'string',
              default: '',
              description: 'The name of the input field',
            },
            {
              displayName: 'Label',
              name: 'label',
              type: 'string',
              default: '',
              description: 'The label for the input field',
            },
            {
              displayName: 'Required',
              name: 'required',
              type: 'boolean',
              default: false,
              description: 'Whether the input field is required',
            },
            {
              displayName: 'Type',
              name: 'type',
              type: 'options',
              options: [
                {
                  name: 'Text',
                  value: 'text',
                  description: 'Text input',
                },
                {
                  name: 'Email',
                  value: 'email',
                  description: 'Email input',
                },
                {
                  name: 'Number',
                  value: 'number',
                  description: 'Number input',
                },
                {
                  name: 'Textarea',
                  value: 'textarea',
                  description: 'Textarea input',
                },
              ],
              default: 'text',
              description: 'The type of the input field',
            },           
          ],
        },
      ],
      description: 'Define the inputs for this step',
    },
  ],
};
