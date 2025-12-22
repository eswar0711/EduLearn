// src/components/CourseMaterialsList.tsx
import React from 'react';
import { Trash2, FileText, Calendar } from 'lucide-react';
import type { CourseMaterial } from '../utils/supabaseClient';

interface CourseMaterialsListProps {
  materials: CourseMaterial[];
  onDelete: (material: CourseMaterial) => void;
  showActions?: boolean;
}

const CourseMaterialsList: React.FC<CourseMaterialsListProps> = ({ 
  materials, 
  onDelete,
  showActions = true 
}) => {
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
  };

  const getMaterialTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      syllabus: 'bg-purple-100 text-purple-700',
      notes: 'bg-blue-100 text-blue-700',
      assignment: 'bg-orange-100 text-orange-700',
      pdf: 'bg-gray-100 text-gray-700',
    };
    return colors[type] || colors.pdf;
  };

  if (materials.length === 0) {
    return (
      <div className="p-8 text-center">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">No materials uploaded yet</p>
        <p className="text-gray-500 text-sm mt-2">
          Upload your first course material to get started
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              File Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Uploaded
            </th>
            {showActions && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {materials.map(material => (
            <tr key={material.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {material.title}
                  </span>
                  {material.description && (
                    <span className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {material.description}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getMaterialTypeColor(material.material_type)}`}>
                  {material.material_type}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="truncate max-w-xs">{material.file_name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {formatFileSize(material.file_size)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {new Date(material.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </td>
              {showActions && (
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => onDelete(material)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                    title="Delete material"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CourseMaterialsList;
