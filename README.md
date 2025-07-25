# TECHNO SUTRA

## 🌟 Overview

**Techno Sutra** é uma aplicação web cyberpunk imersiva que digitaliza a jornada espiritual ancestral do **Sutra Stem Array**, transformando os 56 capítulos sagrados em uma experiência interativa única que combina espiritualidade budista com estética futurística.

O projeto mapeia os 56 personagens místicos do texto sagrado Buddhāvataṃsaka em uma plataforma web moderna, oferecendo visualização 3D, mapas interativos e uma interface cyberpunk totalmente responsiva.

## 🎯 Características Principais

### 🗺️ **Mapa Interativo Sagrado**
- **56 pontos georreferenciados** baseados na rota original em Águas da Prata, SP
- **Modo Cyberpunk** com inversão de cores e efeitos neon imersivos
- **Editor de posições** em tempo real com arrastar e soltar
- **Navegação fluida** com MapTiler SDK e controles avançados
- **Busca inteligente** por personagens, capítulos e localizações
- **Sistema de tracking GPS** com detecção de proximidade
- **Progresso de jornada** com gamificação e conquistas

### 👤 **Galeria de Personagens 3D**
- **56 modelos 3D** de alta qualidade dos personagens místicos
- **Visualizador WebGL** com suporte a realidade aumentada
- **Sistema de raridade** (Common, Epic, Legendary)
- **Modal detalhado** com ensinamentos completos de cada personagem
- **Links diretos** para capítulos originais e QR codes

### 🛤️ **Criador de Rotas Personalizadas**
- **Geocodificação inteligente** usando MapTiler API
- **Criação visual** de waypoints personalizados
- **Salvamento e gerenciamento** de rotas criadas
- **Exportação e importação** de dados para compartilhamento
- **Integração com mapa principal** para visualização

### 📊 **Sistema de Progresso**
- **Tracking de visitas** a waypoints com persistência local
- **Conquistas e marcos** (Explorador, Meio Caminho, Iluminado)
- **Barra de progresso** visual em tempo real
- **Estatísticas detalhadas** de jornada

