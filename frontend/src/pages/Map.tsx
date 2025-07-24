import React, { useEffect, useRef, useState } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Navigation, Route, Users, Zap, Search, Maximize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { useSutraData } from '@/hooks/useSutraData';

// Base coordinates for Águas da Prata, SP
const BASE_COORDINATES = {
  lat: -21.9427,
  lng: -46.7167
};

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedWaypoint, setSelectedWaypoint] = useState<any>(null);
  const [mapStyle, setMapStyle] = useState('streets-v2');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredWaypoints, setFilteredWaypoints] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Load CSV data
  const { getCombinedData, loading: dataLoading, error: dataError } = useSutraData();

  // Generate waypoints from CSV data
  const generateWaypoints = () => {
    const sutraData = getCombinedData('pt');
    if (sutraData.length === 0) return [];

    return sutraData.map((entry, index) => ({
      id: entry.chapter,
      coordinates: [
        BASE_COORDINATES.lng + (Math.random() - 0.5) * 0.012, // Spread over ~1.2km
        BASE_COORDINATES.lat + (Math.random() - 0.5) * 0.012
      ] as [number, number],
      chapter: entry.chapter,
      title: `${entry.nome}`,
      subtitle: `Capítulo ${entry.chapter}`,
      description: entry.descPersonagem || entry.ensinamento.substring(0, 200) + '...',
      fullDescription: entry.descPersonagem,
      teaching: entry.ensinamento,
      occupation: entry.ocupacao,
      meaning: entry.significado,
      location: entry.local,
      chapterSummary: entry.resumoCap,
      model: entry.linkModel,
      capUrl: entry.capUrl,
      qrCodeUrl: entry.qrCodeUrl
    }));
  };

  const [waypoints, setWaypoints] = useState<any[]>([]);

  // Update waypoints when data loads
  useEffect(() => {
    if (!dataLoading && !dataError) {
      const newWaypoints = generateWaypoints();
      setWaypoints(newWaypoints);
      setFilteredWaypoints(newWaypoints);
    }
  }, [dataLoading, dataError]);

  // Filter waypoints based on search
  useEffect(() => {
    if (searchTerm) {
      const filtered = waypoints.filter(waypoint =>
        waypoint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        waypoint.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        waypoint.chapter.toString().includes(searchTerm) ||
        waypoint.occupation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        waypoint.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredWaypoints(filtered);
    } else {
      setFilteredWaypoints(waypoints);
    }
  }, [searchTerm, waypoints]);

  useEffect(() => {
    if (!mapContainer.current || waypoints.length === 0) return;

    setIsLoading(true);

    // Set MapTiler API key
    maptilersdk.config.apiKey = 'rg7OAqXjLo7cLdwqlrVt';
    
    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [BASE_COORDINATES.lng, BASE_COORDINATES.lat],
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

    // Map loaded event
    map.current.on('load', () => {
      setIsLoading(false);
    });

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
      if (!map.current || waypoints.length === 0) return;

      // Calculate route coordinates
      const routeCoordinates = [
        [BASE_COORDINATES.lng - 0.001, BASE_COORDINATES.lat - 0.001], // Start point
        ...waypoints.map(w => w.coordinates),
        [BASE_COORDINATES.lng + 0.001, BASE_COORDINATES.lat + 0.001] // End point
      ];

      // Add route line
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates
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
      waypoints.forEach((waypoint, index) => {
        const el = document.createElement('div');
        el.className = 'waypoint-marker';
        el.style.cssText = `
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00ffff, #ff00ff);
          border: 2px solid #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000;
          font-weight: bold;
          font-size: 11px;
          box-shadow: 0 0 20px #00ffff;
          position: relative;
        `;
        el.textContent = String(waypoint.chapter);

        // Add tooltip on hover
        el.title = `${waypoint.title} - ${waypoint.occupation}`;

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
  }, [mapStyle, waypoints]);

  const flyToWaypoint = (waypoint: any) => {
    map.current?.flyTo({
      center: waypoint.coordinates,
      zoom: 16,
      pitch: 60,
      duration: 2000
    });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'h-screen'} relative overflow-hidden bg-background`}>
      {/* Loading Screen */}
      <AnimatePresence>
        {(isLoading || dataLoading) && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
              />
              <motion.h2
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-xl font-bold text-primary text-glow"
              >
                {dataLoading ? 'Carregando dados do Sutra...' : 'Iniciando Sistema Techno Sutra...'}
              </motion.h2>
              {dataError && (
                <p className="text-destructive text-sm mt-2">
                  Erro ao carregar dados: {dataError}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Enhanced Cyberpunk Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-background/30 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background/30 to-transparent" />
        <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-background/20 to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-background/20 to-transparent" />
      </div>

      {/* Enhanced Controls */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="absolute top-4 left-4 space-y-3 pointer-events-auto max-w-xs"
      >
        {/* Main Info Card */}
        <Card className="cyberpunk-card p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-primary text-glow font-bold">Techno Sutra</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-primary hover:text-accent"
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-2">Rota Sagrada Original</p>
          <div className="flex items-center gap-2 text-xs">
            <MapPin className="w-4 h-4 text-primary" />
            <span>Águas da Prata, SP</span>
          </div>
        </Card>

        {/* Search Card */}
        <Card className="cyberpunk-card p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar personagem ou capítulo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/20 border-border text-foreground"
            />
          </div>
          {searchTerm && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-muted-foreground mt-2"
            >
              {filteredWaypoints.length} pontos encontrados
            </motion.p>
          )}
        </Card>

        {/* Style Controls */}
        <div className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full neon-glow transition-all duration-300 hover:scale-105"
            onClick={() => setMapStyle('backdrop')}
          >
            <Navigation className="w-4 h-4 mr-2" />
            Modo Cyberpunk
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full purple-glow transition-all duration-300 hover:scale-105"
            onClick={() => setMapStyle('satellite')}
          >
            <Route className="w-4 h-4 mr-2" />
            Satélite
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full gradient-neon text-black font-bold transition-all duration-300 hover:scale-105"
            onClick={() => setMapStyle('streets-v2')}
          >
            <Zap className="w-4 h-4 mr-2" />
            Neural Network
          </Button>
        </div>
      </motion.div>

      {/* Enhanced Waypoint Info Panel */}
      <AnimatePresence>
        {selectedWaypoint && (
          <motion.div
            initial={{ x: 100, opacity: 0, scale: 0.9 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 100, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute top-4 right-4 w-80 pointer-events-auto"
          >
            <Card className="cyberpunk-card p-6 relative overflow-hidden">
              {/* Animated background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 animate-pulse" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <motion.h3 
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-primary text-glow font-bold text-lg"
                    >
                      {selectedWaypoint.title}
                    </motion.h3>
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center gap-2 text-xs text-accent mt-1"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Capítulo {selectedWaypoint.chapter}/56</span>
                    </motion.div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedWaypoint(null)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    ✕
                  </Button>
                </div>
                
                <motion.p 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-muted-foreground mb-4"
                >
                  {selectedWaypoint.description}
                </motion.p>
                
                <div className="space-y-3">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button
                      onClick={() => flyToWaypoint(selectedWaypoint)}
                      className="w-full gradient-neon text-black font-bold hover:scale-105 transition-transform"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Voar para Local
                    </Button>
                  </motion.div>
                  
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full border-neon hover:scale-105 transition-transform"
                      onClick={() => {
                        // Open 3D model viewer in new window
                        const modelUrl = selectedWaypoint.model;
                        window.open(`/model-viewer?url=${encodeURIComponent(modelUrl)}&title=${encodeURIComponent(selectedWaypoint.title)}`, '_blank');
                      }}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Ver Modelo 3D
                    </Button>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full border-purple-500 text-purple-400 hover:scale-105 transition-transform"
                      onClick={() => {
                        // Download 3D model
                        const link = document.createElement('a');
                        link.href = selectedWaypoint.model;
                        link.download = `technosutra_modelo_${selectedWaypoint.chapter}.glb`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Modelo
                    </Button>
                  </motion.div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Stats Panel */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute bottom-4 left-4 pointer-events-auto"
      >
        <Card className="cyberpunk-card p-4">
          <div className="flex items-center gap-6 text-sm">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="text-center cursor-pointer"
            >
              <div className="text-primary text-glow font-bold text-xl">56</div>
              <div className="text-muted-foreground">Pontos</div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="text-center cursor-pointer"
            >
              <div className="text-accent text-glow font-bold text-xl">
                {filteredWaypoints.length}
              </div>
              <div className="text-muted-foreground">Filtrados</div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="text-center cursor-pointer"
            >
              <div className="text-cyan-400 text-glow font-bold text-xl">
                {userLocation ? '1' : '0'}
              </div>
              <div className="text-muted-foreground">Localizado</div>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Map;