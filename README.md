
# <img width="30" height="30" alt="android-icon-48x48" src="https://github.com/user-attachments/assets/1d4f7a25-6c09-4fe7-87e3-a42be8a6e7f9" /> AlgoRadar Extension 

Chrome extension to track upcoming competitive programming contests from multiple platforms.

## Feature

- **Multi-Platform**: Codeforces, AtCoder, LeetCode, CodeChef, Kaggle, and more
- **Smart Filters**: Filter by platform and time (Today, Week, Month)
- **Fast & Reliable**: Contest data is served from scheduled, cached JSON updates with automatic background refresh
- **Beautiful**: Clean dark theme interface
- **Secure**: Backend API aggregates and caches CLIST data without exposing credentials
- **Free Forever**: No ads, no tracking, open source

##  Installation

### From Chrome Web Store 
[AlgoRadar](https://chromewebstore.google.com/detail/epmfbchmonbfhpmpkbpjlbdgngkilkea?utm_source=item-share-cb)

### Manual Installation (For Development)
1. Clone this repository
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `extension` folder

##  Project Structure

```markdown
algoradar/
├── api/                      # Backend (Vercel serverless)
│   └── contests.js           # Serves pre-generated contest data (no runtime CLIST calls)
│
├── data/                     # Generated contest data
│   └── contests.json         # Cached JSON updated via GitHub Actions cron
│
├── extension/                # Chrome extension
│   ├── manifest.json         # Extension manifest (MV3)
│   ├── background.js         # Background service worker (fetch + cache logic)
│   ├── popup.html            # Extension popup UI
│   ├── popup.css             # Popup styles
│   └── popup.js              # Popup interaction logic
│
├── .github/
│   └── workflows/
│       └── update-contests.yml  # Cron job to fetch contests from CLIST
│
└── README.md

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

## Backend API (Data Service)

The backend is deployed on Vercel and serves **pre-generated static contest data**.

- Contest data is fetched via a scheduled GitHub Actions cron job
- Data is stored as static JSON and served to clients
- No runtime calls to CLIST API
- Eliminates rate-limit risks and cold-start issues
- Backend only reads cached data at request time



## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Backend**: Vercel Serverless Functions
- **API**: CLIST API
- **Deployment**: Vercel (backend), Chrome Web Store (extension)

## Documentation
- Architecture and design rationale:  
  https://github.com/nilanshucodes/algoradar/wiki/Architecture-and-Design-Rationale
- Also Checkout:
  [Wiki](https://github.com/nilanshucodes/algoradar/wiki/)

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Known Limitations

- Contest data updates depend on the scheduled refresh interval (every 15–30 minutes)
- UI remains intentionally minimal to keep the extension lightweight


### Future Improvements
- Introduce Time zones 
- Optional persistent storage (only if future scale requires it)

## Latest Release (v1.2.0)

- **Global Timezone:** automatically detects your computer's system timezone.
- The "Time Remaining" now accurately matches the actual start time.
- Contests now remain visible and accessible right up until their official start time.
- No UI changes

## License

GPL-3.0 License - see [LICENSE](LICENSE)

## Attribution

- Contest data powered by [CLIST](https://clist.by)
- AlgoRadar is an independent community project

## Contact

- Issues: [GitHub Issues](https://github.com/nilanshucodes/algoradar-extension/issues)
- Contact: [Website](https://algo-radar.vercel.app/contact)

---

Built with ❤️ for the competitive programming community

