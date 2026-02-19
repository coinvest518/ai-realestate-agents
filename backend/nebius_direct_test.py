import os, json, sys
from dotenv import load_dotenv
import httpx

# Load .env (matches how backend loads it)
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
load_dotenv()

key = os.getenv('NEBIUS_API_KEY')
model = os.getenv('NEBIUS_MODEL') or 'meta-llama/Meta-Llama-3.1-8B-Instruct'

# Validate environment variables
if not key:
    print("Error: NEBIUS_API_KEY is missing. Please check your .env file.")
    sys.exit(1)
if not model:
    print("Error: NEBIUS_MODEL is missing. Please check your .env file.")
    sys.exit(1)

print('NEBIUS_API_KEY present in env:', bool(key))
if key:
    # Mask key when printing
    print('NEBIUS_API_KEY preview:', (key[:8] + '...' + key[-4:]) if len(key) > 12 else key)
print('Using NEBIUS_MODEL:', model)

url = 'https://api.tokenfactory.nebius.com/v1/chat/completions'
payload = {
    'model': model,
    'messages': [{'role': 'user', 'content': 'ping'}],
    'max_tokens': 40,
}

try:
    headers = {'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'}
    print("Sending request to Nebius API...")
    print("Payload:", json.dumps(payload, indent=2))
    with httpx.Client(timeout=30.0) as client:
        r = client.post(url, headers=headers, json=payload)
        print('HTTP status:', r.status_code)
        if r.status_code == 401:
            print("Error: Unauthorized. Please check your NEBIUS_API_KEY.")
            sys.exit(1)
        elif r.status_code != 200:
            print(f"Error: Received unexpected HTTP status {r.status_code}.")
            print("Response text:", r.text[:200])
            sys.exit(1)
        try:
            jr = r.json()
            print('Response JSON (truncated):')
            print(json.dumps(jr, indent=2)[:4000])
        except Exception as e:
            print('Non-JSON response:', r.text[:2000])
            print('Error parsing JSON:', str(e))
            sys.exit(2)
except httpx.RequestError as e:
    print('Request error:', str(e))
    sys.exit(2)
except Exception as e:
    print('Unexpected error:', str(e))
    sys.exit(3)
