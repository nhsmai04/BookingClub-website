import React from 'react';
import DOMPurify from 'dompurify';

interface SafeHTMLProps {
  dirtyHtml: string;
  className?: string;
}

const SafeHTML: React.FC<SafeHTMLProps> = ({ dirtyHtml, className }) => {
  // Cấu hình DOMPurify: Lọc sạch mã độc, chỉ giữ lại các thẻ văn bản cơ bản
  const sanitizedHTML = DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS: ['b', 'i', 'p', 'ul', 'li', 'h3', 'div', 'span', 'img'],
    ALLOWED_ATTR: ['src', 'style', 'class'],
    ALLOW_DATA_ATTR: false, 
  });

  return (
    <div 
      className={className} 
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }} 
    />
  );
};

export default SafeHTML;