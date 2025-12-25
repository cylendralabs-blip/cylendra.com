
// وظائف التحقق من صحة البيانات
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل');
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateApiKey = (apiKey: string): boolean => {
  // التحقق من طول وتنسيق مفتاح API
  return apiKey.length >= 32 && /^[a-zA-Z0-9]+$/.test(apiKey);
};

export const validateTradingAmount = (amount: number, balance: number): { isValid: boolean; error?: string } => {
  if (amount <= 0) {
    return { isValid: false, error: 'المبلغ يجب أن يكون أكبر من صفر' };
  }
  
  if (amount > balance) {
    return { isValid: false, error: 'المبلغ أكبر من الرصيد المتاح' };
  }
  
  if (amount > balance * 0.5) {
    return { isValid: false, error: 'المبلغ كبير جداً (أكثر من 50% من الرصيد)' };
  }
  
  return { isValid: true };
};

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // إزالة علامات HTML
    .replace(/javascript:/gi, '') // إزالة JavaScript
    .replace(/on\w+=/gi, '') // إزالة event handlers
    .trim();
};

export const validateSymbol = (symbol: string): boolean => {
  const symbolRegex = /^[A-Z]+\/[A-Z]+$/;
  return symbolRegex.test(symbol);
};

export const validatePercentage = (value: number, min: number = 0, max: number = 100): boolean => {
  return value >= min && value <= max;
};
