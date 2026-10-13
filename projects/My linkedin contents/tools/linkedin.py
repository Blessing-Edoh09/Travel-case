"""Post text updates to LinkedIn using the official Posts API.

Reads credentials from .env:
- LINKEDIN_ACCESS_TOKEN: OAuth token from a LinkedIn app with the
  w_member_social scope.
- LINKEDIN_OWNER_URN: author URN, for example urn:li:person:abc123.

Usage:
    python tools/linkedin.py post "Post text here"
    python tools/linkedin.py post --org "Post as company page"
"""

import json
import os
import sys
import urllib.error
import urllib.request

from pathlib import Path

API_URL = "https://api.linkedin.com/rest/posts"

SETTINGS_PATH = Path(__file__).resolve().parent.parent


def load_env():
    env_vars = {}
    env_path = SETTINGS_PATH / ".env"
    if not env_path.exists():
        return env_vars
    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        env_vars[key.strip()] = value.strip()
    return env_vars


def build_payload(text, org_mode=False):
    env_vars = load_env()
    owner = env_vars.get("LINKEDIN_ORG_URN" if org_mode else "LINKEDIN_OWNER_URN")
    if not owner:
        raise SystemExit("Missing author URN in .env. Set LINKEDIN_OWNER_URN or LINKEDIN_ORG_URN.")
    return {
        "author": owner,
        "commentary": text,
        "visibility": "PUBLIC",
        "distribution": {
            "feedDistribution": "MAIN_FEED",
            "targetEntities": [],
            "thirdPartyDistributionChannels": [],
        },
        "lifecycleState": "PUBLISHED",
        "isReshareEnabledByAuthor": True,
    }


def post(text, org_mode=False):
    env_vars = load_env()
    token = env_vars.get("LINKEDIN_ACCESS_TOKEN")
    if not token:
        raise SystemExit("Missing LINKEDIN_ACCESS_TOKEN in .env.")
    payload = json.dumps(build_payload(text, org_mode)).encode("utf-8")
    request = urllib.request.Request(
        API_URL,
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "X-Restli-Protocol-Version": "2.0.0",
            "LinkedIn-Version": "202401",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request) as response:
            share_urn = response.headers.get("x-restli-id", "unknown")
            return 201, share_urn
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode("utf-8", errors="replace")


def main(argv):
    if len(argv) < 3 or argv[1] != "post":
        raise SystemExit(__doc__)
    org_mode = len(argv) > 3 and argv[2] == "--org"
    text = argv[3] if org_mode else argv[2]
    code, result = post(text, org_mode)
    print(f"status={code}")
    print(result)


if __name__ == "__main__":
    main(sys.argv)