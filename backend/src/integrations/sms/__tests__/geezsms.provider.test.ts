import { toGeezPhone } from '../geezsms.provider';

describe('toGeezPhone', () => {
  it('normalizes +251 and local 0-prefix mobiles', () => {
    expect(toGeezPhone('+251911234567')).toBe('251911234567');
    expect(toGeezPhone('0911234567')).toBe('251911234567');
    expect(toGeezPhone('0711234567')).toBe('251711234567');
    expect(toGeezPhone('251911234567')).toBe('251911234567');
  });
});
