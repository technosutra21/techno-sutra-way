# TECHNO SUTRA - OVERVIEW TÉCNICO DETALHADO

## 🔧 Análise de Componentes Principais

### 📱 **App.tsx - Configuração Central**
```typescript
// Estrutura de roteamento e providers globais
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <div className="dark">
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<Map />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/route-creator" element={<RouteCreator />} />
            <Route path="/model-viewer" element={<ModelViewer />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
```

**Características Técnicas:**
- **Arquitetura SPA** com React Router
- **QueryClient** para gerenciamento de cache global
- **Dark mode forçado** para estética cyberpunk
- **TooltipProvider** para UX consistente
- **Error boundary** implícito via React 18

---

### 🏠 **Home.tsx - Landing Page Imersiva**

**Estrutura Visual:**
```typescript
// Componentes principais da home
const Home = () => {
  const { getCombinedData, loading } = useSutraData();
  const [randomCharacters, setRandomCharacters] = useState([]);

  // Animações escalonadas com Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
```

**Features Implementadas:**
- **Animações complexas** com stagger effects
- **Background dinâmico** com gradientes e blur
- **Cards interativos** com hover states
- **Personagens aleatórios** para showcasing
- **Estatísticas dinâmicas** baseadas nos dados carregados
- **Call-to-actions** estrategicamente posicionados

**Performance:**
- **Lazy loading** de personagens aleatórios
- **Memoização** de componentes pesados
- **Debounce** nos efeitos de hover

---

### 🗺️ **Map.tsx - Sistema de Mapeamento Avançado**

**Arquitetura do Mapa:**
```typescript
const Map = () => {
  // Estados principais
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedWaypoint, setSelectedWaypoint] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [mapStyle, setMapStyle] = useState('backdrop');
  const [isCyberpunkMode, setIsCyberpunkMode] = useState(true);
  
  // Referências para controle direto
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const markersRef = useRef<Map<number, maptilersdk.Marker>>(new Map());
```

**Funcionalidades Avançadas:**

1. **Sistema de Coordenadas Fixas**
   ```typescript
   // Carregamento de coordenadas pré-definidas
   const loadFixedCoordinates = async () => {
     const response = await fetch('/waypoint-coordinates.json');
     const coordinates = await response.json();
     setFixedCoordinates(coordinates);
   };
   ```

2. **Editor de Posições em Tempo Real**
   ```typescript
   const toggleEditMode = () => {
     setEditMode(!editMode);
     // Ativa/desativa draggable nos markers
     markersRef.current.forEach(marker => {
       marker.setDraggable(editMode);
     });
   };
   ```

3. **Modo Cyberpunk Dinâmico**
   ```typescript
   // Aplicação de filtros CSS via JavaScript
   const applyCyberpunkMode = (active: boolean) => {
     if (active && mapContainer.current) {
       mapContainer.current.classList.add('cyberpunk-map');
     }
   };
   ```

**Performance & Otimizações:**
- **Virtualização** de markers fora da viewport
- **Clustering** automático para alta densidade de pontos
- **Debounced updates** durante arrastar e soltar
- **Caching** de posições no localStorage

---

### 🎭 **Gallery.tsx - Visualização 3D dos Personagens**

**Sistema de Renderização:**
```typescript
const Gallery = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [models, setModels] = useState<any[]>([]);
  
  // Geração dinâmica de modelos baseada nos dados CSV
  useEffect(() => {
    const sutraData = getCombinedData('pt');
    const generatedModels = sutraData.map((entry, index) => ({
      id: entry.chapter,
      title: entry.nome,
      modelUrl: entry.linkModel,
      rarity: entry.chapter % 7 === 0 ? 'legendary' : 
              entry.chapter % 3 === 0 ? 'epic' : 'common',
      // Outros campos derivados...
    }));
    setModels(generatedModels);
  }, [dataLoading, dataError]);
```

**Sistema de Raridade:**
```typescript
const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'legendary': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
    case 'epic': return 'bg-gradient-to-r from-purple-400 to-pink-500';
    default: return 'bg-gradient-to-r from-blue-400 to-cyan-500';
  }
};
```

**Features Avançadas:**
- **Filtragem multi-dimensional** (busca + raridade)
- **Grid responsivo** com Tailwind CSS
- **Lazy loading** de thumbnails
- **Modal detalhado** para cada personagem
- **Integração** com visualizador 3D

---

### 🎨 **ModelViewer.tsx - Visualizador 3D WebGL**

**Configuração WebGL:**
```typescript
const ModelViewer = () => {
  const [searchParams] = useSearchParams();
  const modelUrl = searchParams.get('url');
  const title = searchParams.get('title') || 'Modelo 3D';

  // Carregamento dinâmico do Google Model Viewer
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
    document.head.appendChild(script);
  }, [modelUrl]);
```

