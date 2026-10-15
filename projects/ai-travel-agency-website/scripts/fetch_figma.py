# scripts/fetch_figma.py
import urllib.request
import json
import os

token = os.environ.get('FIGMA_ACCESS_TOKEN', '')
file_key = 'BNQ7rawkVVu47o41DAFalL'
node_id = '160:286'

os.makedirs('docs', exist_ok=True)

# 1. Fetch Node 160:286
url = f'https://api.figma.com/v1/files/{file_key}/nodes?ids={node_id}'
req = urllib.request.Request(url, headers={'X-Figma-Token': token})

try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print('SUCCESS: Fetched Figma node 160:286!')
        print('File Name:', data.get('name'))
        nodes = data.get('nodes', {})
        for nid, ninfo in nodes.items():
            doc = ninfo.get('document', {})
            print(f"Node {nid}: Name='{doc.get('name')}', Type='{doc.get('type')}'")
            children = doc.get('children', [])
            print(f"Children count: {len(children)}")
            for idx, c in enumerate(children):
                print(f"  [{idx}] '{c.get('name')}' ({c.get('type')})")
        with open('docs/figma_node_160_286.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
except Exception as e:
    print('Error fetching node:', e)

# 2. Fetch File Overview (Pages & Canvas structure)
file_url = f'https://api.figma.com/v1/files/{file_key}?depth=2'
req_file = urllib.request.Request(file_url, headers={'X-Figma-Token': token})
try:
    with urllib.request.urlopen(req_file) as resp:
        file_data = json.loads(resp.read().decode('utf-8'))
        print('\nSUCCESS: Fetched Figma file structure!')
        print('Document Name:', file_data.get('name'))
        pages = file_data.get('document', {}).get('children', [])
        print(f"Pages count: {len(pages)}")
        for p in pages:
            print(f"Page: '{p.get('name')}' (Children: {len(p.get('children', []))})")
            for frame in p.get('children', [])[:10]:
                print(f"   - Frame: '{frame.get('name')}' (id={frame.get('id')}, type={frame.get('type')})")
        with open('docs/figma_file_overview.json', 'w', encoding='utf-8') as f:
            json.dump(file_data, f, indent=2)
except Exception as e:
    print('Error fetching file overview:', e)
