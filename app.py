import os
import yaml
import requests
from flask import Flask, render_template, request, redirect, url_for, jsonify

app = Flask(__name__)
CONFIG_FILE = 'config.yaml'

def load_config():
    if not os.path.exists(CONFIG_FILE):
        return {'categories': []}
    with open(CONFIG_FILE, 'r') as f:
        return yaml.safe_load(f) or {'categories': []}

def save_config(config):
    with open(CONFIG_FILE, 'w') as f:
        yaml.safe_dump(config, f, sort_keys=False)

@app.route('/')
def index():
    config = load_config()
    return render_template('index.html', categories=config.get('categories', []))

@app.route('/api/config', methods=['GET'])
def get_config():
    return jsonify(load_config())

@app.route('/api/config', methods=['POST'])
def update_config():
    data = request.json
    save_config(data)
    return jsonify({'status': 'success'})

@app.route('/api/ping', methods=['GET'])
def ping_url():
    url = request.args.get('url')
    if not url:
        return jsonify({'status': 'error', 'message': 'No URL provided'}), 400
    
    try:
        # 2s timeout for quick status checks
        response = requests.get(url, timeout=2, verify=False)
        if response.status_code >= 200 and response.status_code < 400:
            return jsonify({'status': 'online', 'code': response.status_code})
        else:
            return jsonify({'status': 'offline', 'code': response.status_code})
    except Exception as e:
        return jsonify({'status': 'offline', 'error': str(e)})

if __name__ == '__main__':
    # Disable SSL warnings for self-hosted sites with local certs
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    app.run(debug=True, port=8001)
