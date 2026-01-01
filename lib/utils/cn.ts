import clsx, { ClassValue } from 'clsx';

/**
 * Utility để merge class names
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}


