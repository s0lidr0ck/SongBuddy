export default {
  title: 'recording',
  version: 0,
  type: 'object',
  primaryKey: 'id',
  additionalProperties: true,
  properties: {
    id: { type: 'string', maxLength: 64 },
    song_id: { type: 'string', maxLength: 64 },
    filename: { type: 'string', maxLength: 255 },
    local_uri: { type: 'string', maxLength: 500 },
    duration_sec: { type: 'number', nullable: true },
    is_private: { type: 'boolean', default: true },
    created_at: { type: 'string', maxLength: 30 }
  },
  required: ['id','song_id','filename','local_uri','created_at'],
  indexes: ['song_id','created_at']
} as const;