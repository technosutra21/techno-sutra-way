import React, { createContext, useContext, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

interface LanguageContextType {
  language: 'pt' | 'en';
  setLanguage: (lang: 'pt' | 'en') => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  pt: {
    // Navigation
    'nav.home': 'Início',
    'nav.map': 'Mapa',
    'nav.gallery': 'Galeria',
    'nav.routeCreator': 'Criar Rota',
    
    // Home page
    'home.title': 'Techno Sutra',
    'home.subtitle': 'A jornada espiritual ancestral encontra a tecnologia cyberpunk. Explore os 56 capítulos sagrados do Sutra Stem Array em uma experiência imersiva única.',
    'home.startJourney': 'Iniciar Jornada',
    'home.exploreGallery': 'Explorar Galeria',
    'home.originalRoute': 'Rota Original',
    'home.originalRouteDesc': 'Explore os 56 pontos sagrados da peregrinação original em Águas da Prata, SP',
    'home.gallery3d': 'Galeria 3D',
    'home.gallery3dDesc': 'Visualize os personagens místicos em realidade aumentada',
    'home.createRoute': 'Criar Rota',
    'home.createRouteDesc': 'Crie sua própria jornada espiritual em qualquer lugar do mundo',
    'home.journeyNumbers': 'A Jornada em Números',
    'home.sacredChapters': 'Capítulos Sagrados',
    'home.models3d': 'Modelos 3D',
    'home.possibleRoutes': 'Rotas Possíveis',
    'home.spiritualDestination': 'Destino Espiritual',
    'home.readyToStart': 'Pronto para Começar?',
    'home.readyToStartDesc': 'Embarque em uma jornada que transcende tempo e espaço. O caminho da iluminação aguarda.',
    'home.startPilgrimage': 'Iniciar Peregrinação Sagrada',
    
    // Map page
    'map.technoSutra': 'Techno Sutra',
    'map.originalRoute': 'Rota Sagrada Original',
    'map.location': 'Águas da Prata, SP',
    'map.searchChapter': 'Buscar personagem ou capítulo...',
    'map.shadowsMode': 'Modo Sombras',
    'map.cyberpunkMode': 'Modo Cyberpunk',
    'map.neuralNetwork': 'Neural Network',
    'map.points': 'Pontos',
    'map.filtered': 'Filtrados',
    'map.located': 'Localizado',
    'map.flyToLocation': 'Voar para Local',
    'map.view3dModel': 'Ver Modelo 3D',
    'map.readChapter': 'Ler Capítulo',
    'map.viewQrCode': 'Ver QR Code',
    'map.meaning': 'Significado',
    
    // Gallery page
    'gallery.title': 'Galeria de Personagens 3D',
    'gallery.subtitle': 'Explore os personagens místicos do Sutra Stem Array',
    'gallery.search': 'Buscar personagens, ocupações, locais...',
    'gallery.all': 'Todos',
    'gallery.viewIn3d': 'Ver em 3D',
    'gallery.meaning': 'Significado',
    
    // Model viewer
    'modelViewer.back': 'Voltar',
    'modelViewer.reset': 'Reset',
    'modelViewer.download': 'Download',
    'modelViewer.loading': 'Carregando Modelo 3D...',
    'modelViewer.controls': 'Controles: Arraste para rotacionar • Scroll para zoom • Clique duplo para focar',
    'modelViewer.partOf': 'Modelo 3D do {title} - Parte da jornada sagrada Techno Sutra',
    
    // Common
    'common.loading': 'Carregando...',
    'common.error': 'Erro',
    'common.chapter': 'Capítulo',
    'common.occupation': 'Ocupação',
    'common.location': 'Local',
    'common.teaching': 'Ensinamento'
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.map': 'Map',
    'nav.gallery': 'Gallery',
    'nav.routeCreator': 'Create Route',
    
    // Home page
    'home.title': 'Techno Sutra',
    'home.subtitle': 'Ancient spiritual journey meets cyberpunk technology. Explore the 56 sacred chapters of the Stem Array Sutra in a unique immersive experience.',
    'home.startJourney': 'Start Journey',
    'home.exploreGallery': 'Explore Gallery',
    'home.originalRoute': 'Original Route',
    'home.originalRouteDesc': 'Explore the 56 sacred points of the original pilgrimage in Águas da Prata, SP',
    'home.gallery3d': '3D Gallery',
    'home.gallery3dDesc': 'Visualize mystical characters in augmented reality',
    'home.createRoute': 'Create Route',
    'home.createRouteDesc': 'Create your own spiritual journey anywhere in the world',
    'home.journeyNumbers': 'The Journey in Numbers',
    'home.sacredChapters': 'Sacred Chapters',
    'home.models3d': '3D Models',
    'home.possibleRoutes': 'Possible Routes',
    'home.spiritualDestination': 'Spiritual Destination',
    'home.readyToStart': 'Ready to Begin?',
    'home.readyToStartDesc': 'Embark on a journey that transcends time and space. The path to enlightenment awaits.',
    'home.startPilgrimage': 'Start Sacred Pilgrimage',
    
    // Map page
    'map.technoSutra': 'Techno Sutra',
    'map.originalRoute': 'Original Sacred Route',
    'map.location': 'Águas da Prata, SP',
    'map.searchChapter': 'Search character or chapter...',
    'map.shadowsMode': 'Shadows Mode',
    'map.cyberpunkMode': 'Cyberpunk Mode',
    'map.neuralNetwork': 'Neural Network',
    'map.points': 'Points',
    'map.filtered': 'Filtered',
    'map.located': 'Located',
    'map.flyToLocation': 'Fly to Location',
    'map.view3dModel': 'View 3D Model',
    'map.readChapter': 'Read Chapter',
    'map.viewQrCode': 'View QR Code',
    'map.meaning': 'Meaning',
    
    // Gallery page
    'gallery.title': '3D Characters Gallery',
    'gallery.subtitle': 'Explore the mystical characters of the Stem Array Sutra',
    'gallery.search': 'Search characters, occupations, locations...',
    'gallery.all': 'All',
    'gallery.viewIn3d': 'View in 3D',
    'gallery.meaning': 'Meaning',
    
    // Model viewer
    'modelViewer.back': 'Back',
    'modelViewer.reset': 'Reset',
    'modelViewer.download': 'Download',
    'modelViewer.loading': 'Loading 3D Model...',
    'modelViewer.controls': 'Controls: Drag to rotate • Scroll to zoom • Double-click to focus',
    'modelViewer.partOf': '3D model of {title} - Part of the sacred Techno Sutra journey',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.chapter': 'Chapter',
    'common.occupation': 'Occupation',
    'common.location': 'Location',
    'common.teaching': 'Teaching'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
      className="text-muted-foreground hover:text-primary transition-colors"
    >
      <Globe className="w-4 h-4 mr-2" />
      {language === 'pt' ? 'EN' : 'PT'}
    </Button>
  );
};