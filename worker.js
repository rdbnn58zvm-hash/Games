export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json; charset=utf-8'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    const url = new URL(request.url);

    // Распознавание текста на фото: Yandex Vision OCR
    if (url.pathname.endsWith('/ocr') && request.method === 'POST') {
      if (!env.YC_API_KEY) {
        return new Response('{"error":"YC_API_KEY not set"}', { status: 500, headers: cors });
      }
      try {
        const r = await fetch('https://ocr.api.cloud.yandex.net/ocr/v1/recognizeText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Api-Key ' + env.YC_API_KEY,
            'x-data-logging-enabled': 'false'
          },
          body: await request.text()
        });
        return new Response(await r.text(), { status: r.status, headers: cors });
      } catch (e) {
        return new Response('{"error":"upstream failed"}', { status: 502, headers: cors });
      }
    }

    // Поиск по штрихкоду: UPCitemdb
    const upc = (url.searchParams.get('upc') || '').replace(/\D/g, '');
    if (upc.length < 8 || upc.length > 14) {
      return new Response('{"error":"bad barcode"}', { status: 400, headers: cors });
    }
    try {
      const r = await fetch('https://api.upcitemdb.com/prod/trial/lookup?upc=' + upc);
      return new Response(await r.text(), { status: r.status, headers: cors });
    } catch (e) {
      return new Response('{"error":"upstream failed"}', { status: 502, headers: cors });
    }
  }
};
