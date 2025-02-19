import { INodeType, IWebhookFunctions } from "n8n-workflow";
import { CustomFormTriggerDescription } from "./CustomFormTrigger.node.description";
import { formWebhook } from "./utils";


export class CustomFormTrigger implements INodeType {
  description = CustomFormTriggerDescription;
 

	async webhook(this: IWebhookFunctions) {
		return await formWebhook(this);
	}
}