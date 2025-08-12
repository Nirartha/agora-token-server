import { RtcTokenBuilder, RtcRole } from './utils/RtcTokenBuilder.js'

const APP_ID = '<YOUR_APP_ID>';
const APP_CERTIFICATE = '<YOUR_APP_CERTIFICATE>';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const channelName = url.searchParams.get('channel');
    const uid = url.searchParams.get('uid') || '0';
    const role = url.searchParams.get('role') === 'subscriber' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

    if (!channelName) {
      return new Response('channel name is required', { status: 400 });
    }

    const expireTime = Math.floor(Date.now() / 1000) + 3600; // 1 小時
    const token = await RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, expireTime);

    return new Response(JSON.stringify({ token }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
