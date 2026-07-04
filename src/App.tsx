import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load heavy pages
const LegacyIndex = lazy(() => import("./pages/Index"));
const AtlasDemo = lazy(() => import("./pages/AtlasDemo"));
const AtlasCore = lazy(() => import("./pages/AtlasCore"));
const AtlasTeach = lazy(() => import("./pages/AtlasTeach"));
const AtlasArchitecture = lazy(() => import("./pages/AtlasArchitecture"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));

const queryClient = new QueryClient();

// Loading fallback for lazy routes
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Dashboard is now the main route */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Atlas Core Dashboard */}
          <Route 
            path="/atlas-core" 
            element={
              <Suspense fallback={<PageLoader />}>
                <AtlasCore />
            </Suspense>
            } 
          />
          <Route 
            path="/atlas-architecture" 
            element={
              <Suspense fallback={<PageLoader />}>
                <AtlasArchitecture />
              </Suspense>
            } 
          />
          <Route 
            path="/coming-soon" 
            element={
              <Suspense fallback={<PageLoader />}>
                <ComingSoon />
              </Suspense>
            } 
          />
          <Route 
            path="/atlas-teach" 
            element={
              <Suspense fallback={<PageLoader />}>
                <AtlasTeach />
              </Suspense>
            }
          />
          
          {/* Legacy routes with lazy loading */}
          <Route 
            path="/legacy" 
            element={
              <Suspense fallback={<PageLoader />}>
                <LegacyIndex />
              </Suspense>
            } 
          />
          <Route 
            path="/atlas-demo" 
            element={
              <Suspense fallback={<PageLoader />}>
                <AtlasDemo />
              </Suspense>
            } 
          />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
