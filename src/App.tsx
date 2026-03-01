import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LegalNoticeBar } from "@/components/LegalNoticeBar";
import { lazy, Suspense } from "react";
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
import KinoZona from "./pages/KinoZona";
import PublicServices from "./pages/PublicServices";
import PublicServicesMenu from "./pages/PublicServicesMenu";
import UtilityCompanies from "./pages/UtilityCompanies";
import DigitalZadar from "./pages/DigitalZadar";
import AdminLogin from "./pages/AdminLogin";
import AdminSignup from "./pages/AdminSignup";
import AdminPanel from "./pages/AdminPanel";
import PravneInformacije from "./pages/PravneInformacije";
import AddCafe from "./pages/AddCafe";
import EvChargers from "./pages/EvChargers";
import NotFound from "./pages/NotFound";
import Znamenitosti from "./pages/Znamenitosti";
import ZadarQuest from "./pages/ZadarQuest";
import SundayRadar from "./pages/SundayRadar";
import Place from "./pages/Place";
import Join from "./pages/Join";
import OwnerLogin from "./pages/owner/Login";
import OwnerDashboard from "./pages/owner/Dashboard";
import OwnerClaim from "./pages/owner/Claim";
import Events from "./pages/Events";
import EmailConfirmed from "./pages/EmailConfirmed";

const DataSources = lazy(() => import("./pages/DataSources"));

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
              <Route path="/kino-zona" element={<KinoZona />} />
              <Route path="/public-services" element={<PublicServicesMenu />} />
              <Route path="/public-services/:orgId" element={<PublicServices />} />
              <Route path="/utility-companies" element={<UtilityCompanies />} />
              <Route path="/digital-zadar" element={<DigitalZadar />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/signup" element={<AdminSignup />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/pravne-informacije" element={<PravneInformacije />} />
              <Route path="/add-cafe" element={<AddCafe />} />
              <Route path="/ev-chargers" element={<EvChargers />} />
              <Route path="/data-sources" element={<Suspense fallback={null}><DataSources /></Suspense>} />
              <Route path="/events" element={<Events />} />
              <Route path="/znamenitosti" element={<Znamenitosti />} />
              <Route path="/quest" element={<ZadarQuest />} />
              <Route path="/sunday-radar" element={<SundayRadar />} />
              <Route path="/place" element={<Place />} />
              <Route path="/join" element={<Join />} />
              <Route path="/owner/login" element={<OwnerLogin />} />
              <Route path="/owner/dashboard" element={<OwnerDashboard />} />
              <Route path="/owner/claim" element={<OwnerClaim />} />
              <Route path="/email-confirmed" element={<EmailConfirmed />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <LegalNoticeBar />
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
