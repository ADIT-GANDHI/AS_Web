'use client';

import React from 'react';
import Image from 'next/image';
import './News.css';

export default function NewsCard() {
  const cards = [
    {
      title: 'Had Anhad',
      subtitle: "I Lost My Heart To Nizam's Glance",
      description:
        'Had Anhad I Lost My Heart To Nizam’s Glance spoke of, to evoke his utopian vision of a world in which the human spirit was not driven by fear, mistrust, oppression and exploitation, but rather was guided by a non-egoic spirit of connection and love.',
      image: '/TN-About-Basavalingaiah-Hiremath.jpg',
    },
    {
      title: 'Second Card',
      subtitle: 'Without Image',
      description:
        'The story highlights the gulshan-e-na-a-freeda (the UnCreated Garden) that Shah hayat spoke of, to evoke his utopian vision of a world in which the human spirit was not driven by fear, mistrust, oppression and exploitation, but rather was guided by a non-egote spirit of connection and love',
      image: null, // No image
    },
  ];

  return (
    <div className="mx-auto mt-8 bg-white space-y-10">
      {cards.map((item, index) => (
        <div key={index}>
          <div className="mt-7 border-dotted-seprator"></div>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Image (only if exists) */}
            {item.image && (
              <div className="flex-shrink-0 w-full md:w-71.5 h-32 md:h-40 bg-gray-200 overflow-hidden rounded-md news-banner-shadow">
                <Image
                  src={item.image}
                  alt={item.title}
                  width={280}
                  height={186}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content (takes full width if no image) */}
            <div className="flex-1">
              <h2 className="news-card-heading mb-2">
                {item.title}
                {item.subtitle && <span className="text-lg  mb-2 ml-1">{item.subtitle}</span>}
              </h2>

              <p>{item.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
