import React from 'react';
import { PenTool, Settings, Info, Microscope, Feather, ShieldCheck, Languages } from 'lucide-react';
import appLogo from '../assets/logo.png';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: any) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const navItems = [
    { id: 'editor', icon: PenTool, label: 'Editor' },
    { id: 'prompt', icon: Feather, label: 'Creative Writing' },
    { id: 'translation', icon: Languages, label: 'Translation' },
    { id: 'analysis', icon: Microscope, label: 'Analysis' },
    { id: 'detector', icon: ShieldCheck, label: 'Plagiarism & AI Detector' },
  ];

  const bottomItems = [
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'about', icon: Info, label: 'About' },
  ];

  const NavButton = ({ item }: { item: any }) => (
    <button
      className={`nav-button ${currentPage === item.id ? 'active' : ''}`}
      onClick={() => onNavigate(item.id)}
      title={item.label}
    >
      <item.icon size={24} />
      <span className="sr-only">{item.label}</span>
    </button>
  );

  return (
    <nav className="sidebar">
      <div className="sidebar-top">
        <div 
          className={`sidebar-logo-container ${currentPage === 'dashboard' ? 'active-dashboard' : ''}`}
          title="AI Grammar Studio - Dashboard Hub" 
          onClick={() => onNavigate('dashboard')}
        >
          <img src={appLogo} alt="AI Grammar Studio" className="sidebar-logo-img" />
        </div>
        {navItems.map(item => <NavButton key={item.id} item={item} />)}
      </div>
      <div className="sidebar-bottom">
        {bottomItems.map(item => <NavButton key={item.id} item={item} />)}
      </div>
    </nav>
  );
};

export default Sidebar;
