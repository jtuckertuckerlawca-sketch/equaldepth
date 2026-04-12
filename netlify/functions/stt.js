exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    // The body comes in as base64-encoded audio
    const { audio, mimeType } = JSON.parse(event.body);
    if (!audio) return { statusCode: 400, body: 'No audio provided' };

    // Convert base64 back to binary
    const audioBuffer = Buffer.from(audio, 'base64');
    const blob = new Blob([audioBuffer], { type: mimeType || 'audio/webm' });

    // Build multipart form
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');
    formData.append('model_id', 'scribe_v1');
    formData.append('language_code', 'en');

    const response = await fetch(
      'https://api.elevenlabs.io/v1/speech-to-text',
      {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: formData
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return { statusCode: response.status, body: err };
    }

    const data = await response.json();
    const transcript = data.text || '';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ transcript })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
