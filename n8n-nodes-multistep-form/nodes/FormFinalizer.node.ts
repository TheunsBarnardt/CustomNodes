import { IExecuteFunctions, INodeExecutionData, INodeType } from "n8n-workflow";
import { formFinalizerDescription } from "./FormFinalizer.node.description";

export class FormFinalizer implements INodeType {
  description = formFinalizerDescription;

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const inputData = this.getInputData();

    // Access the first item in the inputData array and retrieve 'json' from it
    const formData = inputData[0]?.json || {}; // Default to an empty object if inputData is empty or undefined

    // Ensure formData.steps is an array, otherwise fallback to an empty array
    const steps = Array.isArray(formData.steps) ? formData.steps : [];

    let formHtml = '<form action="/submit" method="POST">';

    // Iterate over the steps if it's an array
    if (steps.length > 0) {
      steps.forEach((step: any, index: number) => {
        formHtml += `<h2>Step ${index + 1}: ${step.name}</h2>`;

        // Ensure each step has a 'fields' array, otherwise fallback to an empty array
        const fields = Array.isArray(step.fields) ? step.fields : [];

        fields.forEach((field: any) => {
          formHtml += `<label for="${field.name}">${field.label}</label>`;
          switch (field.type) {
            case "text":
            case "email":
            case "number":
              formHtml += `<input type="${field.type}" name="${field.name}" ${
                field.required ? "required" : ""
              } />`;
              break;
            case "textarea":
              formHtml += `<textarea name="${field.name}" ${
                field.required ? "required" : ""
              }></textarea>`;
              break;
          }
          formHtml += "<br>";
        });
      });
    }

    formHtml += '<button type="submit">Submit</button>';
    formHtml += "</form>";

    console.log(formHtml);
    // Return the HTML form as Base64 encoded string
    return [
      [
        {
          json: {}, // Keep an empty JSON object (required by n8n)
          binary: {
            data: {
              data: Buffer.from(formHtml, "utf-8").toString("base64"), // Encode HTML as Base64
              mimeType: "text/html",
            },
          },
        },
      ],
    ];
  }
}

/*
  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    debugger;
    const self = this as unknown as FormFinalizer;
    try {
      debugger;
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
    debugger;
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
}*/
