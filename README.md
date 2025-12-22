EduVerge - Smart Online Learning & Assessment Platform
A modern, full-stack online learning and assessment platform built with React, TypeScript, Tailwind CSS, and Supabase.

🚀 Features
For Faculty
Create assessments with MCQ and Theory questions

Auto-grading for MCQ questions

View student submissions

Analytics dashboard (total assessments, submissions, average scores)

Manual grading for theory answers

For Students
View and attempt available assessments

Real-time timer during tests

Instant MCQ results

View detailed results with question review

Track performance over time

📋 Prerequisites
Node.js (v18 or higher)

npm or yarn

Supabase account

🛠️ Installation & Setup
1. Clone the Repository
bash
git clone <repository-url>
cd eduverge-mvp
2. Install Dependencies
bash
npm install
3. Set Up Supabase
Create a new project at supabase.com

Go to Project Settings → API

Copy your project URL and anon public key

4. Run Database Schema
Open Supabase SQL Editor

Copy the contents of supabase/schema.sql

Execute the SQL to create tables and set up Row Level Security

5. Configure Environment Variables
Create a .env file in the root directory:

text
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
6. Start Development Server
bash
npm run dev
The application will be available at http://localhost:5173

📁 Project Structure
text
eduverge-mvp/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── AssessmentCreation.tsx
│   │   ├── FacultyDashboard.tsx
│   │   ├── NavigationSidebar.tsx
│   │   ├── ResultsPage.tsx
│   │   ├── StudentDashboard.tsx
│   │   └── TestTaking.tsx
│   ├── pages/
│   │   └── LoginPage.tsx
│   ├── utils/           # Utility functions
│   │   ├── auth.ts
│   │   ├── autoGrading.ts
│   │   └── supabaseClient.ts
│   ├── App.tsx          # Main app component
│   └── index.tsx        # Entry point
├── supabase/
│   └── schema.sql       # Database schema
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
🗄️ Database Schema
Tables
users - User profiles (extends Supabase Auth)

assessments - Test/exam metadata

questions - MCQ and Theory questions

submissions - Student test submissions and scores

Row Level Security (RLS)
All tables have RLS policies to ensure:

Faculty can only see/modify their own assessments

Students can only see their own submissions

Proper access control based on user roles

🎨 Technology Stack
Frontend: React 18 + TypeScript

Styling: Tailwind CSS 3

Routing: React Router v6

Backend: Supabase (PostgreSQL + Auth)

Icons: Lucide React

Build Tool: Vite

🔐 Authentication
Email/password authentication via Supabase Auth

Role-based access control (Faculty/Student)

Automatic user profile creation on signup

Session management with protected routes

📊 Auto-Grading Logic
MCQ questions are automatically graded by comparing student answers with the correct answer stored in the database. Theory questions require manual grading by faculty.

🚢 Deployment
Build for Production
bash
npm run build
Deploy to Vercel/Netlify
Connect your repository

Set environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

Deploy!

Recommended Platforms
Vercel - Optimal for React apps

Netlify - Great for static sites

Cloudflare Pages - Fast global CDN

📝 Usage Guide
Creating an Assessment (Faculty)
Login as faculty

Click "Create Assessment"

Fill in subject, unit, title, and duration

Add MCQ or Theory questions

For MCQ: provide 4 options and select correct answer

Click "Create Assessment"

Taking a Test (Student)
Login as student

View available assessments on dashboard

Click "Start Test"

Answer questions within time limit

Submit test

View instant results

Viewing Results
Students can view:

Total score percentage

MCQ score (instant)

Theory score (after faculty grading)

Detailed question-by-question review

🔧 Customization
Changing Theme Colors
Edit tailwind.config.js:

js
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom color palette
      }
    }
  }
}
Adding New Features
The codebase is modular and easy to extend:

Add new components in src/components/

Add new routes in App.tsx

Extend database schema in supabase/schema.sql

🐛 Troubleshooting
"Invalid API key" error
Check your .env file has correct Supabase credentials

Ensure variable names start with VITE_

RLS policy errors
Verify you ran the complete schema.sql

Check user role is set correctly during signup

Build errors
Clear node_modules and reinstall: rm -rf node_modules && npm install

Clear cache: npm run build -- --force

📄 License
MIT License - feel free to use this project for learning or commercial purposes.

🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

📧 Support
For issues or questions, please open an issue on GitHub.

Built with ❤️ using React + TypeScript + Tailwind + Supabase