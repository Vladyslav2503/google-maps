import { GoogleMap, Marker, MarkerClusterer } from '@react-google-maps/api';
import { FC, useEffect, useRef, useState, useCallback } from 'react';
import styles from "./Map.module.css";
import { db } from '../../config/firestore-config';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { MarkerData, Props, containerStyle } from '../../types/types';

const Map: FC<Props> = ({ center } ) => {
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [hoveredMarker, setHoveredMarker] = useState<MarkerData | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const draggedMarkerIndexRef = useRef<number | null>(null);

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

    const addMarker = useCallback(async (event: google.maps.MapMouseEvent) => {
        if (!event || !event.latLng) return;
        const latValue = event.latLng.lat();
        const longValue = event.latLng.lng();
        const newMarker: MarkerData = {
            Location: { Lat: latValue, Long: longValue },
            Time: Timestamp.now(),
            id: Date.now().toString(),
            Next: null // Додати поле Next зі значенням null для нового маркера
        };
        try {
            const docRef = await addDoc(collection(db, "markers"), newMarker);
            newMarker.id = docRef.id;
            setMarkers(prevMarkers => [...prevMarkers, newMarker]);
            // Оновити попередній маркер, якщо він існує, щоб вказати на новий маркер
            if (markers.length > 0) {
                const prevMarker = markers[markers.length - 1];
                const updatedPrevMarker = { ...prevMarker, Next: newMarker.id };
                const prevMarkerDocRef = doc(collection(db, "markers"), prevMarker.id);
                await updateDoc(prevMarkerDocRef, updatedPrevMarker);
            }
        } catch (error) {
            console.error("Error adding marker: ", error);
        }
    }, [markers]);

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

    const handleDragStart = (marker: MarkerData, index: number) => {
        draggedMarkerIndexRef.current = index;
    };

    const handleDragEnd = async (marker: MarkerData, event: google.maps.MapMouseEvent) => {
        if (!event || !event.latLng) return;
        const newLat = event.latLng.lat();
        const newLng = event.latLng.lng();

        const updatedMarker: MarkerData = {
            ...marker,
            Location: { Lat: newLat, Long: newLng }
        };

        const markerIndex = markers.findIndex(m => m.id === marker.id);

        const updatedMarkers = [...markers];
        updatedMarkers[markerIndex] = updatedMarker;

        try {
            const markerDocRef = doc(collection(db, "markers"), marker.id);
            await updateDoc(markerDocRef, { Location: { Lat: newLat, Long: newLng } });
            setMarkers(updatedMarkers);
        } catch (error) {
            console.error("Error updating marker coordinates: ", error);
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
