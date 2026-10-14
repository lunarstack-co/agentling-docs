import type { ReactNode } from "react";

import { DocsSidebar } from "@/components/docs/sidebar";
import { getDocSections } from "@/lib/content";

export default async function DocsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const sections = await getDocSections();

  return (
    // Column flow below lg so the sticky mobile page selector stacks above
    // the content instead of competing with it for horizontal space.
    <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col lg:flex-row">
      <DocsSidebar sections={sections} />
      <div className="min-w-0 w-full flex-1 px-4 py-6 sm:px-8 lg:px-10 lg:py-10">
        {children}
      </div>
    </div>
  );
}
