# Agora Token Server (Cloudflare Worker)

Generate RTC tokens on the edge with Cloudflare Workers using Web Crypto API.

## Features

- ✅ ESM-compatible
- ✅ No Node.js dependencies (`crypto`, `crc-32`, etc.)
- ✅ Supports RTC roles: publisher / subscriber

## API Usage

```http
GET https://<your-worker>.workers.dev/?channel=<channelName>&uid=<uid>
