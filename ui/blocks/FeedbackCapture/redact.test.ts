import { describe, expect, test } from 'bun:test'
import { redactText, redactUrl, redactValue, secretKey } from './redact'

describe('secretKey', () => {
  test.each(['password', 'newPassword', 'api_key', 'X-Api-Key', 'accessToken', 'client_secret', 'Set-Cookie', 'sessionId', 'auth', 'otp', 'pass', 'pw', 'pin', 'passcode'])('%s is a secret', (key) => {
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

  test('idempotent over already masked JSON and bare values', () => {
    const once = redactText(JSON.stringify(redactValue({ token: 'abc' })))
    expect(redactText(once)).toBe('{"token":"[redacted]"}')
    expect(redactText(redactText('token=abc123'))).toBe('token=[redacted]')
    expect(redactText('secret=[abc]')).toBe('secret=[redacted]')
  })

  test('a secret key whose value is an object or array loses the whole subtree', () => {
    const text = 'Login answered {"session":{"id":"S3CR3T-SESSION"},"tokens":["tok-AAA111","tok-BBB222"],"user":"ada"}'
    expect(redactText(text)).toBe('Login answered {"session":"[redacted]","tokens":"[redacted]","user":"ada"}')
    expect(redactText('x {"credentials":{"value":"a}b"}} y')).toBe('x {"credentials":"[redacted]"} y')
    expect(redactText('{"auth":{"pass":"unbalanced')).not.toContain('unbalanced')
  })

  test('JSON carried in a string, parsed or escaped', () => {
    const twice = JSON.stringify({ url: '/login', body: JSON.stringify({ email: 'ada@example.com', password: 'hunter2' }) })
    expect(redactText(twice)).not.toContain('hunter2')
    expect(redactValue({ init: { body: JSON.stringify({ auth: { user: 'ada', pass: 'hunter2' } }) } })).toEqual({ init: { body: '{"auth":"[redacted]"}' } })
    const embedded = 'POST failed: ' + twice
    expect(redactText(embedded)).not.toContain('hunter2')
    expect(redactText(String.raw`body {\"session\":{\"id\":\"S1\"}} end`)).not.toContain('S1')
  })

  test('header lines lose the whole value', () => {
    expect(redactText('Authorization: ApiKey abc123SECRET')).toBe('Authorization: [redacted]')
    expect(redactText('Cookie: lang=en; remember_me=SECRET1; PHPSESSID=SECRET2\nnext line')).toBe('Cookie: [redacted]\nnext line')
    expect(redactText('Cookie: theme=dark; refresh=secret789')).toBe('Cookie: [redacted]')
  })

  test('long hyphenated or base64 runs stay linear', () => {
    const started = performance.now()
    redactText('ab-'.repeat(20000))
    redactText(Array.from({ length: 3000 }, () => '123e4567-e89b-12d3-a456-426614174000').join('-'))
    expect(performance.now() - started).toBeLessThan(500) // was 7.5 s
  })
})

describe('redactUrl', () => {
  test('masks every query and fragment value, keeps keys and path', () => {
    expect(redactUrl('https://ada:pw@app.example/callback?code=OAUTHCODE&state=xyz#key=K1')).toBe('https://[redacted]@app.example/callback?code=[redacted]&state=[redacted]#key=[redacted]')
    expect(redactUrl('https://app.example/tasks/1')).toBe('https://app.example/tasks/1')
  })
})
