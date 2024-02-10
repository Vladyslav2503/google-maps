import { Timestamp } from 'firebase/firestore';

export const containerStyle = {
    width: '100%',
    height: '100%'
};

export interface Location {
    Lat: number;
    Long: number;
}

export interface MarkerData {
    id: string;
    Location: Location;
    Time: Timestamp;
}

export type Props = {
    center: google.maps.LatLngLiteral 
}

