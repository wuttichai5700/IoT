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
    const { prompt } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // ใช้ console.error เพื่อให้แสดงใน Log ชัดเจน
      console.error("Function Error: GEMINI_API_KEY is not set.");
      throw new Error("Server configuration error: API Key not found.");
    }

    const modelName = "gemini-1.5-flash-latest"; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    const googleResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
    });

    // ถ้า Google API ตอบกลับมาโดยที่ "ไม่ใช่" JSON (เช่น หน้า error HTML)
    const contentType = googleResponse.headers.get("content-type");
    if (!googleResponse.ok || !contentType || !contentType.includes("application/json")) {
      const errorText = await googleResponse.text();
      console.error('Google API Error:', errorText);
      throw new Error(`Google API returned a non-JSON response. Status: ${googleResponse.status}`);
    }

    const data = await googleResponse.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };

  } catch (error) {
    console.error('Caught Function Error:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
