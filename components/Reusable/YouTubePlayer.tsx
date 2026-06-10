import React from 'react';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';

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
      <LiteYouTubeEmbed id={youtubeVideoId} title={title} poster="maxresdefault" noCookie />
    </div>
  );
};

export default YouTubePlayer;
