# n8n Forms with Custom HTML and CSS/Tailwind Options

This branch of the n8n Forms project introduces the ability to add custom HTML to your forms and choose between using standard CSS or Tailwind CSS for styling.  This allows for greater flexibility and customization in the design and functionality of your forms.

## Key Features

*   **Custom HTML:**  You can now directly embed your own HTML code into the form, giving you full control over the form's structure and content.
*   **CSS/Tailwind Toggle:** A simple toggle option lets you choose between styling your form with standard CSS or leveraging the utility-first approach of Tailwind CSS.
*   **Enhanced Flexibility:** This combination of custom HTML and styling options allows you to create highly tailored forms that meet your specific needs and integrate seamlessly with your existing design systems.

## How to Use

1.  **Clone the Branch:** Clone this branch of the n8n Forms repository to your local machine.

2.  **Access Form Settings:** In the n8n workflow editor, navigate to the settings of your form node.

3.  **Custom HTML Input:** You will find a new input field where you can paste your custom HTML code.

4.  **CSS/Tailwind Toggle:**  Locate the toggle switch or dropdown menu that allows you to select between "CSS" and "Tailwind".

5.  **Write Your HTML:** Create your HTML structure.  Remember to include any necessary form elements (inputs, labels, buttons, etc.).

6.  **Style Your Form:**
    *   **CSS:** If you chose "CSS", add your CSS rules either within `<style>` tags in your custom HTML or by linking to an external stylesheet.
    *   **Tailwind:** If you chose "Tailwind", use Tailwind utility classes directly in your HTML elements to style them.  Ensure you have Tailwind CSS set up correctly in your n8n environment.

7.  **Handlebars Templating:** Continue using Handlebars templating (e.g., `{{formTitle}}`, `{{formDescription}}`) within your custom HTML to dynamically populate the form with data from your n8n workflow.

8.  **Form Submission:** The form submission process remains the same.  You can handle form submissions within your n8n workflow as before.

## Example (Tailwind):

```html
<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">{{formTitle}}</h1>
  <form action="#" method="POST">
    <label for="name" class="block text-gray-700 font-bold mb-2">Name:</label>
    <input type="text" id="name" name="name" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
    <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4">Submit</button>
  </form>
</div>