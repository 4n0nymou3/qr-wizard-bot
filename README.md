# QR Wizard Bot 🤖

A Telegram bot that generates QR codes from text/links and scans QR codes from images. Built with Cloudflare Pages and supports both English and Persian languages.

## Live Demo 🚀

- **Bot Link**: [QR Code Wizard Bot](https://t.me/QRCWizardbot)
- **Developer Contact**: [BXAMbot](https://t.me/BXAMbot)

## Features ✨

- Generate QR codes from text or URLs
- Scan QR codes from images
- Bilingual interface (Persian/English)
- Clean and user-friendly design
- No ads or promotional content
- Fast and reliable performance
- Built on Cloudflare's global network

## Prerequisites 🧰

- Telegram account
- Cloudflare account
- Github
- Basic understanding of Cloudflare Pages and Telegram Bots

## Setup 🛠

1. Fork this repository
2. Create a new Telegram bot:
   - Start a chat with [@BotFather](https://t.me/botfather)
   - Send `/newbot` command
   - Follow the instructions to create your bot
   - Save your bot token for the next steps
3. Set up Cloudflare Pages:
   - Sign in to your Cloudflare account
   - Go to Pages section
   - Click "Create a project"
   - Choose "Connect to Github"
   - Select your forked repository
   - Configure build settings:
     - Framework preset: `None`
     - Build command: (leave empty)
     - Build output directory: `functions`
     - Root directory: (leave empty)
     - Environment variable:
       - Key: `TELEGRAM_TOKEN`
       - Value: Your Telegram bot token from step 2
4. After deployment, set up your Telegram webhook:
   ```bash
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<YOUR_PAGES_URL>
   ```
   Replace `<YOUR_BOT_TOKEN>` with your actual bot token and `<YOUR_PAGES_URL>` with your Cloudflare Pages URL

## Project Structure 📁

```
qr-wizard-bot/
├── functions/
│   └── _worker.js     # Main bot logic
├── LICENSE            # MIT License
└── README.md          # Project documentation
```

## Usage 📝

1. Start a chat with your bot on Telegram
2. To create a QR code:
   - Simply send any text or URL
   - The bot will respond with a QR code image
3. To scan a QR code:
   - Send any image containing a QR code
   - The bot will read and send you the content

## Technical Details 🔧

- Built with Cloudflare Pages
- Uses Cloudflare Workers for serverless functionality
- Integrates with Telegram Bot API
- Utilizes QR Server API for QR operations
- Environment variables for secure token management
- Stateless architecture for reliability

## Limitations ⚠️

- Maximum text length for QR code generation: 850 characters
- Supports QR code generation and scanning
- Requires a stable internet connection

## Performance 📊

- Low latency due to Cloudflare's global network
- Minimal resource consumption
- Quick QR code generation and scanning

## Security 🔒

- No user data storage
- Serverless architecture
- Uses secure, encrypted API connections

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing 🤝

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Issues 🐛

Found a bug or have a suggestion? Please check the following:

1. Search existing issues to avoid duplicates
2. Create a new issue with a clear description
3. Include steps to reproduce (for bugs)
4. Add relevant screenshots if applicable

## Support 💬

If you need help with setup or usage:

1. Check existing issues for solutions
2. Create a new issue for support questions
3. Be specific about your problem
4. Include your setup details

## Acknowledgments 🙏

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Cloudflare Pages](https://pages.cloudflare.com/)
- QR Server API

---

Made with ❤️ for the open-source community