import React, { useState, useEffect } from "react";
const { ipcRenderer, shell } = window.require('electron');


const YouTube = () => {

  const [YouTubeAuthCode, setYouTubeAuthCode] = useState('');
  const [oauth2Client, setOauth2Client] = useState(null);

  const beginYt = async () => {

    //get apiServerPort
    var apiServerPort = null;
    try {
      apiServerPort = await ipcRenderer.invoke('get-api-server-port');
    } catch (err) {
      console.log('apiServerPort err=', err)
    }

    //get auth signin url from martinbarker.me
    var authSigninUrl = null;
    //const url = `https://martinbarker.me/getYtUrl?port=${apiServerPort}`;
    const url = `http://localhost:8080/getYtUrl?port=${apiServerPort}`;

    await fetch(url)
      .then(response => response.json())
      .then(data => {
        authSigninUrl = data.url;
      })
      .catch(error => console.error('caught err=', error));

    //open url in your browser
    try {
      console.log(authSigninUrl)
      //await ipcRenderer.invoke('open-url', `${authSigninUrl}`);
    } catch (err) {
      console.log(err)
    }
  }

  async function getYouTubeToken() {
    if (YouTubeAuthCode != "" && YouTubeAuthCode != null) {
      try {
        console.log('getYouTubeToken() YouTubeAuthCode=', YouTubeAuthCode)
        const encodedYouTubeAuthCode = YouTubeAuthCode; //encodeURIComponent(YouTubeAuthCode);
        //const url = `https://martinbarker.me/getYtToken?code=${encodedYouTubeAuthCode}`;
        const url = `http://localhost:8080/getYtToken?code=${encodedYouTubeAuthCode}`;


        await fetch(url)
          .then(response => response.json())
          .then(data => {
            console.log(`getYouTubeToken() data=`, data)
          })
          .catch(error => console.error('getYouTubeToken() err=', error));
      } catch (err) {
        console.error('getYouTubeToken() err=', err)
      }
    }
  }

  useEffect(() => {
    const handleYouTubeCode = async (event, arg) => {
      console.log('YouTubeCode Received: ', arg)
      setYouTubeAuthCode(arg.code)
      //authenticate online 
      await fetch(`http://localhost:8080/getOauth2Client?token=${arg.code}`)
        .then(response => response.json())
        .then(data => {
          console.log('handleYouTubeCode() data rsp:', data);
          setOauth2Client(data)
          console.log('SETTING LOCAL STORAGE')
          localStorage.setItem('oauth2Client', JSON.stringify(data))
          console.log('getting localstorage')
          let localEx = JSON.parse(localStorage.getItem('oauth2Client'))
          console.log('localEx=',localEx)
        })
        .catch(error => console.error('handleYouTubeCode() err=', error));
    }
    ipcRenderer.on('YouTubeCode', handleYouTubeCode);
    return () => {
      //ipcRenderer.removeListener('YouTubeCode', handleYouTubeCode);
    }
  }, []);

  useEffect(() => {
    // Function to call when YouTubeAuthCode changes
    const myFunction = () => {
      console.log('YouTubeAuthCode changed:', YouTubeAuthCode);
      getYouTubeToken()
    }
    myFunction();
  }, [YouTubeAuthCode]);

  //check for oauth2Client in localstorage
  useEffect(() => {
    const checkLocalStorage = () => {
      console.log('checkLocalStorag()')
      var oauth2ClientLocalStorageValue = localStorage.getItem("oauth2Client");
      if (oauth2ClientLocalStorageValue !== null) {
        console.log('oauth2ClientLocalStorageValue is not null, so set state value')
        let val = JSON.parse(oauth2ClientLocalStorageValue)
        console.log(val)
        setOauth2Client(val)
      } else {
        console.log("oauth2ClientLocalStorageValue is null");
      }
    };
    checkLocalStorage();
  }, []);

  const handleFileUpload = async (e) => {
    // Get the filepath of the first file
    const files = e.target.files;
    const videoFilepath = files[0].path;
    //upload
    console.log('handleFileUpload videoFilepath=',videoFilepath)
    let vidUploadRsp = await ipcRenderer.invoke('uploadvideo', {
      oauth2Client:oauth2Client, 
      videoFilepath:videoFilepath
    });

  };

  return (
    <>
      <button onClick={beginYt}>Open URL & Auth</button>
      <br />
      <div>
        <h3>Upload Videos:</h3>
        <input id='fileUpload' type="file" name="filefield" onChange={handleFileUpload} />
      </div>
    </>
  );
};

export default YouTube;
