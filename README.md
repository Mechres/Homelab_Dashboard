# Dashboard Application
<img width="973" height="755" alt="screenshot" src="https://github.com/user-attachments/assets/87aef2bb-7f79-4202-a679-3ef2d1c99f93" />

A simple web dashboard to organize and monitor your self-hosted services and favorite links.

## Features
- Group links by categories.
- Real-time status checks (ping) for each URL.
- Configurable via `config.yaml`.
- Modern, responsive UI.

## Setup

1. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Application:**
   ```bash
   python app.py
   ```
   The application will be available at `http://localhost:8001`.

## Configuration
Edit `config.yaml` to add your categories and links.

## Deployment (Ubuntu Server)
To run this as a system service:

1. Create a service file:
   `sudo nano /etc/systemd/system/dashboard.service`

2. Add the following content (update paths):
   ```ini
   [Unit]
   Description=Dashboard Web Application
   After=network.target

   [Service]
   User=your_username
   WorkingDirectory=/path/to/Dashboard
   ExecStart=/usr/bin/python3 app.py
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl start dashboard
   sudo systemctl enable dashboard
   ```
