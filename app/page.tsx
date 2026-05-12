import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="flex max-w-2xl flex-col items-center gap-6 text-center">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Mailr
            </h1>
            <p className="text-muted-foreground sm:text-lg">
              A developer-first HTML email playground and testing sandbox.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/projects">Get started</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}