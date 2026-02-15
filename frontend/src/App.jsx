import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Chat from './pages/Chat';
import Resume from './pages/Resume';
import MockTest from './pages/MockTest';
import Dashboard from './pages/Dashboard';
import Aptitude from './pages/Aptitude';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Chat />} />
          <Route path="resume" element={<Resume />} />
          <Route path="test" element={<MockTest />} />
          <Route path="aptitude" element={<Aptitude />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
