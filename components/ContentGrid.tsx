"use client";

import { contentData } from "@/lib/data";
import ContentCard from "./ContentCard";
import "../styles/CustomStyle.css";

export default function ContentGrid() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {contentData.map((item, index) => {
            const hasMedia = Boolean(item.video) || Boolean(item.image);

            return (
              <div
                key={item.id}
                className={`product-card ${
                  !hasMedia ? "no-media-padding" : ""
                } ${index === 0 ? "md:col-span-2 lg:col-span-1" : ""} ${
                  index === 2 ? "lg:col-span-2" : ""
                }`}
              >
                <ContentCard item={item} noMedia={!hasMedia} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
