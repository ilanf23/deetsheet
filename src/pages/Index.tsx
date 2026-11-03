import { useState } from "react";
import DeetHeader from "@/components/DeetHeader";
import ColumnLayout from "@/components/ColumnLayout";
import DeetFooter from "@/components/DeetFooter";

const Index = () => {
  const [atBottom, setAtBottom] = useState(false);

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-background">
      <DeetHeader />
      <main className="flex-1 lg:min-h-0 flex flex-col">
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
