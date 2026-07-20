<?php
// speak.php
require_once 'config.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

// استقبال النص من الجافاسكربت
$input = json_decode(file_get_contents('php://input'), true);
$message = $input['message'] ?? '';

if (empty($message)) {
    echo json_encode(['error' => 'الرسالة فارغة']);
    exit;
}

// الرابط الجديد للإصدار الثاني V2
$url = 'https://api.cohere.ai/v2/chat';

// هيكل البيانات الجديد المطلوب لـ V2
$data = [
    'model' => 'command-a-plus-05-2026',
    'messages' => [
        [
            'role' => 'user',
            'content' => $message
        ]
    ]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . COHERE_API_KEY,
    'Content-Type: application/json',
    'accept: application/json'
]);

// إعداد ضروري لتجاوز فحص SSL 
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    echo json_encode(['error' => 'cURL Error: ' . curl_error($ch)]);
} else if ($httpCode !== 200) {
    echo json_encode(['error' => 'API Error', 'details' => json_decode($response)]);
} else {
    $responseData = json_decode($response, true);
    $replyText = '';
    
    // البحث داخل المصفوفة عن الجزء الذي يحتوي على الرد النصي الفعلي
    if (isset($responseData['message']['content']) && is_array($responseData['message']['content'])) {
        foreach ($responseData['message']['content'] as $block) {
            if (isset($block['type']) && $block['type'] === 'text') {
                $replyText = $block['text'];
                break;
            }
        }
    }
    
    // إرسال الرد النهائي إلى الجافاسكربت
    echo json_encode(['text' => $replyText]);
}

curl_close($ch);
?>