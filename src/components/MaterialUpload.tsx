// src/components/MaterialUpload.tsx
import React, { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import type { Subject } from '../utils/supabaseClient';

interface MaterialUploadProps {
  subjects: Subject[];
  onUpload: (data: MaterialUploadData) => Promise<void>;
}

export interface MaterialUploadData {
  subjectId: string;
  title: string;
  description: string;
  materialType: 'pdf' | 'syllabus' | 'notes' | 'assignment';
  file: File;
}

const MaterialUpload: React.FC<MaterialUploadProps> = ({ subjects, onUpload }) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [materialType, setMaterialType] = useState<'pdf' | 'syllabus' | 'notes' | 'assignment'>('pdf');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);

    if (selectedFile) {
      // Validate file type
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload only PDF files');
        return;
      }
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size should not exceed 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedSubject || !title || !file) {
      setError('Please fill all required fields and select a file');
      return;
    }

    setUploading(true);

    try {
      await onUpload({
        subjectId: selectedSubject,
        title,
        description,
        materialType,
        file,
      });

      // Reset form on success
      setSelectedSubject('');
      setTitle('');
      setDescription('');
      setMaterialType('pdf');
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Upload className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Upload New Material</h3>
          <p className="text-sm text-gray-600">Add study materials for your courses</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Subject Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            >
              <option value="">Select a subject</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.code} - {subject.name} (Sem {subject.semester})
                </option>
              ))}
            </select>
          </div>

          {/* Material Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Material Type <span className="text-red-500">*</span>
            </label>
            <select
              value={materialType}
              onChange={(e) => setMaterialType(e.target.value as any)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            >
              <option value="pdf">📄 General PDF</option>
              <option value="syllabus">📚 Syllabus</option>
              <option value="notes">📝 Lecture Notes</option>
              <option value="assignment">📋 Assignment</option>
            </select>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Chapter 1 - Introduction to Data Structures"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the material..."
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload PDF File <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="file-input"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
          </div>
          {file && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <FileText className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">{file.name}</p>
                <p className="text-xs text-green-600">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Maximum file size: 10MB. Only PDF files are accepted.
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={uploading}
            className="flex-1 md:flex-initial px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload Material
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MaterialUpload;
