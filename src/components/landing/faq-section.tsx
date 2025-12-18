"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQSection() {
  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-center mb-12">
        Frequently Asked Questions
      </h2>
      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Is this really free and open source?</AccordionTrigger>
            <AccordionContent>
              Yes! This is 100% free and open source under the MIT License. No paywalls, no restrictions, no telemetry.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Can I use this for commercial projects?</AccordionTrigger>
            <AccordionContent>
              Absolutely! The MIT License allows commercial use without any restrictions.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>What payment providers are supported?</AccordionTrigger>
            <AccordionContent>
              Stripe, bKash, SSLCommerz, and PipraPay are all supported out of the box.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>How do I get started?</AccordionTrigger>
            <AccordionContent>
              Clone the repository, run the setup script, configure your environment variables, and you're ready to go!
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}

