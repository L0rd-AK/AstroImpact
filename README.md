# AstroImpact Simulator

A full-stack web application for simulating asteroid impact scenarios using real NASA data. Built for the 2025 NASA Space Apps Challenge "Meteor Madness" challenge.

## 🚀 Features

- **Real NASA Data Integration**: Live asteroid data from NASA's NeoWs API
- **Interactive Impact Simulation**: Model asteroid impacts anywhere on Earth
- **Mitigation Planning**: Design and test asteroid deflection strategies
- **Community Sharing**: Share simulations and vote on mitigation strategies
- **Real-time Collaboration**: Live updates using Socket.io
- **Responsive Design**: Optimized for desktop and mobile devices

## 🛠 Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time features
- **JWT** for authentication
- **Axios** for NASA API integration

### Frontend
- **React.js** with React Router
- **Bootstrap** for responsive UI
- **Leaflet.js** for interactive maps
- **Chart.js** for data visualization
- **React Spring** for animations
- **Socket.io Client** for real-time updates

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB (local installation or MongoDB Atlas)
- NASA API key (free from https://api.nasa.gov/)

## ⚡ Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd astroimpact-simulator

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

Create `.env` file in the backend directory:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/astroimpact
JWT_SECRET=your_super_secure_jwt_secret_here
NASA_API_KEY=your_nasa_api_key_here
FRONTEND_URL=http://localhost:3000
```

### 3. Database Setup

Start MongoDB service (if running locally):

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 4. Run the Application

**Backend Server:**
```bash
cd backend
npm run dev
```

**Frontend Development Server:**
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔧 Configuration

### NASA API Setup
1. Visit https://api.nasa.gov/
2. Generate a free API key
3. Add the key to your `.env` file as `NASA_API_KEY`

### MongoDB Configuration
- **Local**: Install MongoDB and update `MONGODB_URI` in `.env`
- **Cloud**: Use MongoDB Atlas free tier and update connection string

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Asteroid Endpoints
- `GET /api/asteroids` - List asteroids with pagination
- `GET /api/asteroids/featured` - Get featured asteroids
- `GET /api/asteroids/search` - Search asteroids
- `GET /api/asteroids/:id` - Get specific asteroid
- `POST /api/asteroids/sync` - Sync NASA data

### Simulation Endpoints
- `POST /api/simulations` - Create new simulation
- `GET /api/simulations/my` - Get user's simulations
- `GET /api/simulations/public` - Get public simulations
- `GET /api/simulations/:id` - Get specific simulation
- `POST /api/simulations/:id/vote` - Vote on simulation
- `POST /api/simulations/:id/comments` - Add comment

## 🎮 Usage Guide

### 1. Create Account
- Register with email and password
- Complete optional profile information

### 2. Explore Asteroids
- Browse NASA's asteroid database
- Filter by size, hazard level, or search by name
- View detailed asteroid properties

### 3. Run Simulations
- Select an asteroid from the database
- Choose impact location on interactive map
- Configure impact parameters (angle, mitigation strategy)
- View detailed results including crater size, casualties, economic impact

### 4. Community Features
- Share simulations publicly
- Vote on other users' mitigation strategies
- Comment on simulations
- View leaderboards and user profiles

## 🏗 Project Structure

```
astroimpact-simulator/
├── backend/
│   ├── src/
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API route handlers
│   │   ├── middleware/      # Authentication & validation
│   │   ├── utils/           # NASA API & impact calculations
│   │   └── server.js        # Express server setup
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context providers
│   │   ├── utils/           # Helper functions
│   │   └── App.js           # Main app component
│   └── package.json
└── README.md
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Backend (Render/Heroku)
1. Create account on Render or Heroku
2. Connect your repository
3. Set environment variables
4. Deploy backend service

### Frontend (Vercel/Netlify)
1. Create account on Vercel or Netlify
2. Connect your repository
3. Set build command: `npm run build`
4. Set build directory: `build`
5. Deploy frontend

### Database (MongoDB Atlas)
1. Create MongoDB Atlas account
2. Create cluster and database
3. Update `MONGODB_URI` in production environment

## 🔬 Impact Calculation Methods

The simulator uses scientifically-based formulas:

- **Crater Diameter**: Based on USGS scaling laws `D = k * E^0.33`
- **Blast Damage**: TNT equivalent energy calculations
- **Seismic Effects**: Richter scale magnitude estimation
- **Tsunami Modeling**: For ocean impacts
- **Environmental Impact**: Dust cloud and climate effects

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🏆 NASA Space Apps Challenge

This project was created for the 2025 NASA Space Apps Challenge, specifically addressing the "Meteor Madness" challenge. It demonstrates:

- Real NASA data integration
- Scientific impact modeling
- Community collaboration features
- Educational value for planetary defense awareness

## 📞 Support

For support or questions:
- Create an issue in this repository
- Contact the development team
- Join our community discussions

## 🙏 Acknowledgments

- NASA for providing the NeoWs API and asteroid data
- USGS for impact crater scaling research
- NASA Space Apps Challenge organizers
- Open source community for the amazing tools and libraries

---

**Built with ❤️ for planetary defense and space education**