### 🎨 **Design System Cyberpunk**
- **Paleta AMOLED** com cores neon (Cyan #00FFFF, Purple #B347FF)
- **Efeitos de glow** e animações suaves com Framer Motion
- **Componentes Shadcn/ui** customizados
- **Dark mode nativo** otimizado para displays OLED
- **Tipografia futurística** com Inter font

## 🏗️ Arquitetura Técnica

### **Frontend Stack**
```
React 18.3.1 (SPA)
├── TypeScript 5.5.3          # Type safety
├── Vite 5.4.1                # Build tool & dev server
├── Tailwind CSS 3.4.11       # Utility-first styling
├── Framer Motion 10.18.0     # Animations
├── React Router 6.26.2       # Client-side routing
├── TanStack Query 5.56.2     # Data fetching & caching
└── Shadcn/ui                  # Component library
```

### **Mapas & Visualização**
```
@maptiler/sdk 3.6.1           # Maps & geocoding
├── Controles de navegação     # Zoom, pitch, bearing
├── Sobreposições customizadas # Marcadores interativos
├── Suporte a múltiplos estilos # Backdrop, Streets, Satellite
└── Geocodificação reversa     # Search & fly-to locations
```

### **Modelos 3D**
```
@google/model-viewer 3.5.0    # WebGL 3D rendering
├── Formato GLB otimizado      # Carregamento rápido
├── Controles de câmera        # Rotate, zoom, pan  
├── Realidade aumentada        # AR support
└── Ambiente HDR personalizado # Lighting & reflections
```

### **Gestão de Dados**
```
Sistema de CSV dinâmico + LocalStorage
├── characters.csv             # Dados principais (PT)
├── characters_en.csv          # Dados em inglês
├── chapters.csv               # Capítulos detalhados (PT)
├── chapters_en.csv            # Capítulos em inglês
├── waypoint-coordinates.json  # Coordenadas fixas dos pontos
├── Progress tracking          # Visitas e conquistas
└── Route management           # Rotas personalizadas
```

### **Estado & Performance**
```
React Hooks customizados
├── useSutraData.ts           # CSV parsing & caching
├── useState/useEffect        # Local state management
├── TanStack Query            # Server state & cache
└── LocalStorage              # Persistência de configurações
```

## 📁 Estrutura do Projeto

```
TECHNOSUTRA1/2/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/               # Shadcn/ui components
│   │   │   ├── Navigation.tsx    # Main navigation
│   │   │   └── CharacterDetailModal.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx          # Landing page
│   │   │   ├── Map.tsx           # Interactive map
│   │   │   ├── Gallery.tsx       # 3D character gallery
│   │   │   ├── RouteCreator.tsx  # Custom route builder
│   │   │   └── ModelViewer.tsx   # 3D model viewer
│   │   ├── hooks/
│   │   │   └── useSutraData.ts   # Data management
│   │   ├── types/
│   │   │   └── sutra.ts          # TypeScript interfaces
│   │   └── lib/
│   │       └── utils.ts          # Utility functions
│   ├── public/
│   │   ├── characters.csv        # Character data (PT)
│   │   ├── characters_en.csv     # Character data (EN)
│   │   ├── chapters.csv          # Chapter data (PT)
│   │   ├── chapters_en.csv       # Chapter data (EN)
│   │   └── waypoint-coordinates.json # Fixed coordinates
│   ├── build/                    # Production build
│   └── package.json
├── .gitignore
└── README.md
```

## 🗃️ Estrutura de Dados

### **Character Interface**
```typescript
interface Character {
  id: string;
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
```

### **Coordinates System** 
```json
{
  "1": {
    "lat": -21.868036707651,
    "lng": -46.67732383198648,
    "name": "Buda Śākyamuni",
    "location": "Jetavana, no parque de Anāthapiṇḍada em Śrāvastī"
  }
}
```

## ⚡ Performance & Otimizações Implementadas

### **Bundle Splitting & Lazy Loading**
- **Code splitting automático** com Vite e rollupOptions
- **Lazy loading** de componentes de página com React.lazy()
- **Suspense boundaries** com fallbacks customizados
- **Manual chunks** por categoria (vendor, UI, maps, models, animations)

### **Caching & State Management**
- **TanStack Query** para cache inteligente de dados CSV
- **LocalStorage** para persistência de progresso e rotas
- **Error boundaries** para recuperação de falhas
- **Logger customizado** que respeita ambiente de desenvolvimento

### **Rendering & UX**
- **Animações otimizadas** com Framer Motion
- **Virtual scrolling** preparado para listas grandes
- **Progress indicators** em tempo real
- **Error handling** robusto com fallbacks visuais

### **Security & Accessibility**
- **URL validation** para recursos externos
- **Data sanitization** para conteúdo CSV
- **ARIA labels** completos para screen readers
- **Focus management** para navegação por teclado
- **Keyboard navigation** otimizada

## 📱 Recursos de Gamificação

### **Sistema de Conquistas**
- **Primeiro Passo** - Primeira visita a um waypoint
- **Explorador** - 10 waypoints visitados  
- **Meio Caminho** - 28 waypoints visitados
- **Iluminado** - Jornada completa (56 waypoints)

### **Tracking GPS Avançado**
- **Geolocalização em tempo real** com precisão
- **Detecção de proximidade** a waypoints sagrados
- **Auto-marcação** quando próximo (< 50m)
- **Notificações visuais** de conquistas

### **Sistema de Internacionalização**
- **Português** (idioma padrão)
- **Inglês** (traduções completas)
- **Sistema preparado** para novos idiomas
- **Fallbacks inteligentes** para dados ausentes

## 🚀 Deploy & Build

### **Desenvolvimento**
```bash
cd frontend
npm install
npm run dev          # Servidor de desenvolvimento
```

### **Produção**
```bash
npm run build        # Build otimizado
npm run preview      # Preview do build
```

### **Deploy Atual**
- **Build estático** gerado em `/build`
- **Assets otimizados** com Vite
- **Compatibilidade total** com hospedagem estática

## 🎨 Design System

### **Cores Principais**
```css
/* Cyberpunk AMOLED Palette */
--primary: 180 100% 50%;      /* Neon Cyan #00FFFF */
--accent: 280 100% 60%;       /* Neon Purple #B347FF */
--background: 0 0% 0%;        /* Pure Black #000000 */
--card: 240 100% 2%;          /* Deep Blue #000033 */
--destructive: 0 100% 50%;    /* Neon Red #FF0000 */
```

### **Efeitos Visuais**
- **Text glow** com multiple shadows
- **Box shadows** com cores neon
- **Gradientes animados** com shimmer effects
- **Transitions suaves** em todos os elementos

### **Responsividade**
- **Mobile-first** design approach
- **Breakpoints Tailwind** padrão
- **Touch-friendly** controles nos dispositivos móveis
- **Performance otimizada** para displays menores

## 🔗 Integração de APIs

### **MapTiler API**
```javascript
// Configuração do SDK
maptilersdk.config.apiKey = 'rg7OAqXjLo7cLdwqlrVt';

// Geocodificação
const geocode = async (query) => {
  const response = await fetch(
    `https://api.maptiler.com/geocoding/${query}.json?key=${apiKey}`
  );
  return response.json();
};
```

### **CDN de Modelos 3D**
```
Base URL: https://cdn.statically.io/gh/technosutra21/technosutra/master/
Formato: modelo{N}.glb
Exemplo: modelo1.glb, modelo2.glb, ..., modelo56.glb
```

## 🧪 Features Avançadas

### **Modo Cyberpunk**
- **Inversão automática** de cores do mapa
- **Sobreposições neon** personalizadas
- **Animações intensificadas** para imersão
- **Filtros visuais** aplicados dinamicamente

### **Sistema de Busca**
- **Busca multi-campo** (nome, ocupação, local, capítulo)
- **Highlighting** de resultados
- **Filtragem em tempo real** com debounce
- **Histórico** de buscas recentes

### **Editor de Posições**
- **Drag & drop** de waypoints no mapa  
- **Salvamento automático** no localStorage
- **Undo/redo** de alterações
- **Validação** de coordenadas

### **Internacionalização**
- **Português** (dados principais)
- **Inglês** (traduções completas)
- **Sistema preparado** para novos idiomas
- **Fallbacks inteligentes** para dados ausentes

## 🔐 Segurança & Privacidade

- **API keys** expostas apenas para serviços públicos
- **Sem coleta** de dados pessoais
- **LocalStorage** apenas para preferências
- **Links externos** com target="_blank" seguro

## 🎯 Roadmap & Melhorias

### **Próximas Features**
- [ ] **Modo AR** nativo para dispositivos móveis
- [ ] **Audio guides** para cada personagem
- [ ] **Jornada gamificada** com progresso
- [ ] **Comunidade** com compartilhamento de rotas
- [ ] **PWA** com funcionalidade offline
- [ ] **Integração** com redes sociais

### **Otimizações Técnicas**
- [ ] **Service Worker** para cache offline
- [ ] **WebAssembly** para processamento pesado
- [ ] **Server-Side Rendering** opcional
- [ ] **Database migration** para dados dinâmicos

## 👥 Contribuindo

Este projeto é uma representação digital de conteúdo espiritual sagrado. Contribuições são bem-vindas, especialmente em:

- **Melhorias de performance**
- **Acessibilidade**
- **Traduções adicionais**
- **Otimizações de UX**

## 📜 Licença & Créditos

- **Conteúdo espiritual**: Baseado no Buddhāvataṃsaka Sutra
- **Implementação técnica**: Código aberto
- **Modelos 3D**: Hospedados via CDN GitHub
- **Mapas**: Powered by MapTiler
- **Fontes**: Inter (Google Fonts)

---

**Techno Sutra** representa a convergência entre sabedoria ancestral e tecnologia moderna, oferecendo uma ponte digital para a jornada espiritual através de uma experiência web imersiva e tecnicamente avançada.

*Que todos os seres encontrem iluminação através desta jornada digital. 🙏*
