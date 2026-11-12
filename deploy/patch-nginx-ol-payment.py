#!/usr/bin/env python3
"""把 /ol-payment/ 代理写进 95chong.cn 的 Nginx 配置。"""
from pathlib import Path
import re
import sys

path = Path("/etc/nginx/conf.d/95chong.cn.conf")
text = path.read_text(encoding="utf-8")
snippet = """
    location /ol-payment/ {
        proxy_pass https://ol-payment.sanguosha.com/;
        proxy_ssl_server_name on;
        proxy_set_header Host ol-payment.sanguosha.com;
        proxy_set_header User-Agent $http_user_agent;
        proxy_set_header Origin https://web.sanguosha.com;
        proxy_set_header Referer https://web.sanguosha.com/;
        proxy_set_header Cookie "";
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 10s;
        proxy_read_timeout 30s;
        proxy_hide_header Access-Control-Allow-Origin;
        proxy_hide_header Access-Control-Allow-Credentials;
        proxy_hide_header Set-Cookie;
    }
"""

if "location /ol-payment/" in text:
    print("already present")
    sys.exit(0)

blocks = re.split(r"(?=^server \{)", text, flags=re.M)
out = []
changed = 0
for block in blocks:
    if (
        "server_name 95chong.cn;" in block
        and "sgs-recharge-95/dist" in block
        and "location /ol-payment/" not in block
    ):
        matched = re.search(r"\n    location / \{\n        try_files", block)
        if not matched:
            raise SystemExit("location / not found in block")
        block = block[: matched.start()] + "\n" + snippet + block[matched.start() :]
        changed += 1
    out.append(block)

if changed == 0:
    raise SystemExit("no block updated")

path.write_text("".join(out), encoding="utf-8")
print(f"updated {changed} blocks")
