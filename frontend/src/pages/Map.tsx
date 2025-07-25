import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, Navigation, Zap, Search, Maximize, 
  LocateFixed, Target, Eye, EyeOff, Compass, 
  Satellite, Layers, Users, Globe, Monitor, 
  RefreshCw, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { useSutraData } from '@/hooks/useSutraData';
import { CharacterDetailModal } from '@/components/CharacterDetailModal';
import { logger } from '@/lib/logger';
import { useProgress } from '@/hooks/useProgress';
import { useToast } from '@/hooks/use-toast';

// Base coordinates for Águas da Prata, SP
const BASE_COORDINATES = {
  lat: -21.9427,
  lng: -46.7167
};

// Map styles configuration
const MAP_STYLES = {
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    icon: Zap,
    url: 'backdrop',
    cyberpunk: true,
    description: 'Shadow base com inversão cyberpunk'
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite',
    icon: Satellite,
    url: 'satellite',
    cyberpunk: false,
    description: 'Vista satelital do mundo'
  },
  simple: {
    id: 'simple',
    name: 'Simple',
    icon: Globe,
    url: 'streets-v2',
    cyberpunk: false,
    description: 'Mapa comum e limpo'
  }
};

const Map = () => {
  // Refs
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const markersRef = useRef<globalThis.Map<number, maptilersdk.Marker>>(new globalThis.Map());
  const userMarker = useRef<maptilersdk.Marker | null>(null);
  const accuracyCircleRef = useRef<maptilersdk.Marker | null>(null);
  const locationWatchId = useRef<number | null>(null);

  // State management
  const [currentStyle, setCurrentStyle] = useState<keyof typeof MAP_STYLES>('cyberpunk');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWaypoint, setSelectedWaypoint] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredWaypoints, setFilteredWaypoints] = useState<any[]>([]);
  const [showPanels, setShowPanels] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // GPS tracking state
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isTrackingUser, setIsTrackingUser] = useState(false);
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);
  const [nearbyWaypoints, setNearbyWaypoints] = useState<any[]>([]);

  // Data management
  const [fixedCoordinates, setFixedCoordinates] = useState<any>({});
  const [waypoints, setWaypoints] = useState<any[]>([]);

  // Hooks
  const { getCombinedData, loading: dataLoading, error: dataError } = useSutraData();
  const { 
    visitedWaypoints: progressVisitedWaypoints, 
    totalProgress, 
    visitedCount, 
    markAsVisited, 
    isVisited 
  } = useProgress();
  const { toast } = useToast();

  // Load fixed coordinates from JSON file
  useEffect(() => {
    const loadFixedCoordinates = async () => {
      try {
        const response = await fetch('/waypoint-coordinates.json');
        if (response.ok) {
          const coordinates = await response.json();
          setFixedCoordinates(coordinates);
          logger.info('✅ Loaded', Object.keys(coordinates).length, 'waypoint coordinates');
        } else {
          logger.error('❌ Failed to load waypoint coordinates');
        }
      } catch (error) {
        logger.error('❌ Error loading waypoint coordinates:', error);
      }
    };
    
    loadFixedCoordinates();
  }, []);

  // Generate waypoints from CSV data with fixed coordinates
  const generateWaypoints = useCallback(() => {
    const sutraData = getCombinedData('pt');
    if (sutraData.length === 0 || Object.keys(fixedCoordinates).length === 0) return [];

    const waypointsWithCoords = sutraData.slice(0, 56).filter((entry) => {
      return fixedCoordinates[entry.chapter];
    }).map((entry) => {
      const fixed = fixedCoordinates[entry.chapter];
      const coordinates: [number, number] = [fixed.lng, fixed.lat];

      return {
        id: entry.chapter,
        coordinates,
        chapter: entry.chapter,
        title: entry.nome,
        subtitle: `Capítulo ${entry.chapter}`,
        description: entry.descPersonagem || entry.ensinamento.substring(0, 200) + '...',
        fullCharacter: entry, // Store full character data for modal
        // Additional data for display
        occupation: entry.ocupacao,
        meaning: entry.significado,
        location: entry.local,
        model: entry.linkModel,
        capUrl: entry.capUrl,
        qrCodeUrl: entry.qrCodeUrl
      };
    });
    
    logger.info(`✅ Generated ${waypointsWithCoords.length} waypoints with coordinates`);
    return waypointsWithCoords;
  }, [fixedCoordinates, dataLoading, dataError]); // Remove getCombinedData from dependencies

  // Add waypoints to map
  const addWaypointsToMap = useCallback((waypointsToAdd: any[]) => {
    if (!map.current || waypointsToAdd.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    waypointsToAdd.forEach((waypoint) => {
      const el = document.createElement('div');
      const isVisitedPoint = progressVisitedWaypoints.has(waypoint.chapter);
      const styleConfig = MAP_STYLES[currentStyle];
      
      el.className = `waypoint-marker ${isVisitedPoint ? 'waypoint-visited' : ''}`;
      el.style.cssText = `
        width: ${isVisitedPoint ? '40px' : '36px'};
        height: ${isVisitedPoint ? '40px' : '36px'};
        border-radius: 50%;
        background: ${isVisitedPoint ? 
          'linear-gradient(135deg, #00ff00, #88ff00)' : 
          styleConfig.cyberpunk ? 
            'linear-gradient(135deg, #ff00ff, #00ffff)' : 
            'linear-gradient(135deg, #00aaff, #ff6600)'
        };
        border: 3px solid ${isVisitedPoint ? '#ffffff' : '#ffffff'};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${isVisitedPoint ? '#000' : '#000'};
        font-weight: bold;
        font-size: ${isVisitedPoint ? '14px' : '12px'};
        box-shadow: 0 0 ${isVisitedPoint ? '30px' : '25px'} ${
          isVisitedPoint ? '#00ff00' : 
          styleConfig.cyberpunk ? '#ff00ff' : '#00aaff'
        };
        position: relative;
        z-index: ${isVisitedPoint ? '200' : '100'};
        transition: all 0.3s ease;
        backdrop-filter: blur(5px);
      `;
      
      el.textContent = isVisitedPoint ? '✓' : String(waypoint.chapter);
      el.title = `${waypoint.title}\n${waypoint.occupation}\n📍 ${waypoint.location}${isVisitedPoint ? '\n✅ Visitado' : ''}`;

      // Hover effects
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3)';
        el.style.zIndex = '1000';
        el.style.boxShadow = `0 0 40px ${isVisitedPoint ? '#00ff00' : styleConfig.cyberpunk ? '#ff00ff' : '#00aaff'}`;
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.zIndex = isVisitedPoint ? '200' : '100';
        el.style.boxShadow = `0 0 ${isVisitedPoint ? '30px' : '25px'} ${isVisitedPoint ? '#00ff00' : styleConfig.cyberpunk ? '#ff00ff' : '#00aaff'}`;
      });

      // Click handler - open modal with full character data
      el.addEventListener('click', (e) => {
        setSelectedWaypoint(waypoint.fullCharacter);
        e.stopPropagation();
      });

      const marker = new maptilersdk.Marker(el)
        .setLngLat(waypoint.coordinates)
        .addTo(map.current!);

      markersRef.current.set(waypoint.chapter, marker);
    });
  }, [progressVisitedWaypoints, currentStyle]);

  // Update waypoints when data loads
  useEffect(() => {
    if (!dataLoading && !dataError) {
      const newWaypoints = generateWaypoints();
      setWaypoints(newWaypoints);
      setFilteredWaypoints(newWaypoints);
    }
  }, [dataLoading, dataError, generateWaypoints]);

  // Filter waypoints based on search
  useEffect(() => {
    if (searchTerm) {
      const filtered = waypoints.filter(waypoint =>
        waypoint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        waypoint.chapter.toString().includes(searchTerm) ||
        waypoint.occupation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        waypoint.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        waypoint.meaning.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredWaypoints(filtered);
    } else {
      setFilteredWaypoints(waypoints);
    }
  }, [searchTerm, waypoints]);

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
        center: [BASE_COORDINATES.lng, BASE_COORDINATES.lat],
        zoom: 14,
        pitch: 0,
        bearing: 0,
        attributionControl: false,
        antialias: true
      });

      // Add navigation controls
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
        logger.info('🗺️ Map loaded successfully with style:', currentStyle);
        setIsLoading(false);
        
        // Apply cyberpunk styling if needed
        if (styleConfig.cyberpunk && mapContainer.current) {
          setTimeout(() => {
            mapContainer.current!.classList.add('cyberpunk-map');
            logger.info('🎨 Cyberpunk mode applied');
          }, 500);
        } else if (mapContainer.current) {
          mapContainer.current.classList.remove('cyberpunk-map');
        }
        
        // Add waypoints to map when both map is loaded and waypoints are ready
        if (waypoints.length > 0) {
          addWaypointsToMap(waypoints);
        }
      });

      // Error handling
      map.current.on('error', (e) => {
        logger.error('Map error:', e);
        setIsLoading(false);
        toast({
          title: "Erro no Mapa",
          description: "Problema ao carregar o mapa. Recarregando...",
          variant: "destructive",
        });
      });

    } catch (error) {
      logger.error('Failed to initialize map:', error);
      setIsLoading(false);
      toast({
        title: "Erro de Inicialização",
        description: "Não foi possível inicializar o mapa",
        variant: "destructive",
      });
    }

    return () => {
      if (mapContainer.current) {
        mapContainer.current.classList.remove('cyberpunk-map');
      }
      map.current?.remove();
    };
  }, [currentStyle, toast]); // Remove waypoints from dependencies

  // Separate useEffect for adding waypoints when they're ready
  useEffect(() => {
    if (map.current && waypoints.length > 0 && !isLoading) {
      addWaypointsToMap(waypoints);
    }
  }, [waypoints, isLoading, addWaypointsToMap]);

  // Add waypoints to map
  const addWaypointsToMap = useCallback((waypointsToAdd: any[]) => {
    if (!map.current || waypointsToAdd.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    waypointsToAdd.forEach((waypoint) => {
      const el = document.createElement('div');
      const isVisitedPoint = progressVisitedWaypoints.has(waypoint.chapter);
      const styleConfig = MAP_STYLES[currentStyle];
      
      el.className = `waypoint-marker ${isVisitedPoint ? 'waypoint-visited' : ''}`;
      el.style.cssText = `
        width: ${isVisitedPoint ? '40px' : '36px'};
        height: ${isVisitedPoint ? '40px' : '36px'};
        border-radius: 50%;
        background: ${isVisitedPoint ? 
          'linear-gradient(135deg, #00ff00, #88ff00)' : 
          styleConfig.cyberpunk ? 
            'linear-gradient(135deg, #ff00ff, #00ffff)' : 
            'linear-gradient(135deg, #00aaff, #ff6600)'
        };
        border: 3px solid ${isVisitedPoint ? '#ffffff' : '#ffffff'};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${isVisitedPoint ? '#000' : '#000'};
        font-weight: bold;
        font-size: ${isVisitedPoint ? '14px' : '12px'};
        box-shadow: 0 0 ${isVisitedPoint ? '30px' : '25px'} ${
          isVisitedPoint ? '#00ff00' : 
          styleConfig.cyberpunk ? '#ff00ff' : '#00aaff'
        };
        position: relative;
        z-index: ${isVisitedPoint ? '200' : '100'};
        transition: all 0.3s ease;
        backdrop-filter: blur(5px);
      `;
      
      el.textContent = isVisitedPoint ? '✓' : String(waypoint.chapter);
      el.title = `${waypoint.title}\n${waypoint.occupation}\n📍 ${waypoint.location}${isVisitedPoint ? '\n✅ Visitado' : ''}`;

      // Hover effects
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3)';
        el.style.zIndex = '1000';
        el.style.boxShadow = `0 0 40px ${isVisitedPoint ? '#00ff00' : styleConfig.cyberpunk ? '#ff00ff' : '#00aaff'}`;
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.zIndex = isVisitedPoint ? '200' : '100';
        el.style.boxShadow = `0 0 ${isVisitedPoint ? '30px' : '25px'} ${isVisitedPoint ? '#00ff00' : styleConfig.cyberpunk ? '#ff00ff' : '#00aaff'}`;
      });

      // Click handler - open modal with full character data
      el.addEventListener('click', (e) => {
        setSelectedWaypoint(waypoint.fullCharacter);
        e.stopPropagation();
      });

      const marker = new maptilersdk.Marker(el)
        .setLngLat(waypoint.coordinates)
        .addTo(map.current!);

      markersRef.current.set(waypoint.chapter, marker);
    });
  }, [progressVisitedWaypoints, currentStyle]);

  // Calculate distance between coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Update nearby waypoints based on user location
  const updateNearbyWaypoints = useCallback((userLat: number, userLng: number) => {
    const nearby = waypoints.filter(waypoint => {
      const distance = calculateDistance(userLat, userLng, waypoint.coordinates[1], waypoint.coordinates[0]);
      return distance <= 100;
    }).sort((a, b) => {
      const distA = calculateDistance(userLat, userLng, a.coordinates[1], a.coordinates[0]);
      const distB = calculateDistance(userLat, userLng, b.coordinates[1], b.coordinates[0]);
      return distA - distB;
    });

    setNearbyWaypoints(nearby);

    // Auto-visit nearby waypoints
    nearby.forEach(waypoint => {
      const distance = calculateDistance(userLat, userLng, waypoint.coordinates[1], waypoint.coordinates[0]);
      if (distance <= 50 && !progressVisitedWaypoints.has(waypoint.chapter)) {
        markAsVisited(waypoint.chapter);
        toast({
          title: "🎉 Waypoint Visitado!",
          description: `${waypoint.title} - ${waypoint.occupation}`,
          duration: 5000,
        });
      }
    });
  }, [waypoints, progressVisitedWaypoints, markAsVisited, toast]);

  // GPS tracking functions
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Erro de Geolocalização",
        description: "Seu dispositivo não suporta geolocalização",
        variant: "destructive",
      });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const userCoords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude
        ];
        
        setUserLocation(userCoords);
        setUserAccuracy(position.coords.accuracy);
        updateNearbyWaypoints(userCoords[0], userCoords[1]);

        // Update user marker
        if (map.current) {
          if (userMarker.current) {
            userMarker.current.setLngLat([userCoords[1], userCoords[0]]);
          } else {
            const userEl = document.createElement('div');
            userEl.className = 'user-location-marker';
            
            const marker = new maptilersdk.Marker(userEl, { anchor: 'center' })
              .setLngLat([userCoords[1], userCoords[0]])
              .addTo(map.current);
            userMarker.current = marker;
          }
        }
      },
      (error) => {
        logger.error('Location error:', error);
        toast({
          title: "Erro de Localização",
          description: "Não foi possível obter sua localização",
          variant: "destructive",
        });
        setIsTrackingUser(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000
      }
    );

    locationWatchId.current = watchId;
    setIsTrackingUser(true);
  }, [updateNearbyWaypoints, toast]);

  const stopLocationTracking = useCallback(() => {
    if (locationWatchId.current !== null) {
      navigator.geolocation.clearWatch(locationWatchId.current);
      locationWatchId.current = null;
    }
    setIsTrackingUser(false);
  }, []);

  const centerOnUser = useCallback(() => {
    if (userLocation && map.current) {
      map.current.flyTo({
        center: [userLocation[1], userLocation[0]],
        zoom: 18,
        pitch: 60,
        duration: 2000
      });
    } else {
      toast({
        title: "Localização não disponível",
        description: "Ative o tracking para centralizar no usuário",
      });
    }
  }, [userLocation, toast]);

  const flyToWaypoint = useCallback((waypoint: any) => {
    if (map.current) {
      map.current.flyTo({
        center: waypoint.coordinates,
        zoom: 16,
        pitch: 45,
        duration: 2000
      });
    }
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // Clean up tracking on unmount
  useEffect(() => {
    return () => {
      if (locationWatchId.current !== null) {
        navigator.geolocation.clearWatch(locationWatchId.current);
      }
    };
  }, []);

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'h-screen'} relative overflow-hidden bg-background`}>
      {/* Enhanced Loading Screen */}
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
                className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full mx-auto mb-6"
              />
              <motion.h2
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-2xl font-bold text-primary text-glow mb-2"
              >
                {dataLoading ? 'Carregando Dados Sagrados...' : 'Inicializando Mapa Cyberpunk...'}
              </motion.h2>
              <motion.p
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-muted-foreground"
              >
                56 pontos de jornada preparando...
              </motion.p>
              {dataError && (
                <p className="text-destructive text-sm mt-4">
                  Erro: {dataError}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Modern Control Panel */}
      <AnimatePresence>
        {showPanels && (
          <motion.div 
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            className="absolute top-4 left-4 w-80 space-y-4 pointer-events-auto z-40"
          >
            {/* Header Card */}
            <Card className="amoled-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-primary text-glow">
                    Techno Sutra
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Jornada Sagrada Digital
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
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground mb-2">Estilo do Mapa</h3>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(MAP_STYLES).map(([key, style]) => {
                    const IconComponent = style.icon;
                    const isActive = currentStyle === key;
                    
                    return (
                      <Button
                        key={key}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentStyle(key as keyof typeof MAP_STYLES)}
                        className={`justify-start text-left h-auto p-3 ${
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
              </div>
            </Card>

            {/* Search Card */}
            <Card className="amoled-card p-4">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar personagem, capítulo, local..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 cyberpunk-input"
                />
              </div>
              {searchTerm && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-muted-foreground"
                >
                  {filteredWaypoints.length} de 56 pontos encontrados
                </motion.div>
              )}
            </Card>

            {/* GPS Tracking Card */}
            <Card className="amoled-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-primary text-glow">Sistema GPS</h3>
                <Badge variant={isTrackingUser ? "default" : "outline"} className={isTrackingUser ? "tracking-active" : ""}>
                  {isTrackingUser ? 'ATIVO' : 'INATIVO'}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant={isTrackingUser ? "destructive" : "default"}
                    size="sm"
                    onClick={isTrackingUser ? stopLocationTracking : startLocationTracking}
                    className="flex-1"
                  >
                    <LocateFixed className="w-3 h-3 mr-2" />
                    {isTrackingUser ? 'Parar' : 'Rastrear'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={centerOnUser}
                    disabled={!userLocation}
                    className="flex-1"
                  >
                    <Target className="w-3 h-3 mr-2" />
                    Centro
                  </Button>
                </div>

                {/* GPS Status */}
                {userLocation && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-primary/10 border border-primary/30 rounded text-xs space-y-1"
                  >
                    <div className="text-primary font-bold">📍 Status da Localização</div>
                    <div className="text-muted-foreground">
                      Precisão: {userAccuracy ? `${Math.round(userAccuracy)}m` : 'N/A'}
                    </div>
                    <div className="text-muted-foreground">
                      Próximos: {nearbyWaypoints.length} ponto(s)
                    </div>
                  </motion.div>
                )}
              </div>
            </Card>

            {/* Progress Card */}
            <Card className="amoled-card p-4">
              <h3 className="text-sm font-bold text-accent mb-3">Progresso da Jornada</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Visitados</span>
                  <span className="text-lg font-bold text-primary text-glow">{visitedCount}/56</span>
                </div>
                
                <div className="w-full bg-muted/20 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${totalProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="bg-gradient-to-r from-primary to-accent h-2 rounded-full"
                  />
                </div>
                
                <div className="text-center">
                  <span className="text-2xl font-bold text-accent text-glow">
                    {totalProgress.toFixed(1)}%
                  </span>
                  <p className="text-xs text-muted-foreground">Completo</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Panels Button */}
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

      {/* Quick Stats Bottom Bar */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto z-40"
      >
        <Card className="amoled-card px-6 py-3">
          <div className="flex items-center gap-6 text-sm">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="text-center cursor-pointer"
            >
              <div className="text-primary text-glow font-bold text-xl">
                {filteredWaypoints.length}
              </div>
              <div className="text-muted-foreground">Visíveis</div>
            </motion.div>
            
            <div className="w-px h-8 bg-border" />
            
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="text-center cursor-pointer"
            >
              <div className="text-accent text-glow font-bold text-xl">
                {visitedCount}
              </div>
              <div className="text-muted-foreground">Visitados</div>
            </motion.div>
            
            <div className="w-px h-8 bg-border" />
            
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="text-center cursor-pointer"
            >
              <div className="text-cyan-400 text-glow font-bold text-xl">
                {nearbyWaypoints.length}
              </div>
              <div className="text-muted-foreground">Próximos</div>
            </motion.div>
          </div>
        </Card>
      </motion.div>

      {/* Character Detail Modal */}
      <CharacterDetailModal 
        isOpen={!!selectedWaypoint}
        onClose={() => setSelectedWaypoint(null)}
        character={selectedWaypoint}
      />
    </div>
  );
};

export default Map;