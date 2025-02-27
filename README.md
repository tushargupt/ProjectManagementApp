# ProjectManagementApp

## Project Overview
A comprehensive task management and collaboration tool built with the T3 stack, deployed on AWS using SST, and integrated with Supabase.

## Tech Stack
- **Frontend**: Next.js (Pages Router)
- **Backend**: tRPC, SST (Serverless Stack)
- **Database**: Supabase
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Prerequisites
- Node.js (v18+)
- npm or yarn
- AWS Account
- Supabase Account

## Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ProjectManagementApp.git
cd ProjectManagementApp
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file with the following variables:
```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

### 4. Database Setup
```bash
# Initialize Prisma
npx prisma generate
npx prisma db push
```

### 5. Run the Development Server
```bash
npm run dev
```

## Deployment

### AWS Deployment with SST
```bash
# Install SST globally
npm install -g sst

# Deploy to AWS
sst deploy --stage prod
```

## Testing
```bash
# Run unit tests
npm run test
```

## Project Structure
```
ProjectManagementApp/
├── prisma/             # Database schema
├── src/
│   ├── components/     # React components
│   ├── pages/          # Next.js pages
│   ├── server/         # Server-side logic
│   │   ├── api/        # API routes
│   │   └── trpc/       # tRPC procedures
│   └── utils/          # Utility functions
├── tests/              # Unit and integration tests
└── sst.config.ts       # SST configuration
```

## Features
- Task creation and management
- User authentication
- Project and task tracking
- Team collaboration
- User profile management

## Contributing
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
```