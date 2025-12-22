// src/components/CourseCard.tsx
import React from 'react';
import { BookOpen, Download } from 'lucide-react';
import type { Subject, CourseMaterial } from '../utils/supabaseClient';

interface CourseCardProps {
  subject: Subject;
  materials: CourseMaterial[];
  onDownload: (material: CourseMaterial) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ subject, materials, onDownload }) => {
  const getMaterialIcon = (type: string) => {
    const icons: Record<string, string> = {
      syllabus: '📚',
      notes: '📝',
      assignment: '📋',
      pdf: '📄',
    };
    return icons[type] || '📄';
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Subject Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1">{subject.name}</h3>
            <p className="text-blue-100 text-sm">{subject.code}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
              Semester {subject.semester}
            </span>
            {materials.length > 0 && (
              <span className="bg-green-500 bg-opacity-80 px-3 py-1 rounded-full text-xs">
                {materials.length} material{materials.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        {subject.description && (
          <p className="mt-4 text-blue-50 text-sm leading-relaxed">{subject.description}</p>
        )}
      </div>

      {/* Materials List */}
      <div className="p-6">
        {materials.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No materials uploaded yet</p>
            <p className="text-gray-400 text-xs mt-1">Check back later for updates</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Study Materials
            </h4>
            {materials.map(material => (
              <div
                key={material.id}
                className="group flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                onClick={() => onDownload(material)}
              >
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">{getMaterialIcon(material.material_type)}</span>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-800 mb-1 truncate group-hover:text-blue-700 transition-colors">
                      {material.title}
                    </h5>
                    {material.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {material.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="capitalize px-2 py-1 bg-white rounded border border-gray-200">
                        {material.material_type}
                      </span>
                      <span>{formatFileSize(material.file_size)}</span>
                      <span>•</span>
                      <span>{new Date(material.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(material);
                  }}
                  className="ml-4 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors group-hover:scale-110"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCard;
