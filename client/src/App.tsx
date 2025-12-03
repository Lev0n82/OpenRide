import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import DriverApplication from "./pages/DriverApplication";
import RideBooking from "./pages/RideBooking";
import DeliveryBooking from "./pages/DeliveryBooking";
import DriverDashboard from "./pages/DriverDashboard";
import RiderDashboard from "./pages/RiderDashboard";
import Governance from "./pages/Governance";
import Insurance from "./pages/Insurance";
import Tokens from "./pages/Tokens";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/driver/apply" component={DriverApplication} />
      <Route path="/ride/book" component={RideBooking} />     <Route path="/delivery-booking" component={DeliveryBooking} />
      <Route path="/driver" component={DriverDashboard} />
      <Route path="/rider" component={RiderDashboard} />
      <Route path="/governance" component={Governance} />
      <Route path="/insurance" component={Insurance} />
      <Route path="/tokens" component={Tokens} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
