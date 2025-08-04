/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { RtcTokenBuilder, RtcRole } from './utils/RtcTokenBuilder.js'

const APP_ID = '4d33f7f880db49a9a4f6a2aba40719a6';
const APP_CERTIFICATE = 'd2902907b24c4de4ad43e8174897e481';

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
