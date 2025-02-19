import { INodeType, IWebhookFunctions } from "n8n-workflow";
import { formTriggerDescription } from "./CustomFormTrigger.node.description";
import { formWebhook } from "./utils";


export class FormTrigger implements INodeType {
  description = formTriggerDescription;
 

	async webhook(this: IWebhookFunctions) {
		return await formWebhook(this);
	}
}