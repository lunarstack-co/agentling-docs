import type { ReactNode } from "react";

import { DocsSidebar } from "@/components/docs/sidebar";
import { getDocSections } from "@/lib/content";

export default async function DocsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const sections = await getDocSections();

  return (
    // Column flow below lg so the sticky page selector stacks above the
    // content instead of competing with it for width.
    <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col lg:flex-row">
      <DocsSidebar sections={sections} />
      <div className="w-full min-w-0 flex-1 px-4 pb-16 pt-6 sm:px-8 lg:px-10 lg:pb-20 lg:pt-10">
        {children}
      </div>
    </div>
  );
}
