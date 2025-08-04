import { AccessToken, privileges } from './AccessToken.js';

export const RtcRole = {
  PUBLISHER: 1,
  SUBSCRIBER: 2
};

export const RtcTokenBuilder = {
  async buildTokenWithUid(appID, appCertificate, channelName, uid, role, privilegeExpireTs) {
    const token = new AccessToken(appID, appCertificate, channelName, uid);
    token.addPrivilege(privileges.kJoinChannel, privilegeExpireTs);

    if (role === RtcRole.PUBLISHER) {
      token.addPrivilege(privileges.kPublishAudioStream, privilegeExpireTs);
      token.addPrivilege(privileges.kPublishVideoStream, privilegeExpireTs);
      token.addPrivilege(privileges.kPublishDataStream, privilegeExpireTs);
    }

    return await token.build();
  }
};
