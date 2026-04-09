import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const Index = lazy(() => import("./pages/Index.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const ServicesPage = lazy(() => import("./pages/ServicesPage.tsx"));
const DoctorsPage = lazy(() => import("./pages/DoctorsPage.tsx"));
const ResultsPage = lazy(() => import("./pages/ResultsPage.tsx"));
const ReviewsPage = lazy(() => import("./pages/ReviewsPage.tsx"));
const AboutPage = lazy(() => import("./pages/AboutPage.tsx"));
const ContactsPage = lazy(() => import("./pages/ContactsPage.tsx"));
const ServiceDetailPage = lazy(() => import("./pages/ServiceDetailPage.tsx"));

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Suspense fallback={null}>
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
      </Suspense>
      <ChatWidget />
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
