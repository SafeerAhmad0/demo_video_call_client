const jsonwebtoken = require('jsonwebtoken');
const uuid = require('uuid-random');

/**
 * Function generates a JaaS JWT.
 */
interface JaaSTokenOptions {
  id: string;
  name: string;
  email: string;
  avatar: string;
  appId: string;
  kid: string;
}

const generate = (privateKey: string, { id, name, email, avatar, appId, kid }: JaaSTokenOptions): string => {
  const now = new Date()
  const jwt = jsonwebtoken.sign({
    aud: 'jitsi',
    context: {
      user: {
        id,
        name,
        avatar,
        email: email,
        moderator: 'true'
      },
      features: {
        livestreaming: 'true',
        recording: 'true',
        transcription: 'true',
        "outbound-call": 'true'
      }
    },
    iss: 'chat',
    room: '*',
    sub: appId,
    exp: Math.round(now.setHours(now.getHours() + 3) / 1000),
    nbf: (Math.round((new Date).getTime() / 1000) - 10)
  }, privateKey, { algorithm: 'RS256', header: { kid } })
  return jwt;
}

export default generate;
