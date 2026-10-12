# ConsultantPulse CRM: run it on your own computer

Open **http://localhost:3000** once it's running. Your clients from the online app (Trionec) are
loaded automatically the first time it starts.

## Option A: Docker (easiest, one command, works the same on Windows / macOS / Linux)

1. Install **Docker Desktop**: https://www.docker.com/products/docker-desktop/ and start it.
2. Unzip this folder, open a terminal in it, and run:

   ```
   docker compose up
   ```

3. Open http://localhost:3000. The first start takes a few minutes while it downloads its parts.
   Stop it with `Ctrl+C`; your data is kept for the next start.

## Option C: in the browser with GitHub Codespaces (nothing to install)

1. On https://github.com create a new repository (Private is fine). Click **"uploading an existing file"**,
   drag in **everything inside** the unzipped `ConsultantPulse` folder (including the `.devcontainer` folder), and click **Commit changes**.
2. In the repository click **Code → Codespaces → Create codespace on main**.
3. Wait 3-5 minutes on the first start. The app opens by itself in a new tab
   (or open the **Ports** tab and click the globe next to port **3000**).
   If it doesn't start by itself (e.g. the hidden `.devcontainer` folder wasn't uploaded - on a Mac press
   `Cmd+Shift+.` in Finder to show it), type `docker compose up` in the codespace terminal and open port 3000.

Your data in a codespace lives inside that codespace. Stop the codespace when you're not using it
(free GitHub accounts include a monthly allowance of Codespaces hours).

## Option B: without Docker

Install once:
- **Python 3.11+**: https://www.python.org/downloads/ (on Windows tick "Add python.exe to PATH")
- **Node.js 20+**: https://nodejs.org/
- **MongoDB Community Server**: https://www.mongodb.com/try/download/community (install as a service so it runs on localhost:27017)

Then double-click **`start-windows.bat`** (Windows), or run `bash start-mac-linux.sh` (macOS / Linux).

## Good to know
- Data lives in your local MongoDB database `consultantpulse`, separate from the online app.
- Time zone for "today" / overdue visits: `APP_TZ` in `backend/.env` (default Europe/Bucharest).
- Folders: `backend/` = FastAPI API (port 8001), `frontend/` = React app (port 3000).
- `backend/assets/Solution-EDV.xlsx` is the template used by **Export Excel**.
