const { sanitizeUser } = require('../../src/utils/helpers');

test('sanitizeUser hides the check-in card code but keeps the usher switch', () => {
  const user = sanitizeUser({ id: 2, password: 'hash', check_in_code: 'ABCDEFGHJK', checkInCode: 'ABCDEFGHJK', can_take_attendance: true });
  expect(user).toEqual({ id: 2, can_take_attendance: true });
});
