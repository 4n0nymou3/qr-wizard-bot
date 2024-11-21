export default {
  async fetch(request, env) {
    // Add basic request logging
    console.log('Request received:', {
      method: request.method,
      url: request.url
    });

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    try {
      if (request.method === 'POST') {
        // Log the entire request body for debugging
        const reqBody = await request.json();
        console.log('Request body:', JSON.stringify(reqBody, null, 2));
        
        // Verify token exists
        if (!env.TELEGRAM_TOKEN) {
          throw new Error('TELEGRAM_TOKEN environment variable is not set');
        }

        const chatId = reqBody.message?.chat?.id;
        if (!chatId) {
          throw new Error('Chat ID not found in request');
        }

        let botResponses = [];

        if (reqBody.message.text === '/start') {
          console.log('Processing /start command');
          botResponses.push({
            type: 'text',
            content: 'به ربات QR کد خوش آمدید\\! 🎉\n\n' +
                    'این ربات می‌تواند:\n' +
                    '1️⃣ متن یا لینک شما را به QR کد تبدیل کند\\.\n' +
                    '2️⃣ محتوای QR کد را از تصاویر ارسالی بخواند\\.\n\n' +
                    'لطفاً یک متن، لینک یا تصویر QR کد ارسال کنید\\.\n\n' +
                    '\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\n\n' +
                    'Welcome to QR Code Bot\\! 🎉\n\n' +
                    'This bot can:\n' +
                    '1️⃣ Convert your text or link to a QR code\\.\n' +
                    '2️⃣ Read QR code content from your images\\.\n\n' +
                    'Please send a text, link, or QR code image\\.'
          });
        }

        // Log responses before sending
        console.log('Prepared responses:', JSON.stringify(botResponses, null, 2));

        if (botResponses.length > 0) {
          await sendResponsesToTelegram(botResponses, chatId, env.TELEGRAM_TOKEN);
        }

        return new Response('OK', { 
          status: 200,
          headers: corsHeaders
        });
      }
      
      return new Response('Method Not Allowed', { 
        status: 405,
        headers: corsHeaders
      });
    } catch (error) {
      console.error('Error processing request:', error);
      // Return error details in development
      return new Response(JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }), { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  }
};

async function sendResponsesToTelegram(botResponses, chatId, token) {
  for (const response of botResponses) {
    const telegramUrl = response.type === 'photo'
      ? `https://api.telegram.org/bot${token}/sendPhoto`
      : `https://api.telegram.org/bot${token}/sendMessage`;

    const payload = response.type === 'photo'
      ? {
          chat_id: chatId,
          photo: response.content,
          caption: response.caption,
          parse_mode: 'MarkdownV2'
        }
      : {
          chat_id: chatId,
          text: response.content,
          parse_mode: 'MarkdownV2'
        };

    try {
      console.log('Sending to Telegram:', {
        url: telegramUrl,
        payload: JSON.stringify(payload, null, 2)
      });

      const result = await fetch(telegramUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseData = await result.json();
      console.log('Telegram API response:', JSON.stringify(responseData, null, 2));

      if (!result.ok) {
        throw new Error(`Telegram API error: ${JSON.stringify(responseData)}`);
      }
    } catch (error) {
      console.error('Error sending message to Telegram:', error);
      throw error; // Re-throw to handle in the main function
    }
  }
}

function getFileUrl(fileId, token) {
  return fetch(
    `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`
  )
    .then(response => response.json())
    .then(data => {
      if (!data.ok) {
        throw new Error(`Telegram getFile error: ${JSON.stringify(data)}`);
      }
      return `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
    });
}

function scanQRCode(imageUrl) {
  return fetch(
    `https://api.qrserver.com/v1/read-qr-code/?fileurl=${encodeURIComponent(imageUrl)}`
  )
    .then(response => response.json())
    .then(data => {
      if (!data[0]?.symbol[0]?.data) {
        throw new Error('QR code could not be read');
      }
      return data[0].symbol[0].data;
    });
}

function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}