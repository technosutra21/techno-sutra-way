import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Route, Sparkles, Eye, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
  const features = [
    {
      icon: MapPin,
      title: 'Rota Original',
      description: 'Explore os 56 pontos sagrados da peregrinação original em Águas da Prata, SP',
      link: '/map',
      color: 'text-primary',
      gradient: 'gradient-neon'
    },
    {
      icon: Users,
      title: 'Galeria 3D',
      description: 'Visualize os personagens místicos em realidade aumentada',
      link: '/gallery',
      color: 'text-accent',
      gradient: 'bg-gradient-to-r from-purple-500 to-pink-500'
    },
    {
      icon: Route,
      title: 'Criar Rota',
      description: 'Crie sua própria jornada espiritual em qualquer lugar do mundo',
      link: '/route-creator',
      color: 'text-yellow-400',
      gradient: 'bg-gradient-to-r from-yellow-400 to-orange-500'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-bold text-primary text-glow mb-4">
              Techno Sutra
            </h1>
            <div className="h-1 w-32 gradient-neon mx-auto mb-6 rounded-full"></div>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              A jornada espiritual ancestral encontra a tecnologia cyberpunk. 
              Explore os 56 capítulos sagrados do Sutra Stem Array em uma experiência imersiva única.
            </p>
          </div>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Button
              asChild
              className="gradient-neon text-black font-bold text-lg px-8 py-3 neon-glow"
            >
              <Link to="/map">
                <Navigation className="w-5 h-5 mr-2" />
                Iniciar Jornada
              </Link>
            </Button>
            
            <Button
              asChild
              variant="outline"
              className="border-neon text-lg px-8 py-3"
            >
              <Link to="/gallery">
                <Eye className="w-5 h-5 mr-2" />
                Explorar Galeria
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-3 gap-8 mb-16"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div key={index} variants={itemVariants}>
                <Card className="cyberpunk-card p-8 h-full group cursor-pointer">
                  <Link to={feature.link} className="block h-full">
                    <div className="text-center">
                      <div className={`inline-flex p-4 rounded-full ${feature.gradient} mb-6 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-8 h-8 text-black" />
                      </div>
                      
                      <h3 className={`text-2xl font-bold mb-4 ${feature.color} text-glow`}>
                        {feature.title}
                      </h3>
                      
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                      
                      <div className="mt-6">
                        <Button
                          variant="ghost"
                          className={`${feature.color} hover:bg-current/10`}
                        >
                          Explorar →
                        </Button>
                      </div>
                    </div>
                  </Link>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center mb-16"
        >
          <Card className="cyberpunk-card p-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-primary text-glow mb-8">
              A Jornada em Números
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { number: '56', label: 'Capítulos Sagrados', color: 'text-primary' },
                { number: '56', label: 'Modelos 3D', color: 'text-accent' },
                { number: '∞', label: 'Rotas Possíveis', color: 'text-yellow-400' },
                { number: '1', label: 'Destino Espiritual', color: 'text-green-400' }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className={`text-4xl md:text-5xl font-bold ${stat.color} text-glow mb-2`}>
                    {stat.number}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="text-center"
        >
          <Card className="cyberpunk-card p-12 max-w-2xl mx-auto">
            <Sparkles className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-primary text-glow mb-4">
              Pronto para Começar?
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Embarque em uma jornada que transcende tempo e espaço. 
              O caminho da iluminação aguarda.
            </p>
            <Button
              asChild
              className="gradient-neon text-black font-bold text-xl px-12 py-4 neon-glow"
            >
              <Link to="/map">
                Iniciar Peregrinação Sagrada
              </Link>
            </Button>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;