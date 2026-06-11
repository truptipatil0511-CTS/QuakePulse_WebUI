import { Earthquake } from './earthquake.model';

export const MOCK_EARTHQUAKES: Earthquake[] = [
  { id: 'usp000jmqz', magnitude: 7.2, place: 'Northwest of Honshu, Japan', time: new Date(Date.now() - 2 * 3600000).toISOString(), coordinates: { latitude: 38.2, longitude: 141.9 }, depth: 35 },
  { id: 'usp000jmr2', magnitude: 6.1, place: 'Central Italy', time: new Date(Date.now() - 5 * 3600000).toISOString(), coordinates: { latitude: 42.3, longitude: 13.4 }, depth: 12 },
  { id: 'usp000jmr3', magnitude: 5.8, place: 'Western Turkey', time: new Date(Date.now() - 8 * 3600000).toISOString(), coordinates: { latitude: 38.9, longitude: 27.1 }, depth: 10 },
  { id: 'usp000jmr4', magnitude: 4.8, place: 'Southern California, USA', time: new Date(Date.now() - 12 * 3600000).toISOString(), coordinates: { latitude: 33.8, longitude: -117.4 }, depth: 8 },
  { id: 'usp000jmr5', magnitude: 5.3, place: 'Sumatra, Indonesia', time: new Date(Date.now() - 18 * 3600000).toISOString(), coordinates: { latitude: -0.9, longitude: 100.2 }, depth: 42 },
  { id: 'usp000jmr6', magnitude: 3.9, place: 'Northern Chile', time: new Date(Date.now() - 24 * 3600000).toISOString(), coordinates: { latitude: -20.1, longitude: -69.3 }, depth: 68 },
  { id: 'usp000jmr7', magnitude: 6.4, place: 'New Zealand', time: new Date(Date.now() - 30 * 3600000).toISOString(), coordinates: { latitude: -43.5, longitude: 172.6 }, depth: 25 },
  { id: 'usp000jmr8', magnitude: 2.8, place: 'Nevada, USA', time: new Date(Date.now() - 36 * 3600000).toISOString(), coordinates: { latitude: 38.8, longitude: -119.2 }, depth: 5 },
  { id: 'usp000jmr9', magnitude: 5.1, place: 'Philippines Sea', time: new Date(Date.now() - 40 * 3600000).toISOString(), coordinates: { latitude: 10.5, longitude: 126.8 }, depth: 60 },
  { id: 'usp000jmra', magnitude: 4.3, place: 'Greece', time: new Date(Date.now() - 44 * 3600000).toISOString(), coordinates: { latitude: 37.2, longitude: 22.5 }, depth: 15 },
  { id: 'usp000jmrb', magnitude: 6.8, place: 'Peru–Brazil Border', time: new Date(Date.now() - 48 * 3600000).toISOString(), coordinates: { latitude: -9.1, longitude: -74.2 }, depth: 120 },
  { id: 'usp000jmrc', magnitude: 3.2, place: 'Oregon, USA', time: new Date(Date.now() - 52 * 3600000).toISOString(), coordinates: { latitude: 44.6, longitude: -122.7 }, depth: 18 },
  { id: 'usp000jmrd', magnitude: 5.6, place: 'Solomon Islands', time: new Date(Date.now() - 60 * 3600000).toISOString(), coordinates: { latitude: -8.3, longitude: 159.1 }, depth: 35 },
  { id: 'usp000jmre', magnitude: 4.1, place: 'Aegean Sea', time: new Date(Date.now() - 72 * 3600000).toISOString(), coordinates: { latitude: 39.7, longitude: 24.9 }, depth: 20 },
  { id: 'usp000jmrf', magnitude: 7.5, place: 'Tonga', time: new Date(Date.now() - 80 * 3600000).toISOString(), coordinates: { latitude: -20.5, longitude: -175.4 }, depth: 55 },
  { id: 'usp000jmrg', magnitude: 3.7, place: 'Oklahoma, USA', time: new Date(Date.now() - 90 * 3600000).toISOString(), coordinates: { latitude: 36.2, longitude: -97.8 }, depth: 7 },
  { id: 'usp000jmrh', magnitude: 5.0, place: 'Iran', time: new Date(Date.now() - 100 * 3600000).toISOString(), coordinates: { latitude: 35.6, longitude: 57.3 }, depth: 30 },
  { id: 'usp000jmri', magnitude: 2.5, place: 'Northern California, USA', time: new Date(Date.now() - 110 * 3600000).toISOString(), coordinates: { latitude: 40.1, longitude: -122.4 }, depth: 9 },
  { id: 'usp000jmrj', magnitude: 6.0, place: 'Vanuatu', time: new Date(Date.now() - 120 * 3600000).toISOString(), coordinates: { latitude: -15.4, longitude: 167.7 }, depth: 45 },
  { id: 'usp000jmrk', magnitude: 4.5, place: 'Pakistan', time: new Date(Date.now() - 130 * 3600000).toISOString(), coordinates: { latitude: 30.2, longitude: 67.5 }, depth: 28 },
];
