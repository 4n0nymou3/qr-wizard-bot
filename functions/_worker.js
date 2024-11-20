export default {
  async fetch(request, env) {
    if (request.method === 'POST') {
      const reqBody = await request.json();
      const chatId = reqBody.message.chat.id;
      let botResponses = [];

      if (reqBody.message.text === '/start') {
        botResponses.push({
          type: 'text',
          content: 'به ربات QR کد خوش آمدید! 🎉\n\n' +
                  'این ربات می‌تواند:\n' +
                  '1️⃣ متن یا لینک شما را به QR کد تبدیل کند.\n' +
                  '2️⃣ محتوای QR کد را از تصاویر ارسالی بخواند.\n\n' +
                  'لطفاً یک متن، لینک یا تصویر QR کد ارسال کنید.\n\n' +
                  '--------------------------------\n\n' +
                  'Welcome to QR Code Bot! 🎉\n\n' +
                  'This bot can:\n' +
                  '1️⃣ Convert your text or link to a QR code.\n' +
                  '2️⃣ Read QR code content from your images.\n\n' +
                  'Please send a text, link, or QR code image.'
        });
      } else if (reqBody.message.photo) {
        try {
          const fileId = reqBody.message.photo[reqBody.message.photo.length - 1].file_id;
          const fileUrl = await getFileUrl(fileId, env.TELEGRAM_TOKEN);
          const qrContent = await scanQRCode(fileUrl);
          
          if (qrContent) {
            const escapedContent = escapeMarkdown(qrContent);
            botResponses.push({
              type: 'text',
              content: '🔍 *بارکد خوان*\n' +
                      '\nمحتوای تصویر QR کد اسکن شده:\n\n' +
                      '--------------------------------\n\n' +
                      '🔍 *QR Code Scanner*\n' +
                      '\nScanned QR code content:'
            });
            botResponses.push({
              type: 'text',
              content: `\`${escapedContent}\``
            });
          } else {
            throw new Error('QR code is not readable');
          }
        } catch (error) {
          botResponses.push({
            type: 'text',
            content: '❌ *خطا*\n\n' +
                    'نمی‌توانم محتوای تصویر QR کد را بخوانم. لطفاً مطمئن شوید که تصویر شامل یک QR کد معتبر و خوانا است.\n\n' +
                    '--------------------------------\n\n' +
                    '❌ *Error*\n\n' +
                    'I cannot read the QR code content. Please make sure the image contains a valid and readable QR code.'
          });
        }
      } else if (reqBody.message.text && reqBody.message.text !== '/start') {
        const message = reqBody.message.text;
        
        if (message.trim() === '') {
          botResponses.push({
            type: 'text',
            content: '❌ *خطا*\n\n' +
                    'لطفاً یک متن یا لینک معتبر وارد کنید.\n\n' +
                    '--------------------------------\n\n' +
                    '❌ *Error*\n\n' +
                    'Please enter a valid text or link.'
          });
        } else if (message.length > 4000) {
          botResponses.push({
            type: 'text',
            content: '❌ *خطا*\n\n' +
                    'طول پیام نباید بیشتر از 4000 کاراکتر باشد.\n\n' +
                    '--------------------------------\n\n' +
                    '❌ *Error*\n\n' +
                    'Message length should not exceed 4000 characters.'
          });
        } else if (message.startsWith('http') && !isValidUrl(message)) {
          botResponses.push({
            type: 'text',
            content: '❌ *خطا*\n\n' +
                    'لطفاً یک آدرس اینترنتی معتبر وارد کنید.\n\n' +
                    '--------------------------------\n\n' +
                    '❌ *Error*\n\n' +
                    'Please enter a valid URL.'
          });
        } else {
          try {
            const QR_COLOR = '262626';
            const QR_BG_COLOR = 'D9D9D9';
            const QR_SIZE = 400;
            const QR_MARGIN = 10;
            
            const photoUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${QR_SIZE}x${QR_SIZE}&data=${encodeURIComponent(message)}&color=${QR_COLOR}&bgcolor=${QR_BG_COLOR}&margin=${QR_MARGIN}&format=png&qzone=2`;
            
            botResponses.push({
              type: 'photo',
              content: photoUrl,
              caption: '🖨 *ساخت بارکد*\n\n' +
                      'تصویر QR کد شما با موفقیت ایجاد شد.\n\n' +
                      '--------------------------------\n\n' +
                      '🖨 *QR Code Generator*\n\n' +
                      'Your QR code image was successfully created.'
            });
          } catch (error) {
            botResponses.push({
              type: 'text',
              content: '❌ *خطا*\n\n' +
                      'متأسفانه در ایجاد QR کد مشکلی پیش آمد. لطفاً دوباره تلاش کنید یا متن کوتاه‌تری را امتحان کنید.\n\n' +
                      '--------------------------------\n\n' +
                      '❌ *Error*\n\n' +
                      'Sorry, there was a problem creating the QR code. Please try again or try a shorter text.'
            });
          }
        }
      }

      const TIMEOUT = 10000;
      for (const response of botResponses) {
        const telegramUrl = response.type === 'photo'
          ? `https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendPhoto`
          : `https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage`;

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

        await fetch(telegramUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      return new Response('OK', { status: 200 });
    } else {
      return new Response('Not Found', { status: 404 });
    }
  }
};

async function getFileUrl(fileId, token) {
  const TIMEOUT = 10000;
  const response = await fetchWithTimeout(
    `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`,
    { timeout: TIMEOUT }
  );
  const data = await response.json();
  return `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
}

async function scanQRCode(imageUrl) {
  const TIMEOUT = 10000;
  const response = await fetchWithTimeout(
    `https://api.qrserver.com/v1/read-qr-code/?fileurl=${encodeURIComponent(imageUrl)}`,
    { timeout: TIMEOUT }
  );
  const data = await response.json();
  return data[0].symbol[0].data;
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

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 8000 } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}
