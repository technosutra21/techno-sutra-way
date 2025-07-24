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
  const [mapStyle, setMapStyle] = useState('backdrop'); // Use backdrop as base for cyberpunk effect
  const [isCyberpunkMode, setIsCyberpunkMode] = useState(true); // Default to cyberpunk
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredWaypoints, setFilteredWaypoints] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [draggedWaypoint, setDraggedWaypoint] = useState<any>(null);
  const markersRef = useRef<Map<number, maptilersdk.Marker>>(new Map());
  
  // Load CSV data
  const { getCombinedData, loading: dataLoading, error: dataError } = useSutraData();

  // Generate waypoints from CSV data with saved positions
  const generateWaypoints = () => {
    const sutraData = getCombinedData('pt');
    if (sutraData.length === 0) return [];

    // Load saved positions from localStorage
    const savedPositions = JSON.parse(localStorage.getItem('technosutra-waypoint-positions') || '{}');

    return sutraData.map((entry, index) => ({
      id: entry.chapter,
      coordinates: savedPositions[entry.chapter] || [
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

  // Save waypoint positions
  const saveWaypointPosition = (chapterId: number, coordinates: [number, number]) => {
    const savedPositions = JSON.parse(localStorage.getItem('technosutra-waypoint-positions') || '{}');
    savedPositions[chapterId] = coordinates;
    localStorage.setItem('technosutra-waypoint-positions', JSON.stringify(savedPositions));
    
    // Update waypoints state
    setWaypoints(prev => prev.map(w => 
      w.chapter === chapterId ? { ...w, coordinates } : w
    ));
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (!editMode) {
      // Entering edit mode
      console.log('🔧 MODO DE EDIÇÃO ATIVADO - Arraste os pontos para reposicionar');
    } else {
      // Exiting edit mode
      console.log('✅ MODO DE EDIÇÃO DESATIVADO - Posições salvas');
    }
  };

  // Map style handlers
  const setMapStyleHandler = (style: string, cyberpunk: boolean = false) => {
    setMapStyle(style);
    setIsCyberpunkMode(cyberpunk);
  };

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

    // Apply cyberpunk styling to map container
    if (isCyberpunkMode && mapContainer.current) {
      mapContainer.current.classList.add('cyberpunk-map');
    } else if (mapContainer.current) {
      mapContainer.current.classList.remove('cyberpunk-map');
    }

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

    // Add waypoints and route
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
          'line-color': isCyberpunkMode ? '#ff00ff' : '#00ffff',
          'line-width': 4,
          'line-opacity': 0.8
        }
      });

      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current.clear();

      // Add waypoints with drag functionality
      waypoints.forEach((waypoint, index) => {
        const el = document.createElement('div');
        el.className = `waypoint-marker ${editMode ? 'waypoint-edit-mode waypoint-draggable' : ''}`;
        el.style.cssText = `
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${isCyberpunkMode ? '#ff00ff, #00ffff' : '#00ffff, #ff00ff'});
          border: 2px solid #ffffff;
          cursor: ${editMode ? 'grab' : 'pointer'};
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000;
          font-weight: bold;
          font-size: 11px;
          box-shadow: 0 0 20px ${isCyberpunkMode ? '#ff00ff' : '#00ffff'};
          position: relative;
          z-index: ${editMode ? '1000' : '100'};
        `;
        el.textContent = String(waypoint.chapter);
        el.title = `${waypoint.title} - ${waypoint.occupation}`;

        // Add click handler
        el.addEventListener('click', (e) => {
          if (!editMode) {
            setSelectedWaypoint(waypoint);
          }
          e.stopPropagation();
        });

        // Create marker
        const marker = new maptilersdk.Marker(el, { draggable: editMode })
          .setLngLat(waypoint.coordinates)
          .addTo(map.current!);

        // Add drag event listeners for edit mode
        if (editMode) {
          marker.on('dragstart', () => {
            setDraggedWaypoint(waypoint);
            el.style.cursor = 'grabbing';
          });

          marker.on('dragend', () => {
            const newCoords = marker.getLngLat();
            const coordinates: [number, number] = [newCoords.lng, newCoords.lat];
            saveWaypointPosition(waypoint.chapter, coordinates);
            el.style.cursor = 'grab';
            setDraggedWaypoint(null);
            
            // Update route
            updateRoute();
          });
        }

        markersRef.current.set(waypoint.chapter, marker);
      });
    });

    return () => {
      if (mapContainer.current) {
        mapContainer.current.classList.remove('cyberpunk-map');
      }
      map.current?.remove();
    };
  }, [mapStyle, waypoints, editMode, isCyberpunkMode]);

  // Update route when waypoints change
  const updateRoute = () => {
    if (!map.current) return;
    
    const routeCoordinates = [
      [BASE_COORDINATES.lng - 0.001, BASE_COORDINATES.lat - 0.001],
      ...waypoints.map(w => w.coordinates),
      [BASE_COORDINATES.lng + 0.001, BASE_COORDINATES.lat + 0.001]
    ];

    if (map.current.getSource('route')) {
      (map.current.getSource('route') as any).setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoordinates
        }
      });
    }
  };

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
      
      {/* Cyberpunk Overlay */}
      {isCyberpunkMode && (
        <div className="cyberpunk-overlay" />
      )}
      
      {/* Edit Mode Overlay */}
      {editMode && (
        <div className="edit-mode-overlay" />
      )}
      
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
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleEditMode}
                className={`${editMode ? 'text-yellow-400 bg-yellow-400/20' : 'text-muted-foreground'} hover:text-yellow-400 transition-colors`}
                title={editMode ? 'Desativar modo de edição' : 'Ativar modo de edição'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
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
          <p className="text-sm text-muted-foreground mb-2">
            {editMode ? '🔧 Modo de Edição Ativo' : 'Rota Sagrada Original'}
          </p>
          <div className="flex items-center gap-2 text-xs">
            <MapPin className="w-4 h-4 text-primary" />
            <span>Águas da Prata, SP</span>
          </div>
          {editMode && (
            <div className="mt-2 p-2 bg-yellow-400/10 border border-yellow-400/30 rounded text-xs text-yellow-200">
              💡 Arraste os pontos no mapa para reposicioná-los na trilha correta
            </div>
          )}
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
            className={`w-full transition-all duration-300 hover:scale-105 ${
              isCyberpunkMode ? 'gradient-neon text-black font-bold' : 'neon-glow'
            }`}
            onClick={() => setMapStyleHandler('backdrop', true)}
          >
            <Zap className="w-4 h-4 mr-2" />
            Modo Cyberpunk
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className={`w-full transition-all duration-300 hover:scale-105 ${
              !isCyberpunkMode && mapStyle === 'backdrop' ? 'bg-muted text-foreground' : 'neon-glow'
            }`}
            onClick={() => setMapStyleHandler('backdrop', false)}
          >
            <Navigation className="w-4 h-4 mr-2" />
            Modo Sombras
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className={`w-full purple-glow transition-all duration-300 hover:scale-105 ${
              !isCyberpunkMode && mapStyle === 'streets-v2' ? 'bg-muted text-foreground' : ''
            }`}
            onClick={() => setMapStyleHandler('streets-v2', false)}
          >
            <Route className="w-4 h-4 mr-2" />
            Modo Clássico
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
                      <span>{selectedWaypoint.subtitle} • {selectedWaypoint.occupation}</span>
                    </motion.div>
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.15 }}
                      className="text-xs text-muted-foreground mt-1"
                    >
                      📍 {selectedWaypoint.location}
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
                  className="text-muted-foreground mb-2 text-sm"
                >
                  <strong className="text-yellow-400">Significado:</strong> {selectedWaypoint.meaning}
                </motion.p>
                
                <motion.p 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-muted-foreground mb-4 text-sm"
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
                        // Open chapter PDF or link
                        if (selectedWaypoint.capUrl) {
                          window.open(selectedWaypoint.capUrl, '_blank');
                        }
                      }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Ler Capítulo
                    </Button>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full border-cyan-500 text-cyan-400 hover:scale-105 transition-transform"
                      onClick={() => {
                        // Open QR code
                        if (selectedWaypoint.qrCodeUrl) {
                          window.open(selectedWaypoint.qrCodeUrl, '_blank');
                        }
                      }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      Ver QR Code
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
            {editMode && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                className="text-center cursor-pointer"
              >
                <div className="text-yellow-400 text-glow font-bold text-xl">✏️</div>
                <div className="text-muted-foreground">Editando</div>
              </motion.div>
            )}
          </div>
          {editMode && (
            <div className="mt-2 text-xs text-yellow-400 text-center">
              Posições sendo salvas automaticamente
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default Map;