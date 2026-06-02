import Purchases from "@revenuecat/purchases-js";

let purchasesInstance = null;

// Initialize RevenueCat
export const initializeRevenueCat = async (userId = null) => {
  try {
    if (!purchasesInstance) {
      purchasesInstance = Purchases.configure("YOUR_REVENUECAT_API_KEY", userId);
    }
    
    if (userId) {
      await purchasesInstance.login(userId);
    }
    
    return purchasesInstance;
  } catch (error) {
    console.error('RevenueCat initialization error:', error);
    throw error;
  }
};

// Get current customer info and entitlements
export const checkSubscriptionStatus = async () => {
  try {
    if (!purchasesInstance) {
      throw new Error('RevenueCat not initialized');
    }
    
    const customerInfo = await purchasesInstance.getCustomerInfo();
    
    return {
      isPro: customerInfo.entitlements.active["pro"] !== undefined,
      isPremium: customerInfo.entitlements.active["premium"] !== undefined,
      customerInfo
    };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return {
      isPro: false,
      isPremium: false,
      customerInfo: null
    };
  }
};

// Get available offerings
export const getOfferings = async () => {
  try {
    if (!purchasesInstance) {
      throw new Error('RevenueCat not initialized');
    }
    
    const offerings = await purchasesInstance.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Error fetching offerings:', error);
    return null;
  }
};

// Purchase a package
export const purchasePackage = async (rcPackage) => {
  try {
    if (!purchasesInstance) {
      throw new Error('RevenueCat not initialized');
    }
    
    const { customerInfo } = await purchasesInstance.purchase({ rcPackage });
    
    return {
      success: true,
      isPro: customerInfo.entitlements.active["pro"] !== undefined,
      isPremium: customerInfo.entitlements.active["premium"] !== undefined,
      customerInfo
    };
  } catch (error) {
    console.error('Purchase error:', error);
    
    if (error.code === 'PURCHASE_CANCELLED') {
      return { success: false, cancelled: true };
    }
    
    return { success: false, error: error.message };
  }
};

// Restore purchases
export const restorePurchases = async () => {
  try {
    if (!purchasesInstance) {
      throw new Error('RevenueCat not initialized');
    }
    
    const customerInfo = await purchasesInstance.restorePurchases();
    
    return {
      success: true,
      isPro: customerInfo.entitlements.active["pro"] !== undefined,
      isPremium: customerInfo.entitlements.active["premium"] !== undefined,
      customerInfo
    };
  } catch (error) {
    console.error('Restore purchases error:', error);
    return { success: false, error: error.message };
  }
};

// Login with user ID
export const loginUser = async (userId) => {
  try {
    if (!purchasesInstance) {
      throw new Error('RevenueCat not initialized');
    }
    
    const customerInfo = await purchasesInstance.login(userId);
    return { success: true, customerInfo };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    if (!purchasesInstance) {
      throw new Error('RevenueCat not initialized');
    }
    
    const customerInfo = await purchasesInstance.logout();
    return { success: true, customerInfo };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

export default {
  initializeRevenueCat,
  checkSubscriptionStatus,
  getOfferings,
  purchasePackage,
  restorePurchases,
  loginUser,
  logoutUser
};