**Configuração Avançada do Model Viewer:**
```jsx
<model-viewer
  src={modelUrl}
  alt={title}
  auto-rotate
  camera-controls
  environment-image="https://modelviewer.dev/shared-assets/environments/moon_1k.hdr"
  tone-mapping="aces"
  shadow-intensity="1"
  shadow-softness="0.5"
  interaction-prompt="none"
  style={{
    width: '100%',
    height: 'calc(100vh - 80px)',
    background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 100%)'
  }}
/>
```

**Funcionalidades:**
- **Controles de câmera** 3D completos
- **Auto-rotação** configurável
- **Iluminação HDR** para realismo
- **Tone mapping ACES** para cores precisas
- **Reset de câmera** programático
- **Download** de modelos GLB

---

### 🛣️ **RouteCreator.tsx - Criador de Rotas Personalizadas**

**Sistema de Waypoints:**
```typescript
interface CustomWaypoint {
  id: string;
  coordinates: [number, number];
  name: string;
  type: 'start' | 'end' | 'waypoint';
}

const RouteCreator = () => {
  const [waypoints, setWaypoints] = useState<CustomWaypoint[]>([]);
  const [selectedTool, setSelectedTool] = useState<'start' | 'end' | 'waypoint'>('start');
  
  // Handler para cliques no mapa
  const handleMapClick = (e: any) => {
    const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    const newWaypoint: CustomWaypoint = {
      id: `${selectedTool}-${Date.now()}`,
      coordinates,
      name: getWaypointName(selectedTool, waypoints.length),
      type: selectedTool
    };
    setWaypoints([...waypoints, newWaypoint]);
  };
```

**Geocodificação Integrada:**
```typescript
const geocodeLocation = async (query: string): Promise<[number, number] | null> => {
  try {
    const response = await fetch(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${apiKey}&limit=1`
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
```

---

### 🔧 **useSutraData.ts - Hook de Gerenciamento de Dados**

**Parser CSV Otimizado:**
```typescript
const parseCSV = (csvText: string): any[] => {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(header => 
    header.replace(/^"/, '').replace(/"$/, '').trim()
  );
  
  const data: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parser avançado com suporte a quotes escapadas
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const nextChar = line[j + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentValue += '"';
          j++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    values.push(currentValue.trim());
    
    const entry: any = {};
    headers.forEach((header, index) => {
      entry[header] = values[index] || '';
    });
    
    data.push(entry);
  }
  
  return data;
};
```

**Sistema de Caching e Performance:**
```typescript
export const useSutraData = () => {
  const [data, setData] = useState<SutraData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCSVData = async () => {
      try {
        // Carregamento paralelo de todos os arquivos CSV
        const [charactersResponse, charactersENResponse, chaptersResponse, chaptersENResponse] = 
          await Promise.all([
            fetch('/characters.csv'),
            fetch('/characters_en.csv'),
            fetch('/chapters.csv'),
            fetch('/chapters_en.csv')
          ]);

        // Parse e mapeamento para interfaces TypeScript
        const characters = mapCharacterData(parseCSV(charactersText));
        const charactersEN = mapCharacterENData(parseCSV(charactersENText));
        const chapters = mapChapterData(parseCSV(chaptersText));
        const chaptersEN = mapChapterENData(parseCSV(chaptersENText));

        setData({ characters, charactersEN, chapters, chaptersEN });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadCSVData();
  }, []);

  // Função para combinar dados de personagens e capítulos
  const getCombinedData = (language: 'pt' | 'en' = 'pt'): CombinedSutraEntry[] => {
    if (!data) return [];

    const characters = language === 'pt' ? data.characters : data.charactersEN;
    const chapters = language === 'pt' ? data.chapters : data.chaptersEN;

    return characters.map(char => {
      const chapter = chapters.find(ch => ch.chapter === (language === 'pt' ? char.capitulo : char.chapter));
      
      // Combina dados de personagem e capítulo com fallbacks inteligentes
      return {
        id: char.id,
        chapter: language === 'pt' ? char.capitulo : char.chapter,
        nome: language === 'pt' ? char.nome : data.charactersEN.find(c => c.chapter === char.chapter)?.name || char.nome,
        // ... outros campos combinados
      };
    }).sort((a, b) => a.chapter - b.chapter);
  };
};
```

---

### 🎨 **Design System - index.css**

**Paleta de Cores AMOLED:**
```css
:root {
  /* Pure Black AMOLED Background */
  --background: 0 0% 0%;
  --foreground: 0 0% 100%;

  /* Card system with subtle glow */
  --card: 240 100% 2%;
  --card-foreground: 0 0% 95%;

  /* Neon Cyan Primary */
  --primary: 180 100% 50%;
  --primary-foreground: 0 0% 0%;

  /* Neon Purple Accent */
  --accent: 280 100% 60%;
  --accent-foreground: 0 0% 0%;

  /* Cyberpunk gradients */
  --gradient-neon: linear-gradient(135deg, hsl(180 100% 50%), hsl(280 100% 60%));
  --gradient-glow: linear-gradient(135deg, hsl(180 100% 50% / 0.1), hsl(280 100% 60% / 0.1));

  /* Neon glow effects */
  --glow-cyan: 0 0 20px hsl(180 100% 50% / 0.5);
  --glow-purple: 0 0 20px hsl(280 100% 60% / 0.5);
}
```

**Efeitos Avançados:**
```css
.neon-glow {
  box-shadow: var(--glow-cyan);
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.neon-glow::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, hsl(180 100% 50% / 0.2), transparent);
  transition: left 0.8s;
}

