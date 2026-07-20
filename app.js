// ============================================================
// app.js — منطق الشات بوت الصوتي (معدل لـ Cohere)
// ============================================================

const micBtn = document.getElementById("micBtn");
const micIcon = document.getElementById("micIcon");
const chatLog = document.getElementById("chatLog");
const statusText = document.getElementById("statusText");

// توجيه الطلب إلى ملف speak.php الموجود في نفس المجلد
const BACKEND_URL = "speak.php";

// اللغة المستخدمة للتعرف على الصوت وللنطق
const LANG = "ar-SA";

let isListening = false;

// --------------------------------------------------------
// 1) إعداد التعرف على الصوت (Speech-to-Text)
// --------------------------------------------------------
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognitionAPI) {
  statusText.textContent = "متصفحك لا يدعم التعرف على الصوت. جرّب Chrome أو Edge.";
  micBtn.disabled = true;
} else {
  const recognition = new SpeechRecognitionAPI();
  recognition.lang = LANG;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  micBtn.addEventListener("click", () => {
    if (isListening) {
      recognition.stop();
      return;
    }
    try {
      recognition.start();
    } catch (err) {
      console.error("تعذر بدء الاستماع:", err);
    }
  });

  recognition.onstart = () => {
    isListening = true;
    micBtn.classList.add("listening");
    micIcon.textContent = "⏹️";
    statusText.textContent = "أستمع الآن... تحدّث بحرية";
  };

  recognition.onend = () => {
    isListening = false;
    micBtn.classList.remove("listening");
    micIcon.textContent = "🎤";
    statusText.textContent = "اضغط على الميكروفون وابدأ الحديث";
  };

  recognition.onerror = (event) => {
    console.error("خطأ في التعرف على الصوت:", event.error);
    statusText.textContent = "لم أستطع سماعك، حاول مرة أخرى";
  };

  recognition.onresult = async (event) => {
    const userText = event.results[0][0].transcript;
    if (!userText) return;

    addMessage("user", userText);
    const thinkingEl = addMessage("bot", "...يفكر", { thinking: true });

    try {
      // تم تعديل اسم الدالة هنا 
      const reply = await askCohere(userText);
      thinkingEl.remove();
      addMessage("bot", reply);
      speak(reply);
    } catch (err) {
      console.error(err);
      thinkingEl.remove();
      addMessage("bot", "حدث خطأ أثناء الاتصال بالخادم. حاول مجددًا.");
    }
  };
}

// --------------------------------------------------------
// 2) الاتصال بالخادم الخلفي الذي يستدعي Cohere
// --------------------------------------------------------
async function askCohere(userText) {
  const res = await fetch(BACKEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // التعديل الأول: إرسال النص تحت اسم "message" ليتوافق مع speak.php
    body: JSON.stringify({ message: userText }),
  });

  if (!res.ok) {
    throw new Error(`فشل الطلب: ${res.status}`);
  }

  const data = await res.json();
  
  // التعديل الثاني: استخراج الرد من المتغير "data.text" الخاص بـ Cohere
  return data.text || "لم يصل رد من الخادم.";
}

// --------------------------------------------------------
// 3) تحويل النص إلى كلام (Text-to-Speech)
// --------------------------------------------------------
function speak(text) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel(); // إيقاف أي نطق سابق
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG;
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

// --------------------------------------------------------
// أدوات مساعدة لواجهة الدردشة
// --------------------------------------------------------
function addMessage(role, text, opts = {}) {
  const el = document.createElement("div");
  el.className = `message ${role}${opts.thinking ? " thinking" : ""}`;
  const p = document.createElement("p");
  p.textContent = text;
  el.appendChild(p);
  chatLog.appendChild(el);
  chatLog.scrollTop = chatLog.scrollHeight;
  return el;
}