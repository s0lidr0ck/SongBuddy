export default {
  title: 'verse',
  version: 0,
  type: 'object',
  primaryKey: 'id',
  additionalProperties: true,
  properties: {
    id: { type: 'string', maxLength: 64 },
    translation: { type: 'string', maxLength: 10 },
    book: { type: 'number', multipleOf: 1, minimum: 1, maximum: 66 }, // Add min/max for Bible books
    chapter: { type: 'number', multipleOf: 1, minimum: 1, maximum: 150 }, // Add min/max for chapters
    verse: { type: 'number', multipleOf: 1, minimum: 1, maximum: 176 }, // Add min/max for verses
    text: { type: 'string', maxLength: 1000 }
  },
  required: ['id','translation','book','chapter','verse','text'],
  indexes: [
    ['translation','book','chapter','verse'],
    ['translation','book','chapter']
  ]
} as const;