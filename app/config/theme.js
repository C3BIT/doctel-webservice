export const COLORS = {
    brand: {
      primary: '#20ACE2',  
      secondary: '#223972', 
      primaryLight: '#4CBDE7',
      primaryDark: '#1789B4', 
      secondaryLight: '#2B478E',
      secondaryDark: '#192B57',
    },
  
    text: {
      onPrimary: '#FFFFFF',   
      onSecondary: '#FFFFFF', 
      primary: '#333333',      
      secondary: '#666666',    
    },
  
    status: {
      success: '#34C759',
      error: '#FF3B30',
      warning: '#FFCC00',
      info: '#20ACE2',
    },
  
    common: {
      white: '#FFFFFF',
      black: '#000000',
      transparent: 'transparent',
    },
  };
  
  export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  };
  
  export const COMPONENTS = {
    button: {
      primary: {
        backgroundColor: COLORS.brand.secondary,
        pressedColor: COLORS.brand.secondaryDark,
        textColor: COLORS.text.onSecondary,
        borderRadius: 8,
        padding: SPACING.md,
      },
      secondary: {
        backgroundColor: COLORS.brand.primary,
        pressedColor: COLORS.brand.primaryDark,
        textColor: COLORS.text.onPrimary,
        borderRadius: 8,
        padding: SPACING.md,
      },
    },
    screen: {
      backgroundColor: COLORS.brand.primary,
    },
  };
  
  export default {
    colors: COLORS,
    spacing: SPACING,
    components: COMPONENTS,
  };