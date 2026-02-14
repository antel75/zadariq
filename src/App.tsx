import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import SearchResults from "./pages/SearchResults";
import BusinessDetail from "./pages/BusinessDetail";
import BusinessOwnerPanel from "./pages/BusinessOwnerPanel";
import CategoryBrowse from "./pages/CategoryBrowse";
import Emergency from "./pages/Emergency";
import ForBusiness from "./pages/ForBusiness";
import Transport from "./pages/Transport";
import Parking from "./pages/Parking";
import Cinema from "./pages/Cinema";
import PublicServices from "./pages/PublicServices";
import AdminLogin from "./pages/AdminLogin";
import AdminSignup from "./pages/AdminSignup";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/business/:id" element={<BusinessDetail />} />
              <Route path="/business/:id/panel" element={<BusinessOwnerPanel />} />
              <Route path="/category/:categoryId" element={<CategoryBrowse />} />
              <Route path="/emergency" element={<Emergency />} />
              <Route path="/for-business" element={<ForBusiness />} />
              <Route path="/transport" element={<Transport />} />
              <Route path="/parking" element={<Parking />} />
              <Route path="/cinema" element={<Cinema />} />
              <Route path="/public-services/grad-zadar" element={<PublicServices />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/signup" element={<AdminSignup />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
