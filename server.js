const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const path = require('path');

const app = express();
const PORT = 5500;

// Use your own client id and secret from your spotify app
const clientId = 'client_id';
const clientSecret = 'client_secret';
const redirectUri = 'http://localhost:5500/callback';
const scope = 'user-read-private user-read-email user-top-read';

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/login', (req, res) => {
  res.redirect(`https://accounts.spotify.com/authorize?${querystring.stringify({
    response_type: 'code',
    client_id: clientId,
    scope: scope,
    redirect_uri: redirectUri,
  })}`);
});

app.post('/callback', async (req, res) => {
  const { code } = req.body;

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      querystring.stringify({
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Send the access token in the response
    res.json(response.data);
  } catch (error) {
    console.error('Error exchanging code for access token:', error);
    res.status(500).json({ error: 'Error during authentication' });
  }
});

app.get('/top-tracks', async (req, res) => {
  // Check if the Authorization header is present
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const accessToken = req.headers.authorization.replace('Bearer ', '');

  try {
    const response = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        time_range: 'short_term',
        limit: 20,
      },
    });

    const tracks = response.data.items.map(({ name, artists, album }) => ({
      name,
      artists: artists.map(artist => artist.name).join(', '),
      image: album.images.length > 0 ? album.images[0].url : null,
    }));

    res.json(tracks);
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    res.status(500).json({ error: 'Error fetching top tracks' });
  }
});

app.get('/callback', (req, res) => {
  // Handle GET requests for the /callback route
  // You can either redirect to the home page or serve an HTML page
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
