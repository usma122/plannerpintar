# Jadwal Harian Pintar

A small single-page daily scheduler with a calendar-first UI, localStorage persistence, browser notifications, and a small AI help panel with file-attach preview.

Features
- Calendar-based task creation
- Modal task editor (no prompt/alert)
- Local `localStorage` persistence
- Browser Notification API with toast fallback
- AI help panel that accepts files and shows thumbnails

Run locally
1. Open `index.html` directly: `file:///.../index.html` (some features may be limited)
2. Recommended: serve with a local HTTP server:

```powershell
# from project folder
python -m http.server 8000
# then open http://localhost:8000/index.html
```

How to publish to GitHub
1. Initialize a local repo and commit:

```powershell
git init
git add .
git commit -m "Initial commit"
```

2. Create a repository on GitHub (via website or `gh` CLI) then push:

```powershell
# using GitHub web: set remote URL and push
git remote add origin https://github.com/<your-username>/<repo>.git
git branch -M main
git push -u origin main

# or using GitHub CLI (must be authenticated):
# gh repo create <repo-name> --public --source=. --remote=origin --push
```

License
- Place project license as needed.
