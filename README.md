
# 🎯 AlgoRadar Extension 

Chrome extension to track upcoming competitive programming contests from multiple platforms.

## Features

- **Multi-Platform**: Codeforces, AtCoder, LeetCode, CodeChef, Kaggle, and more
- **Smart Filters**: Filter by platform and time (Today, Week, Month)
- **Fast**: Smart caching with 20-minute refresh
- **Beautiful**: Clean dark theme interface
- **Secure**: Backend API protects CLIST credentials
- **Free Forever**: No ads, no tracking, open source

##  Installation

### From Chrome Web Store (Coming Soon)
[Link will be added after approval]

### Manual Installation (For Development)
1. Clone this repository
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `extension` folder

##  Project Structure

```markdown
algoradar/
├── api/              # Backend (Vercel serverless)
│   └── contests.js   # CLIST API proxy
├── extension/        # Chrome extension
│   ├── manifest.json
│   ├── background.js
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
```
 Development
Backend Development
bash# Install dependencies
npm install -g vercel

# Run locally
vercel dev

# Deploy to production
vercel --prod


### Extension Development
1. Make changes in `extension/` folder
2. Go to `chrome://extensions/`
3. Click reload icon on AlgoRadar
4. Test changes

##  Backend API(Proxy Server)

The backend is deployed on Vercel and provides:
- Secure CLIST API proxy
- 20-minute caching
- Request queuing (prevents rate limits)
- Rate limiting per IP
- Graceful error handling

**Endpoint**: `https://algoradar-extension.vercel.app/api/contests`

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Backend**: Vercel Serverless Functions
- **API**: CLIST API
- **Deployment**: Vercel (backend), Chrome Web Store (extension)

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE)

## Attribution

- Contest data powered by [CLIST](https://clist.by)
- AlgoRadar is an independent community project

## Contact

- Issues: [GitHub Issues](https://github.com/YOUR_USERNAME/algoradar/issues)
- Contact: [Website](https://algo-radar.vercel.app/contact)

---

Built with ❤️ for the competitive programming community
```
