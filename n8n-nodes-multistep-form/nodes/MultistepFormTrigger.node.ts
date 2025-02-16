import { 
  IWebhookFunctions, 
  IWebhookResponseData,
  NodeApiError,
} from 'n8n-workflow';
import { MultistepFormTriggerDescription } from './MultistepFormTrigger.description';
import { z } from 'zod';

export class MultistepFormTrigger {
  description = MultistepFormTriggerDescription;

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    try {
      const req = this.getRequestObject();
      const res = this.getResponseObject();
      const formTitle = this.getNodeParameter('formTitle', '') as string;
      const steps = this.getNodeParameter('steps', {}) as any;
      const webhookUrl = this.getNodeWebhookUrl('default') || '';

      if (req.method === 'GET') {
        const formHtml = MultistepFormTrigger.generateFormHtml(formTitle, steps, webhookUrl);
        res.setHeader('Content-Type', 'text/html');
        res.send(formHtml);
        return { noWebhookResponse: true };
      }

      if (req.method === 'POST') {
        console.log("Received request body:", req.body); // Debugging log
      
        const formData = req.body.formData; // Extract the actual form data
      
        // Updated schema to match the received structure
        const FormSchema = z.record(z.union([z.string(), z.array(z.string()), z.number()]));
      
        const validation = FormSchema.safeParse(formData);
        if (!validation.success) {
          console.error("Validation error:", validation.error.errors);
          res.status(400).json({ error: 'Invalid form data!', details: validation.error.errors });
          return { noWebhookResponse: true };
        }
      
        const workflowData = [{
          json: {
            formData,
            timestamp: new Date().toISOString(),
            webhookUrl,
          },
        }];
      
        res.status(200).json({ message: 'Form submitted successfully!', data: formData });
      
        return {
          workflowData: [workflowData],
          noWebhookResponse: true,
        };
      }
      

      res.status(405).send('Method Not Allowed');
      return { noWebhookResponse: true };
    } catch (error) {
      throw new NodeApiError(this.getNode(), error);
    }
  }

  private static generateFormHtml(formTitle: string, steps: any, webhookUrl: string): string {
    let html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${formTitle}</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-100 flex items-center justify-center min-h-screen">
        <div class="w-full max-w-lg bg-white shadow-lg rounded-lg p-6">
          <h1 class="text-2xl font-semibold text-center mb-4">${formTitle}</h1>
          <form id="multistepForm">
    `;

    const stepsArray = steps.step;

    stepsArray.forEach((step: { fields: { field: any[] }; stepName: any }, index: number) => {
      const isActive = index === 0 ? 'block' : 'hidden';
      const stepName = step.stepName || `Step ${index + 1}`;
      html += `<div class="step ${isActive}" data-step="${step.stepName}">
                <h2 class="text-lg font-bold mb-2">${stepName}</h2>`;

      step.fields.field.forEach((field: { fieldLabel: any; fieldType: any }) => {
        html += `
          <label class="block text-sm font-medium text-gray-700">${field.fieldLabel}</label>
          <input type="${field.fieldType}" name="${field.fieldLabel}" required
            class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
          <br>
        `;
      });
      html += `</div>`;
    });

    html += `
      <div class="flex justify-between mt-4">
        <button type="button" id="prevBtn" class="bg-gray-400 text-white px-4 py-2 rounded" disabled>Previous</button>
        <button type="button" id="nextBtn" class="bg-blue-500 text-white px-4 py-2 rounded">Next</button>
        <button type="submit" id="submitBtn" class="bg-green-500 text-white px-4 py-2 rounded hidden">Submit</button>
      </div>
      </form>
      <script>
        const steps = document.querySelectorAll('.step');
        let currentStep = 0;

        function updateButtons() {
          document.getElementById('prevBtn').disabled = currentStep === 0;
          document.getElementById('nextBtn').classList.toggle('hidden', currentStep === steps.length - 1);
          document.getElementById('submitBtn').classList.toggle('hidden', currentStep !== steps.length - 1);
        }

        document.getElementById('nextBtn').addEventListener('click', () => {
          steps[currentStep].classList.add('hidden');
          currentStep++;
          steps[currentStep].classList.remove('hidden');
          updateButtons();
        });

        document.getElementById('prevBtn').addEventListener('click', () => {
          steps[currentStep].classList.add('hidden');
          currentStep--;
          steps[currentStep].classList.remove('hidden');
          updateButtons();
        });

        document.getElementById('multistepForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const formData = Object.fromEntries(new FormData(e.target).entries());

          fetch('${webhookUrl}', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ formData }),
          })
          .then(response => response.json())
          .then(data => {
            if (data.error) {
              alert('Error: ' + data.error);
            } else {
              alert('Form submitted successfully!');
            }
          })
          .catch(error => {
            alert('Error submitting form: ' + error.message);
          });
        });

        updateButtons();
      </script>
    </div>
    </body>
    </html>`;

    return html;
  }
}
