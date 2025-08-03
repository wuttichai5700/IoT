// นี่คือโค้ดสำหรับ "ผู้ช่วยส่วนตัว" (Serverless Function) ของเรา
// ไฟล์นี้จะทำงานบนเซิร์ฟเวอร์ของ Netlify ไม่ใช่บนเบราว์เซอร์ของผู้ใช้

exports.handler = async function(event, context) {
  // 1. ตรวจสอบว่าคำขอถูกส่งมาด้วยวิธี POST เท่านั้น
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 2. ดึง "prompt" หรือคำสั่งที่ผู้ใช้พิมพ์มาจากหน้าเว็บ
    const { prompt } = JSON.parse(event.body);

    if (!prompt) {
      return { statusCode: 400, body: 'Missing prompt' };
    }

    // 3. **ส่วนที่สำคัญที่สุด:** ดึง API Key มาจาก Environment Variable ที่เราตั้งค่าไว้อย่างปลอดภัยบน Netlify
    //    Key นี้จะไม่ถูกส่งไปให้ผู้ใช้เห็นเด็ดขาด
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    // 4. สร้าง "payload" หรือข้อมูลที่จะส่งไปให้ Google AI
    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }]
    };

    // 5. ให้ "ผู้ช่วยส่วนตัว" ของเรายิงคำขอไปหา Google AI แทนหน้าเว็บ
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // หาก Google AI ตอบกลับมาว่ามีปัญหา ให้ส่งข้อผิดพลาดกลับไป
      console.error('Gemini API error:', await response.text());
      return { statusCode: response.status, body: 'Error from Gemini API' };
    }

    // 6. รับคำตอบจาก Google AI
    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || 'ขออภัย ไม่สามารถสร้างคำตอบได้';

    // 7. ส่งคำตอบสุดท้ายกลับไปให้หน้าเว็บของเราเพื่อแสดงผล
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reply: text }),
    };

  } catch (error) {
    // จัดการข้อผิดพลาดที่ไม่คาดคิด
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An internal server error occurred.' }),
    };
  }
};
