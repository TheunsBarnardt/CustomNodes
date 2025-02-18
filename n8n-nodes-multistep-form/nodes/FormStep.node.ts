// FormStep.node.ts
import { IExecuteFunctions, INodeExecutionData, INodeType,   NodeApiError} from 'n8n-workflow';
import { formStepDescription } from './FormStep.node.description';

export class FormStep implements INodeType {
  description = formStepDescription;
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    try {
      console.log("*input data*");
      const inputData = this.getInputData();
      console.log(JSON.stringify(inputData, null, 2));

      console.log("*step name*");
      const stepName = this.getNodeParameter("stepName", 0) as string;
      console.log(stepName);

      console.log("*step data*");
      const stepInputs = this.getNodeParameter("stepInputs", 0) as {
        stepInput: { name: string; label: string; required: boolean; type: string }[];
      };
      console.log(JSON.stringify(stepInputs, null, 2));

      // Extract existing form data from inputData
      const existingForm = inputData[0]?.json || { name: "Default Form", steps: [] };

      // Ensure form name is retrieved dynamically
      const formName = existingForm.name || "Default Form";

      // Ensure steps is always an array
      const existingSteps = Array.isArray(existingForm.steps) ? existingForm.steps : [];

      // Construct the updated form structure
      const updatedForm = {
        name: formName, // Preserve form name dynamically
        steps: [
          ...existingSteps, // Keep previous steps
          {
            name: stepName,
            fields: stepInputs.stepInput, // Add new inputs
          },
        ],
      };

      console.log("*updated form*");
      console.log(JSON.stringify(updatedForm, null, 2));
      return [[{ json: updatedForm }]] ;

     // return { json: { form: { ...formData.form, steps: currentSteps } }, noWebhookResponse: true } as IWebhookResponseData;
    } catch (error) {
      throw new NodeApiError(this.getNode(), error);
    }
  }
}