import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Route, Zap, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import * as maptilersdk from '@maptiler/sdk';
import "@maptiler/sdk/dist/maptiler-sdk.css";

interface CustomRoute {
  start: [number, number];
  end: [number, number];
  waypoints: Array<{
    id: number;
    coordinates: [number, number];
    chapter: number;
    distance: number;
  }>;
  totalDistance: number;
}

const RouteCreator = () => {
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [customRoute, setCustomRoute] = useState<CustomRoute | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Set MapTiler API key
    maptilersdk.config.apiKey = 'rg7OAqXjLo7cLdwqlrVt';
    
    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: 'dark',
      center: [-46.7167, -21.9427],
      zoom: 2,
      attributionControl: false
    });

    map.current.addControl(new maptilersdk.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, []);

  const geocodeLocation = async (location: string): Promise<[number, number] | null> => {
    // Simulated geocoding - in real app, use Mapbox Geocoding API
    const mockLocations: { [key: string]: [number, number] } = {
      'são paulo': [-46.6333, -23.5505],
      'rio de janeiro': [-43.1729, -22.9068],
      'new york': [-74.0060, 40.7128],
      'london': [-0.1276, 51.5074],
      'tokyo': [139.6917, 35.6895],
      'paris': [2.3522, 48.8566]
    };
    
    const key = location.toLowerCase();
    return mockLocations[key] || null;
  };

  const generateRoute = async () => {
    if (!startLocation || !endLocation) return;
    
    setIsGenerating(true);
    
    try {
      const startCoords = await geocodeLocation(startLocation);
      const endCoords = await geocodeLocation(endLocation);
      
      if (!startCoords || !endCoords) {
        alert('Localização não encontrada. Tente: São Paulo, Rio de Janeiro, New York, London, Tokyo, Paris');
        setIsGenerating(false);
        return;
      }

      // Calculate intermediate waypoints
      const waypoints = [];
      const totalDistance = calculateDistance(startCoords, endCoords);
      
      for (let i = 1; i <= 56; i++) {
        const progress = i / 57; // 56 points between start and end
        const lat = startCoords[1] + (endCoords[1] - startCoords[1]) * progress;
        const lng = startCoords[0] + (endCoords[0] - startCoords[0]) * progress;
        
        // Add some randomization to make it more interesting
        const randomOffset = 0.01;
        const finalLat = lat + (Math.random() - 0.5) * randomOffset;
        const finalLng = lng + (Math.random() - 0.5) * randomOffset;
        
        waypoints.push({
          id: i,
          coordinates: [finalLng, finalLat] as [number, number],
          chapter: i,
          distance: (totalDistance * progress)
        });
      }

      const newRoute: CustomRoute = {
        start: [startCoords[0], startCoords[1]],
        end: [endCoords[0], endCoords[1]],
        waypoints,
        totalDistance
      };

      setCustomRoute(newRoute);
      
      // Update map
      if (map.current) {
        // Clear existing layers
        if (map.current.getLayer('custom-route')) {
          map.current.removeLayer('custom-route');
          map.current.removeSource('custom-route');
        }

        // Add new route
        map.current.addSource('custom-route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                startCoords,
                ...waypoints.map(w => w.coordinates),
                endCoords
              ]
            }
          }
        });

        map.current.addLayer({
          id: 'custom-route',
          type: 'line',
          source: 'custom-route',
          paint: {
            'line-color': '#00ffff',
            'line-width': 4,
            'line-opacity': 0.8
          }
        });

        // Add waypoint markers
        waypoints.forEach((waypoint) => {
          const el = document.createElement('div');
          el.style.cssText = `
            width: 25px;
            height: 25px;
            border-radius: 50%;
            background: linear-gradient(135deg, #00ffff, #ff00ff);
            border: 2px solid #fff;
            color: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            box-shadow: 0 0 15px #00ffff;
          `;
          el.textContent = String(waypoint.chapter);

          new mapboxgl.Marker(el)
            .setLngLat(waypoint.coordinates)
            .addTo(map.current!);
        });

        // Fit map to route
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend(startCoords);
        bounds.extend(endCoords);
        waypoints.forEach(w => bounds.extend(w.coordinates));
        
        map.current.fitBounds(bounds, { padding: 50 });
      }
      
    } catch (error) {
      console.error('Error generating route:', error);
      alert('Erro ao gerar rota. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateDistance = (coord1: [number, number], coord2: [number, number]): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
    const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const exportRoute = () => {
    if (!customRoute) return;
    
    const data = {
      technoSutraRoute: {
        version: '1.0',
        created: new Date().toISOString(),
        start: startLocation,
        end: endLocation,
        waypoints: customRoute.waypoints,
        totalDistance: customRoute.totalDistance
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `techno-sutra-route-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Control Panel */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-96 p-6 bg-card border-r border-border overflow-y-auto"
      >
        <h1 className="text-2xl font-bold text-primary text-glow mb-6">
          Criador de Rotas
        </h1>
        
        <div className="space-y-6">
          {/* Location Inputs */}
          <Card className="cyberpunk-card p-4">
            <h3 className="font-semibold text-primary mb-4">Definir Jornada</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="start" className="text-foreground">Ponto de Origem</Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary w-4 h-4" />
                  <Input
                    id="start"
                    placeholder="Ex: São Paulo"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="end" className="text-foreground">Ponto de Chegada</Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-accent w-4 h-4" />
                  <Input
                    id="end"
                    placeholder="Ex: Rio de Janeiro"
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Button
                onClick={generateRoute}
                disabled={!startLocation || !endLocation || isGenerating}
                className="w-full gradient-neon text-black font-bold"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                    Gerando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Gerar Rota Sagrada
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Route Info */}
          {customRoute && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <Card className="cyberpunk-card p-4">
                <h3 className="font-semibold text-primary mb-4">Rota Gerada</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Waypoints:</span>
                    <span className="text-primary font-bold">56</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distância:</span>
                    <span className="text-accent font-bold">
                      {customRoute.totalDistance.toFixed(0)} km
                    </span>
                  </div>
                  
                  <Button
                    onClick={exportRoute}
                    variant="outline"
                    className="w-full border-neon"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Rota
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Instructions */}
          <Card className="cyberpunk-card p-4">
            <h3 className="font-semibold text-accent mb-2">Como Usar</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Digite origem e destino</li>
              <li>• Clique em "Gerar Rota Sagrada"</li>
              <li>• 56 pontos serão distribuídos automaticamente</li>
              <li>• Cada ponto representa um capítulo do Sutra</li>
              <li>• Use o mapa para explorar a jornada</li>
            </ul>
          </Card>
        </div>
      </motion.div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0" />
        
        {/* Map Overlay */}
        <div className="absolute top-4 right-4 pointer-events-none">
          <Card className="cyberpunk-card p-3 pointer-events-auto">
            <div className="flex items-center gap-2 text-sm">
              <Route className="w-4 h-4 text-primary" />
              <span className="text-foreground">Criador de Rotas Personalizadas</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RouteCreator;