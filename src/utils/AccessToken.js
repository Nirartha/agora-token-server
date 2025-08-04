export const version = "006";

export const privileges = {
  kJoinChannel: 1,
  kPublishAudioStream: 2,
  kPublishVideoStream: 3,
  kPublishDataStream: 4,
  kRtmLogin: 1000
};

export async function encodeHmac(keyStr, messageBytes) {
  const keyBytes = new TextEncoder().encode(keyStr);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, messageBytes);
  return new Uint8Array(sig);
}

export function crc32(str) {
  const table = new Uint32Array(256).map((_, k) => {
    let c = k;
    for (let i = 0; i < 8; i++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    return c >>> 0;
  });
  let crc = 0 ^ -1;
  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ str.charCodeAt(i)) & 0xFF];
  }
  return (crc ^ -1) >>> 0;
}

function encodeUint16LE(val) {
  return new Uint8Array([val & 0xff, (val >> 8) & 0xff]);
}

function encodeUint32LE(val) {
  const buf = new Uint8Array(4);
  new DataView(buf.buffer).setUint32(0, val, true);
  return buf;
}

function ByteBuf() {
  const buffer = new Uint8Array(1024);
  let position = 0;

  return {
    putUint16(val) {
      buffer.set(encodeUint16LE(val), position);
      position += 2;
    },
    putUint32(val) {
      buffer.set(encodeUint32LE(val), position);
      position += 4;
    },
    putBytes(bytes) {
      this.putUint16(bytes.length);
      buffer.set(bytes, position);
      position += bytes.length;
    },
    putString(str) {
      const bytes = new TextEncoder().encode(str);
      this.putBytes(bytes);
    },
    putTreeMapUInt32(map) {
      const keys = Object.keys(map).map(k => parseInt(k));
      this.putUint16(keys.length);
      for (const k of keys) {
        this.putUint16(k);
        this.putUint32(map[k]);
      }
    },
    pack() {
      return buffer.slice(0, position);
    }
  };
}

function Message({ salt, ts, messages }) {
  return {
    pack() {
      const out = ByteBuf();
      out.putUint32(salt);
      out.putUint32(ts);
      out.putTreeMapUInt32(messages);
      return out.pack();
    }
  };
}

function AccessTokenContent({ signature, crc_channel, crc_uid, m }) {
  return {
    pack() {
      const out = ByteBuf();
      out.putBytes(signature); // 🧠 修正：不要用 putString，會導致格式錯誤
      out.putUint32(crc_channel);
      out.putUint32(crc_uid);
      out.putBytes(m);         // 🧠 同樣使用 bytes
      return out.pack();
    }
  };
}

function base64Encode(bytes) {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary);
}

export class AccessToken {
  constructor(appID, appCertificate, channelName, uid) {
    this.appID = appID;
    this.appCertificate = appCertificate;
    this.channelName = channelName;
    this.uid = uid === 0 ? "" : String(uid);
    this.messages = {};
    this.salt = Math.floor(Math.random() * 0xffffffff);
    this.ts = Math.floor(Date.now() / 1000) + 86400;
  }

  addPrivilege(privilege, expireTs) {
    this.messages[privilege] = expireTs;
  }

  async build() {
    const m = Message({
      salt: this.salt,
      ts: this.ts,
      messages: this.messages
    }).pack();

    const toSign = new Uint8Array([
      ...new TextEncoder().encode(this.appID),
      ...new TextEncoder().encode(this.channelName),
      ...new TextEncoder().encode(this.uid),
      ...m
    ]);

    const signature = await encodeHmac(this.appCertificate, toSign);

    const crc_channel = crc32(this.channelName);
    const crc_uid = crc32(this.uid);

    const content = AccessTokenContent({
      signature,
      crc_channel,
      crc_uid,
      m
    }).pack();

    return version + this.appID + base64Encode(content);
  }
}
