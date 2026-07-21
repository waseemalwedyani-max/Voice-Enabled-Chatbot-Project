# 🤖 Voice-Enabled Chatbot Project

## 📌 About the Project
This project was developed to create an interactive web-based voice assistant, allowing users to speak through a microphone and receive smart responses. The system relies on core web technologies (HTML/CSS/JS) for the frontend, PHP for the backend to process requests, and integrates the advanced **Cohere API (V2)**.

**Developer:** Waseem Al-wedyani  
**Hosting Environment:** InfinityFree (LAMP Stack)  
**Live Demo:** [https://waseemakwedyani.site.je/](https://waseemakwedyani.site.je/)

---

## 🚀 Development Journey & Troubleshooting

### Phase 1: Initial Integration with Gemini API
During the initial build, we targeted the Gemini API. We resolved several PHP-side coding challenges to match Gemini's strict requirements:

1. **SSL Certificate Error:**
   * **Problem:** InfinityFree's local server rejected connections to Google's servers due to SSL certificate verification issues.
   * **Solution:** We bypassed local certificate verification in cURL using:
     `curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);`
2. **Complex Payload Structuring:**
   * **Problem:** Gemini requires a deeply nested JSON structure (`contents` > `parts` > `text`), which was causing "Invalid Format" errors.
   * **Solution:** We strictly formatted the PHP array to match this exact architecture before converting it to JSON.
3. **AJAX Response Handling:**
   * **Problem:** The frontend displayed an overarching connection error because the PHP file wasn't returning standard JSON.
   * **Solution:** We added proper headers (`header('Content-Type: application/json');`) and ensured the PHP script caught the server response and formatted it cleanly for the frontend.

**🛑 The Roadblock (Why we switched from Gemini):**
Despite having a 100% correct and functional PHP codebase, **Gemini failed to respond due to server-side conflicts**. InfinityFree imposes strict outbound network restrictions and firewalls on free tiers. Gemini's servers require specific network configurations (and sometimes streaming protocols) that were blocked by our hosting provider. The connection was being dropped by the server before it could even be processed by the AI.

---

### Phase 2: Migration to Cohere API (V2)
To bypass the hosting limitations, we migrated to **Cohere**, which offers a simpler REST API structure that works seamlessly with basic cURL on free hosting, alongside a generous free tier and excellent Arabic support. 

However, integrating Cohere came with its own set of challenges:

1. **V1 Deprecation Error (Model Compatibility):**
   * **Problem:** We received the error `this model is not supported with '/v1/chat'` when trying to use the modern `command-a-plus-05-2026` model.
   * **Solution:** We fully migrated to the V2 API endpoint: `https://api.cohere.ai/v2/chat`.
2. **Payload Restructuring:**
   * **Problem:** V2 does not accept a simple `message` string. It requires a conversational array to maintain context.
   * **Solution:** We updated the payload to use the `messages` array structure:
     ```php
     $data = [
         'model' => 'command-a-plus-05-2026',
         'messages' => [['role' => 'user', 'content' => $message]]
     ];
     ```
3. **The "Thinking" Block Challenge:**
   * **Problem:** The frontend received an empty response `{"text": ""}`. By debugging the raw JSON, we found that Cohere's advanced models return an array with two blocks: a "thinking" draft (`{type: "thinking"}`), and the actual text (`{type: "text"}`). The code was grabbing the first element (the empty thinking draft).
   * **Solution:** We built a loop in `speak.php` to iterate through the response, ignore the metadata, and extract only the final text:
     ```php
     if (isset($responseData['message']['content'])) {
         foreach ($responseData['message']['content'] as $block) {
             if (isset($block['type']) && $block['type'] === 'text') {
                 $replyText = $block['text'];
                 break; 
             }
         }
     }
     ```

---

## ⚙️ How the System Works (Full Workflow)

The application operates through a seamless cycle between the user, the frontend, the backend, and the AI API:

1. **Audio Capture (Frontend):** 
   The user clicks the microphone button on the web interface. The `app.js` file uses the browser's Web Speech API (Speech Recognition) to capture the user's voice and convert it into text.
2. **Request Dispatch:** 
   Once the speech is converted to text, `app.js` bundles this text and sends it via an AJAX POST request to the backend server (`speak.php`).
3. **AI Processing (Backend):** 
   * `speak.php` receives the text and imports the secure API key from `config.php`.
   * It formats the text into the specific JSON structure required by Cohere V2.
   * It initiates a secure cURL request to the Cohere API servers, bypassing local SSL restrictions.
4. **Data Extraction:** 
   Cohere processes the prompt and sends back a complex JSON response. `speak.php` intercepts this response, loops through the data blocks to bypass the AI's "thinking" process, and extracts the final, clean text.
5. **Response Delivery:** 
   The backend sends a simplified JSON object `{"text": "The AI's answer..."}` back to the frontend. `app.js` updates the user interface with this text and (optionally) reads it aloud.

---

## 🛠️ File Structure
* **`app.js`**: Manages the frontend, UI interactions, and audio-to-text conversion.
* **`speak.php`**: The backend API bridge handling cURL requests and data parsing.
* **`config.php`**: A secure configuration file containing the `COHERE_API_KEY` (excluded from version control).
* **`index.html` / `style.css`**: The structural and visual foundation of the chatbot interface.

## 💡 Lessons Learned
1. **The Importance of Debugging Raw Responses:** When dealing with complex APIs, assuming the shape of the response can lead to silent errors. Printing the raw JSON structure was key to understanding the "Thinking" feature in the new Cohere models.
2. **Code Flexibility:** Designing the backend to handle complex data (like extracting text from an array) and passing very simplified data to the frontend `{"text": "..."}` reduces the likelihood of frontend UI crashes.
