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

  // Default active tag is "Shahar"
  const [activeTag, setActiveTag] = useState('Shahar');
  const [hoveredTag, setHoveredTag] = useState(null);

  return (
    <div className="poems-tag-inner-container">
      <div className="tag-inner-container">
        {tags.map((tag, index) => {
          const isActive = activeTag === tag.word;
          const isHovered = hoveredTag === tag.word;

          return (
            <div
              key={index}
              className="cursor-pointer tag-text text-center transition-all duration-300"
              onClick={() => setActiveTag(tag.word)}
              onMouseEnter={() => setHoveredTag(tag.word)}
              onMouseLeave={() => setHoveredTag(null)}
            >
              <span
                className={`tag transition-colors duration-300 ${
                  isActive || isHovered ? 'text-pink-600' : 'text-gray-800'
                }`}
              >
                {tag.word}
              </span>{' '}
              <span
                className={`tag-italic duration-300 ${
                  isActive || isHovered ? 'opacity-100' : 'opacity-80'
                }`}
              >
                {tag.meaning}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PoemsTags;
