import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const HighlightableTextArea = ({ 
  content, 
  annotations, 
  onTextSelect, 
  annotationType,
  readOnly = false 
}) => {
  const [selectedRange, setSelectedRange] = useState({ start: null, end: null, text: '' });
  const [hoveredAnnotation, setHoveredAnnotation] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const textContainerRef = useRef(null);
  const contentRef = useRef(null);

  // Handle mouse-based text selection
  useEffect(() => {
    const handleMouseUp = () => {
      if (readOnly) return;

      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const text = selection.toString();
        
        if (text.length > 0) {
          // Calculate start and end indices
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(contentRef.current);
          preCaretRange.setEnd(range.startContainer, range.startOffset);
          const start = preCaretRange.toString().length;
          
          const end = start + text.length;
          
          setSelectedRange({ start, end, text });
          onTextSelect({ text, start, end });
        }
      }
      
      // Clear selection after callback
      selection.removeAllRanges();
    };

    const container = textContainerRef.current;
    if (container) {
      container.addEventListener('mouseup', handleMouseUp);
      return () => container.removeEventListener('mouseup', handleMouseUp);
    }
  }, [onTextSelect, readOnly]);

  // Clear selection when clicked outside
  const handleContainerClick = (e) => {
    if (e.target === textContainerRef.current) {
      setSelectedRange({ start: null, end: null, text: '' });
    }
  };

  // Render text with annotation highlights
  const renderTextWithAnnotations = () => {
    if (!content) return null;

    // Sort annotations by start position
    const sortedAnnotations = [...annotations].sort((a, b) => a.span_start - b.span_start);
    
    let lastIndex = 0;
    const elements = [];

    // Render text segments with highlights
    for (const annotation of sortedAnnotations) {
      // Add text before annotation
      if (annotation.span_start > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`} className="text-gray-800">
            {content.substring(lastIndex, annotation.span_start)}
          </span>
        );
      }

      // Get color based on annotation type and label
      const config = getAnnotationColor(annotation.annotation_sub_type, annotation.label);
      
      // Add highlighted span
      elements.push(
        <mark
          key={`annotation-${annotation.id}`}
          data-annotation-id={annotation.id}
          className={`${config.bgClass} ${config.textClass} px-1 rounded cursor-pointer transition-opacity hover:opacity-80`}
          style={{ opacity: config.opacity || 1 }}
          onMouseEnter={(e) => handleAnnotationHover(annotation, e)}
          onMouseLeave={handleAnnotationLeave}
          onClick={(e) => handleAnnotationClick(annotation, e)}
        >
          {content.substring(annotation.span_start, annotation.span_end)}
        </mark>
      );

      lastIndex = annotation.span_end;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      elements.push(
        <span key={`text-${lastIndex}`} className="text-gray-800">
          {content.substring(lastIndex)}
        </span>
      );
    }

    return elements;
  };

  // Get color configuration for annotation
  const getAnnotationColor = (subType, label) => {
    // Default colors for different label types
    const colors = {
      'PERSON': { bgClass: 'bg-blue-200', textClass: 'text-blue-900', opacity: 0.3 },
      'ORG': { bgClass: 'bg-purple-200', textClass: 'text-purple-900', opacity: 0.3 },
      'LOCATION': { bgClass: 'bg-green-200', textClass: 'text-green-900', opacity: 0.3 },
      'DATE': { bgClass: 'bg-yellow-200', textClass: 'text-yellow-900', opacity: 0.3 },
      'PRODUCT': { bgClass: 'bg-pink-200', textClass: 'text-pink-900', opacity: 0.3 },
      'EVENT': { bgClass: 'bg-indigo-200', textClass: 'text-indigo-900', opacity: 0.3 },
      'MONEY': { bgClass: 'bg-orange-200', textClass: 'text-orange-900', opacity: 0.3 },
      'NOUN': { bgClass: 'bg-blue-100', textClass: 'text-blue-900', opacity: 0.3 },
      'VERB': { bgClass: 'bg-green-100', textClass: 'text-green-900', opacity: 0.3 },
      'ADJ': { bgClass: 'bg-purple-100', textClass: 'text-purple-900', opacity: 0.3 },
      'ADV': { bgClass: 'bg-yellow-100', textClass: 'text-yellow-900', opacity: 0.3 },
      'POSITIVE': { bgClass: 'bg-green-100', textClass: 'text-green-900', opacity: 0.3 },
      'NEGATIVE': { bgClass: 'bg-red-100', textClass: 'text-red-900', opacity: 0.3 },
      'NEUTRAL': { bgClass: 'bg-gray-100', textClass: 'text-gray-900', opacity: 0.3 },
      'JOY': { bgClass: 'bg-yellow-100', textClass: 'text-yellow-900', opacity: 0.3 },
      'ANGER': { bgClass: 'bg-red-200', textClass: 'text-red-900', opacity: 0.3 },
      'SADNESS': { bgClass: 'bg-blue-200', textClass: 'text-blue-900', opacity: 0.3 },
      'FEAR': { bgClass: 'bg-purple-200', textClass: 'text-purple-900', opacity: 0.3 },
      // Default colors for other types
      'default': { bgClass: 'bg-gray-200', textClass: 'text-gray-900', opacity: 0.3 }
    };

    return colors[label] || colors['default'];
  };

  // Handle annotation hover
  const handleAnnotationHover = (annotation, e) => {
    const rect = e.target.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setHoveredAnnotation(annotation);
  };

  // Handle annotation leave
  const handleAnnotationLeave = () => {
    setHoveredAnnotation(null);
  };

  // Handle annotation click
  const handleAnnotationClick = (annotation, e) => {
    e.stopPropagation();
    // Could emit onSpanClick for editing/deleting
    console.log('Annotation clicked:', annotation);
  };

  // Clear selection with keyboard (Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedRange({ start: null, end: null, text: '' });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div 
      ref={textContainerRef}
      onClick={handleContainerClick}
      className="relative"
    >
      {/* Tooltip */}
      {hoveredAnnotation && (
        <div 
          className="absolute z-50 bg-gray-900 text-white text-xs px-3 py-2 rounded shadow-lg whitespace-nowrap"
          style={{ 
            left: `${tooltipPosition.x}px`, 
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="font-semibold">{hoveredAnnotation.label}</div>
          <div className="text-gray-400">ID: {hoveredAnnotation.id}</div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setHoveredAnnotation(null);
            }}
            className="absolute top-1 right-1 text-gray-400 hover:text-white"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Text Content */}
      <div 
        ref={contentRef}
        className="p-4 bg-white border border-gray-200 rounded-lg min-h-[200px] font-mono text-sm leading-relaxed whitespace-pre-wrap select-text"
      >
        {renderTextWithAnnotations()}
      </div>

      {/* Selection Info */}
      {selectedRange.text && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-900">
            <strong>Selected:</strong> "{selectedRange.text}"
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Start: {selectedRange.start} | End: {selectedRange.end} | Length: {selectedRange.text.length}
          </p>
        </div>
      )}
    </div>
  );
};

export default HighlightableTextArea;