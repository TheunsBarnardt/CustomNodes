import { INodeType, IWebhookFunctions } from "n8n-workflow";
import { formTriggerDescription } from "./FormTrigger.node.description";
import { formWebhook } from "./utils";


export class FormTrigger implements INodeType {
  description = formTriggerDescription;
 

	async webhook(this: IWebhookFunctions) {
		return await formWebhook(this);
	}
}