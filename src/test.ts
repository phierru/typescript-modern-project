// Import without specifying the extension. `./Lib.js` would look odd in a .ts file

test('constructor', () => {
  const emptyString = ''
  expect(emptyString === '').toBeTruthy()
})
