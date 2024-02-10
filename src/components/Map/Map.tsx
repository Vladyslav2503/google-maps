import { GoogleMap, Marker, MarkerClusterer } from '@react-google-maps/api';
import { FC, useEffect, useRef, useState } from 'react';
import styles from "./Map.module.css";
import { db } from '../../config/firestore-config';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { Location, MarkerData, Props, containerStyle } from '../../types/types';


const Map: FC<Props> = ({ center } ) => {
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [hoveredMarker, setHoveredMarker] = useState<MarkerData | null>(null);

    const mapRef = useRef<google.maps.Map | null>(null);
    const draggedMarkerRef = useRef<MarkerData | null>(null);

    useEffect(() => {
        const getMarkers = async () => {
            try {
                const data = await getDocs(collection(db, "markers"));
                const filteredData = data.docs.map(doc => ({ ...doc.data(), id: doc.id }) as MarkerData);
                setMarkers(filteredData);
            } catch (error) {
                console.error("Error fetching markers: ", error);
            }
        };
        getMarkers();
    }, []);

    const addMarker = async (event: google.maps.MapMouseEvent) => {
        if (!event || !event.latLng) return;

        const latValue = event.latLng.lat()
        const longValue = event.latLng.lng()

        const newMarker: MarkerData = {
            Location: {
                Lat: latValue,
                Long: longValue
            },
            Time: Timestamp.now(),
            id: Date.now().toString()
        };
        try {

            const docRef = await addDoc(collection(db, "markers"), newMarker);
            newMarker.id = docRef.id;
            setMarkers(prevMarkers => [...prevMarkers, newMarker]);
        } catch (error) {
            console.error("Error adding marker: ", error);
        }
    };

    const deleteMarker = async (marker: MarkerData) => {
        try {
            await deleteDoc(doc(collection(db, "markers"), marker.id));
            const updatedMarkers = markers.filter(m => m.id !== marker.id);
            setMarkers(updatedMarkers);
        } catch (error) {
            console.error("Error deleting marker: ", error);
        }
    };

    const handleDeleteAllMarkers = async () => {
        try {
            const snapshot = await getDocs(collection(db, "markers"));
            const batch = writeBatch(db);
            snapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            setMarkers([]);
        } catch (error) {
            console.error("Error deleting all markers: ", error);
        }
    };

    const handleMarkerMouseOver = (marker: MarkerData) => {
        setHoveredMarker(marker);
    };

    const handleMarkerMouseOut = () => {
        setHoveredMarker(null);
    };

    const handleDragStart = (event: google.maps.MapMouseEvent, marker: MarkerData) => {
        draggedMarkerRef.current = marker;
    };

    const handleDragEnd = async (marker: MarkerData, event: google.maps.MapMouseEvent) => {
        if (!event || !event.latLng) return;
        const Location: Location = {
            Lat: event.latLng.lat(),
            Long: event.latLng.lng()
        };

        const updatedMarkers = markers.map(m => {
            if (m === marker) {
                return {
                    ...m,
                    Location: { ...m.Location, Lat: Location.Lat, Long: Location.Long },
                    Time: Timestamp.now()
                };
            }
            return m;
        });

        try {
            await updateMarkerInFirestore(marker.id, { Location: { Lat: Location.Lat, Long: Location.Long } });
            setMarkers(updatedMarkers);
        } catch (error) {
            console.error("Error updating marker coordinates: ", error);
        }
    };

    const updateMarkerInFirestore = async (markerId: string, newData: Partial<MarkerData>) => {
        try {
            const markerDocRef = doc(collection(db, "markers"), markerId);
            await updateDoc(markerDocRef, newData);
        } catch (error) {
            console.error("Error updating marker in Firestore: ", error);
        }
    };

    const onLoad = (map: google.maps.Map) => {
        mapRef.current = map;
    };

    const onUnmount = () => {
        mapRef.current = null;
    };

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
                            {markers.map(marker => (
                                <Marker
                                    key={marker.id}
                                    position={{ lat: marker.Location.Lat, lng: marker.Location.Long }}
                                    onClick={() => deleteMarker(marker)}
                                    onMouseOver={() => handleMarkerMouseOver(marker)}
                                    onMouseOut={handleMarkerMouseOut}
                                    draggable
                                    onDragStart={event => handleDragStart(event, marker)}
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