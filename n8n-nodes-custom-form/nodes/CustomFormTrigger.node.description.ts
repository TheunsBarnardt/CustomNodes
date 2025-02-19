import { INodePropertyOptions, INodeTypeDescription, NodeConnectionType } from "n8n-workflow";
import { formDescription, formFields, formRespondMode, formTitle, formTriggerPanel, webhookPath } from "./common.descriptions";

export const CustomFormTriggerDescription: INodeTypeDescription = {
  displayName: 'Custom Form Trigger',
  name: 'formTrigger',
  icon: 'file:./resources/n8n_custom_forms_icon.svg',
  group: ['trigger'],
  version: 1.0,
  description: 'Trigger node for creating dynamic custom forms',
  defaults: {
    name: 'Custom Form Trigger',
  },
  inputs: [],
  outputs: [NodeConnectionType.Main],
  webhooks: [
		{
			name: 'setup',
			httpMethod: 'GET',
			responseMode: 'onReceived',
			isFullPath: true,
			path: '={{ $parameter["path"] || $parameter["options"]?.path || $webhookId }}',
			ndvHideUrl: true,
			isForm: true,
		},
		{
			name: 'default',
			httpMethod: 'POST',
			responseMode: '={{$parameter["responseMode"]}}',
			responseData: '={{$parameter["responseMode"] === "lastNode" ? "noData" : undefined}}',
			isFullPath: true,
			path: '={{ $parameter["path"] || $parameter["options"]?.path || $webhookId }}',
			ndvHideMethod: true,
			isForm: true,
		},
	],
  eventTriggerDescription: 'Waiting for you to submit the form',
	activationMessage: 'You can now make calls to your production Form URL.',
	triggerPanel: formTriggerPanel,
  properties: [
    {
      displayName: 'Html Template',
      name: 'formHtml',
      type: 'string',
      typeOptions: { editor: "htmlEditor" },
      default: `
        <html lang='en'>

        <head>
          <meta charset='UTF-8' />
          <meta name='viewport' content='width=device-width, initial-scale=1.0' />
          <meta name="description" content="{{formDescriptionMetadata}}" />
          <meta property="og:title" content="{{formTitle}}" />
          <meta property="og:description" content="{{formDescriptionMetadata}}" />
          <meta property="og:type" content="website" />
          <meta property="og:image" content="/static/og_image.png" />
          <link rel='icon' type='image/png' href='https://n8n.io/favicon.ico' />
          <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap"
            rel="stylesheet">
          <title>{{formTitle}}</title>
          <style>
            *,
            ::after,
            ::before {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }

            body {
              font-family:
                "Open Sans",
                sans-serif;
              font-weight: 400;
              font-size: 12px;
              display: flex;
              flex-direction: column;
              justify-content: start;
              background-color: #fbfcfe;
            }

            .container {
              margin: auto;
              text-align: center;
              padding-top: 24px;
              width: 448px;
            }

            .test-notice {
              padding: 12px 24px;
              color: #e6a23d;
              background-color: #fefaf6;
              border-radius: 8px;
              border: 1px solid #f6dcb7;
              font-size: 12px;
              font-weight: 400;
              line-height: 16px;
              text-align: left;
              margin-bottom: 16px;
            }

            .card {
              padding: 24px;
              background-color: white;
              border: 1px solid #dbdfe7;
              border-radius: 8px;
              box-shadow: 0px 4px 16px 0px #634dff0f;
              margin-bottom: 16px;
            }

            .n8n-link {
              padding-bottom: 24px;
            }

            .n8n-link a {
              color: #7e8186;
              font-weight: 600;
              font-size: 12px;
              text-decoration: none;
            }

            .n8n-link svg {
              display: inline-block;
              vertical-align: middle;
            }

            .form-header h1 {
              color: #525356;
              font-size: 20px;
              font-weight: 400;
            }

            .form-header p {
              padding-top: 8px;
              color: #7e8186;
              font-size: 14px;
              font-weight: 400;
            }

            .inputs-wrapper {
              padding-top: 24px;
              padding-bottom: 24px;
            }

            form label {
              display: block;
              text-align: left;
              font-size: 14px;
              font-weight: 600;
              color: #555555;
              padding-bottom: 6px;
            }

            form .form-input {
              border: 1px solid #dbdfe7;
              border-radius: 6px;
              width: 100%;
              font-size: 14px;
              color: #71747A;
              font-weight: 400;
              padding: 12px;
            }

            form textarea:focus,
            form input:focus {
              outline: none;
              border-color: rgb(90, 76, 194);
            }

            .select-input {
              border: 1px solid #dbdfe7;
              border-radius: 6px;
            }

            .select-input:focus-within {
              border: 1px solid rgb(90, 76, 194);
            }

            form select {
              outline: transparent;
              border: none;
              border-radius: 6px;
              width: 100%;
              font-size: 14px;
              color: #71747A;
              font-weight: 400;
              background-color: white;
              padding: 12px;
              border-right: 12px solid transparent;
            }

            input[type='date'] {
              font-family:
                Open Sans,
                sans-serif;
            }

            ::placeholder {
              opacity: 0.5;
            }

            #submit-btn {
              width: 100%;
              height: 48px;
              padding: 12px;
              border-radius: 6px;
              border: 0;
              font-size: 14px;
              font-weight: 600;
              font-family:
                Open Sans,
                sans-serif;
              background-color: #ff6d5a;
              color: #ffffff;
              cursor: pointer;
            }

            #submit-btn span {
              padding-right: 6px;
              display: none;
            }

            #submit-btn span svg {
              display: inline-block;
              vertical-align: middle;
              fill: #ffffff;
              animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
            }

            @keyframes lds-ring {
              0% {
                transform: rotate(0deg);
              }

              100% {
                transform: rotate(360deg);
              }
            }

            #submit-btn:hover {
              opacity: 0.7;
            }

            .error-hidden {
              display: block;
              position: relative;
              color: #ea1f30;
              text-align: left;
              font-size: 12px;
              font-weight: 400;
              visibility: hidden;
              padding-top: 6px;
              padding-bottom: 9px;
            }

            .error-show {
              visibility: visible;
            }

            /* multiselect ----------------------------------- */
            .multiselect {
              padding-left: 6px;
              padding-right: 6px;
            }

            .multiselect-option {
              padding-top: 6px;
              display: flex;
            }

            .multiselect-option label {
              padding-left: 12px;
              color: #7e8186;
              font-weight: 400;
              cursor: pointer;
            }

            .multiselect-checkbox {
              vertical-align: middle;
              min-width: 18px;
            }

            input[type='checkbox'] {
              width: 18px;
              height: 18px;
              cursor: pointer;
            }

            /* required field ----------------------------- */
            .form-required {}

            label.form-required::after {
              content: ' *';
              color: #ff6d5a;
            }

            hr {
              border: 0;
              height: 1px;
              border-top: 1px solid #dbdfe7;
              margin-top: 24px;
              margin-bottom: 24px;
              display: none;
            }

            .file-input-wrapper {
              position: relative;
              display: inline-block;
              width: 100%;
            }

            input[type="file"] {}

            .clear-button {
              position: absolute;
              right: 5px;
              top: 50%;
              transform: translateY(-65%);
              background-color: #7e8186;
              border: none;
              border-radius: 50%;
              font-size: 14px;
              font-weight: 600;
              font-family:
                Open Sans,
                sans-serif;
              color: white;
              width: 20px;
              height: 20px;
              text-align: center;
              line-height: 20px;
              cursor: pointer;
              display: none;
            }

            input[type="file"]:not(:empty)+.clear-button {
              display: inline-block;
            }

            div.html {
              text-align: left;
              color: #555;
              font-size: 14px;
            }

            div.html h1,
            div.html h2,
            div.html h3,
            div.html h4,
            div.html h5,
            div.html h6,
            div.html p,
            div.html ul,
            div.html ol,
            div.html a {
              font-weight: 400;
              font-style: normal;
              margin-bottom: 8px;
            }

            div.html li {
              margin-bottom: 8px;
              margin-left: 24px;
            }

            div.html ul,
            div.html ol {
              font-size: 14px;
              display: flex;
              flex-direction: column;
              align-self: stretch;
              line-height: normal;
            }

            div.html b {
              font-weight: 600;
            }

            div.html h1 {
              font-size: 28px;
              line-height: 35px;
            }

            div.html h2 {
              font-size: 20px;
              line-height: 26px;
            }

            div.html h3 {
              font-size: 16px;
              line-height: 24px;
            }

            div.html h4 {
              font-size: 14px;
              line-height: 18px;
            }

            div.html h5 {
              font-size: 12px;
            }

            div.html h6 {
              font-size: 10px;
            }

            div.html p {
              margin-bottom: 8px;
            }

            div.html a {
              color: #FF6D5A;
              font-size: 14px;
            }

            @media only screen and (max-width: 500px) {
              body {
                background-color: white;
              }

              hr {
                display: block;
              }

              .container {
                width: 95%;
                min-height: 100vh;
                padding: 24px;
                background-color: white;
                border: 0px solid #dbdfe7;
                border-radius: 0px;
                box-shadow: 0px 0px 0px 0px white;
              }

              .card {
                padding: 0px;
                background-color: white;
                border: 0px solid #dbdfe7;
                border-radius: 0px;
                box-shadow: 0px 0px 0px 0px white;
                margin-bottom: 0px;
              }
            }
          </style>
        </head>

        <body>
          <div class='container'>
            <section>
              {{#if testRun}}
              <div class='test-notice'>
                <p>This is test version of your form</p>
              </div>
              <hr>
              {{/if}}

              {{#if validForm}}
              <form class='card' action='#' method='POST' name='n8n-form' id='n8n-form' novalidate>
                <div class='form-header'>
                  <h1>{{formTitle}}</h1>
                  <p style="white-space: pre-line">{{{formDescription}}} </p>
                </div>

                <div class='inputs-wrapper'>
                  {{#each formFields}}
                  {{#if isMultiSelect}}
                  <div>
                    <label
                      class="form-label {{inputRequired}} block text-left text-base font-semibold text-555555 pb-1"
                      for="{{id}}">{{label}}</label>
                    <div class="multiselect {{inputRequired}} pl-1 pr-1 border border-dbdfe7 rounded-lg"
                      id="{{id}}"> {{#each multiSelectOptions}}
                      <div class="multiselect-option flex items-center pt-2"> <input type="checkbox"
                          class="multiselect-checkbox mr-2 w-4 h-4 cursor-pointer" id="{{id}}" /> <label
                          for="{{id}}" class="text-7e8186 font-normal cursor-pointer">{{label}}</label> </div>
                      {{/each}}
                    </div>
                    <p class="{{errorId}} error-hidden text-left text-xs text-ea1f30 pt-1 pb-2"> This field is
                      required
                    </p>
                  </div>
                  {{/if}}

                  {{#if isSelect}}
                  <div class="form-group">
                    <label
                      class="form-label {{inputRequired}} block text-left text-base font-semibold text-555555 pb-1"
                      for="{{id}}">{{label}}</label>
                    <div class="select-input border border-dbdfe7 rounded-lg focus-within:border-rgb(90, 76, 194)">
                      <select id="{{id}}" name="{{id}}"
                        class="{{inputRequired}} w-full text-base text-71747A font-normal bg-white px-3 py-2 appearance-none">
                        <option value="" disabled selected>Select an option ...</option>
                        {{#each selectOptions}}
                        <option value="{{this}}">{{this}}</option>
                        {{/each}}
                      </select>
                    </div>
                    <p class="{{errorId}} error-hidden text-left text-xs text-ea1f30 pt-1 pb-2">
                      This field is required
                    </p>
                  </div>
                  {{/if}}

                  {{#if isHtml}}
                  <div class="form-group html text-left text-base text-555">
                    {{{html}}}
                    <input type="hidden" id="{{id}}" name="{{id}}" value="{{html}}" />
                  </div>
                  {{/if}}

                  {{#if isHidden}}
                  <input type="hidden" id="{{id}}" name="{{id}}" value="{{hiddenValue}}" />
                  {{/if}}

                  {{#if isTextarea}}
                  <div class="form-group">
                    <label
                      class="form-label {{inputRequired}} block text-left text-base font-semibold text-555555 pb-1"
                      for="{{id}}">{{label}}</label>
                    <textarea
                      class="form-input {{inputRequired}} border border-dbdfe7 rounded-lg w-full text-base text-71747A font-normal px-3 py-2"
                      id="{{id}}" name="{{id}}" placeholder="{{placeholder}}">{{defaultValue}}</textarea>
                    <p class="{{errorId}} error-hidden text-left text-xs text-ea1f30 pt-1 pb-2">
                      This field is required
                    </p>
                  </div>
                  {{/if}}

                  {{#if isFileInput}}
                  <div class="form-group file-input-wrapper relative">
                    <label
                      class="form-label {{inputRequired}} block text-left text-base font-semibold text-555555 pb-1"
                      for="{{id}}">{{label}}</label>
                    <input
                      class="form-input {{inputRequired}} border border-dbdfe7 rounded-lg w-full text-base text-71747A font-normal px-3 py-2"
                      type="file" id="{{id}}" name="{{id}}" accept="{{acceptFileTypes}}" {{multipleFiles}}
                      placeholder="{{placeholder}}" />
                    <button
                      class="clear-button absolute right-1/4 top-1/2 -translate-y-1/2 bg-7e8186 border-none rounded-full text-white text-base font-semibold w-5 h-5 text-center leading-5 cursor-pointer hidden">&times;</button>
                    <p class="{{errorId}} error-hidden text-left text-xs text-ea1f30 pt-1 pb-2">
                      This field is required
                    </p>
                  </div>
                  {{/if}}

                  {{#if isInput}}
                  <div class="form-group">
                    <label
                      class="form-label {{inputRequired}} block text-left text-base font-semibold text-555555 pb-1"
                      for="{{id}}">{{label}}</label>
                    <input
                      class="form-input {{inputRequired}} border border-dbdfe7 rounded-lg w-full text-base text-71747A font-normal px-3 py-2"
                      type="{{type}}" id="{{id}}" name="{{id}}" value="{{defaultValue}}"
                      placeholder="{{placeholder}}" />
                    <p class="{{errorId}} error-hidden text-left text-xs text-ea1f30 pt-1 pb-2">
                      This field is required
                    </p>
                  </div>
                  {{/if}}
                  {{/each}}
                </div>

                <button id='submit-btn' type='submit'>
                  <span><svg xmlns='http://www.w3.org/2000/svg' height='18px'
                      viewBox='0 0 512 512'>
                      <path
                        d='M304 48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zm0 416a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM48 304a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm464-48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM142.9 437A48 48 0 1 0 75 369.1 48 48 0 1 0 142.9 437zm0-294.2A48 48 0 1 0 75 75a48 48 0 1 0 67.9 67.9zM369.1 437A48 48 0 1 0 437 369.1 48 48 0 1 0 369.1 437z' />
                    </svg></span>
                  {{ buttonLabel }}
                </button>
              </form>
              {{else}}
              <div class='card'>
                <div class='form-header'>
                  {{#if testRun}}
                  <h1>Please add at least one field to your form</h1>
                  {{else}}
                  <h1>Problem loading form</h1>
                  <p>
                    This usually occurs if the n8n workflow serving this form is deactivated or no
                    longer exist
                  </p>
                  {{/if}}
                </div>
              </div>
              {{/if}}

              <div class='card' id='submitted-form' style='display: none;'>
                <div class='form-header'>
                  {{#if formSubmittedHeader}}
                  <h1 id='submitted-header'>{{formSubmittedHeader}}</h1>
                  {{else}}
                  <h1 id='submitted-header'>Form Submitted</h1>
                  {{/if}}
                  {{#if formSubmittedText}}
                  <p id='submitted-content'>
                    {{formSubmittedText}}
                  </p>
                  {{/if}}
                </div>
              </div>

              {{#if redirectUrl}}
              <a id='redirectUrl' href='{{redirectUrl}}' style='display: none;'></a>
              {{/if}}
              <input id="useResponseData" style="display: none;" value={{useResponseData}} />
            </section>
          </div>
          <script>
            function validateInput(input, errorElement) {
              const value = input.value.trim();
              const type = input.type;

              if (type === 'email' && value !== '') {
                return validateEmailInput(value, errorElement);
              } else if (type === 'number' && value !== '') {
                if (isNaN(value)) {
                  errorElement.textContent = 'Enter only numbers in this field';
                  errorElement.classList.add('error-show');
                  return false;
                } else {
                  errorElement.classList.remove('error-show');
                  return true;
                }
              } else if (value === '') {
                errorElement.textContent = 'This field is required';
                errorElement.classList.add('error-show');
                return false;
              } else {
                errorElement.classList.remove('error-show');
                return true;
              }
            }

            function validateEmailInput(value, errorElement) {
              const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
              const isValidEmail = regex.test(value);

              if (!isValidEmail) {
                errorElement.textContent = 'Enter a valid email address in this field';
                errorElement.classList.add('error-show');
                return false;
              } else {
                errorElement.textContent = 'This field is required';
                errorElement.classList.remove('error-show');
                return true;
              }
            }

            function getSelectedValues(input) {
              const selectedValues = [];
              const checkboxes = input.querySelectorAll('.multiselect-checkbox');

              checkboxes.forEach((checkbox, index) => {
                if (checkbox.checked) {
                  const label = input.querySelectorAll('label')[index];
                  selectedValues.push(label.textContent.trim());
                }
              });

              return selectedValues;
            }

            function validateMultiselect(input, errorElement) {
              const selectedValues = getSelectedValues(input);

              if (!selectedValues.length) {
                errorElement.classList.add('error-show');
                return false;
              } else {
                errorElement.classList.remove('error-show');
                return true;
              }
            }

            const form = document.querySelector('#n8n-form');

            document.querySelectorAll("input[type=number]").forEach(function (element) {
              element.addEventListener("wheel", function (event) {
                if (document.activeElement === event.target) {
                  event.preventDefault();
                }
              });
            });

            document.querySelectorAll('input[type="file"]').forEach(fileInput => {
              const clearButton = fileInput.nextElementSibling;
              let previousFiles = [];

              fileInput.addEventListener('change', () => {
                const files = fileInput.files;

                if (files.length > 0) {
                  previousFiles = Array.from(files);
                  clearButton.style.display = 'inline-block';
                } else {
                  if (previousFiles.length > 0) {
                    const dataTransfer = new DataTransfer();
                    previousFiles.forEach(file => dataTransfer.items.add(file));
                    fileInput.files = dataTransfer.files;
                    clearButton.style.display = 'inline-block';
                  }
                }
              });

              clearButton.addEventListener('click', (event) => {
                event.preventDefault();
                fileInput.value = '';
                previousFiles = [];
                clearButton.style.display = 'none';
              });
            });

            const requiredInputs = document.querySelectorAll('.form-required:not(label)');
            const emailInputs = document.querySelectorAll("input[type=email]");

            requiredInputs.forEach((input) => {
              const errorSelector = '.error-${`input.id`}';
              const error = document.querySelector(errorSelector);

              if (input.classList.contains('multiselect')) {
                input.addEventListener('click', () => {
                  validateMultiselect(input, error);
                });
              } else {
                input.addEventListener('blur', () => {
                  validateInput(input, error);
                });
                input.addEventListener('input', () => {
                  error.classList.remove('error-show');
                });
              }
            });

            emailInputs.forEach(function (input) {
              const errorSelector = '.error-${`input.id`}';
              const error = document.querySelector(errorSelector);

              input.addEventListener("input", function (event) {
                const value = input.value.trim();
                if (value === "") {
                  error.classList.remove('error-show');
                } else {
                  validateEmailInput(value, error);
                }
              });
            });

            form.addEventListener('submit', (e) => {
              const valid = [];
              e.preventDefault();

              emailInputs.forEach(function (input) {
                const value = input.value.trim();
                if (value === '') {
                  return;
                }
                const errorSelector = '.error-${`input.id`}';
                const error = document.querySelector(errorSelector);
                valid.push(validateEmailInput(value, error));
              });

              requiredInputs.forEach((input) => {
                const errorSelector = '.error-${`input.id`}';
                const error = document.querySelector(errorSelector);

                if (input.classList.contains('multiselect')) {
                  valid.push(validateMultiselect(input, error));
                } else {
                  valid.push(validateInput(input, error));
                }
              });

              if (valid.every((v) => v)) {
                var formData = new FormData();

                for (const filed of form.elements) {
                  if (filed.type !== 'file') {
                    formData.append(filed.name, filed.value);
                  } else {
                    for (const file of filed.files) {
                      if (file.size === 0) {
                        continue;
                      }
                      formData.append(filed.name, file);
                    }
                  }
                }

                document.querySelectorAll('.multiselect').forEach((multiselect) => {
                  const selectedValues = getSelectedValues(multiselect);
                  formData.append(multiselect.id, JSON.stringify(selectedValues));
                });

                document.querySelector('#submit-btn').disabled = true;
                document.querySelector('#submit-btn').style.cursor = 'not-allowed';
                document.querySelector('#submit-btn span').style.display = 'inline-block';
                fetch('', {
                  method: 'POST',
                  body: formData,
                })
                  .then(async function (response) {
                    const useResponseData = document.getElementById("useResponseData").value;

                    if (useResponseData === "true") {
                      const text = await response.text();
                      let json;

                      try {
                        json = JSON.parse(text);
                      } catch (e) { }

                      if (json?.redirectURL) {
                        const url = json.redirectURL.includes("://") ? json.redirectURL : "https://" + json.redirectURL;
                        window.location.replace(url);
                      } else if (json?.formSubmittedText) {
                        form.style.display = 'none';
                        document.querySelector('#submitted-form').style.display = 'block';
                        document.querySelector('#submitted-content').textContent = json.formSubmittedText;
                      } else {
                        document.body.innerHTML = text;
                      }
                      return;
                    }

                    if (response.status === 200) {
                      if (response.redirected) {
                        window.location.replace(response.url);
                        return;
                      }
                      const redirectUrl = document.getElementById("redirectUrl");
                      if (redirectUrl) {
                        window.location.replace(redirectUrl.href);
                      } else {
                        form.style.display = 'none';
                        document.querySelector('#submitted-form').style.display = 'block';
                      }
                    } else {
                      form.style.display = 'none';
                      document.querySelector('#submitted-form').style.display = 'block';
                      document.querySelector('#submitted-header').textContent = 'Problem submitting response';
                      document.querySelector('#submitted-content').textContent =
                        'Please try again or contact support if the problem persists';
                    }

                    return;
                  })
                  .catch(function (error) {
                    console.error('Error:', error);
                  });

                const isWaitingForm = window.location.href.includes('form-waiting');
                if (isWaitingForm) {
                  const interval = setInterval(function () {
                    const isSubmited = document.querySelector('#submitted-form').style.display;
                    if (isSubmited === 'block') {
                      clearInterval(interval);
                      return;
                    }
                    window.location.reload();
                  }, 2000);
                }
              }
            });
          </script>
        </body>

        </html>
      `,
      description: 'Custom html to render form',
      hint:"https://uiverse.io"

    },
    {
      displayName: 'Form Name',
      name: 'formName',
      type: 'string',
      default: 'My Form',
      description: 'The name of the form',
    },
    { ...webhookPath },
		formTitle,
		formDescription,
		formFields,		
		{
			...formRespondMode,
			options: (formRespondMode.options as INodePropertyOptions[])?.filter(
				(option) => option.value !== 'responseNode',
			),		
		},   
  ],
};
