"use client";
import React from "react";
import { useContextElement } from "@/context/Context";
import { useRouter } from "next/navigation";

export default function UserIcon({ className = "nav-icon-item", style = {} }) {
  const { isAuthenticated, user, openAuthModal } = useContextElement();
  const router = useRouter();

  const handleUserIconClick = (e) => {
    e.preventDefault();
    
    if (isAuthenticated) {
      // User is logged in, redirect to my-account page
      router.push('/my-account');
    } else {
      // User is not logged in, open auth modal
      openAuthModal();
    }
  };

  return (
    <a 
      href="#" 
      className={className}
      onClick={handleUserIconClick} 
      style={{ 
        display: 'flex', 
        alignItems: 'center',
        position: 'relative',
        ...style
      }}
      title={isAuthenticated ? `Welcome, ${user?.name || 'User'}` : 'Sign In'}
    >
      <svg
        className="icon"
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        <path
          d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
          stroke={isAuthenticated ? "#28a745" : "#181818"}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
          stroke={isAuthenticated ? "#28a745" : "#181818"}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {isAuthenticated && (
        <span 
          style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            width: '8px',
            height: '8px',
            backgroundColor: '#28a745',
            borderRadius: '50%',
            border: '2px solid white'
          }}
        />
      )}
    </a>
  );
}
