import { describe, expect, test } from 'bun:test'
import { redactText, redactValue, secretKey } from './redact'

describe('secretKey', () => {
  test.each(['password', 'newPassword', 'api_key', 'X-Api-Key', 'accessToken', 'client_secret', 'Set-Cookie', 'sessionId', 'auth', 'otp'])('%s is a secret', (key) => {
    expect(secretKey(key)).toBe(true)
  })
  test.each(['author', 'email', 'name', 'id', 'keyboard', 'total'])('%s is not', (key) => {
    expect(secretKey(key)).toBe(false)
  })
})

describe('redactValue', () => {
  test('masks secret keys at any depth, with their whole subtree', () => {
    const input = { user: 'ada', auth: { accessToken: 'abc123' }, nested: [{ deeper: { password: 'hunter 2', keep: 'yes' } }], credentials: { user: 'x' } }
    expect(redactValue(input)).toEqual({ user: 'ada', auth: '[redacted]', nested: [{ deeper: { password: '[redacted]', keep: 'yes' } }], credentials: '[redacted]' })
  })

  test('cycles, depth, errors, functions; shared references stay', () => {
    const shared = { a: 1 }
    const cyclic: Record<string, unknown> = { shared, again: shared }
    cyclic['self'] = cyclic
    expect(redactValue(cyclic)).toEqual({ shared: { a: 1 }, again: { a: 1 }, self: '[circular]' })
    expect(redactValue({ a: { b: { c: 1 } } }, 2)).toEqual({ a: { b: '[deep]' } })
    const error = new TypeError('token=abc123 failed')
    expect((redactValue(error) as { message: string }).message).toBe('token=[redacted] failed')
    expect(redactValue({ run: () => 1 })).toEqual({ run: '[function]' })
  })

  test('strings inside values are scrubbed', () => {
    expect(redactValue({ url: '/api?a=1&token=abc123&b=2' })).toEqual({ url: '/api?a=1&token=[redacted]&b=2' })
  })
})

describe('redactText', () => {
  test.each([
    ['Authorization: Bearer abc.def.ghi123', 'Authorization: [redacted]'],
    ['sent Bearer abcdef123456', 'sent Bearer [redacted]'],
    ['{"password":"hunter 2","name":"ada"}', '{"password":"[redacted]","name":"ada"}'],
    ["{ apiKey: 'k-123' }", "{ apiKey: '[redacted]' }"],
    ['https://x.example/cb?code=1&access_token=abc&state=2', 'https://x.example/cb?code=1&access_token=[redacted]&state=2'],
    ['jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl here', 'jwt [redacted] here'],
    ['session=s%3Aabc; theme=dark', 'session=[redacted]; theme=dark'],
    ['author: ada', 'author: ada'],
    ['GET https://ada:pw@db.example/x failed', 'GET https://[redacted]@db.example/x failed'],
    [String.raw`{"password":"a\"b","x":1}`, '{"password":"[redacted]","x":1}'],
  ])('%s', (input, output) => {
    expect(redactText(input)).toBe(output)
  })

  test('idempotent over already masked JSON', () => {
    const once = redactText(JSON.stringify(redactValue({ token: 'abc' })))
    expect(redactText(once)).toBe('{"token":"[redacted]"}')
  })
})
