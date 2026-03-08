import { useState } from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subjectCategories, getTopicsByCategory } from "@/data/seedData";

const SubjectsSidebar = () => {
  const [bizName, setBizName] = useState("");
  const [bizCity, setBizCity] = useState("");

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
                    <a
                      key={topic.id}
                      href="#"
                      className="text-sm text-primary hover:underline"
                    >
                      {topic.name}
                    </a>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

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
