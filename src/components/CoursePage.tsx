// src/components/CoursePage.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { User, Subject, CourseMaterial } from '../utils/supabaseClient';
import NavigationSidebar from './NavigationSidebar';
import { BookOpen, Download, FileText, Calendar } from 'lucide-react';

interface CoursePageProps {
  user: User;
}

interface SubjectWithMaterials extends Subject {
  materials: CourseMaterial[];
}

const CoursePage: React.FC<CoursePageProps> = ({ user }) => {
  const [subjects, setSubjects] = useState<SubjectWithMaterials[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState<number>(3); // Default semester

  useEffect(() => {
    fetchCourses();
  }, [selectedSemester]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // Fetch subjects for selected semester
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .eq('semester', selectedSemester)
        .order('code');

      if (subjectsError) throw subjectsError;

      // Fetch all course materials for this semester
      const { data: materialsData } = await supabase
        .from('course_materials')
        .select('*')
        .eq('semester', selectedSemester)
        .order('created_at', { ascending: false });

      // Combine subjects with their materials
      const subjectsWithMaterials: SubjectWithMaterials[] = (subjectsData || []).map(subject => ({
        ...subject,
        materials: (materialsData || []).filter(m => m.subject_id === subject.id),
      }));

      setSubjects(subjectsWithMaterials);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadMaterial = async (material: CourseMaterial) => {
    try {
      // Get signed URL for download
      const { data, error } = await supabase.storage
        .from('course-materials')
        .createSignedUrl(material.file_url, 60); // 60 seconds expiry

      if (error) throw error;

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error downloading material:', error);
      alert('Error downloading file. Please try again.');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'syllabus':
        return <BookOpen className="w-5 h-5" />;
      case 'notes':
        return <FileText className="w-5 h-5" />;
      case 'assignment':
        return <Calendar className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <NavigationSidebar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg text-gray-600">Loading courses...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <NavigationSidebar user={user} />

      <div className="flex-1 p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Course Materials</h2>
          <p className="text-gray-600">Access syllabus and study materials for your courses</p>
        </div>

        {/* Semester Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Semester
          </label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>
        </div>

        {/* Subjects Grid */}
        {subjects.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No courses available for Semester {selectedSemester}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {subjects.map(subject => (
              <div
                key={subject.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Subject Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{subject.name}</h3>
                      <p className="text-blue-100 text-sm">{subject.code}</p>
                    </div>
                    <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                      Sem {subject.semester}
                    </span>
                  </div>
                  {subject.description && (
                    <p className="mt-4 text-blue-50 text-sm">{subject.description}</p>
                  )}
                </div>

                {/* Materials List */}
                <div className="p-6">
                  {subject.materials.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No materials uploaded yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">
                        Study Materials
                      </h4>
                      {subject.materials.map(material => (
                        <div
                          key={material.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <div className="text-blue-600 mt-1">
                              {getMaterialIcon(material.material_type)}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-800 mb-1">
                                {material.title}
                              </h5>
                              {material.description && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {material.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="capitalize">{material.material_type}</span>
                                <span>•</span>
                                <span>{formatFileSize(material.file_size)}</span>
                                <span>•</span>
                                <span>{new Date(material.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => downloadMaterial(material)}
                            className="ml-4 p-2 bg-indigo-400 hover:bg-blue-500 text-white rounded-lg transition-colors"
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursePage;
