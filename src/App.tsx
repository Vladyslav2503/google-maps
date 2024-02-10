import React, { useRef } from 'react';
import './App.css';
import {Libraries, useJsApiLoader } from '@react-google-maps/api';
import Map from './components/Map/Map';



const API_KEY  = process.env.REACT_APP_API_KEY

const defaultCenter = {
  lat: 51.509865,
  lng: -0.118092

}


const apiKey: string = API_KEY || "";
const libraries: Libraries = ["places"];

function App() {

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries
  })



  console.log(API_KEY)
  return (
    <div className="App">
      {isLoaded ?  <Map center={defaultCenter} /> : <h2>Loading</h2>}
     
    </div>
  );
}

export default App;
