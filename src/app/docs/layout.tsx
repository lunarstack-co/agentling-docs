import type { ReactNode } from "react";

import { DocsSidebar } from "@/components/docs/sidebar";
import { getDocSections } from "@/lib/content";

export default async function DocsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const sections = await getDocSections();

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1">
      <DocsSidebar sections={sections} />
      <div className="min-w-0 flex-1 px-6 py-8 sm:px-10 lg:py-10">
        {children}
      </div>
    </div>
  );
}
