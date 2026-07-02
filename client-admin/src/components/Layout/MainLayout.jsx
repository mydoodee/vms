import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-main">
        <Header />
        <main className="layout-content">
          {children}
        </main>
      </div>
    </div>
  );
}
