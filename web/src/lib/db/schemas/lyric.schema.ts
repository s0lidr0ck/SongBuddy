export default {
  title: 'lyric_line',
  version: 0,
  type: 'object',
  primaryKey: 'id',
  additionalProperties: true,
  properties: {
    id: { type: 'string', maxLength: 64 },
    song_id: { type: 'string', maxLength: 64 },
    line_index: { type: 'number', multipleOf: 1, minimum: 0, maximum: 1000 }, // Add min/max for line index
    text: { type: 'string', maxLength: 500 },
    syllables: { type: 'number', nullable: true },
    updated_at: { type: 'string', maxLength: 30 }
  },
  required: ['id','song_id','line_index','text','updated_at'],
  indexes: ['song_id', ['song_id','line_index']]
} as const;