import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { AdminModeProvider } from "@/hooks/useAdminMode";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import TopicPage from "./pages/TopicPage";
import PostPage from "./pages/PostPage";
import TopicsDirectory from "./pages/TopicsDirectory";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Investor from "./pages/Investor";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

// Profile pages are code-split: ProfileEdit alone pulls in react-hook-form,
// @hookform/resolvers, zod, and react-easy-crop — none of which the rest of
// the site uses. ProfileView is split too so the read path stays cheap.
const ProfileView = lazy(() => import("./pages/ProfileView"));
const ProfileEdit = lazy(() => import("./pages/ProfileEdit"));

function ProfileChunkFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

// Admin surface is code-split: it pulls in recharts + date-fns + a stack of
// shadcn primitives that the public site never needs. Keeping these out of
// the main chunk meaningfully shrinks first-paint cost for everyone, and
// admins only pay the chunk-fetch on first nav into /admin.
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminRouteGuard = lazy(() => import("./components/admin/AdminRouteGuard"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminPosts = lazy(() => import("./pages/admin/AdminPosts"));
const AdminReview = lazy(() => import("./pages/admin/AdminReview"));
const AdminComments = lazy(() => import("./pages/admin/AdminComments"));
const AdminTopics = lazy(() => import("./pages/admin/AdminTopics"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminAuditLog = lazy(() => import("./pages/admin/AdminAuditLog"));
const AdminContactMessages = lazy(() => import("./pages/admin/AdminContactMessages"));
const AdminSitePages = lazy(() => import("./pages/admin/AdminSitePages"));

function AdminChunkFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <LocationProvider>
            <AdminModeProvider>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/profile"
              element={
                <Suspense fallback={<ProfileChunkFallback />}>
                  <ProfileView />
                </Suspense>
              }
            />
            <Route
              path="/profile/:userId"
              element={
                <Suspense fallback={<ProfileChunkFallback />}>
                  <ProfileView />
                </Suspense>
              }
            />
            <Route
              path="/profile/edit"
              element={
                <Suspense fallback={<ProfileChunkFallback />}>
                  <ProfileEdit />
                </Suspense>
              }
            />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/topics" element={<TopicsDirectory />} />
            <Route path="/topic/:topicName" element={<TopicPage />} />
            <Route path="/topic/:topicName/post/:slug" element={<PostPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/investor" element={<Investor />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route
              path="/admin"
              element={
                <Suspense fallback={<AdminChunkFallback />}>
                  <AdminLayout />
                </Suspense>
              }
            >
              <Route element={<AdminRouteGuard />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="posts" element={<AdminPosts />} />
                <Route path="comments" element={<AdminComments />} />
                <Route path="topics" element={<AdminTopics />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="audit" element={<AdminAuditLog />} />
                <Route path="contact-messages" element={<AdminContactMessages />} />
                <Route path="site-pages" element={<AdminSitePages />} />
              </Route>
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
            </AdminModeProvider>
            </LocationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
