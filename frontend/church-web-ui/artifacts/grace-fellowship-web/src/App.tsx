import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import SermonsPage from "@/pages/SermonsPage";
import SermonDetailPage from "@/pages/SermonDetailPage";
import EventsPage from "@/pages/EventsPage";
import GivePage from "@/pages/GivePage";
import CommunityPage from "@/pages/CommunityPage";
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";
import SmallGroupsPage from "@/pages/SmallGroupsPage";
import PrayerWallPage from "@/pages/PrayerWallPage";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/sermons" component={SermonsPage} />
      <Route path="/sermons/:id" component={SermonDetailPage} />
      <Route path="/events" component={EventsPage} />
      <Route path="/give" component={GivePage} />
      <Route path="/community" component={CommunityPage} />
      <Route path="/groups" component={SmallGroupsPage} />
      <Route path="/prayer" component={PrayerWallPage} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Layout>
            <Router />
          </Layout>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
