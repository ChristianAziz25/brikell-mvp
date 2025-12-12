import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Book, ExternalLink, MessageCircle, Search } from "lucide-react";

const helpArticles = [
  {
    title: "Getting Started with Brikell",
    meta: "Basics • 5 min",
  },
  {
    title: "Understanding NOI Calculations",
    meta: "Analytics • 8 min",
  },
  {
    title: "Setting Up Rent Roll Imports",
    meta: "Data • 6 min",
  },
  {
    title: "OPEX Category Configuration",
    meta: "Settings • 4 min",
  },
  {
    title: "AI Command Center Guide",
    meta: "AI • 10 min",
  },
  {
    title: "Generating Custom Reports",
    meta: "Reports • 7 min",
  },
];

const faqs = [
  {
    id: "faq-1",
    question: "How do I import property data?",
    answer: "Navigate to Data Library and use the import wizard.",
  },
  {
    id: "faq-2",
    question: "Can I customize the dashboard?",
    answer: "Yes, use the settings menu to configure your dashboard layout.",
  },
  {
    id: "faq-3",
    question: "How often is data synced?",
    answer: "Data syncs automatically every 15 minutes, or manually on-demand.",
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search card */}
      <Card className="shadow-card">
        <CardContent className="p-6 pt-6">
          <div className="max-w-xl mx-auto text-center space-y-4">
            <div>
              <h2 className="text-lg font-medium text-foreground">
                How can we help?
              </h2>
              <p className="text-sm text-muted-foreground">
                Search our documentation or browse topics below
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search help articles..." className="pl-10" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Help Articles */}
        <Card className="shadow-card">
          <CardHeader className="p-6 pb-3">
            <CardTitle className="tracking-tight text-base font-medium flex items-center gap-2">
              <Book className="w-4 h-4" />
              Help Articles
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {helpArticles.map((article) => (
                <Button
                  key={article.title}
                  variant="ghost"
                  className="w-full flex items-center justify-between p-4 h-auto rounded-none hover:bg-muted/30 text-left cursor-pointer"
                >
                  <div className="flex flex-col items-start">
                    <p className="font-medium text-foreground">
                      {article.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {article.meta}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQ with accordion */}
        <Card className="shadow-card">
          <CardHeader className="p-6 pb-3">
            <CardTitle className="tracking-tight text-base font-medium flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="border border-border rounded-lg px-4"
                >
                  <AccordionTrigger className="text-left font-medium text-foreground py-4 cursor-pointer">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-3">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* Contact support */}
      <Card className="shadow-card">
        <CardContent className="p-6 pt-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-medium text-foreground">Need more help?</h3>
              <p className="text-sm text-muted-foreground">
                Contact our support team for personalized assistance
              </p>
            </div>
            <Button className="cursor-pointer hover:bg-muted/30">
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