.neon-glow:hover::before {
  left: 100%;
}

.gradient-neon::after {
  content: '';
  position: absolute;
  background: linear-gradient(45deg, transparent 49%, hsl(0 0% 100% / 0.1) 50%, transparent 51%);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
}
```

---

## 📊 **Estrutura de Dados Detalhada**

### **Interfaces TypeScript:**
```typescript
interface Character {
  id: string;
  createdDate: string;
  updatedDate: string;
  owner: string;
  capitulo: number;
  nome: string;
  ensinamento: string;
  descPersonagem: string;
  ocupacao: string;
  significado: string;
  local: string;
  resumoCap: string;
  capFileName: string;
  capUrl: string;
  qrCodeUrl: string;
  linkModel: string;
}

interface CombinedSutraEntry {
  id: string;
  chapter: number;
  // Dados bilíngues
  nome: string;
  name: string;
  ocupacao: string;
  occupation: string;
  significado: string;
  meaning: string;
  local: string;
  location: string;
  ensinamento: string;
  teaching: string;
  // Dados adicionais dos capítulos
  encounter?: string;
  assembly?: string;
  dialogue?: string;
  manifestation?: string;
  learning?: string;
  direction?: string;
  literaryStructure?: string;
}
```

### **Sistema de Coordenadas:**
```json
{
  "1": {
    "lat": -21.868036707651,
    "lng": -46.67732383198648,
    "name": "Buda Śākyamuni",
    "location": "Jetavana, no parque de Anāthapiṇḍada em Śrāvastī"
  },
  "2": {
    "lat": -21.86953296779599,
    "lng": -46.67805522448601,
    "name": "Samanta­bhadra",
    "location": "Jetavana, no parque de Anāthapiṇḍada em Śrāvastī"
  }
  // ... 56 pontos totais
}
```

---

## 🚀 **Otimizações de Performance**

### **Bundle Splitting:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-tabs'],
          maps: ['@maptiler/sdk'],
          models: ['@google/model-viewer'],
          animations: ['framer-motion']
        }
      }
    }
  }
});
```

### **Lazy Loading Strategy:**
```typescript
// Componentes carregados sob demanda
const ModelViewer = lazy(() => import('./pages/ModelViewer'));
const RouteCreator = lazy(() => import('./pages/RouteCreator'));

// Modelos 3D carregados apenas quando necessário
const load3DModel = async (modelUrl: string) => {
  const model = await import(modelUrl);
  return model.default;
};
```

### **Caching Strategy:**
```typescript
// TanStack Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hora
      cacheTime: 1000 * 60 * 60 * 24, // 24 horas
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});
```

---

## 🔐 **Segurança e Melhores Práticas**

### **API Key Management:**
```typescript
// Keys públicas (seguras para exposição)
const PUBLIC_API_KEYS = {
  MAPTILER: 'rg7OAqXjLo7cLdwqlrVt', // Pública para domínio específico
};

// Validação de URLs externas
const validateExternalUrl = (url: string): boolean => {
  const allowedDomains = [
    'cdn.statically.io',
    'drive.google.com',
    'technosutra21.github.io'
  ];
  
  try {
    const urlObj = new URL(url);
    return allowedDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
};
```

### **Input Sanitization:**
```typescript
// Sanitização de dados CSV
const sanitizeCSVData = (data: any): any => {
  const sanitized = { ...data };
  
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      // Remove scripts maliciosos
      sanitized[key] = sanitized[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .trim();
    }
  });
  
  return sanitized;
};
```

---

## 📱 **Responsividade e Acessibilidade**

### **Breakpoints Tailwind:**
```css
/* Mobile First Approach */
.container {
  @apply px-4 mx-auto;
}

@screen sm {
  .container { @apply px-6; }
}

@screen md {
  .container { @apply px-8; }
}

@screen lg {
  .container { @apply px-12; }
}
```

### **Acessibilidade:**
```typescript
// ARIA labels dinâmicos
const getAriaLabel = (character: Character): string => {
  return `${character.nome}, Capítulo ${character.capitulo}, ${character.ocupacao}. ${character.significado}`;
};

// Focus management
const manageFocus = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.focus();
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};
```

---

Este overview técnico demonstra a profundidade e sofisticação do projeto **Techno Sutra**, combinando tecnologias modernas com práticas de desenvolvimento avançadas para criar uma experiência web imersiva e performática.

*A convergência entre código e consciência, expressa através de tecnologia transcendental. ⚡*
