import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Route, Zap, Download, Play, Trash2, Save, Search, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as maptilersdk from '@maptiler/sdk';
import "@maptiler/sdk/dist/maptiler-sdk.css";

interface CustomWaypoint {
  id: string;
  coordinates: [number, number];
  name: string;
  type: 'start' | 'end' | 'waypoint';
}

interface CustomRoute {
  id: string;
  name: string;
  waypoints: CustomWaypoint[];
  distance: number;
  created: Date;
}

const RouteCreator = () => {
  const [routeName, setRouteName] = useState('');
  const [startSearch, setStartSearch] = useState('');
  const [endSearch, setEndSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<CustomRoute | null>(null);
  const [waypoints, setWaypoints] = useState<CustomWaypoint[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<CustomRoute[]>([]);
  const [selectedTool, setSelectedTool] = useState<'start' | 'end' | 'waypoint'>('start');
  const [showInstructions, setShowInstructions] = useState(false);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const markersRef = useRef<maptilersdk.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Set MapTiler API key
    maptilersdk.config.apiKey = 'rg7OAqXjLo7cLdwqlrVt';
    
    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: 'backdrop',
      center: [-46.7167, -21.9427],
      zoom: 10,
      attributionControl: false
    });

    map.current.addControl(new maptilersdk.NavigationControl(), 'top-right');

    // Load saved routes from localStorage
    const saved = localStorage.getItem('technosutra-routes');
    if (saved) {
      setSavedRoutes(JSON.parse(saved));
    }

    // Map loaded event
    map.current.on('load', () => {
      console.log('Map loaded successfully');
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Add click handler when creating mode is active
  useEffect(() => {
    if (!map.current) return;

    const handleMapClick = (e: any) => {
      if (!isCreating) return;

      console.log('Map clicked!', e.lngLat);
      
      const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const newWaypoint: CustomWaypoint = {
        id: `${selectedTool}-${Date.now()}`,
        coordinates,
        name: getWaypointName(selectedTool, waypoints.length),
        type: selectedTool
      };

      // Remove existing start/end if adding new one
      let updatedWaypoints = waypoints;
      if (selectedTool === 'start' || selectedTool === 'end') {
        updatedWaypoints = waypoints.filter(w => w.type !== selectedTool);
      }

      const finalWaypoints = [...updatedWaypoints, newWaypoint];
      setWaypoints(finalWaypoints);
      updateMapVisualization(finalWaypoints);
      
      // Auto-advance tool selection
      if (selectedTool === 'start') {
        setSelectedTool('end');
      } else if (selectedTool === 'end') {
        setSelectedTool('waypoint');
      }
    };

    map.current.on('click', handleMapClick);

    return () => {
      if (map.current) {
        map.current.off('click', handleMapClick);
      }
    };
  }, [isCreating, selectedTool, waypoints]);

  // Geocoding function using MapTiler Geocoding API
  const geocodeLocation = async (query: string): Promise<[number, number] | null> => {
    if (!query.trim()) return null;
    
    try {
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=rg7OAqXjLo7cLdwqlrVt&limit=1`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return [lng, lat];
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const searchAndFlyTo = async (query: string, type: 'start' | 'end') => {
    const coords = await geocodeLocation(query);
    if (coords && map.current) {
      map.current.flyTo({
        center: coords,
        zoom: 14,
        duration: 2000
      });
      
      // If we're in creating mode, automatically set the tool to the searched type
      if (isCreating) {
        setSelectedTool(type);
        setShowInstructions(true);
        setTimeout(() => setShowInstructions(false), 5000);
      }
    } else {
      alert('Local não encontrado. Tente termos como "São Paulo", "Rio de Janeiro", etc.');
    }
  };

  const getWaypointName = (type: string, count: number) => {
    switch (type) {
      case 'start': return 'Ponto de Partida';
      case 'end': return 'Destino Final';
      default: return `Ponto ${count}`;
    }
  };

  const updateMapVisualization = (waypoints: CustomWaypoint[]) => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    waypoints.forEach(waypoint => {
      const el = document.createElement('div');
      el.className = 'custom-waypoint-marker';
      
      const color = waypoint.type === 'start' ? '#00ff00' : 
                   waypoint.type === 'end' ? '#ff0040' : '#00ffff';
      
      el.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid #ffffff;
        cursor: pointer;
        box-shadow: 0 0 20px ${color};
        position: relative;
        z-index: 1000;
      `;

      // Add label
      const label = document.createElement('div');
      label.textContent = waypoint.name;
      label.style.cssText = `
        position: absolute;
        top: -35px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        white-space: nowrap;
        pointer-events: none;
        border: 1px solid ${color};
      `;
      el.appendChild(label);

      const marker = new maptilersdk.Marker(el)
        .setLngLat(waypoint.coordinates)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Draw route line if we have at least 2 points
    if (waypoints.length >= 2 && map.current) {
      // Remove existing route layer
      if (map.current.getLayer('custom-route')) {
        map.current.removeLayer('custom-route');
        map.current.removeSource('custom-route');
      }

      // Sort waypoints: start, waypoints, end
      const sortedWaypoints = [
        ...waypoints.filter(w => w.type === 'start'),
        ...waypoints.filter(w => w.type === 'waypoint'),
        ...waypoints.filter(w => w.type === 'end')
      ];

      if (sortedWaypoints.length >= 2) {
        map.current.addSource('custom-route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: sortedWaypoints.map(w => w.coordinates)
            }
          }
        });

        map.current.addLayer({
          id: 'custom-route',
          type: 'line',
          source: 'custom-route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#ff00ff',
            'line-width': 4,
            'line-opacity': 0.8
          }
        });
      }
    }
  };

  const calculateDistance = (waypoints: CustomWaypoint[]) => {
    if (waypoints.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < waypoints.length; i++) {
      const [lng1, lat1] = waypoints[i - 1].coordinates;
      const [lng2, lat2] = waypoints[i].coordinates;
      
      // Haversine formula for distance calculation
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      totalDistance += R * c;
    }
    
    return totalDistance;
  };

  const startCreating = () => {
    setIsCreating(true);
    setWaypoints([]);
    setSelectedTool('start');
    setRouteName(`Nova Rota ${new Date().toLocaleDateString()}`);
    // Clear map
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    if (map.current && map.current.getLayer('custom-route')) {
      map.current.removeLayer('custom-route');
      map.current.removeSource('custom-route');
    }
    setShowInstructions(true);
    setTimeout(() => setShowInstructions(false), 8000);
  };

  const saveRoute = () => {
    if (waypoints.length < 2) {
      alert('Adicione pelo menos um ponto de partida e um destino!');
      return;
    }

    const newRoute: CustomRoute = {
      id: `route-${Date.now()}`,
      name: routeName || `Rota ${new Date().toLocaleDateString()}`,
      waypoints,
      distance: calculateDistance(waypoints),
      created: new Date()
    };

    const updatedRoutes = [...savedRoutes, newRoute];
    setSavedRoutes(updatedRoutes);
    localStorage.setItem('technosutra-routes', JSON.stringify(updatedRoutes));
    
    setCurrentRoute(newRoute);
    setIsCreating(false);
    alert('Rota salva com sucesso!');
  };

  const loadRoute = (route: CustomRoute) => {
    setWaypoints(route.waypoints);
    setCurrentRoute(route);
    setRouteName(route.name);
    setIsCreating(false);
    updateMapVisualization(route.waypoints);
    
    // Fit map to route
    if (route.waypoints.length > 0) {
      const bounds = new maptilersdk.LngLatBounds();
      route.waypoints.forEach(w => bounds.extend(w.coordinates));
      map.current?.fitBounds(bounds, { padding: 50 });
    }
  };

  const clearRoute = () => {
    setWaypoints([]);
    setCurrentRoute(null);
    setIsCreating(false);
    setStartSearch('');
    setEndSearch('');
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    if (map.current && map.current.getLayer('custom-route')) {
      map.current.removeLayer('custom-route');
      map.current.removeSource('custom-route');
    }
  };

  const deleteRoute = (routeId: string) => {
    const updatedRoutes = savedRoutes.filter(r => r.id !== routeId);
    setSavedRoutes(updatedRoutes);
    localStorage.setItem('technosutra-routes', JSON.stringify(updatedRoutes));
    
    if (currentRoute?.id === routeId) {
      clearRoute();
    }
  };

  return (
    <div className="h-screen bg-background flex">
      {/* Left Panel */}
      <motion.div
        initial={{ x: -400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-96 bg-card border-r border-border overflow-y-auto"
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-primary text-glow mb-2">
              Criador de Rotas
            </h1>
            <p className="text-sm text-muted-foreground">
              Crie rotas personalizadas no mundo Techno Sutra
            </p>
          </div>

          {/* Search Locations */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-400" />
                Buscar Ponto de Partida
              </Label>
              <div className="flex gap-2">
                <Input
                  value={startSearch}
                  onChange={(e) => setStartSearch(e.target.value)}
                  placeholder="Ex: São Paulo, SP"
                  className="cyberpunk-input flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && searchAndFlyTo(startSearch, 'start')}
                />
                <Button
                  size="sm"
                  onClick={() => searchAndFlyTo(startSearch, 'start')}
                  className="neon-glow"
                  disabled={!startSearch.trim()}
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-400" />
                Buscar Destino Final
              </Label>
              <div className="flex gap-2">
                <Input
                  value={endSearch}
                  onChange={(e) => setEndSearch(e.target.value)}
                  placeholder="Ex: Rio de Janeiro, RJ"
                  className="cyberpunk-input flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && searchAndFlyTo(endSearch, 'end')}
                />
                <Button
                  size="sm"
                  onClick={() => searchAndFlyTo(endSearch, 'end')}
                  className="neon-glow"
                  disabled={!endSearch.trim()}
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Route Name */}
          <div className="space-y-2">
            <Label htmlFor="routeName" className="text-foreground">Nome da Rota</Label>
            <Input
              id="routeName"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="cyberpunk-input"
              placeholder="Digite o nome da rota..."
            />
          </div>

          {/* Creation Controls */}
          <AnimatePresence mode="wait">
            {!isCreating && !currentRoute && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-3"
              >
                <Button
                  onClick={startCreating}
                  className="w-full gradient-neon text-black font-bold py-3"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Começar Nova Rota
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  1. Busque os locais acima<br/>
                  2. Clique em "Começar Nova Rota"<br/>
                  3. Clique no mapa para adicionar pontos
                </p>
              </motion.div>
            )}

            {isCreating && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="bg-muted/20 p-4 rounded-lg border border-border">
                  <h3 className="font-bold text-primary mb-2">Modo Criação Ativo</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Clique no mapa para adicionar pontos:
                  </p>
                  
                  {/* Tool Selection */}
                  <div className="space-y-2">
                    {[
                      { type: 'start', label: '🟢 Ponto de Partida', color: 'bg-green-500' },
                      { type: 'end', label: '🔴 Destino Final', color: 'bg-red-500' },
                      { type: 'waypoint', label: '🔵 Pontos Intermediários', color: 'bg-cyan-500' }
                    ].map(({ type, label, color }) => (
                      <Button
                        key={type}
                        variant={selectedTool === type ? "default" : "outline"}
                        size="sm"
                        className={`w-full justify-start text-left ${selectedTool === type ? 'neon-glow' : ''}`}
                        onClick={() => setSelectedTool(type as any)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Current Route Stats */}
                {waypoints.length > 0 && (
                  <Card className="cyberpunk-card p-4">
                    <h4 className="font-bold text-primary mb-2">Rota Atual</h4>
                    <div className="space-y-1 text-sm">
                      <div>Pontos: {waypoints.length}</div>
                      <div>Distância: {calculateDistance(waypoints).toFixed(2)} km</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {waypoints.filter(w => w.type === 'start').length > 0 && '✅ Partida definida'}<br/>
                        {waypoints.filter(w => w.type === 'end').length > 0 && '✅ Destino definido'}<br/>
                        {waypoints.filter(w => w.type === 'waypoint').length > 0 && `✅ ${waypoints.filter(w => w.type === 'waypoint').length} pontos intermediários`}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={saveRoute}
                    disabled={waypoints.length < 2}
                    className="flex-1 gradient-neon text-black font-bold"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button
                    onClick={clearRoute}
                    variant="outline"
                    className="flex-1 border-destructive text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar
                  </Button>
                </div>
              </motion.div>
            )}

            {currentRoute && !isCreating && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <Card className="cyberpunk-card p-4">
                  <h3 className="font-bold text-primary mb-2">{currentRoute.name}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>Pontos: {currentRoute.waypoints.length}</div>
                    <div>Distância: {currentRoute.distance.toFixed(2)} km</div>
                    <div>Criado: {currentRoute.created.toLocaleDateString()}</div>
                  </div>
                </Card>

                <div className="flex gap-2">
                  <Button
                    onClick={startCreating}
                    className="flex-1 gradient-neon text-black font-bold"
                  >
                    Nova Rota
                  </Button>
                  <Button
                    onClick={clearRoute}
                    variant="outline"
                    className="flex-1"
                  >
                    Limpar
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Saved Routes */}
          {savedRoutes.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-foreground">Rotas Salvas</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {savedRoutes.map((route) => (
                  <Card key={route.id} className="cyberpunk-card p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-primary">{route.name}</h4>
                        <div className="text-xs text-muted-foreground">
                          {route.waypoints.length} pontos • {route.distance.toFixed(1)} km
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadRoute(route)}
                          className="px-2"
                        >
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteRoute(route.id)}
                          className="px-2 text-destructive border-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0" />
        
        {/* Instructions Overlay */}
        <AnimatePresence>
          {(isCreating && showInstructions) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-4 right-4 z-10"
            >
              <Card className="cyberpunk-card p-4 text-center border-primary">
                <p className="text-primary text-glow font-bold mb-1">
                  Modo de Criação Ativo
                </p>
                <p className="text-sm text-muted-foreground">
                  Clique no mapa para adicionar: <span className="text-primary font-bold">
                    {selectedTool === 'start' ? '🟢 Ponto de Partida' : 
                     selectedTool === 'end' ? '🔴 Destino Final' : 
                     '🔵 Pontos Intermediários'}
                  </span>
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Tool Indicator */}
        {isCreating && (
          <div className="absolute bottom-4 left-4 z-10">
            <Card className="cyberpunk-card p-3">
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-3 h-3 rounded-full ${
                  selectedTool === 'start' ? 'bg-green-500' :
                  selectedTool === 'end' ? 'bg-red-500' : 'bg-cyan-500'
                }`} />
                <span className="text-primary font-medium">
                  {selectedTool === 'start' ? 'Clique para Ponto de Partida' :
                   selectedTool === 'end' ? 'Clique para Destino Final' :
                   'Clique para Pontos Intermediários'}
                </span>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteCreator;