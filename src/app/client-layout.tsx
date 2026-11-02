"use client";

import { usePathname } from "next/navigation";
import { DataProvider } from "@/lib/store";
import Sidebar from "@/components/Sidebar";
import ChatBubble from "@/components/ChatBubble";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isUploadPage = pathname === "/" || pathname === "/upload";

    return (
        <DataProvider>
            {!isUploadPage && <Sidebar />}
            <main className={isUploadPage ? "" : "ml-64"}>{children}</main>
            <ChatBubble />
        </DataProvider>
    );
}
