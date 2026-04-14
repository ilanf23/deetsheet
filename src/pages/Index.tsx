import DeetHeader from "@/components/DeetHeader";
import HeroBanner from "@/components/HeroBanner";
import ColumnLayout from "@/components/ColumnLayout";
import DeetFooter from "@/components/DeetFooter";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <DeetHeader />
      <main className="flex-1">
        <HeroBanner />
        <ColumnLayout />
      </main>
      <DeetFooter />
    </div>
  );
};

export default Index;
