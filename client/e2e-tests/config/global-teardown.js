/**
 * Global Teardown for Jest
 *
 * This file runs once after all tests are complete.
 * It's a good place to clean up global resources.
 */

export default async function () {
  console.log('Cleaning up global test environment...');

  // Any global cleanup can be done here

  console.log('Global teardown complete');
}
