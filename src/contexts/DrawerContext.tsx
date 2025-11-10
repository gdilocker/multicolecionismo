import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

interface DrawerContextType {
  isInDrawer: boolean;
  returnUrl: string;
  returnPageName: string;
  setDrawerState: (isOpen: boolean, url?: string, pageName?: string) => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export const useDrawer = () => {
  const context = useContext(DrawerContext);
  if (!context) {
    return {
      isInDrawer: false,
      returnUrl: '/',
      returnPageName: 'Página Anterior',
      setDrawerState: () => {}
    };
  }
  return context;
};

interface DrawerProviderProps {
  children: ReactNode;
}

export const DrawerProvider: React.FC<DrawerProviderProps> = ({ children }) => {
  const [isInDrawer, setIsInDrawer] = useState(false);
  const [returnUrl, setReturnUrl] = useState(() => {
    return localStorage.getItem('drawer_return_url') || '/';
  });
  const [returnPageName, setReturnPageName] = useState(() => {
    return localStorage.getItem('drawer_return_name') || 'Página Anterior';
  });

  const setDrawerState = (isOpen: boolean, url?: string, pageName?: string) => {
    setIsInDrawer(isOpen);

    if (isOpen && url && pageName) {
      setReturnUrl(url);
      setReturnPageName(pageName);
      localStorage.setItem('drawer_return_url', url);
      localStorage.setItem('drawer_return_name', pageName);
    } else if (!isOpen) {
      localStorage.removeItem('drawer_return_url');
      localStorage.removeItem('drawer_return_name');
    }
  };

  useEffect(() => {
    const storedUrl = localStorage.getItem('drawer_return_url');
    const storedName = localStorage.getItem('drawer_return_name');

    if (storedUrl && storedName) {
      setIsInDrawer(true);
    }
  }, []);

  return (
    <DrawerContext.Provider value={{ isInDrawer, returnUrl, returnPageName, setDrawerState }}>
      {children}
    </DrawerContext.Provider>
  );
};
