import { IWebhookFunctions, IWebhookResponseData } from 'n8n-workflow';
import { MultistepFormTriggerDescription } from './MultistepFormTrigger.description';

export class MultistepFormTrigger {
  description = MultistepFormTriggerDescription;

  // Use the webhook method instead of trigger
  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const req = this.getRequestObject();
    const res = this.getResponseObject();
    const formTitle = this.getNodeParameter('formTitle', '') as string;
    const steps = this.getNodeParameter('steps', {}) as any;

    // Handle GET request: Serve the form HTML
    if (req.method === 'GET') {
      const formHtml = (this as unknown as MultistepFormTrigger).generateFormHtml(formTitle, steps);

      // Send the HTML response
      res.setHeader('Content-Type', 'text/html');
      res.send(formHtml);

      return {}; // Indicates that we've manually handled the response
    }

    // Handle POST request: Process form submission
    if (req.method === 'POST') {
      const formData = req.body;

      // Emit the form data to the workflow
      return {
        workflowData: [[{ json: formData }]],
      };
    }

    // Default response for unsupported methods
    res.status(405).send('Method Not Allowed');
    return {}; // Indicates that we've manually handled the response
  }

  private generateFormHtml(formTitle: string, steps: any): string {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${formTitle}</title>
        <style>
          .step { display: none; }
          .step.active { display: block; }
          button { margin: 10px; }
        </style>
      </head>
      <body>
        <h1>${formTitle}</h1>
        <form id="multistepForm" method="POST">
    `;

    // Generate steps
    Object.values(steps.step.values).forEach((step: any, index: number) => {
      const isActive = index === 0 ? 'active' : '';
      html += `<div class="step ${isActive}" data-step="${step.stepName}">`;
      html += `<h2>${step.stepName}</h2>`;

      // Generate fields
      Object.values(step.fields.values).forEach((field: any) => {
        const { fieldLabel, fieldType } = field.field;
        html += `
          <label>${fieldLabel}</label>
          <input type="${fieldType}" name="${fieldLabel}" required><br>
        `;
      });

      html += `</div>`;
    });

    // Add navigation buttons and script
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
            fetch(window.location.href, {
              method: 'POST',
              body: formData,
            }).then(() => alert('Form submitted!'));
          });

          updateButtons();
        </script>
      </body>
      </html>
    `;

    return html;
  }
}