import { INodePropertyOptions, INodeTypeDescription, NodeConnectionType } from "n8n-workflow";
import { formDescription, formFields, formRespondMode, formTitle, formTriggerPanel, webhookPath } from "./common.descriptions";

export const formTriggerDescription: INodeTypeDescription = {
  displayName: 'Multistep Form Trigger',
  name: 'formTrigger',
  icon: 'file:./resources/n8n_custom_forms_icon.svg',
  group: ['trigger'],
  version: 1.0,
  description: 'Trigger node for creating dynamic multi-step forms',
  defaults: {
    name: 'Multistep Form Trigger',
  },
  inputs: [],
  outputs: [NodeConnectionType.Main],
  webhooks: [
		{
			name: 'setup',
			httpMethod: 'GET',
			responseMode: 'onReceived',
			isFullPath: true,
			path: '={{ $parameter["path"] || $parameter["options"]?.path || $webhookId }}',
			ndvHideUrl: true,
			isForm: true,
		},
		{
			name: 'default',
			httpMethod: 'POST',
			responseMode: '={{$parameter["responseMode"]}}',
			responseData: '={{$parameter["responseMode"] === "lastNode" ? "noData" : undefined}}',
			isFullPath: true,
			path: '={{ $parameter["path"] || $parameter["options"]?.path || $webhookId }}',
			ndvHideMethod: true,
			isForm: true,
		},
	],
  eventTriggerDescription: 'Waiting for you to submit the form',
	activationMessage: 'You can now make calls to your production Form URL.',
	triggerPanel: formTriggerPanel,
  properties: [
    {
      displayName: 'Form Name',
      name: 'formName',
      type: 'string',
      default: 'My Form',
      description: 'The name of the form',
    },
    { ...webhookPath },
		formTitle,
		formDescription,
		formFields,		
		{
			...formRespondMode,
			options: (formRespondMode.options as INodePropertyOptions[])?.filter(
				(option) => option.value !== 'responseNode',
			),		
		},   
  ],
};
