import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, Route, Zap, Download, Play, Trash2, Save, Search, 
  Navigation, Globe, Satellite, Eye, EyeOff, Maximize, Target,
  Plus, Minus, RotateCcw, Share2, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as maptilersdk from '@maptiler/sdk';
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

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
  style: string;
}

// Map styles for RouteCreator
const MAP_STYLES = {
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    icon: Zap,
    url: 'backdrop',
    cyberpunk: true,
    description: 'Estilo cyberpunk para criação'
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite',
    icon: Satellite,
    url: 'satellite',
    cyberpunk: false,
    description: 'Vista satelital para precisão'
  },
  simple: {
    id: 'simple',
    name: 'Simple',
    icon: Globe,
    url: 'streets-v2',
    cyberpunk: false,
    description: 'Mapa limpo para foco'
  }
};

const RouteCreator = () => {
  // Refs
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const markersRef = useRef<maptilersdk.Marker[]>([]);

  // State management
  const [currentStyle, setCurrentStyle] = useState<keyof typeof MAP_STYLES>('simple');
  const [isLoading, setIsLoading] = useState(true);
  const [routeName, setRouteName] = useState('');
  const [startSearch, setStartSearch] = useState('');
  const [endSearch, setEndSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<CustomRoute | null>(null);
  const [waypoints, setWaypoints] = useState<CustomWaypoint[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<CustomRoute[]>([]);
  const [selectedTool, setSelectedTool] = useState<'start' | 'end' | 'waypoint'>('start');
  const [showInstructions, setShowInstructions] = useState(false);
  const [showPanels, setShowPanels] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Hooks
  const { toast } = useToast();

  // Load saved routes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('technosutra-routes');
    if (saved) {
      try {
        setSavedRoutes(JSON.parse(saved));
      } catch (error) {
        logger.error('Error loading saved routes:', error);
      }
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    setIsLoading(true);
    maptilersdk.config.apiKey = 'rg7OAqXjLo7cLdwqlrVt';
    
    try {
      const styleConfig = MAP_STYLES[currentStyle];
      
      map.current = new maptilersdk.Map({
        container: mapContainer.current,
        style: styleConfig.url,
        center: [-46.7167, -21.9427], // Águas da Prata, SP
        zoom: 10,
        attributionControl: false,
        antialias: true
      });

      map.current.addControl(
        new maptilersdk.NavigationControl({
          visualizePitch: true,
          showZoom: true,
          showCompass: true
        }), 
        'top-right'
      );

      // Map loaded event
      map.current.on('load', () => {
        logger.info('🗺️ RouteCreator map loaded with style:', currentStyle);
        setIsLoading(false);
        
        // Apply cyberpunk styling if needed
        if (styleConfig.cyberpunk && mapContainer.current) {
          setTimeout(() => {
            mapContainer.current!.classList.add('cyberpunk-map');
            logger.info('🎨 Cyberpunk mode applied to RouteCreator');
          }, 500);
        } else if (mapContainer.current) {
          mapContainer.current.classList.remove('cyberpunk-map');
        }
      });

      // Error handling
      map.current.on('error', (e) => {
        logger.error('RouteCreator map error:', e);
        setIsLoading(false);
        toast({
          title: "Erro no Mapa",
          description: "Problema ao carregar o mapa do criador de rotas",
          variant: "destructive",
        });
      });

    } catch (error) {
      logger.error('Failed to initialize RouteCreator map:', error);
      setIsLoading(false);
    }

    return () => {
      if (mapContainer.current) {
        mapContainer.current.classList.remove('cyberpunk-map');
      }
      map.current?.remove();
    };
  }, [currentStyle, toast]);

  // Add click handler for route creation
  useEffect(() => {
    if (!map.current) return;

    const handleMapClick = (e: any) => {
      if (!isCreating) return;

      logger.info('Map clicked for route creation:', e.lngLat);
      
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

      toast({
        title: "Ponto Adicionado",
        description: `${getWaypointName(selectedTool, 0)} criado com sucesso`,
      });
    };

    map.current.on('click', handleMapClick);

    return () => {
      if (map.current) {
        map.current.off('click', handleMapClick);
      }
    };
  }, [isCreating, selectedTool, waypoints, toast]);

  // Geocoding function
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
      logger.error('Geocoding error:', error);
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
      
      if (isCreating) {
        setSelectedTool(type);
        setShowInstructions(true);
        setTimeout(() => setShowInstructions(false), 5000);

        toast({
          title: "Local Encontrado",
          description: `Voe para ${query}. Clique no mapa para adicionar ${type === 'start' ? 'ponto de partida' : 'destino'}.`,
        });
      }
    } else {
      toast({
        title: "Local não encontrado",
        description: "Tente termos como 'São Paulo, SP' ou 'Rio de Janeiro, RJ'",
        variant: "destructive",
      });
    }
  };

  const getWaypointName = (type: string, count: number) => {
    switch (type) {
      case 'start': return 'Ponto de Partida';
      case 'end': return 'Destino Final';
      default: return `Waypoint ${count}`;
    }
  };

  const updateMapVisualization = useCallback((waypointsToUpdate: CustomWaypoint[]) => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    waypointsToUpdate.forEach(waypoint => {
      const el = document.createElement('div');
      el.className = 'custom-waypoint-marker';
      
      const color = waypoint.type === 'start' ? '#00ff00' : 
                   waypoint.type === 'end' ? '#ff0040' : '#00ffff';
      
      el.style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid #ffffff;
        cursor: pointer;
        box-shadow: 0 0 25px ${color};
        position: relative;
        z-index: 1000;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #000;
        font-weight: bold;
        font-size: 10px;
      `;

      // Add emoji based on type
      el.textContent = waypoint.type === 'start' ? '🚀' : 
                      waypoint.type === 'end' ? '🎯' : '📍'; 

      // Hover effects
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3)';
        el.style.boxShadow = `0 0 35px ${color}`;
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = `0 0 25px ${color}`;
      });

      // Label
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
        border-radius: 6px;
        font-size: 11px;
        white-space: nowrap;
        pointer-events: none;
        border: 1px solid ${color};
        box-shadow: 0 0 10px ${color};
      `;
      el.appendChild(label);

      const marker = new maptilersdk.Marker(el)
        .setLngLat(waypoint.coordinates)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Draw route line if we have at least 2 points
    if (waypointsToUpdate.length >= 2 && map.current) {
      // Remove existing route layer
      if (map.current.getLayer('custom-route')) {
        map.current.removeLayer('custom-route');
        map.current.removeSource('custom-route');
      }

      // Sort waypoints: start, waypoints, end
      const sortedWaypoints = [
        ...waypointsToUpdate.filter(w => w.type === 'start'),
        ...waypointsToUpdate.filter(w => w.type === 'waypoint'),
        ...waypointsToUpdate.filter(w => w.type === 'end')
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

        const styleConfig = MAP_STYLES[currentStyle];
        map.current.addLayer({
          id: 'custom-route',
          type: 'line',
          source: 'custom-route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': styleConfig.cyberpunk ? '#ff00ff' : '#00aaff',
            'line-width': 5,
            'line-opacity': 0.8
          }
        });
      }
    }
  }, [currentStyle]);

  const calculateDistance = (waypointsToCalculate: CustomWaypoint[]) => {
    if (waypointsToCalculate.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < waypointsToCalculate.length; i++) {
      const [lng1, lat1] = waypointsToCalculate[i - 1].coordinates;
      const [lng2, lat2] = waypointsToCalculate[i].coordinates;
      
      // Haversine formula
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

    toast({
      title: "Modo Criação Ativado",
      description: "Clique no mapa para começar a criar sua rota personalizada",
    });
  };

  const saveRoute = () => {
    if (waypoints.length < 2) {
      toast({
        title: "Rota Incompleta",
        description: "Adicione pelo menos um ponto de partida e um destino!",
        variant: "destructive",
      });
      return;
    }

    const newRoute: CustomRoute = {
      id: `route-${Date.now()}`,
      name: routeName || `Rota ${new Date().toLocaleDateString()}`,
      waypoints,
      distance: calculateDistance(waypoints),
      created: new Date(),
      style: currentStyle
    };

    const updatedRoutes = [...savedRoutes, newRoute];
    setSavedRoutes(updatedRoutes);
    localStorage.setItem('technosutra-routes', JSON.stringify(updatedRoutes));
    
    setCurrentRoute(newRoute);
    setIsCreating(false);
    
    toast({
      title: "Rota Salva!",
      description: `${newRoute.name} foi salva com sucesso`,
    });
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

    toast({
      title: "Rota Carregada",
      description: `${route.name} foi carregada no mapa`,
    });
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

    toast({
      title: "Rota Limpa",
      description: "Todos os pontos foram removidos",
    });
  };

  const deleteRoute = (routeId: string) => {
    const routeToDelete = savedRoutes.find(r => r.id === routeId);
    const updatedRoutes = savedRoutes.filter(r => r.id !== routeId);
    setSavedRoutes(updatedRoutes);
    localStorage.setItem('technosutra-routes', JSON.stringify(updatedRoutes));
    
    if (currentRoute?.id === routeId) {
      clearRoute();
    }

    toast({
      title: "Rota Excluída",
      description: `${routeToDelete?.name || 'Rota'} foi removida`,
    });
  };

  const exportRoute = () => {
    if (!currentRoute) return;
    
    const dataStr = JSON.stringify(currentRoute, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${currentRoute.name.replace(/\s+/g, '_')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Rota Exportada",
      description: `${currentRoute.name} foi baixada como JSON`,
    });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'h-screen'} bg-background flex overflow-hidden`}>
      {/* Enhanced Loading Screen */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 border-4 border-accent border-t-transparent rounded-full mx-auto mb-6"
              />
              <motion.h2
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-2xl font-bold text-accent text-glow mb-2"
              >
                Inicializando Criador de Rotas...
              </motion.h2>
              <motion.p
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-muted-foreground"
              >
                Sistema de navegação personalizada
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Control Panel */}
      <AnimatePresence>
        {showPanels && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            className="w-96 bg-card border-r border-border overflow-y-auto z-40"
          >
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-accent text-glow mb-2">
                    Criador de Rotas
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Crie rotas personalizadas no universo Techno Sutra
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPanels(false)}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <EyeOff className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="text-primary hover:text-accent"
                  >
                    <Maximize className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Map Style Selector */}
              <Card className="amoled-card p-4">
                <h3 className="text-sm font-bold text-foreground mb-3">Estilo do Mapa</h3>
                <div className="space-y-2">
                  {Object.entries(MAP_STYLES).map(([key, style]) => {
                    const IconComponent = style.icon;
                    const isActive = currentStyle === key;
                    
                    return (
                      <Button
                        key={key}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentStyle(key as keyof typeof MAP_STYLES)}
                        className={`w-full justify-start text-left h-auto p-3 ${
                          isActive ? 
                            (style.cyberpunk ? 'gradient-neon text-black font-bold' : 'bg-primary text-primary-foreground') : 
                            'hover:bg-muted/20'
                        }`}
                      >
                        <IconComponent className="w-4 h-4 mr-3" />
                        <div>
                          <div className="font-medium">{style.name}</div>
                          <div className="text-xs opacity-80">{style.description}</div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </Card>

              {/* Search Locations */}
              <Card className="amoled-card p-4">
                <h3 className="text-sm font-bold text-foreground mb-3">Buscar Locais</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-400" />
                      Ponto de Partida
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
                      <Target className="w-4 h-4 text-red-400" />
                      Destino Final
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
                        className="purple-glow"
                        disabled={!endSearch.trim()}
                      >
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Route Name */}
              <Card className="amoled-card p-4">
                <Label htmlFor="routeName" className="text-foreground font-bold mb-2 block">Nome da Rota</Label>
                <Input
                  id="routeName"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  className="cyberpunk-input"
                  placeholder="Digite o nome da sua rota..."
                />
              </Card>

              {/* Creation Controls */}
              <AnimatePresence mode="wait">
                {!isCreating && !currentRoute && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="amoled-card p-4">
                      <Button
                        onClick={startCreating}
                        className="w-full gradient-neon text-black font-bold py-4 text-lg"
                      >
                        <Play className="w-5 h-5 mr-3" />
                        Começar Nova Rota
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-3 leading-relaxed">
                        1. Busque locais nos campos acima<br/>
                        2. Clique em "Começar Nova Rota"<br/>
                        3. Clique no mapa para adicionar pontos
                      </p>
                    </Card>
                  </motion.div>
                )}

                {isCreating && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="amoled-card p-4">
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="gradient-neon text-black font-bold">MODO CRIAÇÃO</Badge>
                          <Badge variant="outline">{waypoints.length} pontos</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Clique no mapa para adicionar pontos:
                        </p>
                      </div>
                      
                      {/* Tool Selection */}
                      <div className="space-y-2 mb-4">
                        {[
                          { type: 'start', label: '🚀 Ponto de Partida', color: 'border-green-500 text-green-400' },
                          { type: 'end', label: '🎯 Destino Final', color: 'border-red-500 text-red-400' },
                          { type: 'waypoint', label: '📍 Pontos Intermediários', color: 'border-cyan-500 text-cyan-400' }
                        ].map(({ type, label, color }) => (
                          <Button
                            key={type}
                            variant={selectedTool === type ? "default" : "outline"}
                            size="sm"
                            className={`w-full justify-start text-left ${selectedTool === type ? 'gradient-neon text-black font-bold' : `${color} hover:bg-muted/20`}`}
                            onClick={() => setSelectedTool(type as any)}
                          >
                            {label}
                          </Button>
                        ))}
                      </div>

                      {/* Current Route Stats */}
                      {waypoints.length > 0 && (
                        <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded">
                          <h4 className="font-bold text-primary mb-2">Estatísticas da Rota</h4>
                          <div className="space-y-1 text-sm">
                            <div>Pontos: {waypoints.length}</div>
                            <div>Distância: {calculateDistance(waypoints).toFixed(2)} km</div>
                            <div className="text-xs text-muted-foreground mt-2">
                              {waypoints.filter(w => w.type === 'start').length > 0 && '✅ Partida definida'}<br/>
                              {waypoints.filter(w => w.type === 'end').length > 0 && '✅ Destino definido'}<br/>
                              {waypoints.filter(w => w.type === 'waypoint').length > 0 && `✅ ${waypoints.filter(w => w.type === 'waypoint').length} pontos intermediários`}
                            </div>
                          </div>
                        </div>
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
                          className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Limpar
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {currentRoute && !isCreating && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="amoled-card p-4">
                      <h3 className="font-bold text-accent mb-3">{currentRoute.name}</h3>
                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div className="flex justify-between">
                          <span>Pontos:</span>
                          <span className="text-primary">{currentRoute.waypoints.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Distância:</span>
                          <span className="text-accent">{currentRoute.distance.toFixed(2)} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Criado em:</span>
                          <span>{new Date(currentRoute.created).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={startCreating}
                          className="flex-1 gradient-neon text-black font-bold"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Nova Rota
                        </Button>
                        <Button
                          onClick={exportRoute}
                          variant="outline"
                          className="border-cyan-500 text-cyan-400"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={clearRoute}
                          variant="outline"
                          className="border-muted text-muted-foreground"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Saved Routes */}
              {savedRoutes.length > 0 && (
                <Card className="amoled-card p-4">
                  <h3 className="font-bold text-foreground mb-3">Rotas Salvas ({savedRoutes.length})</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {savedRoutes.map((route) => (
                      <div key={route.id} className="p-3 bg-muted/10 border border-border rounded">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-primary truncate">{route.name}</h4>
                            <div className="text-xs text-muted-foreground">
                              {route.waypoints.length} pontos • {route.distance.toFixed(1)} km
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(route.created).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => loadRoute(route)}
                              className="px-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteRoute(route.id)}
                              className="px-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Panel Button */}
      {!showPanels && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="absolute top-4 left-4 z-40"
        >
          <Button
            onClick={() => setShowPanels(true)}
            className="gradient-neon text-black font-bold"
            size="sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            Mostrar Controles
          </Button>
        </motion.div>
      )}

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
              className="absolute top-4 left-4 right-4 z-30"
            >
              <Card className="amoled-card p-4 text-center border-accent border-2">
                <motion.p
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-accent text-glow font-bold mb-1"
                >
                  🎯 MODO DE CRIAÇÃO ATIVO
                </motion.p>
                <p className="text-sm text-muted-foreground">
                  Clique no mapa para adicionar: <span className="text-primary font-bold">
                    {selectedTool === 'start' ? '🚀 Ponto de Partida' : 
                     selectedTool === 'end' ? '🎯 Destino Final' : 
                     '📍 Pontos Intermediários'}
                  </span>
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Tool Indicator */}
        {isCreating && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30"
          >
            <Card className="amoled-card px-6 py-3">
              <div className="flex items-center gap-3 text-sm">
                <div className={`w-4 h-4 rounded-full ${
                  selectedTool === 'start' ? 'bg-green-500' :
                  selectedTool === 'end' ? 'bg-red-500' : 'bg-cyan-500'
                }`} />
                <span className="text-primary font-medium">
                  {selectedTool === 'start' ? 'Clique para Ponto de Partida' :
                   selectedTool === 'end' ? 'Clique para Destino Final' :
                   'Clique para Pontos Intermediários'}
                </span>
                <Badge variant="outline" className="ml-2">
                  {waypoints.length} pontos
                </Badge>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default RouteCreator;