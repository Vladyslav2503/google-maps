import { useEffect, useRef, useState, useCallback } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { MarkerData } from '../types/types';
import { db } from '../config/firestore-config';

const useMapMarkers = (initialCenter: { lat: number, lng: number }) => {
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
            Next: null
        };
        try {
            const docRef = await addDoc(collection(db, "markers"), newMarker);
            newMarker.id = docRef.id;
            setMarkers(prevMarkers => [...prevMarkers, newMarker]);
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

    return {
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
    };
};

export default useMapMarkers;
