import { INodeType, IWebhookFunctions, IWebhookResponseData, NodeApiError } from "n8n-workflow";
import { formTriggerDescription } from "./FormTrigger.node.description";

export class FormTrigger implements INodeType {
  description = formTriggerDescription;

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    try {
      const formName = this.getNodeParameter("formName") as string;
      const formInputsParam = this.getNodeParameter("formInputs", {}) as {
        formInput: {
          formInputName: string;
          formInputLabel: string;
          formInputType: string;
          formInputRequired: boolean;
        }[];
      };

      // Ensure formInputsParam.formInput is an array before mapping
      const inputsArray = Array.isArray(formInputsParam.formInput) ? formInputsParam.formInput : [];

      const form = {       
          name: formName,
          steps: [
            {
              name: "Step 1",
              fields: inputsArray.map(input => ({
                name: input.formInputName,
                label: input.formInputLabel,
                type: input.formInputType,
                required: input.formInputRequired
              }))
            }
          ]
      };
      console.log(JSON.stringify(form, null, 2));
      return { form } as IWebhookResponseData;
    } catch (error) {
      throw new NodeApiError(this.getNode(), error);
    }
  }
}