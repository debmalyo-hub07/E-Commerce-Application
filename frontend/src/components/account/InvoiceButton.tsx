"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import PDFReceipt from "@/components/account/PDFReceipt";

interface InvoiceButtonProps {
  order: any;
}

export default function InvoiceButton({ order }: InvoiceButtonProps) {
  return (
    <div className="relative">
      {/* @ts-ignore - PDFDownloadLink has tricky types */}
      <PDFDownloadLink
        document={<PDFReceipt order={order} />}
        fileName={`Invoice-${order.orderNumber}.pdf`}
        className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground font-bold rounded-2xl hover:bg-secondary/80 transition-all border border-border shadow-sm"
      >
        {/* @ts-ignore */}
        {({ loading }: { loading: boolean }) => (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={loading ? "animate-bounce" : ""}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            {loading ? "Preparing..." : "Invoice PDF"}
          </>
        )}
      </PDFDownloadLink>
    </div>
  );
}
