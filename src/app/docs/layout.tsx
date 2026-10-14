import type { ReactNode } from "react";

import { DocsSidebar } from "@/components/docs/sidebar";
import { getDocSections } from "@/lib/content";

export default async function DocsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const sections = await getDocSections();

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-1">
      <DocsSidebar sections={sections} />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10 lg:py-10 overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
