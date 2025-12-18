import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Github, Heart, Code, Users, Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Open Source",
  description: "Learn about nextjs-saaskit's open-source philosophy, goals, and how you can contribute.",
};

export default function OpenSourcePage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Open Source</h1>
          <p className="text-xl text-muted-foreground">
            Built with transparency, community, and freedom in mind
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Project Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                nextjs-saaskit aims to provide a production-ready, fully-featured SaaS starter kit
                that developers can use to build their own SaaS products without starting from scratch.
              </p>
              <p>
                Our goal is to eliminate the repetitive work of setting up authentication, billing,
                multi-tenancy, and other common SaaS features, so developers can focus on building
                their unique product value.
              </p>
              <p>
                We believe that great tools should be accessible to everyone, regardless of budget
                or company size.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Open Source Philosophy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">100% Free & Open Source</h3>
                <p className="text-muted-foreground">
                  This project is completely free to use, modify, and distribute. There are no
                  hidden costs, no premium features, and no restrictions.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">No Monetization</h3>
                <p className="text-muted-foreground">
                  We don't sell anything. No paid plans, no premium versions, no commercial
                  licensing. Everything is available under the MIT License.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">No Tracking</h3>
                <p className="text-muted-foreground">
                  We don't collect telemetry or track usage. Your privacy and your users' privacy
                  are respected. The code is yours to run as you see fit.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Transparency</h3>
                <p className="text-muted-foreground">
                  All code is open and auditable. No hidden backdoors, no spyware, no dark patterns.
                  What you see is what you get.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Community First</h3>
                <p className="text-muted-foreground">
                  This project is built for and by the community. Contributions, feedback, and
                  discussions are welcome and valued.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Maintainer Role
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                This project is maintained by <strong>Prayangshu Biswas</strong>. As the maintainer,
                my role is to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Review and merge pull requests</li>
                <li>Fix bugs and security issues</li>
                <li>Guide the project's direction based on community feedback</li>
                <li>Ensure code quality and maintainability</li>
                <li>Keep dependencies up to date</li>
                <li>Document features and changes</li>
              </ul>
              <p>
                The project is maintainer-led, meaning I make final decisions about the project's
                direction, but I always consider community input and contributions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                How You Can Help
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Contribute Code</h3>
                  <p className="text-muted-foreground mb-2">
                    Found a bug? Have a feature idea? Submit a pull request! All contributions
                    are welcome.
                  </p>
                  <Button asChild variant="outline">
                    <Link href="https://github.com/prayangshuuu/nextjs-saaskit">
                      <Github className="h-4 w-4 mr-2" />
                      View on GitHub
                    </Link>
                  </Button>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Report Issues</h3>
                  <p className="text-muted-foreground">
                    Found a bug or have a suggestion? Open an issue on GitHub. Your feedback helps
                    improve the project for everyone.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Improve Documentation</h3>
                  <p className="text-muted-foreground">
                    Documentation improvements are always welcome. Help make the project more
                    accessible to new users.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Share Your Experience</h3>
                  <p className="text-muted-foreground">
                    Built something cool with nextjs-saaskit? Share it with the community! Your
                    use cases inspire others and help guide future development.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Spread the Word</h3>
                  <p className="text-muted-foreground">
                    If you find this project useful, consider sharing it with others. The more
                    people use it, the better it becomes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>License</CardTitle>
              <CardDescription>MIT License - Free to use for any purpose</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This project is licensed under the MIT License. You are free to use, modify,
                distribute, and even sell products built with this code.
              </p>
              <Button asChild variant="outline">
                <Link href="/LICENSE">View License</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

