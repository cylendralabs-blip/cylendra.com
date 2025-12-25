import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Company from "./pages/Company";
import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";
import Disclaimer from "./pages/legal/Disclaimer";
import DeliveryReport from "./pages/DeliveryReport";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/products" component={Products} />
        <Route path="/products/:slug" component={ProductDetail} />
        <Route path="/company" component={Company} />
        <Route path="/legal/privacy" component={Privacy} />
        <Route path="/legal/terms" component={Terms} />
        <Route path="/legal/disclaimer" component={Disclaimer} />
        <Route path="/report" component={DeliveryReport} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
