import { 
  IWebhookFunctions, 
  IWebhookResponseData,
  NodeApiError,
} from 'n8n-workflow';
import { MultistepFormTriggerDescription } from './MultistepFormTrigger.description';

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
  
        // Prevent further execution
        return { noWebhookResponse: true };
      }
  
      if (req.method === 'POST') {
        const formData = req.body;
        return {
          workflowData: [[{
            json: {
              formData,
              timestamp: new Date().toISOString(),
              webhookUrl,
            },
          }]],
        };
      }
  
      // Handle unsupported methods (405)
      res.status(405).send('Method Not Allowed');
      return { noWebhookResponse: true };
    } catch (error) {
      throw new NodeApiError(this.getNode(), error);
    }
  }
  
  
  private static generateFormHtml(formTitle: string, steps: any, webhookUrl: string): string {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${formTitle}</title>
        <style>
          .step { display: none; }
          .step.active { display: block; }
          button { margin: 10px; }
          .webhook-url { margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>${formTitle}</h1>
        <div class="webhook-url">
          Form URL: <a href="${webhookUrl}" target="_blank">${webhookUrl}</a>
        </div>
        <form id="multistepForm" method="POST" action="${webhookUrl}">
    `;
  
    Object.values(steps || {}).forEach((step: any, index: number) => {
      console.log('Step Data:', step); // Log the full step to check its structure
  
      const isActive = index === 0 ? 'active' : '';
      const stepName = step.stepName || `Step ${index + 1}`; // Ensure stepName is defined
      html += `<div class="step ${isActive}" data-step="${stepName}">`;
      html += `<h2>${stepName}</h2>`;
    debugger;
      // Check if fields are defined and properly structured
      if (!step.fields || !step.fields.field) {
        console.error(`Missing or invalid fields for step: ${stepName}`);
        return;  // Skip this step if there are no fields
      }
  
      // Render the fields for the current step
      step.fields.field.forEach((field: any) => {
        if (!field.fieldLabel || !field.fieldType) {
          console.error(`Invalid field structure for field:`, field);
          return;
        }
  
        const { fieldLabel, fieldType } = field;
        html += `
          <label>${fieldLabel}</label>
          <input type="${fieldType}" name="${fieldLabel}" required><br>
        `;
      });
  
      html += `</div>`;
    });
  
    html += `
      <button type="button" id="prevBtn" disabled>Previous</button>
      <button type="button" id="nextBtn">Next</button>
      <button type="submit" id="submitBtn" style="display: none;">Submit</button>
      </form>
      <script>
        const steps = document.querySelectorAll('.step');
        let currentStep = 0;
  
        function updateButtons() {
          document.getElementById('prevBtn').disabled = currentStep === 0;
          document.getElementById('nextBtn').style.display = currentStep === steps.length - 1 ? 'none' : 'inline';
          document.getElementById('submitBtn').style.display = currentStep === steps.length - 1 ? 'inline' : 'none';
        }
  
        document.getElementById('nextBtn').addEventListener('click', () => {
          steps[currentStep].classList.remove('active');
          currentStep++;
          steps[currentStep].classList.add('active');
          updateButtons();
        });
  
        document.getElementById('prevBtn').addEventListener('click', () => {
          steps[currentStep].classList.remove('active');
          currentStep--;
          steps[currentStep].classList.add('active');
          updateButtons();
        });
  
        document.getElementById('multistepForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          fetch('${webhookUrl}', {
            method: 'POST',
            body: formData,
          })
          .then(() => {
            alert('Form submitted successfully!');
          })
          .catch(error => {
            alert('Error submitting form: ' + error.message);
          });
        });
  
        updateButtons();
      </script>
    </body>
    </html>
    `;
  
    return html;
  }
  
  
}
