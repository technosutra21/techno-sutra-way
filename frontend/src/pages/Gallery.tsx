import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Download, Star } from 'lucide-react';
import { motion } from 'framer-motion';

// Generate 56 models data
const MODELS = Array.from({ length: 56 }, (_, i) => ({
  id: i + 1,
  title: `Personagem ${i + 1}`,
  description: `Personagem místico do capítulo ${i + 1} do Sutra Stem Array`,
  chapter: i + 1,
  modelUrl: `https://cdn.statically.io/gh/technosutra21/technosutra/master/modelo${i + 1}.glb`,
  thumbnailUrl: `https://via.placeholder.com/300x200/000011/00ffff?text=Modelo+${i + 1}`,
  tags: ['Budista', 'Místico', '3D', 'AR'],
  rarity: i % 7 === 0 ? 'legendary' : i % 3 === 0 ? 'epic' : 'common',
  downloads: Math.floor(Math.random() * 10000),
  rating: (4 + Math.random()).toFixed(1)
}));

const Gallery = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<any>(null);

  const filteredModels = MODELS.filter(model => {
    const matchesSearch = model.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRarity = selectedRarity === 'all' || model.rarity === selectedRarity;
    
    return matchesSearch && matchesRarity;
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'epic': return 'bg-gradient-to-r from-purple-400 to-pink-500';
      default: return 'bg-gradient-to-r from-blue-400 to-cyan-500';
    }
  };

  const openModelViewer = (model: any) => {
    setSelectedModel(model);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-primary text-glow mb-2">
          Galeria de Modelos 3D
        </h1>
        <p className="text-muted-foreground">
          Explore os 56 personagens místicos do Sutra Stem Array
        </p>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8 space-y-4"
      >
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar modelos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            {['all', 'common', 'epic', 'legendary'].map(rarity => (
              <Button
                key={rarity}
                variant={selectedRarity === rarity ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRarity(rarity)}
                className={selectedRarity === rarity ? 'gradient-neon text-black' : 'border-neon'}
              >
                {rarity === 'all' ? 'Todos' : rarity.charAt(0).toUpperCase() + rarity.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredModels.map((model, index) => (
          <motion.div
            key={model.id}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="cyberpunk-card overflow-hidden group">
              {/* Thumbnail */}
              <div className="relative aspect-video bg-secondary">
                <img
                  src={model.thumbnailUrl}
                  alt={model.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Rarity Badge */}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold text-black ${getRarityColor(model.rarity)}`}>
                  {model.rarity.toUpperCase()}
                </div>
                
                {/* Hover Actions */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    onClick={() => openModelViewer(model)}
                    className="gradient-neon text-black font-bold"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver em 3D
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-primary mb-1">{model.title}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {model.description}
                </p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {model.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    {model.rating}
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    {model.downloads.toLocaleString()}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Model Viewer Modal */}
      {selectedModel && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedModel(null)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-primary text-glow">
                  {selectedModel.title}
                </h2>
                <p className="text-muted-foreground">Capítulo {selectedModel.chapter}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedModel(null)}
                className="text-muted-foreground hover:text-primary"
              >
                ✕
              </Button>
            </div>
            
            {/* 3D Model Viewer */}
            <div className="aspect-video bg-secondary rounded-lg mb-4 flex items-center justify-center border-neon">
              <model-viewer
                src={selectedModel.modelUrl}
                alt={selectedModel.title}
                auto-rotate
                camera-controls
                ar
                ar-modes="webxr scene-viewer quick-look"
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'transparent'
                }}
              />
            </div>
            
            <p className="text-muted-foreground mb-4">
              {selectedModel.description}
            </p>
            
            <div className="flex gap-3">
              <Button className="gradient-neon text-black font-bold">
                <Eye className="w-4 h-4 mr-2" />
                Ver em AR
              </Button>
              <Button variant="outline" className="border-neon">
                <Download className="w-4 h-4 mr-2" />
                Download GLB
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Gallery;