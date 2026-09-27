import type { ValidationIssue } from '$core/model';

declare global {
  namespace App {
    interface Error {
      message: string;
      /** Set when the map failed validation, so the page can list what to fix. */
      issues?: ValidationIssue[];
    }
  }
}

export {};
