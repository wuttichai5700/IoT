exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    // 1. ดึง prompt ที่ส่งมาจากหน้าเว็บ
    const { prompt } = JSON.parse(event.body);

    // 2. ดึง API Key จากที่เก็บลับของ Netlify (ปลอดภัย)
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error("API Key is not set in Netlify environment.");
    }

    const modelName = "gemini-1.5-flash-latest"; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    // 3. ยิง request ไปยัง Google AI API จากเซิร์ฟเวอร์ของ Netlify
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      return { statusCode: response.status, headers, body: JSON.stringify({ error: errorBody.error.message }) };
    }

    const data = await response.json();

    // 4. ส่งผลลัพธ์กลับไปให้หน้าเว็บ
    return { statusCode: 200, headers, body: JSON.stringify(data) };

  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};