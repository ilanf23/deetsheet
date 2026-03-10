import { useState } from "react";
import { Link } from "react-router-dom";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { subjectCategories, getTopicsByCategory } from "@/data/seedData";
import CreateTopicDialog from "@/components/CreateTopicDialog";

const SubjectsSidebar = () => {
  const [bizName, setBizName] = useState("");
  const [bizCity, setBizCity] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1">
        Subjects:
      </h2>

      <Accordion type="multiple" defaultValue={subjectCategories}>
        {subjectCategories.map((cat) => {
          const catTopics = getTopicsByCategory(cat);
          return (
            <AccordionItem key={cat} value={cat}>
              <AccordionTrigger className="py-2 text-sm font-semibold">
                {cat}
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {catTopics.map((topic) => (
                    <Link
                      key={topic.id}
                      to={`/topic/${encodeURIComponent(topic.name)}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {topic.name}
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <div className="border-t pt-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Create a Topic
        </Button>
        <CreateTopicDialog open={createOpen} onOpenChange={setCreateOpen} />
      </div>

      <div className="border-t pt-4 space-y-2">
        <h3 className="text-sm font-semibold text-card-foreground">Local Businesses</h3>
        <Input
          placeholder="Name"
          value={bizName}
          onChange={(e) => setBizName(e.target.value)}
          className="h-8 text-sm"
        />
        <Input
          placeholder="City"
          value={bizCity}
          onChange={(e) => setBizCity(e.target.value)}
          className="h-8 text-sm"
        />
        <Button size="sm" className="w-full">Go</Button>
      </div>
    </div>
  );
};

export default SubjectsSidebar;
