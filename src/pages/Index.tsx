import { useState } from "react";
import DeetHeader from "@/components/DeetHeader";
import HeroBanner from "@/components/HeroBanner";
import ColumnLayout from "@/components/ColumnLayout";
import DeetFooter from "@/components/DeetFooter";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, loading } = useAuth();
  const [atBottom, setAtBottom] = useState(false);

  return (
    <div className="home-theme min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-background">
      <DeetHeader />
      <main className="flex-1 lg:min-h-0 flex flex-col">
        {!loading && !user && <HeroBanner />}
        <ColumnLayout onAtBottomChange={setAtBottom} />
      </main>
      {atBottom && (
        <div className="fixed inset-x-0 bottom-0 z-40 animate-in slide-in-from-bottom duration-200">
          <DeetFooter />
        </div>
      )}
    </div>
  );
};

export default Index;
