import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Products",
  description: "Search across thousands of products on NexMart.",
};

export default function SearchPage() {
  return <SearchResultsClient />;
}

import SearchResultsClient from "./SearchResultsClient";
