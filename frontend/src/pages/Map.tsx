import React, { useEffect, useRef, useState } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Navigation, Route, Users } from 'lucide-react';
import { motion } from 'framer-motion';

// Sample waypoints data (56 points for the journey)
const ORIGINAL_ROUTE = {
  start: [-21.9427, -46.7167], // Águas da Prata, SP
  end: [-21.9527, -46.7267],
  waypoints: Array.from({ length: 56 }, (_, i) => ({
    id: i + 1,
    coordinates: [
      -46.7167 + (Math.random() - 0.5) * 0.01,
      -21.9427 + (Math.random() - 0.5) * 0.01
    ] as [number, number],
    chapter: i + 1,
    title: `Capítulo ${i + 1}`,
    description: `Ponto de jornada do capítulo ${i + 1} do Sutra Stem Array`,
    model: `https://cdn.statically.io/gh/technosutra21/technosutra/master/modelo${i + 1}.glb`
  }))
};

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedWaypoint, setSelectedWaypoint] = useState<any>(null);
  const [mapStyle, setMapStyle] = useState('dark');

  useEffect(() => {
    if (!mapContainer.current) return;

    // Set MapTiler API key
    maptilersdk.config.apiKey = 'rg7OAqXjLo7cLdwqlrVt';
    
    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: ORIGINAL_ROUTE.start as [number, number],
      zoom: 12,
      pitch: 45,
      bearing: 0,
      attributionControl: false
    });

    // Add navigation controls
    map.current.addControl(
      new maptilersdk.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];
          setUserLocation(userCoords);
          
          // Add user location marker
          new maptilersdk.Marker({
            color: '#00ffff',
            scale: 1.2
          })
            .setLngLat([userCoords[1], userCoords[0]] as [number, number])
            .addTo(map.current!);
        },
        (error) => {
          console.warn('Geolocation not available:', error);
        }
      );
    }

    // Add waypoints
    map.current.on('load', () => {
      if (!map.current) return;

      // Add route line
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              ORIGINAL_ROUTE.start.reverse(),
              ...ORIGINAL_ROUTE.waypoints.map(w => w.coordinates.reverse()),
              ORIGINAL_ROUTE.end.reverse()
            ]
          }
        }
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#00ffff',
          'line-width': 4,
          'line-opacity': 0.8
        }
      });

      // Add waypoints
      ORIGINAL_ROUTE.waypoints.forEach((waypoint, index) => {
        const el = document.createElement('div');
        el.className = 'waypoint-marker';
        el.style.cssText = `
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00ffff, #ff00ff);
          border: 2px solid #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000;
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 0 20px #00ffff;
        `;
        el.textContent = String(waypoint.chapter);

        el.addEventListener('click', () => {
          setSelectedWaypoint(waypoint);
        });

        new maptilersdk.Marker(el)
          .setLngLat(waypoint.coordinates)
          .addTo(map.current!);
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [mapStyle]);

  const flyToWaypoint = (waypoint: any) => {
    map.current?.flyTo({
      center: waypoint.coordinates,
      zoom: 16,
      pitch: 60,
      duration: 2000
    });
  };

  return (
    <div className="h-screen relative overflow-hidden bg-background">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Cyberpunk Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-background/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background/20 to-transparent" />
      </div>

      {/* Controls */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="absolute top-4 left-4 space-y-3 pointer-events-auto"
      >
        <Card className="cyberpunk-card p-4">
          <h3 className="text-primary text-glow font-bold mb-2">Techno Sutra</h3>
          <p className="text-sm text-muted-foreground">Rota Sagrada Original</p>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <MapPin className="w-4 h-4 text-primary" />
            <span>Águas da Prata, SP</span>
          </div>
        </Card>

        <div className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full neon-glow"
            onClick={() => setMapStyle('dark')}
          >
            <Navigation className="w-4 h-4 mr-2" />
            Modo Cyberpunk
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full purple-glow"
            onClick={() => setMapStyle('satellite')}
          >
            <Route className="w-4 h-4 mr-2" />
            Satélite
          </Button>
        </div>
      </motion.div>

      {/* Waypoint Info Panel */}
      {selectedWaypoint && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          className="absolute top-4 right-4 w-80 pointer-events-auto"
        >
          <Card className="cyberpunk-card p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-primary text-glow font-bold text-lg">
                {selectedWaypoint.title}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedWaypoint(null)}
                className="text-muted-foreground hover:text-primary"
              >
                ✕
              </Button>
            </div>
            
            <p className="text-muted-foreground mb-4">
              {selectedWaypoint.description}
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={() => flyToWaypoint(selectedWaypoint)}
                className="w-full gradient-neon text-black font-bold"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Voar para Local
              </Button>
              
              <Button
                variant="outline"
                className="w-full border-neon"
                onClick={() => {
                  // Navigate to 3D model viewer
                  window.open(`/model/${selectedWaypoint.id}`, '_blank');
                }}
              >
                <Users className="w-4 h-4 mr-2" />
                Ver Modelo 3D
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Stats Panel */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute bottom-4 left-4 pointer-events-auto"
      >
        <Card className="cyberpunk-card p-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <div className="text-primary text-glow font-bold">56</div>
              <div className="text-muted-foreground">Pontos</div>
            </div>
            <div className="text-center">
              <div className="text-accent text-glow font-bold">
                {userLocation ? '1' : '0'}
              </div>
              <div className="text-muted-foreground">Localizado</div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Map;