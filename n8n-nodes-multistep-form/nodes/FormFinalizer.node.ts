
// FormFinalizer.node.ts
import { INodeType, IWebhookFunctions, IWebhookResponseData, NodeApiError } from "n8n-workflow";
import { formFinalizerDescription } from "./FormFinalizer.node.description";

export class FormFinalizer implements INodeType {
  description = formFinalizerDescription;

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    debugger;
    const self = this as unknown as FormFinalizer;
    try {
      const req = this.getRequestObject();
      const res = this.getResponseObject();

      const formData = req.body || {};
      const workflowData = formData.form;

      if (!workflowData || !workflowData.steps || workflowData.steps.length === 0) {
        res.status(400).send('No form data found');
        return { noWebhookResponse: true } as IWebhookResponseData;
      }

      const htmlForm = await self.constructHtmlForm(workflowData);

      res.status(200).send(htmlForm);
      return { noWebhookResponse: true } as IWebhookResponseData;
    } catch (error) {
      throw new NodeApiError(this.getNode(), error);
    }
  }

  private constructHtmlForm(workflowData: any): string {
    let formHtml = '<form action="/submit" method="POST">';

    workflowData.steps.forEach((step: any, index: number) => {
      formHtml += `<h2>Step ${index + 1}: ${step.name}</h2>`;
      step.inputs.forEach((input: any) => {
        formHtml += `<label for="${input.name}">${input.label}</label>`;
        formHtml += this.generateInputHtml(input);
        formHtml += '<br>';
      });
    });

    formHtml += '<button type="submit">Submit</button>';
    formHtml += '</form>';
    return formHtml;
  }

  private generateInputHtml(input: any): string {
    switch (input.type) {
      case 'text':
      case 'email':
      case 'number':
        return `<input type="${input.type}" name="${input.name}" ${input.required ? 'required' : ''} />`;
      case 'textarea':
        return `<textarea name="${input.name}" ${input.required ? 'required' : ''}></textarea>`;
      default:
        return '';
    }
  }
}