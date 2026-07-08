import type { ReactNode } from "react";

import { DocsSidebar } from "@/components/docs/sidebar";
import { getDocSections } from "@/lib/content";

export const revalidate = 300;

export default async function DocsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const sections = await getDocSections();

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 px-4 sm:px-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <DocsSidebar sections={sections} />
      {children}
    </div>
  );
}
