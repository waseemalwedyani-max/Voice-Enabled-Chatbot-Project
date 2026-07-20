# 🤖 Voice-Enabled Chatbot Project

## 📌 About the Project
This project was developed to create an interactive web-based voice assistant, allowing users to speak through a microphone and receive smart responses. The system relies on core web technologies (HTML/CSS/JS) for the frontend, PHP for the backend to process requests, and integrates the advanced **Cohere API (V2)**.

**Developer:** Waseem Al-wedyani  
**Hosting Environment:** InfinityFree (LAMP Stack)

---

## 🚀 Troubleshooting & Solutions

During the development phase and connecting the backend (`speak.php`) with the AI servers, we encountered several technical challenges that were gradually resolved to ensure application stability:

### 1. SSL Certificate Error
* **Problem:** When attempting to send a cURL request from InfinityFree servers to Cohere servers, the connection failed completely due to the free hosting restrictions on SSL certificate verification.
* **Solution:** A custom setting was added to the PHP code to bypass local certificate verification, allowing the request to pass successfully:
  ```php
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
  ```

### 2. V1 Deprecation Error (Model Compatibility)
* **Problem:** We received the error `this model is not supported with '/v1/chat'`. The reason was using a very modern and advanced model (`command-a-plus-05-2026`) and trying to send it through the legacy V1 endpoint.
* **Solution:** We fully migrated to the V2 API and updated the connection URL:
  ```php
  $url = '[https://api.cohere.ai/v2/chat](https://api.cohere.ai/v2/chat)';
  ```

### 3. Payload Restructuring
* **Problem:** In V1, the text was sent directly as `message`. In V2, the system relies on a "conversation array" to support context.
* **Solution:** We modified the JSON payload structure to be inside a `messages` array, specifying the sender's role `role: user` and the content `content`:
  ```php
  $data = [
      'model' => 'command-a-plus-05-2026',
      'messages' => [
          ['role' => 'user', 'content' => $message]
      ]
  ];
  ```

### 4. The "Thinking" Block Challenge
* **Problem:** After resolving all connection issues, the frontend (`app.js`) was receiving an empty response `{"text": ""}`. We printed the raw response to diagnose the issue and discovered that the modern AI model performs a "thinking" process before answering. The response returned as an array containing two types of data:
  1. `{type: "thinking"}`: The thinking draft (which the code mistakenly picked up because it was the first element).
  2. `{type: "text"}`: The actual text of the response.
* **Solution:** We built a smart loop in the `speak.php` file that searches within the response array, completely ignores the thinking section, and extracts only the final text to send it back to the frontend in a clean and direct format:
  ```php
  if (isset($responseData['message']['content'])) {
      foreach ($responseData['message']['content'] as $block) {
          if (isset($block['type']) && $block['type'] === 'text') {
              $replyText = $block['text'];
              break; // Stop when the actual text is found
          }
      }
  }
  ```

### 5. Why Cohere API?
* **Gemini Server Requirements:** Initially, we considered using the Gemini API. However, Gemini's servers required specific server-side configurations and dependencies that conflicted with the strict limitations of our free hosting environment (InfinityFree). Cohere provided a much simpler, straightforward REST API solution that worked seamlessly with basic cURL.
* **Generous Free Tier:** Cohere offers a free Developer Tier that provides an excellent monthly request limit, making it ideal for educational environments and open-source projects for testing on hosts like InfinityFree without early costs.
* **Excellent Arabic Support:** The advanced `Command` model family has an exceptional ability to understand and generate accurate and highly natural Arabic text compared to many competing models.
* **Continuous Evolution:** The transition to V2 proved that the platform is evolving rapidly and provides modern features like "deep thinking" before answering, which significantly improves the quality of responses.

---

## 🛠️ File Structure
* **`app.js`**: Manages the frontend, captures audio, converts it to text, and displays messages.
* **`speak.php`**: The backend bridge that receives text from the user, prepares it, connects to the Cohere V2 API, extracts the final response, and sends it back to the frontend.
* **`config.php`**: A secure configuration file containing the API key (`COHERE_API_KEY`).

## 💡 Lessons Learned
1. **The Importance of Debugging Raw Responses:** When dealing with complex APIs, assuming the shape of the response can lead to silent errors. Printing the raw JSON structure was key to understanding the "Thinking" feature in the new Cohere models.
2. **Code Flexibility:** Designing the backend to handle complex data (like extracting text from an array) and passing very simplified data to the frontend `{"text": "..."}` reduces the likelihood of frontend UI crashes.
