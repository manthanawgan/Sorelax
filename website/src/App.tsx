import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import DocsPage from './pages/DocsPage';
import GitHubPage from './pages/GitHubPage';
import { DashboardPage } from './features/dashboard/DashboardPage';

function MarketingLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-white">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/github" element={<GitHubPage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/dashboard/*" element={<DashboardPage />} />
      <Route path="/*" element={<MarketingLayout />} />
    </Routes>
  );
}

export default App;
