const express = require('express');
const cors = require('cors');
const jsonwebtoken = require('jsonwebtoken');
const uuid = require('uuid-random');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const generate = (privateKey, { id, name, email, avatar, appId, kid }) => {
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
  }, privateKey, { algorithm: 'RS256', header: { kid } });
  return jwt;
};

// Load environment variables
const privateKeyRaw = process.env.JAAS_PRIVATE_KEY || '';
const privateKeyPEM = `-----BEGIN PRIVATE KEY-----\n${privateKeyRaw}\n-----END PRIVATE KEY-----`;
const JAAS_PRIVATE_KEY = Buffer.from(privateKeyPEM).toString();
const JAAS_APP_ID = process.env.JAAS_APP_ID;
const JAAS_KID = process.env.JAAS_KID;

app.post('/generate-jwt', (req, res) => {
  try {
    const jwt = generate(JAAS_PRIVATE_KEY, {
      id: uuid(),
      name: "Claims Verification User",
      email: "user@example.com",
      avatar: "",
      appId: JAAS_APP_ID,
      kid: JAAS_KID
    });

    res.json({ jwt });
  } catch (error) {
    console.error('JWT Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate JWT' });
  }
});

app.listen(port, () => {
  console.log(`JWT Server running on port ${port}`);
});
