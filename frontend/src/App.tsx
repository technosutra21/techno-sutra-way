import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Navigation from "./components/Navigation";
import ErrorBoundary from "./components/ErrorBoundary";
import { LanguageProvider } from "./components/LanguageSwitcher";
import { logger } from "./lib/logger";

// Lazy load pages for better performance
const Home = lazy(() => import("./pages/Home"));
const Map = lazy(() => import("./pages/Map"));
const Gallery = lazy(() => import("./pages/Gallery"));
const RouteCreator = lazy(() => import("./pages/RouteCreator"));
const ModelViewer = lazy(() => import("./pages/ModelViewer"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Configure React Query with optimal settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hour
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});

// Loading component for Suspense fallback
const LoadingScreen = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="text-muted-foreground animate-pulse">Carregando...</p>
    </div>
  </div>
);

const App = () => {
  logger.info('🚀 Techno Sutra App initialized');

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="dark">
                <Navigation />
                <Suspense fallback={<LoadingScreen />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/map" element={<Map />} />
                    <Route path="/gallery" element={<Gallery />} />
                    <Route path="/route-creator" element={<RouteCreator />} />
                    <Route path="/model-viewer" element={<ModelViewer />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
