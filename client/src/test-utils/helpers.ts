import { screen, waitForElementToBeRemoved as _waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Helper to find elements by test ID with proper typing
export const getByTestId = (testId: string) => {
  return screen.getByTestId(testId);
};

// Helper to find elements by role with proper typing
export const getByRole = (role: string, name: string) => {
  return screen.getByRole(role, { name });
};

// Helper to simulate user interactions
export const userActions = {
  async click(element: HTMLElement) {
    await userEvent.click(element);
  },
  async type(element: HTMLElement, text: string) {
    await userEvent.type(element, text);
  },
  async clear(element: HTMLElement) {
    await userEvent.clear(element);
  },
  async selectOption(element: HTMLElement, option: string) {
    await userEvent.selectOptions(element, option);
  }
};

// Helper to wait for element to be removed
export const waitForElementToBeRemoved = async (element: HTMLElement) => {
  return _waitForElementToBeRemoved(element);
};

// Helper to wait for element to be visible
export const waitForElementToBeVisible = async (testId: string) => {
  return screen.findByTestId(testId);
};

// Helper to generate test data
export const generateTestData = {
  number(min = 0, max = 100) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  string(length = 10) {
    return Math.random().toString(36).substring(2, length + 2);
  },
  boolean() {
    return Math.random() >= 0.5;
  },
  array<T>(generator: () => T, length = 5): T[] {
    return Array.from({ length }, generator);
  }
};

// Helper to mock date/time
export const mockDate = (isoDate: string) => {
  const mockDate = new Date(isoDate);
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
};

// Helper to restore mocked date
export const restoreDate = () => {
  jest.spyOn(global, 'Date').mockRestore();
};