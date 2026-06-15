'use client';

import React, { useState } from 'react';
import './PoemsTags.css';

const PoemsTags = () => {
  const tags = [
    { word: 'Shoonya', meaning: 'Emptiness' },
    { word: 'Ulat', meaning: 'Upside Down' },
    { word: 'Alakh', meaning: 'Unseeable' },
    { word: 'Darpan', meaning: 'Mirror' },
    { word: 'Shahar', meaning: 'City' },
  ];

  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  return (
    <div className="poems-tag-inner-container">
      <div className="tag-inner-container">
        {tags.map((tag) => {
          const isHovered = hoveredTag === tag.word;

          return (
            <div
              key={tag.word}
              className="cursor-pointer tag-text text-center transition-all duration-300"
              onMouseEnter={() => setHoveredTag(tag.word)}
              onMouseLeave={() => setHoveredTag(null)}
            >
              <span
                className={`tag transition-colors duration-300 ${
                  isHovered ? 'text-pink-600' : 'text-gray-800'
                }`}
              >
                {tag.word}
              </span>{' '}
              <span className="tag-italic duration-300 opacity-80">{tag.meaning}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PoemsTags;
