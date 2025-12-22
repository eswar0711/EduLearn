// src/components/FacultyCourseMaterials.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { User, Subject, CourseMaterial } from '../utils/supabaseClient';
import NavigationSidebar from './NavigationSidebar';
import SubjectManagement from './SubjectManagement';  // ← NEW IMPORT
import { Upload, Trash2, FileText, BookOpen } from 'lucide-react';

interface FacultyCourseMaterialsProps {
  user: User;
}

const FacultyCourseMaterials: React.FC<FacultyCourseMaterialsProps> = ({ user }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [materialType, setMaterialType] = useState<'pdf' | 'syllabus' | 'notes' | 'assignment'>('pdf');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all subjects
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*')
        .order('semester', { ascending: true });

      setSubjects(subjectsData || []);

      // Fetch materials uploaded by this faculty
      const { data: materialsData } = await supabase
        .from('course_materials')
        .select('*')
        .eq('faculty_id', user.id)
        .order('created_at', { ascending: false });

      setMaterials(materialsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (selectedFile.type !== 'application/pdf') {
        alert('Please upload only PDF files');
        return;
      }
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('File size should not exceed 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSubject || !title || !file) {
      alert('Please fill all required fields and select a file');
      return;
    }

    setUploading(true);

    try {
      // Get subject details
      const subject = subjects.find(s => s.id === selectedSubject);
      if (!subject) {
        alert('Subject not found');
        return;
      }

      // Upload file to Supabase Storage
      const fileName = `${subject.code}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Insert material record into database
      const { error: dbError } = await supabase
        .from('course_materials')
        .insert({
          subject_id: selectedSubject,
          faculty_id: user.id,
          title,
          description: description || null,
          file_url: fileName,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          material_type: materialType,
          semester: subject.semester,
        });

      if (dbError) throw dbError;

      alert('Material uploaded successfully!');
      
      // Reset form
      setSelectedSubject('');
      setTitle('');
      setDescription('');
      setMaterialType('pdf');
      setFile(null);
      
      // Refresh materials list
      fetchData();
    } catch (error) {
      console.error('Error uploading material:', error);
      alert('Error uploading material. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (material: CourseMaterial) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('course-materials')
        .remove([material.file_url]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('course_materials')
        .delete()
        .eq('id', material.id);

      if (dbError) throw dbError;

      alert('Material deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting material:', error);
      alert('Error deleting material. Please try again.');
    }
  };

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

  if (loading) {
    return (
      <div className="flex">
        <NavigationSidebar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <NavigationSidebar user={user} />

      <div className="flex-1 p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Course Materials Management</h2>
          <p className="text-gray-600">Upload and manage study materials for your courses</p>
        </div>

        {/* ==================== NEW: Subject Management ==================== */}
        <SubjectManagement onSubjectAdded={fetchData} />
        {/* ================================================================= */}

        {/* Upload Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Upload New Material</h3>
              <p className="text-sm text-gray-600">Add study materials for your courses</p>
            </div>
          </div>

          <form onSubmit={handleUpload} className="space-y-5">
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
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                required
              />
              {file && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <FileText className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">{file.name}</p>
                    <p className="text-xs text-green-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              )}
              <p className="mt-2 text-xs text-gray-500">Maximum file size: 10MB</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
          </form>
        </div>

        {/* Uploaded Materials List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">Your Uploaded Materials</h3>
            <p className="text-sm text-gray-600 mt-1">
              {materials.length} material{materials.length !== 1 ? 's' : ''} uploaded
            </p>
          </div>

          {materials.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No materials uploaded yet</p>
              <p className="text-gray-500 text-sm mt-2">Upload your first course material to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {materials.map(material => (
                    <tr key={material.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{material.title}</span>
                          {material.description && (
                            <span className="text-xs text-gray-500 mt-1">{material.description}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getMaterialTypeColor(material.material_type)}`}>
                          {material.material_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{material.file_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatFileSize(material.file_size)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(material.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDelete(material)}
                          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyCourseMaterials;
