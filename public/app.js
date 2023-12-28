const clientId = 'client_id';
const redirectUri = 'http://localhost:5500/callback';
const scope = 'user-read-private user-read-email user-top-read';

document.addEventListener('DOMContentLoaded', () => {
  const loginButton = document.getElementById('login-button');
  const reminderContainer = document.getElementById('reminder-container');
  const tracksListContainer = document.getElementById('tracks-list');

  // Check if the access token is present in the URL
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');

  if (code) {
    // Exchange the code for an access token
    // Handle the authentication and update the DOM with top tracks
    authenticateAndDisplayTopTracks(code);
  } else {
    // Check if the user is already logged in (has an access token)
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      // Hide the login button
      loginButton.style.display = 'none';
      // Display a reminder
      reminderContainer.style.display = 'block';
      // Get top tracks and update the DOM
      getTopTracks(accessToken)
        .then(topTracks => displayTopTracks(topTracks))
        .catch(error => console.error('Error fetching top tracks:', error));
    }
  }

  loginButton.addEventListener('click', () => {
    // Redirect to Spotify login
    window.location.href = `http://localhost:5500/login?${new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: scope,
      redirect_uri: redirectUri,
    })}`;
  });

  async function authenticateAndDisplayTopTracks(code) {
    try {
      const response = await axios.post('http://localhost:5500/callback', { code });

      const accessToken = response.data.access_token;

      // Save access token in localStorage
      localStorage.setItem('accessToken', accessToken);

      // Hide the login button
      loginButton.style.display = 'none';
      // Display a reminder
      reminderContainer.style.display = 'block';

      // Get top tracks and update the DOM
      const topTracks = await getTopTracks(accessToken);
      displayTopTracks(topTracks);
    } catch (error) {
      console.error('Error during authentication:', error);
    }
  }

  async function getTopTracks(accessToken) {
    try {
      const response = await axios.get('http://localhost:5500/top-tracks', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });      
  
      console.log('Top tracks response:', response.data);
  
      return response.data;
    } catch (error) {
      console.error('Error fetching top tracks:', error);
      throw error;
    }
  }
  
  function displayTopTracks(tracks) {
    console.log('Top tracks:', tracks);
  
    const tracksListHtml = tracks.map(track => `
      <div class="col-md-4 mb-4">
        <div class="card">
          <img src="${track.image}" class="card-img-top" alt="${track.name}">
          <div class="card-body">
            <h5 class="card-title">${track.name}</h5>
            <p class="card-text">${track.artists}</p>
          </div>
        </div>
      </div>
    `).join('');
  
    tracksListContainer.innerHTML = tracksListHtml;
  }
  
});
