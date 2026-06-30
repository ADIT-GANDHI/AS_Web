import React from 'react';
import YouTubeEmbedFrame from '@/components/Reusable/YouTubeEmbedFrame';

interface IYouTubePlayerProps {
  youtubeVideoId: string;
  title?: string;
  className?: string;
}

const YouTubePlayer: React.FC<IYouTubePlayerProps> = ({
  youtubeVideoId,
  title = 'YouTube Video',
  className = '',
}) => {
  return (
    <div
      className={`border-[10px] border-white rounded-sm overflow-hidden max-w-full ${className}`}
    >
      <YouTubeEmbedFrame videoId={youtubeVideoId} title={title} />
    </div>
  );
};

export default YouTubePlayer;
