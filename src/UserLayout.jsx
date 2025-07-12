import React from 'react';
import Navbar from './Navigation/Navbar';

export default function UserLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
} 