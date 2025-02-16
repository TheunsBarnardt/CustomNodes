import { INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';

export const MultistepFormTriggerDescription: INodeTypeDescription = {
  displayName: 'Multistep Form Trigger',
  name: 'multistepFormTrigger',
  icon: 'fa:form',
  group: ['trigger'],
  version: 1,
  description: 'Triggers a workflow when a multistep form is submitted',
  defaults: {
    name: 'Multistep Form Trigger',
  },
  inputs: [],
  outputs: ['main' as NodeConnectionType],
  webhooks: [
    {
      name: 'default',
      httpMethod: 'GET',
      path: 'form',
      isUrlAutoGenerated: true,
      isForm: true,
    },
    {
      name: 'default',
      httpMethod: 'POST',
      path: 'form',
      isUrlAutoGenerated: true,
    },
  ],
  properties: [
    {
      displayName: 'Webhook URL',
      name: 'webhookUrl',
      type: 'notice',
      default: 'This will be automatically generated when the workflow is active',
    },
    {
      displayName: 'Form Title',
      name: 'formTitle',
      type: 'string',
      default: 'Multistep Form',
      description: 'The title of the form',
    },
    {
      displayName: 'Steps',
      name: 'steps',
      type: 'fixedCollection',
      typeOptions: {
        multipleValues: true,
      },
      default: {},
      options: [
        {
          name: 'step',
          displayName: 'Step',
          values: [
            {
              displayName: 'Step Name',
              name: 'stepName',
              type: 'string',
              default: '',
              description: 'Name of the step',
            },
            {
              displayName: 'Fields',
              name: 'fields',
              type: 'fixedCollection',
              typeOptions: {
                multipleValues: true,
              },
              default: {},
              options: [
                {
                  name: 'field',
                  displayName: 'Field',
                  values: [
                    {
                      displayName: 'Field Label',
                      name: 'fieldLabel',
                      type: 'string',
                      default: '',
                      description: 'Label for the field',
                    },
                    {
                      displayName: 'Field Type',
                      name: 'fieldType',
                      type: 'options',
                      options: [
                        { name: 'Text', value: 'text' },
                        { name: 'Email', value: 'email' },
                        { name: 'Number', value: 'number' },
                        { name: 'Dropdown', value: 'dropdown' },
                      ],
                      default: 'text',
                      description: 'Type of the field',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};