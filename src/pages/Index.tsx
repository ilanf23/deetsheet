import DeetHeader from "@/components/DeetHeader";
import HeroBanner from "@/components/HeroBanner";
import ColumnLayout from "@/components/ColumnLayout";
import DeetFooter from "@/components/DeetFooter";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, loading } = useAuth();
  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-background">
      <DeetHeader />
      <main className="flex-1 lg:min-h-0 flex flex-col">
        {!loading && !user && <HeroBanner />}
        <ColumnLayout />
      </main>
      <DeetFooter />
    </div>
  );
};

export default Index;
