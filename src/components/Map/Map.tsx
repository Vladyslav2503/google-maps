import { GoogleMap, Marker, MarkerClusterer } from '@react-google-maps/api';
import { FC } from 'react';
import styles from "./Map.module.css";
import useMapMarkers from '../../hooks/MapMarkers';
import { Props, containerStyle } from '../../types/types';

const Map: FC<Props> = ({ center } ) => {
    const {
        markers,
        hoveredMarker,
        addMarker,
        deleteMarker,
        handleDeleteAllMarkers,
        handleMarkerMouseOver,
        handleMarkerMouseOut,
        handleDragStart,
        handleDragEnd,
        onLoad,
        onUnmount
    } = useMapMarkers(center);

    return (
        <div className={styles.container}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={10}
                onClick={addMarker}
                onLoad={onLoad}
                onUnmount={onUnmount}
            >
                <MarkerClusterer options={{ imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m' }}>
                    {clusterer => (
                        <div>
                            {markers.map((marker, index) => (
                                <Marker
                                    key={marker.id}
                                    position={{ lat: marker.Location.Lat, lng: marker.Location.Long }}
                                    onClick={() => deleteMarker(marker)}
                                    onMouseOver={() => handleMarkerMouseOver(marker)}
                                    onMouseOut={handleMarkerMouseOut}
                                    draggable
                                    onDragStart={() => handleDragStart(marker, index)}
                                    onDragEnd={event => handleDragEnd(marker, event)}
                                    clusterer={clusterer}
                                />
                            ))}
                        </div>
                    )}
                </MarkerClusterer>
            </GoogleMap>
            <button className={styles.deleteButton} onClick={handleDeleteAllMarkers}>Видалити всі маркери</button>
            {markers.length > 0 && hoveredMarker && (
                <div className={styles.hoveredMarkerInfo}>
                    Координати маркера: Lat: {hoveredMarker.Location.Lat.toFixed(6)}, Lng: {hoveredMarker.Location.Long.toFixed(6)} | Додано: {new Date(hoveredMarker.Time.toMillis()).toLocaleString()}
                </div>
            )}
        </div>
    );
};

export default Map;
