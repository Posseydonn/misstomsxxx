import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ServicesPage from "./pages/ServicesPage.tsx";
import DoctorsPage from "./pages/DoctorsPage.tsx";
import ResultsPage from "./pages/ResultsPage.tsx";
import ReviewsPage from "./pages/ReviewsPage.tsx";
import AboutPage from "./pages/AboutPage.tsx";
import ContactsPage from "./pages/ContactsPage.tsx";
import ServiceDetailPage from "./pages/ServiceDetailPage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:slug" element={<ServiceDetailPage />} />
          <Route path="/doctors" element={<DoctorsPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
