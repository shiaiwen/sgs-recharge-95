function rotateLeft(value: number, shift: number) {
  return (value << shift) | (value >>> (32 - shift))
}

function toWords(input: string) {
  const bytes = unescape(encodeURIComponent(input))
  const bitLength = bytes.length * 8
  const words = new Array(Math.ceil((bytes.length + 9) / 64) * 16).fill(0)
  for (let index = 0; index < bytes.length; index += 1) {
    words[index >> 2] |= bytes.charCodeAt(index) << ((index % 4) * 8)
  }
  words[bytes.length >> 2] |= 0x80 << ((bytes.length % 4) * 8)
  words[words.length - 2] = bitLength
  return words
}

function add(left: number, right: number) {
  const low = (left & 0xffff) + (right & 0xffff)
  return (((left >> 16) + (right >> 16) + (low >> 16)) << 16) | (low & 0xffff)
}

export function md5(input: string) {
  const words = toWords(input)
  let a = 1732584193
  let b = -271733879
  let c = -1732584194
  let d = 271733878
  const shifts = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21]
  const constants = new Array(64).fill(0).map((_, index) => Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000))

  for (let offset = 0; offset < words.length; offset += 16) {
    const originalA = a
    const originalB = b
    const originalC = c
    const originalD = d
    for (let index = 0; index < 64; index += 1) {
      let mixed = 0
      let wordIndex = index
      if (index < 16) {
        mixed = (b & c) | (~b & d)
      } else if (index < 32) {
        mixed = (d & b) | (~d & c)
        wordIndex = (5 * index + 1) % 16
      } else if (index < 48) {
        mixed = b ^ c ^ d
        wordIndex = (3 * index + 5) % 16
      } else {
        mixed = c ^ (b | ~d)
        wordIndex = (7 * index) % 16
      }
      const next = add(rotateLeft(add(add(a, mixed), add(constants[index], words[offset + wordIndex])), shifts[(index >> 4) * 4 + (index % 4)]), b)
      a = d
      d = c
      c = b
      b = next
    }
    a = add(a, originalA)
    b = add(b, originalB)
    c = add(c, originalC)
    d = add(d, originalD)
  }

  return [a, b, c, d].map((value) => (
    [0, 8, 16, 24].map((shift) => ((value >>> shift) & 0xff).toString(16).padStart(2, '0')).join('')
  )).join('')
}
