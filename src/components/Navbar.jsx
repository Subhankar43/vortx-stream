import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProfileModal from './ProfileModal';

export default function Navbar({ onSearch, onLoginOpen, onSignupOpen, onWatchlistOpen, onNavClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const profileRef = useRef(null);
  const debounceRef = useRef(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const currentPage = location.pathname === '/' ? 'home'
    : location.pathname === '/movies' ? 'movies'
    : location.pathname === '/series' ? 'series' : '';

  useEffect(() => {
    function handler(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  function handleSearch(val) {
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { onSearch(''); return; }
    debounceRef.current = setTimeout(() => onSearch(val.trim()), 380);
  }

  function clearSearch() { setQuery(''); onSearch(''); }

  function navTo(page) {
    onNavClick?.();
    setMenuOpen(false);
    if (page === 'home') navigate('/');
    else navigate('/' + page);
  }

  return (
    <>
      <nav className="nav">
        <div className="nav-left">
          <div className="nav-logo" onClick={() => navTo('home')}>VortxStream</div>
          <div className="nav-links">
            <button className={`nav-link ${currentPage === 'home' ? 'active' : ''}`} onClick={() => navTo('home')}>Home</button>
            <button className={`nav-link ${currentPage === 'movies' ? 'active' : ''}`} onClick={() => navTo('movies')}>Movies</button>
            <button className={`nav-link ${currentPage === 'series' ? 'active' : ''}`} onClick={() => navTo('series')}>Series</button>
            <button className={`nav-link ${currentPage === 'anime' ? 'active' : ''}`} onClick={() => navTo('anime')}>Anime</button>
            <a href="https://vortx.pages.dev" className="nav-link" target="_blank" rel="noreferrer">Portfolio</a>
          </div>
        </div>

        <div className="nav-center">
          <div className="search-wrap">
            <svg className="search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder="Search movies, series..."
              value={query}
              onChange={e => handleSearch(e.target.value)}
            />
            {query && <button className="search-clear" onClick={clearSearch}>✕</button>}
          </div>
        </div>

        <div className="nav-right">
          {user ? (
            <div className="profile-wrap" ref={profileRef} style={{ position: 'relative' }}>
           <div className="profile-avatar" onClick={() => setProfileOpen(o => !o)}>
  {user.avatar || user.name.charAt(0).toUpperCase()}
</div>
              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="profile-name">{user.name}</div>
                  <div className="profile-email">{user.email}</div>
                  <hr className="dropdown-divider" />
                  <button className="dropdown-item" onClick={() => { setProfileOpen(false); setProfileModalOpen(true); }}>
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  Edit Profile
</button>
                  <button className="dropdown-item" onClick={() => { setProfileOpen(false); onWatchlistOpen(); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    My Watchlist
                  </button>
                  <button className="dropdown-item" onClick={() => { setProfileOpen(false); navTo('home'); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    Continue Watching
                  </button>
                  <hr className="dropdown-divider" />
                  <button className="dropdown-item danger" onClick={() => { logout(); setProfileOpen(false); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button className="nav-btn btn-outline" onClick={onLoginOpen}>Login</button>
              <button className="nav-btn btn-primary" onClick={onSignupOpen}>Sign Up</button>
            </>
          )}
        </div>

        <button className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(o => !o)}>
          <span/><span/><span/>
        </button>
      </nav>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        {['home','movies','series'].map(p => (
          <button key={p} className={`mobile-link ${currentPage === p ? 'active' : ''}`} onClick={() => navTo(p)}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        <a href="https://vortx.pages.dev/" className="mobile-link" target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>Portfolio</a>
        <div className="mobile-menu-divider" />
        {user ? (
          <div className="mobile-profile" id="mobileProfile">
            <div className="mobile-profile-info">
              <div className="mobile-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div>
                <div className="mobile-profile-name">{user.name}</div>
                <div className="mobile-profile-email">{user.email}</div>
              </div>
            </div>
            <div className="mobile-menu-divider" />
            <button className="mobile-link" onClick={() => { onWatchlistOpen(); setMenuOpen(false); }}>🎬 My Watchlist</button>
            <button className="mobile-link" onClick={() => { navTo('home'); setMenuOpen(false); }}>▶ Continue Watching</button>
            <button className="mobile-link danger" onClick={() => { logout(); setMenuOpen(false); }}>⏻ Logout</button>
          </div>
        ) : (
          <>
            <button className="mobile-auth-btn btn-outline" onClick={() => { onLoginOpen(); setMenuOpen(false); }}>Login</button>
            <button className="mobile-auth-btn btn-primary" onClick={() => { onSignupOpen(); setMenuOpen(false); }}>Sign Up</button>
          </>
          
        )}
      </div>
      <ProfileModal active={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </>
  );
}
