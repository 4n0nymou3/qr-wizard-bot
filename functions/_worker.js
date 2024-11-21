export default
{
	async fetch(request, env)
	{
		console.log('Request received:'
		, {
			method: request.method
			, url: request.url
		});
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*'
			, 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
			, 'Access-Control-Allow-Headers': 'Content-Type'
		};
		if (request.method === 'OPTIONS')
		{
			return new Response(null
			, {
				headers: corsHeaders
			});
		}
		try
		{
			if (request.method === 'POST')
			{
				const reqBody = await request.json();
				console.log('Request body:', JSON.stringify(reqBody, null, 2));
				if (!env.TELEGRAM_TOKEN)
				{
					throw new Error('TELEGRAM_TOKEN environment variable is not set');
				}
				const chatId = reqBody.message?.chat?.id;
				if (!chatId)
				{
					throw new Error('Chat ID not found in request');
				}
				let botResponses = [];
				if (reqBody.message.text === '/start')
				{
					console.log('Processing /start command');
					botResponses.push(
					{
						type: 'text'
						, content: 'به ربات QR کد خوش آمدید\\! 🎉\n\n' + 'این ربات می‌تواند:\n' + '1️⃣ متن یا لینک شما را به QR کد تبدیل کند\\.\n' + '2️⃣ محتوای QR کد را از تصاویر ارسالی بخواند\\.\n\n' + 'لطفاً یک متن، لینک یا تصویر QR کد ارسال کنید\\.\n\n' + '\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\n\n' + 'Welcome to QR Code Bot\\! 🎉\n\n' + 'This bot can:\n' + '1️⃣ Convert your text or link to a QR code\\.\n' + '2️⃣ Read QR code content from your images\\.\n\n' + 'Please send a text, link, or QR code image\\.'
					});
				}
				else if (reqBody.message.photo)
				{
					console.log('Processing photo message');
					try
					{
						const fileId = reqBody.message.photo[reqBody.message.photo.length - 1].file_id;
						console.log('File ID:', fileId);
						const fileUrl = await getFileUrl(fileId, env.TELEGRAM_TOKEN);
						console.log('File URL:', fileUrl);
						// Get the image data
						const imageResponse = await fetch(fileUrl);
						const imageBlob = await imageResponse.blob();
						const qrContent = await scanQRCode(imageBlob);
						console.log('QR Content:', qrContent);
						if (qrContent)
						{
							const escapedContent = escapeMarkdown(qrContent);
							botResponses.push(
							{
								type: 'text'
								, content: '🔍 *بارکد خوان*\n\n' + 'محتوای تصویر QR کد اسکن شده:\\.\n\n' + '\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\n\n' + '🔍 *QR Code Scanner*\n\n' + 'Scanned QR code content:'
							});
							botResponses.push(
							{
								type: 'text'
								, content: `\`${escapedContent}\``
							});
						}
						else
						{
							throw new Error('QR code content is empty');
						}
					}
					catch (error)
					{
						console.error('Error processing photo:', error);
						botResponses.push(
						{
							type: 'text'
							, content: '❌ *خطا*\n\n' + 'نمی‌توانم محتوای تصویر QR کد را بخوانم\\. لطفاً مطمئن شوید که تصویر شامل یک QR کد معتبر و خوانا است\\.\n\n' + '\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\n\n' + '❌ *Error*\n\n' + 'I cannot read the QR code content\\. Please make sure the image contains a valid and readable QR code\\.'
						});
					}
				}
				else if (reqBody.message.text && reqBody.message.text !== '/start')
				{
					console.log('Processing text message');
					const message = reqBody.message.text;
					if (message.trim() === '')
					{
						botResponses.push(
						{
							type: 'text'
							, content: '❌ *خطا*\n\n' + 'لطفاً یک متن یا لینک معتبر وارد کنید\\.\n\n' + '\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\n\n' + '❌ *Error*\n\n' + 'Please enter a valid text or link\\.'
						});
					}
					else if (message.length > 1000)
					{
						botResponses.push(
						{
							type: 'text'
							, content: '❌ *خطا*\n\n' + 'طول پیام نباید بیشتر از 1000 کاراکتر باشد\\.\n\n' + '\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\n\n' + '❌ *Error*\n\n' + 'Message length should not exceed 1000 characters\\.'
						});
					}
					else if (message.startsWith('http') && !isValidUrl(message))
					{
						botResponses.push(
						{
							type: 'text'
							, content: '❌ *خطا*\n\n' + 'لطفاً یک آدرس اینترنتی معتبر وارد کنید\\.\n\n' + '\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\n\n' + '❌ *Error*\n\n' + 'Please enter a valid URL\\.'
						});
					}
					else
					{
						try
						{
							const QR_COLOR = '262626';
							const QR_BG_COLOR = 'D9D9D9';
							const QR_SIZE = 400;
							const QR_MARGIN = 10;
							const photoUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${QR_SIZE}x${QR_SIZE}&data=${encodeURIComponent(message)}&color=${QR_COLOR}&bgcolor=${QR_BG_COLOR}&margin=${QR_MARGIN}&format=png&qzone=2`;
							console.log('Generated QR URL:', photoUrl);
							botResponses.push(
							{
								type: 'photo'
								, content: photoUrl
								, caption: '🖨 *ساخت بارکد*\n\n' + 'تصویر QR کد شما با موفقیت ایجاد شد\\.\n\n' + '\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\n\n' + '🖨 *QR Code Generator*\n\n' + 'Your QR code image was successfully created\\.'
							});
						}
						catch (error)
						{
							console.error('Error generating QR code:', error);
							botResponses.push(
							{
								type: 'text'
								, content: '❌ *خطا*\n\n' + 'متأسفانه در ایجاد QR کد مشکلی پیش آمد\\. لطفاً دوباره تلاش کنید یا متن کوتاه‌تری را امتحان کنید\\.\n\n' + '\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\n\n' + '❌ *Error*\n\n' + 'Sorry, there was a problem creating the QR code\\. Please try again or try a shorter text\\.'
							});
						}
					}
				}
				console.log('Prepared responses:', JSON.stringify(botResponses, null, 2));
				if (botResponses.length > 0)
				{
					await sendResponsesToTelegram(botResponses, chatId, env.TELEGRAM_TOKEN);
				}
				return new Response('OK'
				, {
					status: 200
					, headers: corsHeaders
				});
			}
			return new Response('Method Not Allowed'
			, {
				status: 405
				, headers: corsHeaders
			});
		}
		catch (error)
		{
			console.error('Error processing request:', error);
			return new Response(JSON.stringify(
			{
				error: error.message
				, stack: error.stack
			})
			, {
				status: 500
				, headers:
				{
					...corsHeaders
					, 'Content-Type': 'application/json'
				}
			});
		}
	}
};
async function sendResponsesToTelegram(botResponses, chatId, token)
{
	for (const response of botResponses)
	{
		const telegramUrl = response.type === 'photo' ? `https://api.telegram.org/bot${token}/sendPhoto` : `https://api.telegram.org/bot${token}/sendMessage`;
		const payload = response.type === 'photo' ?
		{
			chat_id: chatId
			, photo: response.content
			, caption: response.caption
			, parse_mode: 'MarkdownV2'
		} :
		{
			chat_id: chatId
			, text: response.content
			, parse_mode: 'MarkdownV2'
		};
		try
		{
			console.log('Sending to Telegram:'
			, {
				url: telegramUrl
				, type: response.type
				, chat_id: chatId
			});
			const result = await fetch(telegramUrl
			, {
				method: 'POST'
				, headers:
				{
					'Content-Type': 'application/json'
				}
				, body: JSON.stringify(payload)
			});
			const responseData = await result.json();
			console.log('Telegram API response:', JSON.stringify(responseData, null, 2));
			if (!result.ok)
			{
				throw new Error(`Telegram API error: ${JSON.stringify(responseData)}`);
			}
		}
		catch (error)
		{
			console.error('Error sending message to Telegram:', error);
			throw error;
		}
	}
}
async function getFileUrl(fileId, token)
{
	console.log('Getting file URL for fileId:', fileId);
	const response = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
	const data = await response.json();
	console.log('getFile response:', data);
	if (!data.ok)
	{
		throw new Error(`Telegram getFile error: ${JSON.stringify(data)}`);
	}
	const fileUrl = `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
	console.log('Generated file URL:', fileUrl);
	return fileUrl;
}
async function scanQRCode(imageBlob)
{
	console.log('Scanning QR code from blob');
	const formData = new FormData();
	formData.append('file', imageBlob, 'qr.png');
	const response = await fetch('https://api.qrserver.com/v1/read-qr-code/'
	, {
		method: 'POST'
		, body: formData
	});
	const data = await response.json();
	console.log('QR scan response:', JSON.stringify(data, null, 2));
	if (!data[0]?.symbol[0]?.data)
	{
		throw new Error('QR code could not be read');
	}
	return data[0].symbol[0].data;
}

function escapeMarkdown(text)
{
	return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

function isValidUrl(string)
{
	try
	{
		new URL(string);
		return true;
	}
	catch (_)
	{
		return false;
	}
}